'use client';

import { useEffect, useState } from 'react';
import { pingBackend } from '../lib/api';

/**
 * Banner "mode offline" — tampil bila backend NestJS tak terjangkau.
 * Halaman dashboard tetap bisa dibuka dari cache lokal, tapi perubahan
 * belum tentu tersimpan di server. Cek saat mount + tiap 30 detik.
 */
export default function BackendOfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cek = async () => {
      const ok = await pingBackend();
      if (!cancelled) setOnline(ok);
    };
    cek();
    const id = setInterval(cek, 30000);
    const onOnline = () => cek();
    const onOffline = () => {
      if (!cancelled) setOnline(false);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      className="relative z-20 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
    >
      <span className="material-symbols-outlined icon-fill text-[18px]">
        cloud_off
      </span>
      Backend tidak terjangkau — mode offline. Data yang tampil dari cache
      lokal dan perubahan belum tentu tersimpan di server.
    </div>
  );
}
