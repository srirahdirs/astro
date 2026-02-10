'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ registration_id: '', name: '', role: 'male', phone: '', whatsapp_number: '', notes: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [phoneCopied, setPhoneCopied] = useState(false);

  function handleCopyPhone() {
    const phone = form.phone.trim();
    if (!phone) return;
    navigator.clipboard.writeText(phone).then(() => {
      setForm((f) => ({ ...f, whatsapp_number: phone }));
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    });
  }

  useEffect(() => {
    fetch(`/api/registrations/${id}`)
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => setForm({
        registration_id: data.registration_id || '',
        name: data.name || '',
        role: data.role || 'male',
        phone: data.phone || '',
        whatsapp_number: data.whatsapp_number || '',
        notes: data.notes || '',
        address: data.address || '',
      }))
      .catch(() => setError('Not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed');
        return;
      }
      router.push('/dashboard/registrations');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container-dashboard"><p className="text-slate-600 p-6">Loading...</p></div>;
  if (error) return <div className="container-dashboard"><div className="card"><p className="alert-error">{error}</p><Link href="/dashboard/registrations" className="btn-secondary mt-4 inline-block">← Back to profiles</Link></div></div>;

  return (
    <div className="container-dashboard max-w-2xl">
      <Link href="/dashboard/registrations" className="link mb-4 inline-block">← Back to profiles</Link>
      <h1 className="page-title">Edit profile</h1>
      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Profile ID *</label>
            <input className="input" value={form.registration_id} onChange={(e) => setForm({ ...form, registration_id: e.target.value })} required />
            <p className="text-xs text-slate-500 mt-1">Must be unique across all profiles.</p>
          </div>
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Gender *</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <div className="flex gap-2">
              <input className="input flex-1 min-w-0" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 9876543210" />
              <button
                type="button"
                onClick={handleCopyPhone}
                disabled={!form.phone.trim()}
                title="Copy phone and use as WhatsApp number"
                className="shrink-0 flex items-center justify-center w-10 h-[42px] rounded-xl border-2 border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {phoneCopied ? (
                  <span className="text-xs font-medium text-emerald-600">OK</span>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-navy-500 mt-1">Copy: also sets WhatsApp number to this phone.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">WhatsApp number</label>
            <input className="input" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Notes</label>
          <textarea className="input min-h-[80px]" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        {error && <p className="alert-error text-sm mt-2">{error}</p>}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
}
