'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AdGrid from '@/components/ads/AdGrid';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'newest' | string>('newest');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadAds();
  }, [activeFilter]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredAds(ads);
      return;
    }

    setFilteredAds(
      ads.filter((ad) => ad.title.toLowerCase().includes(query))
    );
  }, [ads, searchQuery]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories((data || []).filter((category) => category.slug !== 'sve-kategorije'));
    };

    loadCategories();
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setIsAuthenticated(!!data.session?.user);
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const loadAds = async () => {
    const categoryId =
      activeFilter === 'newest'
        ? null
        : categories.find((category) => category.slug === activeFilter)?.id || null;
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
        .limit(12);

      if (activeFilter === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (categoryId) {
        query = query.eq('category_id', categoryId);
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

  return (
    <div className="min-h-screen bg-[#FDF7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">
                Pomozi Donacijom.
              </h1>
              <p className="text-lg text-[#666666]">
                Pronađi stvari koje su potrebne ili doniraj svoje.
              </p>
            </div>

            {/* Section Title */}
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Stvari u vašoj blizini
            </h2>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveFilter('newest')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === 'newest'
                    ? 'bg-[#E53935] text-white'
                    : 'bg-white text-[#333333] hover:bg-gray-50'
                }`}
              >
                Najnovije
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.slug)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === category.slug
                      ? 'bg-[#E53935] text-white'
                      : 'bg-white text-[#333333] hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Ads Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-[#666666]">Učitavanje...</p>
              </div>
            ) : (
              <AdGrid
                ads={filteredAds}
                canRequest={isAuthenticated}
                requireAuthUrl="/register"
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Search */}
            <Card>
              <h3 className="font-semibold text-[#333333] mb-3">Brza Pretraga</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Pretraži stvari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
            </Card>

            {/* Map Preview */}
            <Card>
              <h3 className="font-semibold text-[#333333] mb-3">
                Donacije u vašoj blizini
              </h3>
              <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-3">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                Prikaži punu mapu
              </Button>
            </Card>

            {/* See Needs */}
            <Card>
              <h3 className="font-semibold text-[#333333] mb-2">
                Vidi šta je potrebno
              </h3>
              <p className="text-sm text-[#666666] mb-3">
                Porodice koje traže pomoć
              </p>
              <Link href="/potrebe">
                <Button variant="secondary" className="w-full">
                  VIDI POTREBE
                </Button>
              </Link>
            </Card>

            {/* Want to Help */}
            <Card>
              <h3 className="font-semibold text-[#333333] mb-2">
                Želite da pomognete?
              </h3>
              <p className="text-sm text-[#666666] mb-3">
                Poklonite nešto danas!
              </p>
              <Link href={isAuthenticated ? '/doniraj' : '/register'}>
                <Button variant="primary" className="w-full">
                  DODAJ DONACIJU
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
