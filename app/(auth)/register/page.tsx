'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/utils/validation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userRole: 'user',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    setLoading(true);

    try {
      let locationId: string | null = null;
      if (data.userRole === 'family') {
        const city = data.city?.trim();
        const municipality = data.municipality?.trim();

        if (!city) {
          setError('Grad je obavezan.');
          setLoading(false);
          return;
        }

        const address = municipality || city;
        const { data: existingLocation, error: locationError } = await supabase
          .from('locations')
          .select('id')
          .eq('city', city)
          .eq('address', address)
          .eq('country', 'Srbija')
          .maybeSingle();

        if (locationError) {
          throw locationError;
        }

        if (existingLocation) {
          locationId = existingLocation.id;
        } else {
          const { data: newLocation, error: createError } = await supabase
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

          if (createError || !newLocation) throw createError;
          locationId = newLocation.id;
        }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
            phone: data.phone,
            user_role: data.userRole || 'user',
          },
        },
      });

      if (authError) {
        setError(authError.message || 'Došlo je do greške prilikom registracije');
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Update profile with additional info
        const profilePayload: {
          full_name: string;
          username: string;
          phone: string | null;
          user_role: 'user' | 'organization' | 'admin' | 'family';
          location_id?: string | null;
        } = {
          full_name: data.fullName,
          username: data.username,
          phone: data.phone || null,
          user_role:
            (data.userRole as 'user' | 'organization' | 'admin' | 'family') || 'user',
        };

        if (locationId) {
          profilePayload.location_id = locationId;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Create organization or family record if needed
        if (data.userRole === 'organization' && authData.user) {
          await supabase.from('organizations').insert({
            profile_id: authData.user.id,
            organization_name: data.fullName,
          });
        } else if (data.userRole === 'family' && authData.user) {
          await supabase.from('families').insert({
            profile_id: authData.user.id,
            family_name: data.fullName,
          });
        }

        router.push(data.userRole === 'family' ? '/porodica-profil' : '/profil-podesavanja');
        router.refresh();
      }
    } catch (err) {
      setError('Došlo je do greške. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl" padding="lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <span className="text-5xl font-bold text-[#E53935]">✚</span>
          </div>
          <h1 className="text-3xl font-bold text-[#333333] mb-2">
            Pridružite nam se
          </h1>
          <p className="text-[#666666]">
            Napravite nalog i počnite da pomažete
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ime i Prezime *"
              placeholder="Vaše ime i prezime"
              {...register('fullName')}
              error={errors.fullName?.message}
            />

            <Input
              label="Korisničko ime *"
              placeholder="Korisničko ime"
              {...register('username')}
              error={errors.username?.message}
            />

            <Input
              label="Email adresa *"
              type="email"
              placeholder="vas@email.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Telefon"
              placeholder="06X XXX XXXX"
              {...register('phone')}
              error={errors.phone?.message}
            />

            <Input
              label="Lozinka *"
              type="password"
              placeholder="Unesite lozinku"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Potvrdi lozinku *"
              type="password"
              placeholder="Potvrdite lozinku"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Select
            label="Tip naloga"
            options={[
              { value: 'user', label: 'Korisnik' },
              { value: 'organization', label: 'Organizacija' },
              { value: 'family', label: 'Porodica' },
            ]}
            {...register('userRole')}
          />

          {watch('userRole') === 'family' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Grad *"
                placeholder="Grad"
                {...register('city')}
                error={errors.city?.message}
              />
              <Input
                label="Opština (opciono)"
                placeholder="Opština"
                {...register('municipality')}
                error={errors.municipality?.message}
              />
              <Input label="Država" value="Srbija" disabled />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-[#666666]">
            Registracijom prihvatate uslove korišćenja i politiku privatnosti. Vaši podaci će
            biti korišćeni isključivo za koordinaciju donacija u saradnji sa Crvenim krstom.
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registracija...' : '✚ Registruj se'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#666666]">
            Već imate nalog?{' '}
            <Link href="/login" className="text-[#E53935] hover:underline font-medium">
              Prijavite se
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

