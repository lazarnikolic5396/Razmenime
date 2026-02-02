'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createRequestAndConversation } from '@/lib/utils/request';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type AdDetails = {
  id: string;
  title: string;
  description: string;
  user_id: string;
  category?: { name: string } | null;
  owner?: { full_name: string | null } | null;
};

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const adId = searchParams.get('ad');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ad, setAd] = useState<AdDetails | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadAd = async () => {
      if (!adId) {
        setError('Oglas nije pronađen.');
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();

      if (profile?.user_role === 'organization' || profile?.user_role === 'admin') {
        setError('Organizacije i admin ne mogu da šalju zahteve.');
        setLoading(false);
        return;
      }

      const { data, error: adError } = await supabase
        .from('ads')
        .select(
          'id,title,description,user_id,category:categories(name),owner:profiles!ads_user_id_fkey(full_name)'
        )
        .eq('id', adId)
        .single();

      if (adError || !data) {
        setError('Oglas nije pronađen.');
        setLoading(false);
        return;
      }

      setAd(data as AdDetails);
      setLoading(false);
    };

    loadAd();
  }, [adId, router, supabase]);

  const handleSend = async () => {
    setError(null);

    if (!message.trim()) {
      setError('Poruka je obavezna.');
      return;
    }

    if (!ad) {
      setError('Oglas nije pronađen.');
      return;
    }

    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push('/login');
        return;
      }

      const result = await createRequestAndConversation(ad.id, user.id, ad.user_id, message.trim());
      if (!result.success) {
        setError('Došlo je do greške prilikom slanja zahteva.');
        return;
      }

      router.push(`/zahtevi?tab=moji-zahtevi&conversation=${result.conversationId}`);
    } catch (err) {
      console.error('Error sending request:', err);
      setError('Došlo je do greške prilikom slanja zahteva.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center">
        <p className="text-[#666666]">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Pošalji zahtev donatoru</h1>
          <p className="text-[#666666]">
            Napišite poruku donatoru i objasnite zašto vam je potrebna ova stvar.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {ad && (
          <Card padding="lg" className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {ad.category?.name || 'Bez kategorije'}
            </p>
            <h2 className="text-xl font-semibold text-[#333333]">{ad.title}</h2>
            <p className="text-sm text-gray-500">
              Donator: {ad.owner?.full_name || 'Anoniman'}
            </p>
            <p className="text-[#666666]">{ad.description}</p>
          </Card>
        )}

        <Card padding="lg" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">Poruka *</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              placeholder="Napišite poruku donatoru..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="primary" onClick={handleSend} disabled={sending}>
              {sending ? 'Slanje...' : 'Pošalji zahtev'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/')}>
              Otkaži
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

