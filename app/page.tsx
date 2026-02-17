import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect('/dashboard');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-page">
      <div className="w-full max-w-md card shadow-card-hover overflow-hidden border-navy-200/80">
        <div className="bg-sidebar text-white px-6 py-10 -m-4 mb-6 sm:-m-6 sm:mb-6 sm:py-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">Wedding Profile Matcher</h1>
            <p className="text-navy-200 text-sm mt-2">Track profiles and reminders by ID</p>
            <div className="mt-4 h-0.5 w-16 bg-gold-500/60 rounded-full" />
          </div>
        </div>
        <Link href="/login" className="btn-primary inline-block w-full py-3.5 text-center">Login</Link>
      </div>
    </div>
  );
}
