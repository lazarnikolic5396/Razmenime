'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type DonationRequest = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  requester_id: string;
  category: { name: string } | null;
};

type ProfileInfo = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type FamilyInfo = {
  profile_id: string;
  family_name: string | null;
  description: string | null;
};

type FamilyRequestView = DonationRequest & {
  profile?: ProfileInfo | null;
  family?: FamilyInfo | null;
};

export default function NeedsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<FamilyRequestView[]>([]);
  const [activeRequest, setActiveRequest] = useState<FamilyRequestView | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setError(null);

      const { data, error: requestError } = await supabase
        .from('donation_requests')
        .select('id,title,description,created_at,requester_id,category:categories(name)')
        .eq('requester_type', 'family')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (requestError) {
        if (isMounted) {
          setError('Došlo je do greške prilikom učitavanja potreba.');
          setLoading(false);
        }
        return;
      }

      const requestList = (data || []) as DonationRequest[];
      const requesterIds = Array.from(new Set(requestList.map((item) => item.requester_id)));

      const [profilesResult, familiesResult] = await Promise.all([
        requesterIds.length
          ? supabase
              .from('profiles')
              .select('id,full_name,avatar_url')
              .in('id', requesterIds)
          : Promise.resolve({ data: [] as ProfileInfo[] }),
        requesterIds.length
          ? supabase
              .from('families')
              .select('profile_id,family_name,description')
              .in('profile_id', requesterIds)
          : Promise.resolve({ data: [] as FamilyInfo[] }),
      ]);

      const profileMap = new Map(
        (profilesResult.data || []).map((profile) => [profile.id, profile as ProfileInfo])
      );
      const familyMap = new Map(
        (familiesResult.data || []).map((family) => [family.profile_id, family as FamilyInfo])
      );

      const hydrated = requestList.map((item) => ({
        ...item,
        profile: profileMap.get(item.requester_id) ?? null,
        family: familyMap.get(item.requester_id) ?? null,
      }));

      if (isMounted) {
        setRequests(hydrated);
        setLoading(false);
      }
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const formattedRequests = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      createdLabel: new Date(request.created_at).toLocaleDateString('sr-RS'),
    }));
  }, [requests]);

  const handleContactFamily = async () => {
    if (!activeRequest) return;

    setContactLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      if (user.id === activeRequest.requester_id) {
        setError('Ne možete kontaktirati sopstveni zahtev.');
        return;
      }

      const { data: existingContact } = await supabase
        .from('family_request_contacts')
        .select('conversation_id')
        .eq('request_id', activeRequest.id)
        .eq('helper_id', user.id)
        .single();

      if (existingContact?.conversation_id) {
        router.push(`/chat?conversation=${existingContact.conversation_id}`);
        return;
      }

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1_id.eq.${user.id},participant_2_id.eq.${activeRequest.requester_id}),and(participant_1_id.eq.${activeRequest.requester_id},participant_2_id.eq.${user.id})`
        )
        .single();

      let conversationId = existingConv?.id;
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: user.id < activeRequest.requester_id ? user.id : activeRequest.requester_id,
            participant_2_id: user.id < activeRequest.requester_id ? activeRequest.requester_id : user.id,
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv?.id;
      }

      if (!conversationId) {
        throw new Error('Conversation not created');
      }

      const { error: contactError } = await supabase.from('family_request_contacts').insert({
        request_id: activeRequest.id,
        requester_id: activeRequest.requester_id,
        helper_id: user.id,
        conversation_id: conversationId,
      });

      if (contactError) throw contactError;

      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: 'Zdravo! Želim da pomognem.',
      });
      if (messageError) throw messageError;

      router.push(`/chat?conversation=${conversationId}`);
    } catch (err: any) {
      console.error('Error contacting family:', err);
      setError('Došlo je do greške prilikom kontakta porodice.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Porodice koje traže pomoć</h1>
          <p className="text-[#666666]">
            Pogledajte zahteve i saznajte više o porodicama kojima je potrebna pomoć.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-[#666666]">Učitavanje zahteva...</div>
        ) : formattedRequests.length === 0 ? (
          <Card padding="lg">
            <p className="text-[#666666]">Trenutno nema aktivnih zahteva.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formattedRequests.map((request) => (
              <Card key={request.id} padding="lg" className="space-y-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  {request.category?.name || 'Bez kategorije'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#333333]">{request.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{request.createdLabel}</p>
                </div>
                <p className="text-[#666666] line-clamp-3">{request.description}</p>
                <Button variant="primary" size="sm" onClick={() => setActiveRequest(request)}>
                  Detaljnije
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Porodica</p>
                <h3 className="text-xl font-semibold text-[#333333]">
                  {activeRequest.family?.family_name ||
                    activeRequest.profile?.full_name ||
                    'Porodica'}
                </h3>
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-[#E53935]"
                onClick={() => setActiveRequest(null)}
              >
                ✕
              </button>
            </div>

            {activeRequest.profile?.avatar_url && (
              <img
                src={activeRequest.profile.avatar_url}
                alt="Porodica"
                className="w-full h-56 object-cover"
              />
            )}

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Opis porodice</p>
                <p className="text-[#333333] whitespace-pre-line">
                  {activeRequest.family?.description || 'Opis porodice nije dodat.'}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Opis zahteva</p>
                <p className="text-[#333333] whitespace-pre-line">{activeRequest.description}</p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="mr-2"
                  onClick={handleContactFamily}
                  disabled={contactLoading}
                >
                  {contactLoading ? 'Otvaranje...' : 'Kontaktiraj porodicu'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveRequest(null)}>
                  Zatvori
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

