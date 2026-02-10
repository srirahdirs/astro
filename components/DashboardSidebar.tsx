'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

export const DASHBOARD_LINKS = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/lookup', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { href: '/dashboard/registrations', label: 'Profiles', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/dashboard/record-share', label: 'Add share', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
  { href: '/dashboard/follow-ups', label: 'Reminders', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/upload', label: 'Upload horoscope', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { href: '/dashboard/send-profile-details', label: 'Send details', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

const SETTINGS_LINK = { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' };
const CHANGE_PASSWORD_LINK = { href: '/dashboard/change-password', label: 'Change password', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' };

type Props = { role: string; allowedMenus: string[] | null };

export default function DashboardSidebar({ role, allowedMenus }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = role === 'admin';
  const visibleLinks = isAdmin
    ? DASHBOARD_LINKS
    : DASHBOARD_LINKS.filter((link) => allowedMenus && allowedMenus.includes(link.href));

  const NavContent = () => (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
        onClick={() => setMobileOpen(false)}
      >
        <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
          <span className="text-gold-400 font-heading font-bold text-lg">W</span>
        </div>
        <span className="font-heading font-semibold text-white text-lg tracking-tight">Profile Matcher</span>
      </Link>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                  : 'text-navy-200 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              {link.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href={SETTINGS_LINK.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === SETTINGS_LINK.href
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                : 'text-navy-200 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <svg className="w-5 h-5 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={SETTINGS_LINK.icon} />
            </svg>
            {SETTINGS_LINK.label}
          </Link>
        )}
        <Link
          href={CHANGE_PASSWORD_LINK.href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === CHANGE_PASSWORD_LINK.href
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
              : 'text-navy-200 hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <svg className="w-5 h-5 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CHANGE_PASSWORD_LINK.icon} />
          </svg>
          {CHANGE_PASSWORD_LINK.label}
        </Link>
      </nav>
      <div className="p-3 border-t border-white/10">
        <LogoutButton sidebar />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: top bar with Menu button and Logout */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar shadow-sidebar flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          <span className="font-medium text-sm">Menu</span>
        </button>
        <Link href="/dashboard" className="font-heading font-semibold text-white text-lg truncate" onClick={() => setMobileOpen(false)}>
          Profile Matcher
        </Link>
        <LogoutButton />
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-navy-950/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`lg:flex lg:flex-col lg:w-64 lg:min-h-screen lg:flex-shrink-0 lg:translate-x-0 bg-sidebar shadow-sidebar transition-transform duration-300 ease-out fixed lg:sticky top-0 left-0 z-30 w-72 min-h-full ${
          mobileOpen ? 'flex flex-col translate-x-0' : 'hidden -translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-14 lg:pt-0">
          <NavContent />
        </div>
      </aside>

      {/* Desktop: spacer for mobile top bar */}
      <div className="lg:hidden h-14 flex-shrink-0" />
    </>
  );
}
