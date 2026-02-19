import Link from 'next/link';

const searchOptions = [
  {
    href: '/dashboard/horoscope-profile-search',
    title: 'Horoscope sent to',
    desc: 'Search profile and see who received their horoscope PDF (from Upload horoscope)',
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  },
  {
    href: '/dashboard/profile-details-sent-search',
    title: 'Details sent to',
    desc: 'Search profile and see who received their profile details (from Send profile details)',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    href: '/dashboard/received-profile-search',
    title: 'Details received from',
    desc: 'Search profile and see who sent their details to this profile',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
];

export default function ProfileSearchPage() {
  return (
    <div className="container-dashboard">
      <h1 className="page-title">Profile search</h1>
      <p className="text-navy-600 mb-8">
        Search by profile ID to find sharing history. Choose what you want to see:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {searchOptions.map((item) => (
          <Link key={item.href} href={item.href} className="card-hover block group">
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 mb-4 group-hover:bg-gold-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-navy-800 group-hover:text-gold-800 transition-colors mb-2">{item.title}</h3>
              <p className="text-sm text-navy-600 flex-1">{item.desc}</p>
              <span className="link text-sm mt-3 inline-block">Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
