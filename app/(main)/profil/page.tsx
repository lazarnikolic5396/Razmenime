'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

type ProfileData = {
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_role: string | null;
};

type FamilyData = {
  family_name: string | null;
  description: string | null;
};

type LocationData = {
  city: string | null;
  address: string | null;
};

type AdData = {
  id: string;
  title: string;
  created_at: string;
  category?: { name: string } | null;
};

type FamilyRequestData = {
  id: string;
  title: string;
  created_at: string;
  category?: { name: string } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [ads, setAds] = useState<AdData[]>([]);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);
  const [pendingAds, setPendingAds] = useState<AdData[]>([]);
  const [familyRequests, setFamilyRequests] = useState<FamilyRequestData[]>([]);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name,username,email,phone,user_role,avatar_url,location_id')
        .eq('id', user.id)
        .single();

      if (data?.user_role === 'admin') {
        router.replace('/admin');
        return;
      }

      const { data: familyData } = await supabase
        .from('families')
        .select('family_name,description')
        .eq('profile_id', user.id)
        .maybeSingle();

      const { data: userAds } = await supabase
        .from('ads')
        .select('id,title,created_at,category:categories(name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data: pendingUserAds } = await supabase
        .from('ads')
        .select('id,title,created_at,category:categories(name)')
        .eq('user_id', user.id)
        .eq('status', 'inactive')
        .order('created_at', { ascending: false });

      let requestList: FamilyRequestData[] = [];
      if (familyData) {
        const { data: requestData } = await supabase
          .from('donation_requests')
          .select('id,title,created_at,category:categories(name)')
          .eq('requester_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        requestList = (requestData || []) as FamilyRequestData[];
      }

      if (data?.location_id) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('city,address')
          .eq('id', data.location_id)
          .single();
        setLocation(locationData ?? null);
      } else {
        setLocation(null);
      }

      if (!isMounted) return;

      setProfile(data ?? null);
      setFamily(familyData ?? null);
      setAds((userAds || []) as AdData[]);
      setPendingAds((pendingUserAds || []) as AdData[]);
      setFamilyRequests(requestList);
      setLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleDeleteAd = async (adId: string) => {
    if (deletingAdId) return;

    const confirmed = window.confirm('Da li ste sigurni da želite da obrišete ovaj oglas?');
    if (!confirmed) return;

    setDeletingAdId(adId);
    const { error } = await supabase.from('ads').delete().eq('id', adId);

    if (error) {
      window.alert('Brisanje oglasa nije uspelo. Pokušajte ponovo.');
      setDeletingAdId(null);
      return;
    }

    setAds((prevAds) => prevAds.filter((ad) => ad.id !== adId));
    setDeletingAdId(null);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (deletingRequestId) return;

    const confirmed = window.confirm('Da li ste sigurni da želite da obrišete ovaj zahtev?');
    if (!confirmed) return;

    setDeletingRequestId(requestId);
    const { error } = await supabase
      .from('donation_requests')
      .update({ status: 'removed' })
      .eq('id', requestId);

    if (error) {
      window.alert('Brisanje zahteva nije uspelo. Pokušajte ponovo.');
      setDeletingRequestId(null);
      return;
    }

    setFamilyRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));
    setDeletingRequestId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center">
        <p className="text-[#666666]">Učitavanje profila...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center">
        <p className="text-[#666666]">Profil nije pronađen.</p>
      </div>
    );
  }

  if (family) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#333333]">Profil porodice</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/porodica-profil')}>
                Izmeni profil
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Odjavi se
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden" padding="none">
            <div className="h-48 w-full bg-gray-200">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Porodica"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-red-100 to-red-50" />
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Porodica</p>
                <h2 className="text-2xl font-bold text-[#333333]">
                  {family.family_name || profile?.full_name || 'Porodica'}
                  <span className="text-[#E53935]"> !</span>
                </h2>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Opis</p>
                <p className="text-[#333333] whitespace-pre-line">
                  {family.description || 'Opis nije dodat.'}
                </p>
              </div>
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-[#333333]">Moji zahtevi</h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/potrebe/novo')}>
                Dodaj zahtev
              </Button>
            </div>

            {familyRequests.length === 0 ? (
              <Card padding="lg">
                <p className="text-[#666666]">Nemate aktivne zahteve.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyRequests.map((request) => (
                  <Card key={request.id} padding="lg" className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {request.category?.name || 'Bez kategorije'}
                      </p>
                      <h3 className="text-lg font-semibold text-[#333333]">{request.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/potrebe/novo?edit=${request.id}`)}
                      >
                        Izmeni
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingRequestId === request.id}
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        {deletingRequestId === request.id ? 'Brisanje...' : 'Obriši'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#333333]">Moj profil</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/profil-podesavanja')}>
              Izmeni profil
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Odjavi se
            </Button>
          </div>
        </div>

        <Card className="space-y-6" padding="lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profil'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  ✚
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#333333]">
                {profile.full_name || 'Korisnik'}
              </h2>
              <p className="text-sm text-gray-500">{profile.email || '—'}</p>
              <p className="text-sm text-gray-500 capitalize">{profile.user_role || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Korisničko ime</p>
              <p className="text-[#333333]">{profile.username || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Telefon</p>
              <p className="text-[#333333]">{profile.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lokacija</p>
              <p className="text-[#333333]">
                {location
                  ? [location.city, location.address].filter(Boolean).join(', ')
                  : '—'}
              </p>
            </div>
          </div>
        </Card>

        {pendingAds.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-[#333333]">Oglasi na čekanju</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAds.map((ad) => (
                <Card key={ad.id} padding="lg" className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {ad.category?.name || 'Bez kategorije'}
                    </p>
                    <h3 className="text-lg font-semibold text-[#333333]">{ad.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(ad.created_at).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/doniraj?edit=${ad.id}`)}
                    >
                      Izmeni
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingAdId === ad.id}
                      onClick={() => handleDeleteAd(ad.id)}
                    >
                      {deletingAdId === ad.id ? 'Brisanje...' : 'Obriši'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[#333333]">Aktivni oglasi</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/doniraj')}>
              Dodaj oglas
            </Button>
          </div>

          {ads.length === 0 ? (
            <Card padding="lg">
              <p className="text-[#666666]">Nemate aktivne oglase.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map((ad) => (
                <Card key={ad.id} padding="lg" className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {ad.category?.name || 'Bez kategorije'}
                    </p>
                    <h3 className="text-lg font-semibold text-[#333333]">{ad.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(ad.created_at).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/doniraj?edit=${ad.id}`)}
                    >
                      Izmeni
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingAdId === ad.id}
                      onClick={() => handleDeleteAd(ad.id)}
                    >
                      {deletingAdId === ad.id ? 'Brisanje...' : 'Obriši'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

