'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type ProfileInfo = {
  avatar_url: string | null;
  location_id: string | null;
  phone: string | null;
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const bucketName =
    process.env.NEXT_PUBLIC_SUPABASE_PROFILE_IMAGES_BUCKET || 'profile-images';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url,location_id,phone')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      const profileData = profile as ProfileInfo | null;
      setAvatarUrl(profileData?.avatar_url ?? null);
      setPhone(profileData?.phone ?? '');

      if (profileData?.location_id) {
        const { data: location } = await supabase
          .from('locations')
          .select('city,address')
          .eq('id', profileData.location_id)
          .single();

        if (location) {
          const label = [location.city, location.address].filter(Boolean).join(', ');
          setLocationInput(label || location.city);
        }
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleImageUpload = async (file: File) => {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError('Morate biti prijavljeni da biste dodali sliku');
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      const message = uploadError.message || 'Greška pri dodavanju slike';
      if (message.toLowerCase().includes('bucket') && message.toLowerCase().includes('not found')) {
        setError(`Bucket "${bucketName}" ne postoji. Kreiraj ga u Supabase Storage.`);
      } else {
        setError(`${message}. Proveri Storage policies za upload.`);
      }
      return;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (data?.publicUrl) {
      setAvatarUrl(data.publicUrl);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push('/login');
        return;
      }

      const trimmedLocation = locationInput.trim();
      if (!trimmedLocation) {
        setError('Lokacija je obavezna.');
        return;
      }

      const [city, ...addressParts] = trimmedLocation.split(',').map((s) => s.trim());
      const address = addressParts.join(', ') || city;

      let locationId: string;
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('city', city)
        .eq('address', address)
        .single();

      if (existingLocation) {
        locationId = existingLocation.id;
      } else {
        const { data: newLocation, error: locError } = await supabase
          .from('locations')
          .insert({
            city,
            address,
            country: 'Srbija',
            latitude: 44.7866,
            longitude: 20.4489,
          })
          .select('id')
          .single();

        if (locError || !newLocation) throw locError;
        locationId = newLocation.id;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          location_id: locationId,
          avatar_url: avatarUrl,
          phone: phone.trim() || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/profil');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške');
    } finally {
      setSaving(false);
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
      <div className="max-w-3xl mx-auto">
        <Card padding="lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#333333] mb-2">Podešavanje profila</h1>
            <p className="text-[#666666]">
              Dodajte sliku profila i lokaciju kako bismo lakše prikazali donacije.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Fotografija profila
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleImageUpload(file);
                    e.target.value = '';
                  }
                }}
              />
              {avatarUrl && (
                <div className="mt-3">
                  <img
                    src={avatarUrl}
                    alt="Profil"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <Input
              label="Lokacija *"
              placeholder="Grad, Opština"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
            />
            <p className="text-sm text-[#666666] -mt-2">
              npr. Beograd, Vračar ili Novi Sad, Centar
            </p>

            <Input
              label="Telefon"
              placeholder="06X XXX XXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            <div className="flex gap-4">
              <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Čuvanje...' : 'Sačuvaj profil'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

