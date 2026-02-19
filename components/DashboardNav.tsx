'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/profile-search', label: 'Profile search' },
  { href: '/dashboard/registrations', label: 'Profiles' },
  { href: '/dashboard/follow-ups', label: 'Reminders' },
  { href: '/dashboard/upload', label: 'Upload horoscope' },
  { href: '/dashboard/send-profile-details', label: 'Send profile details' },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400"
        aria-expanded={open}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-0 bg-slate-800 border-b border-slate-700 shadow-xl md:hidden">
          <nav className="flex flex-col py-2 px-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href ? 'bg-violet-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.href ? 'bg-violet-600 text-white' : 'text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
