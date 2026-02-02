'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDate } from '@/lib/utils/date';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface AdCardProps {
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
  onRequest?: (id: string) => void;
  canRequest?: boolean;
  requireAuthUrl?: string;
}

const conditionLabels = {
  odlično: 'Odlično',
  dobro: 'Dobro',
  solidno: 'Solidno',
};

const conditionColors = {
  odlično: 'bg-green-100 text-green-800',
  dobro: 'bg-blue-100 text-blue-800',
  solidno: 'bg-gray-100 text-gray-800',
};

export default function AdCard({
  id,
  title,
  description,
  category,
  categoryIcon,
  condition,
  location,
  donorName,
  createdAt,
  imageUrl,
  userId,
  onRequest,
  canRequest = true,
  requireAuthUrl = '/register',
}: AdCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleRequest = async () => {
    if (!canRequest) {
      router.push(requireAuthUrl);
      return;
    }

    if (onRequest) {
      onRequest(id);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(requireAuthUrl);
        return;
      }
      router.push(`/zahtevi/novo?ad=${id}`);
    } catch (error) {
      console.error('Error requesting item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image */}
      <div className="relative w-full h-48 bg-gray-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Condition and Availability Tags */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${conditionColors[condition]}`}>
            {conditionLabels[condition]}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
            Dostupno
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-full">
        <h3 className="font-semibold text-lg text-[#333333] mb-2 line-clamp-1">
          {title}
        </h3>

        {/* Category */}
        <div className="flex items-center text-sm text-[#666666] mb-2">
          <span className="mr-2">{categoryIcon || '📦'}</span>
          <span>{category}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-[#666666] mb-3 line-clamp-2">
          {description}
        </p>

        {/* Location */}
        <div className="flex items-center text-sm text-[#666666] mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{location}</span>
        </div>

        {/* Donor */}
        <div className="flex items-center text-sm text-[#666666] mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Donirao {donorName}</span>
        </div>

        {/* Date */}
        <div className="flex items-center text-sm text-[#666666] mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(createdAt)}</span>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          className="w-full mt-auto"
          onClick={handleRequest}
          disabled={loading}
        >
          {loading ? 'Učitavanje...' : 'Zatraži Ovu Stvar'}
        </Button>
      </div>
    </div>
  );
}

