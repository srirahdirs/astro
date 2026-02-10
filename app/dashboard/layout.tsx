import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getViewerAllowedMenus } from '@/lib/settings';
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  let allowedMenus: string[] | null = null;
  if (session.role === 'viewer') {
    try {
      allowedMenus = await getViewerAllowedMenus();
    } catch {
      allowedMenus = [];
    }
  }

  return (
    <div className="min-h-screen flex bg-page">
      <DashboardSidebar role={session.role} allowedMenus={allowedMenus} />
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 w-full p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
