'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { adSchema, type AdInput } from '@/lib/utils/validation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type DonirajForm = AdInput & {
  clothingType?: string;
  clothingSize?: string;
  clothingGender?: string;
  footwearType?: string;
  footwearSize?: string;
  footwearGender?: string;
  furnitureType?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookGenre?: string;
  bookCondition?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceCondition?: string;
  householdType?: string;
  toyType?: string;
  babyItemType?: string;
  otherDetails?: string;
};

export default function DonirajPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const supabase = createClient();
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_AD_IMAGES_BUCKET || 'ad-images';
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLocationId, setProfileLocationId] = useState<string | null>(null);
  const [profileLocationLabel, setProfileLocationLabel] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DonirajForm>({
    resolver: zodResolver(adSchema),
  });

  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  useEffect(() => {
    if (selectedCategory?.slug === 'knjige') {
      setValue('condition', 'dobro', { shouldValidate: true });
    }
  }, [selectedCategory?.slug, setValue]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error: categoryError } = await supabase
        .from('categories')
        .select('id,name,slug')
        .order('name');

      if (categoryError) {
        console.error('Error loading categories:', categoryError);
        return;
      }

      setCategories(data || []);
    };

    const loadProfileLocation = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('location_id')
        .eq('id', user.id)
        .single();

      if (!profile?.location_id) {
        setProfileLocationId(null);
        setProfileLocationLabel(null);
        return;
      }

      setProfileLocationId(profile.location_id);

      const { data: location } = await supabase
        .from('locations')
        .select('city,address')
        .eq('id', profile.location_id)
        .single();

      if (location) {
        const label = [location.city, location.address].filter(Boolean).join(', ');
        setProfileLocationLabel(label || location.city);
      }
    };

    const loadAdForEdit = async () => {
      if (!editId) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data: ad } = await supabase
        .from('ads')
        .select('id,title,description,category_id,condition,image_urls,metadata')
        .eq('id', editId)
        .eq('user_id', user.id)
        .single();

      if (!ad) return;

      setIsEditing(true);
      setImageUrls(ad.image_urls || []);
      reset({
        title: ad.title,
        description: ad.description,
        categoryId: ad.category_id,
        condition: ad.condition,
      });
    };

    loadCategories();
    loadProfileLocation();
    loadAdForEdit();
  }, [editId, reset, supabase]);

  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: 'Izaberite kategoriju' },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ];
  }, [categories]);

  const uploadImageFile = useCallback(
    async (file: File) => {
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
        .upload(filePath, file, { upsert: false });

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
        setImageUrls((prev) => [...prev, data.publicUrl]);
      }
    },
    [supabase]
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;

      event.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        await uploadImageFile(file);
      }
    },
    [uploadImageFile]
  );

  const onSubmit = async (data: DonirajForm) => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setError('Morate biti prijavljeni');
        router.push('/login');
        return;
      }

      if (!profileLocationId) {
        setError('Morate prvo podesiti lokaciju profila.');
        router.push('/profil-podesavanja');
        return;
      }

      const metadata: Record<string, string> = {};
      if (selectedCategory?.slug === 'odeca') {
        if (data.clothingType) metadata.type = data.clothingType;
        if (data.clothingSize) metadata.size = data.clothingSize;
        if (data.clothingGender) metadata.gender = data.clothingGender;
      }
      if (selectedCategory?.slug === 'obuca') {
        if (data.footwearType) metadata.type = data.footwearType;
        if (data.footwearSize) metadata.size = data.footwearSize;
        if (data.footwearGender) metadata.gender = data.footwearGender;
      }
      if (selectedCategory?.slug === 'namestaj' && data.furnitureType) {
        metadata.type = data.furnitureType;
      }
      if (selectedCategory?.slug === 'knjige') {
        if (data.bookTitle) metadata.title = data.bookTitle;
        if (data.bookAuthor) metadata.author = data.bookAuthor;
        if (data.bookGenre) metadata.genre = data.bookGenre;
        if (data.bookCondition) metadata.condition = data.bookCondition;
      }
      if (selectedCategory?.slug === 'elektronika') {
        if (data.deviceType) metadata.type = data.deviceType;
        if (data.deviceBrand) metadata.brand = data.deviceBrand;
        if (data.deviceModel) metadata.model = data.deviceModel;
        if (data.deviceCondition) metadata.condition = data.deviceCondition;
      }
      if (selectedCategory?.slug === 'kucne-potrepstine' && data.householdType) {
        metadata.type = data.householdType;
      }
      if (selectedCategory?.slug === 'igracke' && data.toyType) {
        metadata.type = data.toyType;
      }
      if (selectedCategory?.slug === 'stvari-za-bebe' && data.babyItemType) {
        metadata.type = data.babyItemType;
      }
      if ((selectedCategory?.slug === 'ostalo' || selectedCategory?.slug === 'predmet') && data.otherDetails) {
        metadata.details = data.otherDetails;
      }

      const payload = {
        user_id: user.id,
        title: data.title,
        description: data.description,
        category_id: data.categoryId,
        location_id: profileLocationId,
        condition: data.condition,
        image_urls: imageUrls,
        metadata,
        ...(isEditing ? {} : { status: 'inactive' as const }),
      };

      const adQuery = isEditing && editId
        ? supabase.from('ads').update(payload).eq('id', editId).eq('user_id', user.id)
        : supabase.from('ads').insert(payload);

      const { error: adError } = await adQuery;

      if (adError) throw adError;

      reset();
      setImageUrls([]);
      router.push('/profil');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FDF7F7] py-10 px-4 sm:px-6 lg:px-8"
      onPaste={handlePaste}
    >
      <div className="max-w-3xl mx-auto">
        <Card padding="lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#333333] mb-2">
              {isEditing ? 'Izmeni oglas' : 'Dodaj Donaciju'}
            </h1>
            <p className="text-[#666666]">
              {isEditing
                ? 'Ažurirajte detalje o stvari koju donirate.'
                : 'Unesite detalje o stvari koju želite da donirate.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Naziv stvari *"
              placeholder="npr. Zimski kaput - veličina L"
              {...register('title')}
              error={errors.title?.message}
            />

            <Select
              label="Kategorija *"
              options={categoryOptions}
              {...register('categoryId')}
              error={errors.categoryId?.message}
            />

            {selectedCategory?.slug === 'odeca' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Vrsta odeće"
                  options={[
                    { value: 'Majica', label: 'Majica' },
                    { value: 'Duks', label: 'Duks' },
                    { value: 'Farmerke', label: 'Farmerke' },
                    { value: 'Pantalone', label: 'Pantalone' },
                    { value: 'Jakna', label: 'Jakna' },
                    { value: 'Kaput', label: 'Kaput' },
                    { value: 'Haljina', label: 'Haljina' },
                    { value: 'Suknja', label: 'Suknja' },
                    { value: 'Košulja', label: 'Košulja' },
                    { value: 'Džemper', label: 'Džemper' },
                    { value: 'Trenerka', label: 'Trenerka' },
                    { value: 'Drugo', label: 'Drugo' },
                  ]}
                  {...register('clothingType')}
                />
                <Select
                  label="Veličina"
                  options={[
                    { value: 'XS', label: 'XS' },
                    { value: 'S', label: 'S' },
                    { value: 'M', label: 'M' },
                    { value: 'L', label: 'L' },
                    { value: 'XL', label: 'XL' },
                    { value: 'XXL', label: 'XXL' },
                  ]}
                  {...register('clothingSize')}
                />
                <Select
                  label="Pol"
                  options={[
                    { value: 'Muški', label: 'Muški' },
                    { value: 'Ženski', label: 'Ženski' },
                    { value: 'Unisex', label: 'Unisex' },
                  ]}
                  {...register('clothingGender')}
                />
              </div>
            )}

            {selectedCategory?.slug === 'obuca' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Vrsta obuće"
                  options={[
                    { value: 'Patike', label: 'Patike' },
                    { value: 'Cipele', label: 'Cipele' },
                    { value: 'Papuče', label: 'Papuče' },
                    { value: 'Sandale', label: 'Sandale' },
                    { value: 'Čizme', label: 'Čizme' },
                    { value: 'Drugo', label: 'Drugo' },
                  ]}
                  {...register('footwearType')}
                />
                <Input
                  label="Broj"
                  placeholder="npr. 42"
                  {...register('footwearSize')}
                />
                <Select
                  label="Pol"
                  options={[
                    { value: 'Muški', label: 'Muški' },
                    { value: 'Ženski', label: 'Ženski' },
                    { value: 'Unisex', label: 'Unisex' },
                  ]}
                  {...register('footwearGender')}
                />
              </div>
            )}

            {selectedCategory?.slug === 'namestaj' && (
              <Select
                label="Vrsta nameštaja"
                options={[
                  { value: 'Sto', label: 'Sto' },
                  { value: 'Stolica', label: 'Stolica' },
                  { value: 'Sofa', label: 'Sofa' },
                  { value: 'Krevet', label: 'Krevet' },
                  { value: 'Ormar', label: 'Ormar' },
                  { value: 'Komoda', label: 'Komoda' },
                  { value: 'Polica', label: 'Polica' },
                  { value: 'Drugo', label: 'Drugo' },
                ]}
                {...register('furnitureType')}
              />
            )}

            {selectedCategory?.slug === 'knjige' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Naziv knjige"
                  placeholder="npr. Na Drini ćuprija"
                  {...register('bookTitle')}
                />
                <Input
                  label="Autor"
                  placeholder="npr. Ivo Andrić"
                  {...register('bookAuthor')}
                />
                <Select
                  label="Tip knjige"
                  options={[
                    { value: 'Roman', label: 'Roman' },
                    { value: 'Zbirka priča', label: 'Zbirka priča' },
                    { value: 'Poezija', label: 'Poezija' },
                    { value: 'Učbenik', label: 'Učbenik' },
                    { value: 'Stručna literatura', label: 'Stručna literatura' },
                    { value: 'Drugo', label: 'Drugo' },
                  ]}
                  {...register('bookGenre')}
                />
                <Select
                  label="Stanje knjige"
                  options={[
                    { value: 'Odlično', label: 'Odlično' },
                    { value: 'Dobro', label: 'Dobro' },
                    { value: 'Solidno', label: 'Solidno' },
                    { value: 'Oštećena', label: 'Oštećena' },
                  ]}
                  {...register('bookCondition')}
                />
              </div>
            )}

            {selectedCategory?.slug === 'elektronika' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tip uređaja"
                  placeholder="npr. Laptop, telefon"
                  {...register('deviceType')}
                />
                <Input
                  label="Brend"
                  placeholder="npr. Dell, Samsung"
                  {...register('deviceBrand')}
                />
                <Input
                  label="Model"
                  placeholder="npr. XPS 13"
                  {...register('deviceModel')}
                />
                <Select
                  label="Stanje uređaja"
                  options={[
                    { value: 'Odlično', label: 'Odlično' },
                    { value: 'Dobro', label: 'Dobro' },
                    { value: 'Solidno', label: 'Solidno' },
                    { value: 'Neispravno', label: 'Neispravno' },
                  ]}
                  {...register('deviceCondition')}
                />
              </div>
            )}

            {selectedCategory?.slug === 'kucne-potrepstine' && (
              <Input
                label="Vrsta potrepštine"
                placeholder="npr. Usisivač, posteljina"
                {...register('householdType')}
              />
            )}

            {selectedCategory?.slug === 'igracke' && (
              <Input
                label="Vrsta igračke"
                placeholder="npr. Kocke, plišani meda"
                {...register('toyType')}
              />
            )}

            {selectedCategory?.slug === 'stvari-za-bebe' && (
              <Input
                label="Vrsta stvari"
                placeholder="npr. Kolica, hranilica"
                {...register('babyItemType')}
              />
            )}

            {(selectedCategory?.slug === 'ostalo' || selectedCategory?.slug === 'predmet') && (
              <Input
                label="Detalji"
                placeholder="npr. Blender, ćebe, igračka..."
                {...register('otherDetails')}
              />
            )}

            {selectedCategory?.slug !== 'knjige' && (
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
            )}

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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-[#666666]">
              Lokacija oglasa: {profileLocationLabel || 'Nije podešena'}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Dodaj sliku
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadImageFile(file);
                    e.target.value = '';
                  }
                }}
              />
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
                {loading ? 'Čuvanje...' : isEditing ? 'Sačuvaj izmene' : 'Dodaj Donaciju'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/profil')}>
                Otkaži
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

