'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LookupRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    const url = id ? `/dashboard/horoscope-profile-search?id=${encodeURIComponent(id)}` : '/dashboard/horoscope-profile-search';
    router.replace(url);
  }, [router, searchParams]);

  return (
    <div className="container-dashboard">
      <p className="text-navy-600">Redirecting...</p>
    </div>
  );
}
