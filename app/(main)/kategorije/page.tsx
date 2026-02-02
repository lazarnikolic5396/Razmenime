'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdGrid from '@/components/ads/AdGrid';
import Card from '@/components/ui/Card';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  count?: number;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryIcon?: string;
  condition: 'odlično' | 'dobro' | 'solidno';
  location: string;
  donorName: string;
  createdAt: string;
  imageUrl?: string;
  userId?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalActiveCount, setTotalActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCategories();
    loadAds();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon')
        .order('name');

      if (error) throw error;

      const { count: totalCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setTotalActiveCount(totalCount || 0);

      // Get counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || [])
          .filter((category) => category.slug !== 'sve-kategorije')
          .map(async (category) => {
          const { count } = await supabase
            .from('ads')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('category_id', category.id);
          return { ...category, count: count || 0 };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ads')
        .select(`
          id,
          title,
          description,
          condition,
          image_urls,
          created_at,
          user_id,
          category_id,
          location_id,
          profiles!ads_user_id_fkey(full_name),
          categories(name, slug),
          locations(city, address)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedAds: Ad[] = (data || []).map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        category: ad.categories?.name || 'Nepoznata kategorija',
        condition: ad.condition,
        location: `${ad.locations?.city || ''}, ${ad.locations?.address || ''}`.trim(),
        donorName: ad.profiles?.full_name || 'Anoniman',
        createdAt: ad.created_at,
        imageUrl: ad.image_urls?.[0] || undefined,
        userId: ad.user_id,
      }));

      setAds(formattedAds);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons: Record<string, string> = {
    'sve-kategorije': '📦',
    'odeca': '👕',
    'obuca': '👟',
    'namestaj': '🛋️',
    'elektronika': '💻',
    'kucne-potrepstine': '🏠',
    'igracke': '🎁',
    'stvari-za-bebe': '🍼',
    'knjige': '📚',
    'predmet': '📦',
    'ostalo': '📦',
  };

  return (
    <div className="min-h-screen bg-[#FDF7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] mb-2">Kategorije</h1>
          <p className="text-lg text-[#666666]">
            Pretražite donacije po kategorijama
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <Card
            padding="md"
            className={`cursor-pointer transition-all ${
              !selectedCategory
                ? 'bg-gray-200 text-[#333333] border border-gray-300'
                : 'bg-white hover:shadow-md border border-transparent'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="font-semibold mb-1">Sve Kategorije</div>
              <div className="text-sm opacity-75">{totalActiveCount} stvari</div>
            </div>
          </Card>

          {categories.map((category) => (
            <Card
              key={category.id}
              padding="md"
              className={`cursor-pointer transition-all ${
                selectedCategory === category.id
                  ? 'bg-gray-200 text-[#333333] border border-gray-300'
                  : 'bg-white hover:shadow-md border border-transparent'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {categoryIcons[category.slug] || '📦'}
                </div>
                <div className="font-semibold mb-1">{category.name}</div>
                <div className="text-sm opacity-75">
                  {category.count || 0} {category.count === 1 ? 'stvar' : 'stvari'}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Ads Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-[#333333]">
            Sve Donacije ({totalActiveCount})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#666666]">Učitavanje...</p>
          </div>
        ) : (
          <AdGrid ads={ads} />
        )}
      </div>
    </div>
  );
}

