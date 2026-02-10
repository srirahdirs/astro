'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DASHBOARD_LINKS } from '@/components/DashboardSidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch('/api/settings/viewer-menus')
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return { menus: [] };
        }
        return res.json();
      })
      .then((data) => setAllowedMenus(data.menus || []))
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, []);

  function toggle(href: string) {
    setAllowedMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch('/api/settings/viewer-menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: allowedMenus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error || 'Failed' });
        return;
      }
      setMessage({ type: 'ok', text: 'Saved. User role will see only the selected menus.' });
      router.refresh();
    } catch {
      setMessage({ type: 'err', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container-dashboard">
        <h1 className="page-title">Settings</h1>
        <p className="text-navy-600">Loading...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="container-dashboard">
        <h1 className="page-title">Settings</h1>
        <p className="alert-error">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container-dashboard max-w-2xl">
      <h1 className="page-title">Settings</h1>
      <p className="text-navy-600 mb-6">Configure which menus the User role can see. Admins always see all menus.</p>

      <form onSubmit={handleSubmit} className="card">
        <h2 className="section-title-accent mb-4">User role menu access</h2>
        <p className="text-sm text-navy-600 mb-4">Select the menu items that users (non-admin) can see in the sidebar.</p>
        <ul className="space-y-2">
          {DASHBOARD_LINKS.map((link) => (
            <li key={link.href} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={'menu-' + link.href.replace(/\//g, '-')}
                checked={allowedMenus.includes(link.href)}
                onChange={() => toggle(link.href)}
                className="w-4 h-4 rounded border-navy-300 text-gold-600 focus:ring-gold-500"
              />
              <label htmlFor={'menu-' + link.href.replace(/\//g, '-')} className="text-sm font-medium text-navy-800 cursor-pointer">
                {link.label}
              </label>
              <span className="text-xs text-navy-500">{link.href}</span>
            </li>
          ))}
        </ul>
        {message && (
          <p className={'mt-4 text-sm ' + (message.type === 'ok' ? 'alert-success' : 'alert-error')}>{message.text}</p>
        )}
        <button type="submit" className="btn-primary mt-4" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
