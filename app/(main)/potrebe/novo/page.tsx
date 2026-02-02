'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { familyRequestSchema, type FamilyRequestInput } from '@/lib/utils/validation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Category = {
  id: string;
  name: string;
};

export default function NeedsRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFamilyUser, setIsFamilyUser] = useState<boolean | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyRequestInput>({
    resolver: zodResolver(familyRequestSchema),
  });

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error: categoryError } = await supabase
        .from('categories')
        .select('id,name')
        .order('name');

      if (categoryError) {
        console.error('Error loading categories:', categoryError);
        return;
      }

      setCategories(data || []);
    };

    const loadProfileRole = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      setIsFamilyUser(!!family);
    };

    loadCategories();
    loadProfileRole();
  }, [router, supabase]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) {
      setEditingRequestId(null);
      return;
    }

    let isMounted = true;

    const loadRequest = async () => {
      setLoadingRequest(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error: requestError } = await supabase
        .from('donation_requests')
        .select('id,title,description,category_id,requester_id')
        .eq('id', editId)
        .single();

      if (requestError || !data) {
        if (isMounted) {
          setError('Zahtev nije pronađen.');
          setLoadingRequest(false);
        }
        return;
      }

      if (data.requester_id !== user.id) {
        if (isMounted) {
          setError('Nemate dozvolu da izmenite ovaj zahtev.');
          setLoadingRequest(false);
        }
        return;
      }

      if (!isMounted) return;

      setEditingRequestId(data.id);
      reset({
        title: data.title,
        description: data.description,
        categoryId: data.category_id,
      });
      setLoadingRequest(false);
    };

    loadRequest();

    return () => {
      isMounted = false;
    };
  }, [reset, router, searchParams, supabase]);

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Izaberite kategoriju' },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories]
  );

  const onSubmit = async (data: FamilyRequestInput) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError('Morate biti prijavljeni');
        router.push('/login');
        return;
      }

      if (!isFamilyUser) {
        setError('Samo porodice mogu da kreiraju zahteve za pomoć.');
        return;
      }

      const requestPayload = {
        title: data.title,
        description: data.description,
        category_id: data.categoryId,
      };

      const { error: requestError } = editingRequestId
        ? await supabase
            .from('donation_requests')
            .update(requestPayload)
            .eq('id', editingRequestId)
        : await supabase.from('donation_requests').insert({
            requester_id: user.id,
            requester_type: 'family',
            ...requestPayload,
            status: 'active',
          });

      if (requestError) throw requestError;

      if (!editingRequestId) {
        reset();
      }
      setSuccess(editingRequestId ? 'Zahtev je uspešno izmenjen.' : 'Zahtev je uspešno poslat.');
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card padding="lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#333333] mb-2">
              {editingRequestId ? 'Izmeni zahtev' : 'Zatraži pomoć'}
            </h1>
            <p className="text-[#666666]">
              {editingRequestId
                ? 'Ažurirajte detalje o stvarima koje su potrebne vašoj porodici.'
                : 'Unesite detalje o stvarima koje su potrebne vašoj porodici.'}
            </p>
          </div>

          {isFamilyUser === false && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              Samo porodice mogu da kreiraju zahteve. Ako ste se registrovali kao porodica,
              proverite da li ste prijavljeni.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Naziv potrebe *"
              placeholder="npr. Dečije jakne (zima)"
              {...register('title')}
              error={errors.title?.message}
            />

            <Select
              label="Kategorija *"
              options={categoryOptions}
              {...register('categoryId')}
              error={errors.categoryId?.message}
            />

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">Opis *</label>
              <textarea
                {...register('description')}
                placeholder="Opišite potrebu i dodatne informacije"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent resize-none"
                rows={4}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || loadingRequest || isFamilyUser === false}
                className="flex-1"
              >
                {loading ? 'Čuvanje...' : editingRequestId ? 'Sačuvaj izmene' : 'Pošalji zahtev'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/potrebe')}>
                Otkaži
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

