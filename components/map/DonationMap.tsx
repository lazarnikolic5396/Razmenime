'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  city: string;
  count: number;
}

interface DonationMapProps {
  markers: MapMarker[];
  onMarkerClick?: (city: string) => void;
}

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function DonationMap({ markers, onMarkerClick }: DonationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Serbia
    const map = L.map(mapContainerRef.current).setView([44.0165, 21.0059], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current.getContainer?.();
    if (!container || container.isConnected === false) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = L.marker([markerData.lat, markerData.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`${markerData.city} (${markerData.count})`)
        .on('click', () => {
          onMarkerClick?.(markerData.city);
        });

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '500px' }} />
    </div>
  );
}

