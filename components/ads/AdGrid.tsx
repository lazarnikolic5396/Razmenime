'use client';

import AdCard from './AdCard';

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

interface AdGridProps {
  ads: Ad[];
  onRequest?: (id: string) => void;
  canRequest?: boolean;
  requireAuthUrl?: string;
}

export default function AdGrid({ ads, onRequest, canRequest, requireAuthUrl }: AdGridProps) {
  if (ads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#666666] text-lg">Nema dostupnih donacija</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          {...ad}
          onRequest={onRequest}
          canRequest={canRequest}
          requireAuthUrl={requireAuthUrl}
        />
      ))}
    </div>
  );
}

