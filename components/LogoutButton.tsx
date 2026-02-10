'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton({ sidebar }: { sidebar?: boolean }) {
  const router = useRouter();
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  if (sidebar) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-200 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-3 py-2 rounded-xl text-sm font-medium text-navy-200 hover:bg-white/10 hover:text-white transition-colors"
    >
      Logout
    </button>
  );
}
