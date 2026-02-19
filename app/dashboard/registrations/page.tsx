'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Registration = {
  id: number;
  registration_id: string;
  name: string;
  role: string;
  phone: string | null;
  whatsapp_number: string | null;
  horoscope_path: string | null;
  notes: string | null;
  address: string | null;
  created_at: string;
};

export default function RegistrationsPage() {
  const [list, setList] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ registration_id: '', name: '', role: 'male', phone: '', whatsapp_number: '', notes: '', address: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  async function fetchList() {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/registrations${q}`);
    const data = await res.json();
    setList(data.registrations || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchList();
  }, [search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed');
        return;
      }
      setShowForm(false);
      setForm({ registration_id: '', name: '', role: 'male', phone: '', whatsapp_number: '', notes: '', address: '' });
      fetchList();
    } catch {
      setSubmitError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-dashboard w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="page-title mb-0">Profiles</h1>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary w-full sm:w-auto shrink-0">
          {showForm ? 'Cancel' : 'Add profile'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card mb-6">
          <h2 className="section-title-accent">New profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Profile ID *</label>
              <input className="input" value={form.registration_id} onChange={(e) => setForm({ ...form, registration_id: e.target.value })} placeholder="e.g. 40001" required />
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
              <input className="input" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="e.g. 919876543210" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes</label>
            <textarea className="input min-h-[80px]" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {submitError && <p className="alert-error text-sm mt-2">{submitError}</p>}
          <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</button>
        </form>
      )}

      <div className="mb-4">
        <input
          type="text"
          className="input max-w-full sm:max-w-xs"
          placeholder="Search by ID, name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        {loading ? (
          <p className="p-6 text-slate-600">Loading...</p>
        ) : list.length === 0 ? (
          <p className="p-6 text-slate-600">No profiles found.</p>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">ID</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Gender</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Phone / WhatsApp</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700 hidden lg:table-cell">Address</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">File</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <Link href={`/dashboard/horoscope-profile-search?id=${r.registration_id}`} className="link font-medium">{r.registration_id}</Link>
                  </td>
                  <td className="p-3 text-slate-800">{r.name}</td>
                  <td className="p-3 text-slate-600">{String(r.role).charAt(0).toUpperCase() + String(r.role).slice(1)}</td>
                  <td className="p-3 text-slate-600 text-sm">{r.phone || '—'}{r.whatsapp_number && ` / ${r.whatsapp_number}`}</td>
                  <td className="p-3 text-slate-600 text-sm max-w-[180px] truncate hidden lg:table-cell" title={r.address || undefined}>{r.address || '—'}</td>
                  <td className="p-3">
                    {r.horoscope_path ? (
                      <a href={r.horoscope_path.startsWith('http') ? r.horoscope_path : (typeof window !== 'undefined' ? window.location.origin : '') + r.horoscope_path} target="_blank" rel="noopener noreferrer" className="link text-sm">View</a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/dashboard/registrations/${r.id}`} className="link text-sm">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
