'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type RequestRow = {
  id: string;
  created_at: string;
  conversation_id: string;
  requester_id: string;
  ad?: {
    id: string;
    title: string;
    user_id: string;
    category?: { name: string } | null;
    owner?: { full_name: string | null } | null;
  } | null;
  requester?: { id: string; full_name: string | null } | null;
};

type TabKey = 'moje-donacije' | 'moji-zahtevi' | 'porodice';

type FamilyContactRow = {
  id: string;
  created_at: string;
  conversation_id: string;
  request?: { id: string; title: string } | null;
  family?: { id: string; full_name: string | null } | null;
};

export default function RequestsPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [familyContacts, setFamilyContacts] = useState<FamilyContactRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('moje-donacije');
  const [activeGroup, setActiveGroup] = useState<RequestRow[] | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'moji-zahtevi' || tab === 'moje-donacije' || tab === 'porodice') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError('Morate biti prijavljeni da biste videli zahteve.');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error: requestError } = await supabase
        .from('ad_requests')
        .select(
          `
          id,
          created_at,
          conversation_id,
          requester_id,
          ad:ads(
            id,
            title,
            user_id,
            category:categories(name),
            owner:profiles!ads_user_id_fkey(full_name)
          ),
          requester:profiles!ad_requests_requester_id_fkey(id,full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (requestError) {
        setError('Došlo je do greške prilikom učitavanja zahteva.');
        setLoading(false);
        return;
      }

      const { data: familyData, error: familyError } = await supabase
        .from('family_request_contacts')
        .select(
          `
          id,
          created_at,
          conversation_id,
          request:donation_requests(id,title),
          family:profiles!family_request_contacts_requester_id_fkey(id,full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (familyError) {
        setError('Došlo je do greške prilikom učitavanja porodičnih zahteva.');
        setLoading(false);
        return;
      }

      setRequests((data || []) as RequestRow[]);
      setFamilyContacts((familyData || []) as FamilyContactRow[]);
      setLoading(false);
    };

    loadRequests();
  }, [supabase]);

  const { myDonations, myRequests } = useMemo(() => {
    if (!currentUserId) {
      return { myDonations: [], myRequests: [] };
    }

    const myDonationsList = requests.filter((item) => item.ad?.user_id === currentUserId);
    const myRequestsList = requests.filter((item) => item.requester_id === currentUserId);

    return { myDonations: myDonationsList, myRequests: myRequestsList };
  }, [currentUserId, requests]);

  const groupedRequests = useMemo(() => {
    const source = activeTab === 'moje-donacije' ? myDonations : myRequests;
    return source.reduce<Record<string, RequestRow[]>>((acc, item) => {
      const adId = item.ad?.id || item.id;
      acc[adId] = acc[adId] || [];
      acc[adId].push(item);
      return acc;
    }, {});
  }, [activeTab, myDonations, myRequests]);

  const groupedList = Object.values(groupedRequests);

  return (
    <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Zahtevi</h1>
          <p className="text-[#666666]">
            Pratite zahteve i razgovore u vezi donacija.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant={activeTab === 'moje-donacije' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('moje-donacije')}
          >
            Moje donacije
          </Button>
          <Button
            variant={activeTab === 'moji-zahtevi' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('moji-zahtevi')}
          >
            Moji zahtevi
          </Button>
          <Button
            variant={activeTab === 'porodice' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('porodice')}
          >
            Porodice
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-[#666666]">Učitavanje zahteva...</div>
        ) : activeTab === 'porodice' ? (
          familyContacts.length === 0 ? (
            <Card padding="lg">
              <p className="text-[#666666]">Trenutno nema porodičnih chatova.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {familyContacts.map((item) => (
                <Card key={item.id} padding="lg" className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Porodica</div>
                  <h2 className="text-xl font-semibold text-[#333333]">
                    {item.family?.full_name || 'Porodica'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Zahtev: {item.request?.title || 'Pomoć'}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/chat?conversation=${item.conversation_id}`;
                    }}
                  >
                    Otvori chat
                  </Button>
                </Card>
              ))}
            </div>
          )
        ) : groupedList.length === 0 ? (
          <Card padding="lg">
            <p className="text-[#666666]">Trenutno nema zahteva.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedList.map((group) => {
              const item = group[0];
              return (
                <Card key={item.id} padding="lg" className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    {item.ad?.category?.name || 'Bez kategorije'}
                  </div>
                  <h2 className="text-xl font-semibold text-[#333333]">
                    {item.ad?.title || 'Donacija'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Broj zahteva: {group.length}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveGroup(group)}
                  >
                    Otvori chatove
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Zahtevi</p>
                <h3 className="text-xl font-semibold text-[#333333]">
                  {activeGroup[0].ad?.title || 'Donacija'}
                </h3>
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-[#E53935]"
                onClick={() => setActiveGroup(null)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {activeGroup.map((item) => {
                const otherName =
                  activeTab === 'moje-donacije'
                    ? item.requester?.full_name || 'Korisnik'
                    : item.ad?.owner?.full_name || 'Donator';

                return (
                  <Card key={item.id} padding="lg" className="space-y-2">
                    <p className="text-sm text-gray-500">Kontakt: {otherName}</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/chat?conversation=${item.conversation_id}`;
                      }}
                    >
                      Otvori chat
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

