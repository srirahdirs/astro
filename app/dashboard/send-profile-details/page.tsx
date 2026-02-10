'use client';

import { useState, useEffect, useRef } from 'react';

const MAX_WHATSAPP_NUMBERS = 5;

type ProfileSuggestion = { registration_id: string; name: string; role: string; phone: string | null; whatsapp_number: string | null };
type SelectedProfile = {
  registration_id: string;
  name: string;
  role: string;
  phone: string | null;
  whatsapp_number: string | null;
  notes: string | null;
  address?: string | null;
  created_at: string;
};

const DETAIL_FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'address', label: 'Address' },
];

export default function SendProfileDetailsPage() {
  const [profileSearch, setProfileSearch] = useState('');
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  // Editable values that will be sent (pre-filled from profile, user can change)
  const [payload, setPayload] = useState<Record<string, string>>({ name: '', phone: '', whatsapp: '', address: '' });
  const [fieldChecks, setFieldChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(DETAIL_FIELDS.map((f) => [f.key, false]))
  );
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(Array(MAX_WHATSAPP_NUMBERS).fill(''));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sentTo?: string[]; failed?: { number: string; error: string }[] } | null>(null);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  function setWhatsappAt(index: number, value: string) {
    setWhatsappNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  useEffect(() => {
    if (!profileSearch.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/registrations?prefix=${encodeURIComponent(profileSearch.trim())}`);
        const data = await res.json();
        if (res.ok && data.registrations) setSuggestions(data.registrations);
        else setSuggestions([]);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [profileSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function selectProfile(reg: ProfileSuggestion) {
    setProfileSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setResult(null);
    try {
      const res = await fetch(`/api/registrations?registration_id=${encodeURIComponent(reg.registration_id)}`);
      if (!res.ok) throw new Error('Not found');
      const profile = await res.json();
      setSelectedProfile({
        registration_id: profile.registration_id,
        name: profile.name,
        role: profile.role,
        phone: profile.phone ?? null,
        whatsapp_number: profile.whatsapp_number ?? null,
        notes: profile.notes ?? null,
        address: profile.address ?? null,
        created_at: profile.created_at,
      });
      setPayload({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        whatsapp: profile.whatsapp_number ?? '',
        address: profile.address ?? '',
      });
    } catch {
      setSelectedProfile({ ...reg, notes: null, address: null, created_at: '' });
      setPayload({ name: reg.name ?? '', phone: reg.phone ?? '', whatsapp: reg.whatsapp_number ?? '', address: '' });
    }
  }

  function setPayloadField(key: string, value: string) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  function toggleField(key: string) {
    setFieldChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!selectedProfile) {
      setError('Select a profile first');
      return;
    }
    const numbers = whatsappNumbers.map((n) => n.trim().replace(/\D/g, '')).filter(Boolean);
    if (numbers.length === 0) {
      setError('Enter at least one WhatsApp number');
      return;
    }
    if (!Object.values(fieldChecks).some(Boolean)) {
      setError('Select at least one field to send');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        registration_id: selectedProfile.registration_id,
        fields: fieldChecks,
        payload: { name: payload.name, phone: payload.phone, whatsapp: payload.whatsapp, address: payload.address },
      };
      for (let i = 0; i < MAX_WHATSAPP_NUMBERS; i++) {
        const v = whatsappNumbers[i]?.trim().replace(/\D/g, '');
        if (v) body[`whatsapp_${i + 1}`] = v;
      }
      const res = await fetch('/api/send-profile-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send');
        return;
      }
      setResult({ sentTo: data.sentTo, failed: data.failed });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-dashboard max-w-2xl">
      <h1 className="page-title">Send profile details to WhatsApp</h1>
      <p className="text-slate-600 mb-6">Select a profile and choose which details to send. The selected fields will be sent as a text message to up to 5 WhatsApp numbers.</p>

      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="space-y-4">
          <div ref={searchRef} className="relative">
            <label className="label">Profile</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Type to search e.g. 4 → 40001, 40002..."
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              disabled={!!selectedProfile}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="dropdown-list">
                {suggestions.map((r) => (
                  <li
                    key={r.registration_id}
                    className="dropdown-item"
                    onClick={() => selectProfile(r)}
                  >
                    <span className="font-medium">{r.registration_id}</span>
                    {' – '}
                    <span>{r.name}</span>
                    {' – '}
                    <span className="text-slate-600">{r.phone || r.whatsapp_number || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
            {showSuggestions && profileSearch.trim() && suggestions.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">No profiles found.</p>
            )}
          </div>

          {selectedProfile && (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-semibold text-slate-800">Profile details – edit below, then choose what to send</h3>
                  <button
                    type="button"
                    className="link text-sm shrink-0"
                    onClick={() => {
                      setSelectedProfile(null);
                      setResult(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">Profile ID: <strong>{selectedProfile.registration_id}</strong> (read-only). Edit the fields below; these values will be sent when you check the boxes.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Name (to send)</label>
                    <input type="text" className="input" value={payload.name} onChange={(e) => setPayloadField('name', e.target.value)} placeholder="Name" />
                  </div>
                  <div>
                    <label className="label text-xs">Phone (to send)</label>
                    <input type="text" className="input" value={payload.phone} onChange={(e) => setPayloadField('phone', e.target.value)} placeholder="Phone" />
                  </div>
                  <div>
                    <label className="label text-xs">WhatsApp (to send)</label>
                    <input type="text" className="input" value={payload.whatsapp} onChange={(e) => setPayloadField('whatsapp', e.target.value)} placeholder="WhatsApp number" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-xs">Address (to send)</label>
                    <input type="text" className="input" value={payload.address} onChange={(e) => setPayloadField('address', e.target.value)} placeholder="Address" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Include in message (check to send)</label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {DETAIL_FIELDS.map((f) => (
                    <label key={f.key} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!fieldChecks[f.key]}
                        onChange={() => toggleField(f.key)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">WhatsApp numbers (up to 5)</label>
                <p className="text-xs text-slate-500 mb-2">91 will be prefixed if you enter 10 digits.</p>
                <div className="space-y-2">
                  {whatsappNumbers.map((num, i) => (
                    <input
                      key={i}
                      type="text"
                      className="input"
                      placeholder={i === 0 ? 'e.g. 9876543210' : `Number ${i + 2}`}
                      value={num}
                      onChange={(e) => setWhatsappAt(i, e.target.value)}
                      maxLength={15}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {error && <p className="alert-error text-sm mt-2">{error}</p>}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={loading || !selectedProfile}>
          {loading ? 'Sending...' : 'Send profile details to WhatsApp'}
        </button>
      </form>

      {result && (
        <div className="card card-accent alert-success">
          <h2 className="section-title-accent">Details sent</h2>
          {result.sentTo && result.sentTo.length > 0 && (
            <p className="text-sm">Sent to: <strong>{result.sentTo.join(', ')}</strong></p>
          )}
          {result.failed && result.failed.length > 0 && (
            <p className="text-sm alert-warning mt-2">Failed: {result.failed.map((f) => `${f.number} (${f.error})`).join('; ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
