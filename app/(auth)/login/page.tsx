'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/utils/validation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);

    try {
      const identifier = data.username.trim();
      const isEmail = identifier.includes('@');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: data.password,
      });

      if (authError) {
        if (isEmail) {
          setError('Nevažeće korisničko ime ili lozinka');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', identifier)
          .single();

        if (!profile?.email) {
          setError('Nevažeće korisničko ime ili lozinka');
          setLoading(false);
          return;
        }

        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: data.password,
        });

        if (retryError) {
          setError('Nevažeće korisničko ime ili lozinka');
          setLoading(false);
          return;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (profile?.user_role === 'admin') {
          router.push('/admin');
          router.refresh();
          return;
        }
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Došlo je do greške. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <span className="text-5xl font-bold text-[#E53935]">✚</span>
          </div>
          <h1 className="text-3xl font-bold text-[#333333] mb-2">
            Dobrodošli nazad
          </h1>
          <p className="text-[#666666]">
            Prijavite se na vaš Razmeni me nalog
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Korisničko ime"
            placeholder="Unesite korisničko ime"
            {...register('username')}
            error={errors.username?.message}
          />

          <Input
            label="Lozinka"
            type="password"
            placeholder="Unesite lozinku"
            {...register('password')}
            error={errors.password?.message}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Prijavljivanje...' : '→ Prijavi se'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#666666]">
            Nemate nalog?{' '}
            <Link href="/register" className="text-[#E53935] hover:underline font-medium">
              Registrujte se
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

