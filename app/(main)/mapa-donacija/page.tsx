'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DonationMap from '@/components/map/DonationMap';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface CityData {
  city: string;
  count: number;
  lat: number;
  lng: number;
}

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Beograd: { lat: 44.7866, lng: 20.4489 },
  'Novi Sad': { lat: 45.2671, lng: 19.8335 },
  Niš: { lat: 43.3209, lng: 21.8958 },
  Kragujevac: { lat: 44.0165, lng: 20.9249 },
  Subotica: { lat: 46.1005, lng: 19.6656 },
  Čačak: { lat: 43.8914, lng: 20.3497 },
};

export default function MapPage() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCityData();
  }, []);

  const loadCityData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('location_id, locations(city)')
        .eq('status', 'active');

      if (error) throw error;

      // Group by city
      const cityCounts: Record<string, number> = {};
      (data || []).forEach((ad: any) => {
        const city = ad.locations?.city;
        if (city) {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
      });

      const cityData: CityData[] = Object.entries(cityCounts).map(([city, count]) => ({
        city,
        count,
        ...(cityCoordinates[city] || { lat: 44.0165, lng: 21.0059 }),
      }));

      setCities(cityData);
    } catch (error) {
      console.error('Error loading city data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markers = cities.map((city) => ({
    id: city.city,
    lat: city.lat,
    lng: city.lng,
    city: city.city,
    count: city.count,
  }));

  return (
    <div className="min-h-screen bg-[#FDF7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#333333] mb-2">Mapa Donacija</h1>
          <p className="text-lg text-[#666666]">
            Pronađite donacije u vašoj blizini
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card padding="none" className="h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#666666]">Učitavanje mape...</p>
                </div>
              ) : (
                <DonationMap markers={markers} />
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cities List */}
            <Card>
              <h3 className="font-semibold text-[#333333] mb-4">
                Donacije po Gradovima
              </h3>
              <div className="space-y-2">
                {cities.map((city) => (
                  <div
                    key={city.city}
                    className="flex justify-between items-center p-2 rounded hover:bg-gray-50"
                  >
                    <span className="text-[#333333]">{city.city}</span>
                    <span className="bg-[#E53935] text-white text-xs px-2 py-1 rounded">
                      {city.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Distance Filter */}
            <Card>
              <h3 className="font-semibold text-[#333333] mb-4">
                Filtrirajte po Udaljenosti
              </h3>
              <div className="space-y-2">
                {[
                  { value: '5', label: 'Do 5 km' },
                  { value: '10', label: 'Do 10 km' },
                  { value: '20', label: 'Do 20 km' },
                  { value: 'all', label: 'Sve lokacije' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="distance"
                      value={option.value}
                      checked={selectedDistance === option.value}
                      onChange={(e) => setSelectedDistance(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-[#333333]">{option.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Back to Home */}
            <Link href="/">
              <Button variant="primary" className="w-full">
                Nazad na Početnu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

