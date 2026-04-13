'use client';

import { useEffect, useRef } from 'react';

type Props = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  className?: string;
};

/**
 * Mapa interativo OpenStreetMap (Leaflet + tiles OSM gratuitos). Clica ou arrasta o pin.
 */
export function ClassifiedMapPicker({ lat, lng, onPick, className }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import('leaflet')).default;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (cancelled || !elRef.current) return;

      const startLat = lat ?? -14.235;
      const startLng = lng ?? -51.9253;
      const z = lat != null && lng != null ? 15 : 4;

      const map = L.map(elRef.current, { scrollWheelZoom: true }).setView([startLat, startLng], z);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const ensureMarker = (la: number, ln: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([la, ln]);
        } else {
          const m = L.marker([la, ln], { draggable: true }).addTo(map);
          m.on('dragend', () => {
            const p = m.getLatLng();
            onPickRef.current(p.lat, p.lng);
          });
          markerRef.current = m;
        }
      };

      if (lat != null && lng != null) {
        ensureMarker(lat, lng);
      }

      map.on('click', (e) => {
        ensureMarker(e.latlng.lat, e.latlng.lng);
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;

    void import('leaflet').then((Mod) => {
      const L = Mod.default;
      if (!mapRef.current) return;
      map.setView([lat, lng], Math.max(map.getZoom(), 14));

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { draggable: true }).addTo(map);
        m.on('dragend', () => {
          const p = m.getLatLng();
          onPickRef.current(p.lat, p.lng);
        });
        markerRef.current = m;
      }
    });
  }, [lat, lng]);

  return (
    <div
      ref={elRef}
      className={className || 'h-[220px] w-full rounded-xl border border-[var(--border)] overflow-hidden z-0'}
    />
  );
}
