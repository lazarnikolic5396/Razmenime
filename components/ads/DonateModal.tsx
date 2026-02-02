'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { adSchema, type AdInput } from '@/lib/utils/validation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DonateModal({ isOpen, onClose, onSuccess }: DonateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdInput & { location: string }>({
    resolver: zodResolver(adSchema),
  });

  if (!isOpen) return null;

  const onSubmit = async (data: AdInput & { location: string }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Morate biti prijavljeni');
        return;
      }

      // Parse location (e.g., "Beograd, Vračar")
      const [city, ...addressParts] = data.location.split(',').map((s) => s.trim());
      const address = addressParts.join(', ') || city;

      // Get or create location
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
        // For now, use default coordinates - in production, use geocoding API
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

      // Create ad
      const { error: adError } = await supabase.from('ads').insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        category_id: data.categoryId,
        location_id: locationId,
        condition: data.condition,
        image_urls: imageUrls,
        status: 'active',
      });

      if (adError) throw adError;

      reset();
      setImageUrls([]);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlAdd = (url: string) => {
    if (url && !imageUrls.includes(url)) {
      setImageUrls([...imageUrls, url]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" padding="lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#333333]">Donirajte Stvar</h2>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#333333] text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-[#666666] mb-6">
          Popunite detalje o stvari koju želite da donirate. Vaša donacija može
          promeniti nečiji život!
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Naziv stvari *"
            placeholder="npr. Zimski Kaput - Veličina L"
            {...register('title')}
            error={errors.title?.message}
          />

          <Select
            label="Kategorija *"
            options={[
              { value: '', label: 'Izaberite kategoriju' },
              { value: '1', label: 'Odeća' },
              { value: '2', label: 'Nameštaj' },
              { value: '3', label: 'Elektronika' },
            ]}
            {...register('categoryId')}
            error={errors.categoryId?.message}
          />

          <Select
            label="Stanje *"
            options={[
              { value: 'dobro', label: 'Dobro' },
              { value: 'odlično', label: 'Odlično' },
              { value: 'solidno', label: 'Solidno' },
            ]}
            {...register('condition')}
            error={errors.condition?.message}
          />

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">
              Opis *
            </label>
            <textarea
              {...register('description')}
              placeholder="Opišite stvar, njenu upotrebu i bilo koje važne detalje"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent resize-none"
              rows={4}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <Input
            label="Lokacija *"
            placeholder="Grad, Opština"
            {...register('location')}
            error={errors.location?.message}
          />
          <p className="text-sm text-[#666666] -mt-2">
            npr. Beograd, Vračar ili Novi Sad, Centar
          </p>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">
              URL Slike (opciono)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://primer.com/slika.jpg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleImageUrlAdd((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="URL"]') as HTMLInputElement;
                  if (input?.value) {
                    handleImageUrlAdd(input.value);
                    input.value = '';
                  }
                }}
              >
                Dodaj
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imageUrls.map((url, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    {url.substring(0, 30)}...
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                      className="ml-2 text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-[#666666]">
            Donacijom potvrđujete da je stvar u funkcionalnom/nosivom stanju i da je
            Crveni krst ili njegovi partneri mogu distribuirati porodicama kojima je
            potrebna. Stvari treba da budu čiste i bezbedne za upotrebu.
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={loading} className="flex-1">
              {loading ? 'Dodavanje...' : 'Dodaj Donaciju'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Otkaži
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

