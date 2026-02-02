'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type FamilyProfile = {
  family_name: string | null;
  description: string | null;
};

type ProfileInfo = {
  avatar_url: string | null;
  full_name: string | null;
};

export default function FamilyProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const bucketName =
    process.env.NEXT_PUBLIC_SUPABASE_PROFILE_IMAGES_BUCKET || 'profile-images';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        .select('avatar_url,full_name')
        .eq('id', user.id)
        .single();

      const { data: family } = await supabase
        .from('families')
        .select('family_name,description')
        .eq('profile_id', user.id)
        .single();

      if (!isMounted) return;

      setProfileInfo(profile ?? null);
      setFamilyProfile(family ?? null);
      setDescription(family?.description ?? '');
      setAvatarUrl(profile?.avatar_url ?? null);
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

      const { data: familyCheck } = await supabase
        .from('families')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!familyCheck) {
        setError('Ova stranica je namenjena porodicama.');
        return;
      }

      const familyName =
        familyProfile?.family_name || profileInfo?.full_name || 'Porodica';

      const { error: familyError } = await supabase
        .from('families')
        .upsert(
          {
            profile_id: user.id,
            family_name: familyName,
            description: description || null,
          },
          { onConflict: 'profile_id' }
        );

      if (familyError) throw familyError;

      if (avatarUrl) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

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
        <p className="text-[#666666]">Učitavanje profila...</p>
      </div>
    );
  }

  if (!profileInfo) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center">
        <p className="text-[#666666]">Profil nije pronađen.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card padding="lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#333333] mb-2">Profil porodice</h1>
            <p className="text-[#666666]">
              Dodajte opis vaše porodice i fotografiju koja će pomoći donatorima.
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
                Fotografija porodice
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
                    alt="Porodica"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">Opis *</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ukratko opišite vašu porodicu i potrebe"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent resize-none"
                rows={5}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Čuvanje...' : 'Sačuvaj profil'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Nazad na početnu
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

