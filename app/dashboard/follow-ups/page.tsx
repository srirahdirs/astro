'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type FollowUp = {
  id: number;
  registration_id: string;
  due_date: string;
  note: string;
  status: string;
  created_at: string;
  registration_name: string;
  registration_role: string;
};

export default function FollowUpsPage() {
  const [list, setList] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ registration_id: '', due_date: '', note: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registrations, setRegistrations] = useState<{ registration_id: string; name: string }[]>([]);

  async function fetchList() {
    const res = await fetch('/api/follow-ups');
    const data = await res.json();
    setList(data.followUps || []);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchList();
      const r = await fetch('/api/registrations');
      const d = await r.json();
      setRegistrations(d.registrations || []);
      setLoading(false);
    })();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/follow-ups', {
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
      setForm({ registration_id: '', due_date: '', note: '' });
      fetchList();
    } catch {
      setSubmitError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(f: FollowUp) {
    const newStatus = f.status === 'pending' ? 'done' : 'pending';
    await fetch(`/api/follow-ups/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    fetchList();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="page-title mb-0">Reminders</h1>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary w-full sm:w-auto shrink-0">
          {showForm ? 'Cancel' : 'Add reminder'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card mb-6">
          <h2 className="section-title-accent">New reminder</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Profile ID *</label>
              <input
                className="input"
                list="reg-list"
                value={form.registration_id}
                onChange={(e) => setForm({ ...form, registration_id: e.target.value })}
                required
              />
              <datalist id="reg-list">
                {registrations.map((r) => (
                  <option key={r.registration_id} value={r.registration_id}>{r.name}</option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Due date *</label>
              <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Note *</label>
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Call back after 5 days" required />
            </div>
          </div>
          {submitError && <p className="alert-error text-sm mt-2">{submitError}</p>}
          <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</button>
        </form>
      )}

      <div className="table-wrap">
        {loading ? (
          <p className="p-6 text-slate-600">Loading...</p>
        ) : list.length === 0 ? (
          <p className="p-6 text-slate-600">No reminders.</p>
        ) : (
          <table className="w-full min-w-[520px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Registration</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Due date</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Note</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className={`border-t border-slate-200 hover:bg-slate-50 transition-colors ${f.due_date === today && f.status === 'pending' ? 'bg-amber-50' : ''}`}>
                  <td className="p-3">
                    <Link href={`/dashboard/horoscope-profile-search?id=${f.registration_id}`} className="link font-medium">{f.registration_id}</Link>
                    <span className="text-slate-600"> – {f.registration_name}</span>
                  </td>
                  <td className="p-3 text-slate-800">{f.due_date}</td>
                  <td className="p-3 text-slate-600">{f.note}</td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${f.status === 'done' ? 'text-green-600' : 'text-amber-600'}`}>{f.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => toggleStatus(f)} className="link text-sm">
                      Mark as {f.status === 'pending' ? 'done' : 'pending'}
                    </button>
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
