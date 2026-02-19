import Link from 'next/link';
import { getFollowUpsDueToday } from '@/lib/queries';

const menuCards = [
  { href: '/dashboard/profile-search', title: 'Profile search', desc: 'Search by profile ID — see horoscope sent to, details sent to, or details received from', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { href: '/dashboard/registrations', title: 'Profiles', desc: 'Add and edit profiles (male / female)', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/dashboard/follow-ups', title: 'Reminders', desc: 'Add reminders (e.g. call back after 5 days)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/upload', title: 'Upload horoscope', desc: 'Upload horoscope and send to WhatsApp', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { href: '/dashboard/send-profile-details', title: 'Send profile details', desc: 'Send selected profile details (name, phone, etc.) to WhatsApp numbers', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

export default async function DashboardPage() {
  const dueToday = await getFollowUpsDueToday();

  return (
    <div className="container-dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="card card-accent mb-8">
        <h2 className="section-title-accent">Reminders due today</h2>
        {dueToday.length === 0 ? (
          <p className="text-navy-600">No reminders due today.</p>
        ) : (
          <ul className="space-y-2">
            {dueToday.map((f: any) => (
              <li key={f.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-navy-100 last:border-0">
                <span className="text-navy-800">
                  <strong>{f.registration_id}</strong> – {f.registration_name} ({String(f.registration_role).charAt(0).toUpperCase() + String(f.registration_role).slice(1)})
                  <span className="text-navy-600 block sm:inline sm:ml-2">{f.note}</span>
                </span>
                <Link href="/dashboard/follow-ups" className="btn-secondary text-sm self-start sm:self-center shrink-0">
                  Manage
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 pt-3 border-t border-navy-100">
          <Link href="/dashboard/follow-ups" className="link font-medium">View all reminders →</Link>
        </div>
      </div>

      <h2 className="section-title-accent mb-4">Quick actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {menuCards.map((item) => (
          <Link key={item.href} href={item.href} className="card-hover block group">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 group-hover:bg-gold-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-navy-800 group-hover:text-gold-800 transition-colors">{item.title}</h3>
                <p className="text-sm text-navy-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
