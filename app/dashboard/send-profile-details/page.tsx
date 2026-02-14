'use client';

import { useState, useEffect, useRef } from 'react';
import WhatsAppNumberInput from '@/components/WhatsAppNumberInput';

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
  const [result, setResult] = useState<{
    whatsappLinks?: { number: string; url: string }[];
    twilioResults?: { number: string; ok: boolean; sid?: string; error?: string }[];
  } | null>(null);
  const [sendViaTwilio, setSendViaTwilio] = useState(false);
  const [twilioConfigured, setTwilioConfigured] = useState(false);
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
    fetch('/api/whatsapp-status')
      .then((r) => r.json())
      .then((d) => setTwilioConfigured(!!d?.twilioConfigured))
      .catch(() => setTwilioConfigured(false));
  }, []);

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
    const normalized = numbers.map((n) => (n.length === 10 ? `91${n}` : n.startsWith('91') ? n : n));
    if (new Set(normalized).size < normalized.length) {
      setError('Remove duplicate numbers before sending.');
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
        send_via_twilio: sendViaTwilio,
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
      setResult({ whatsappLinks: data.whatsappLinks, twilioResults: data.twilioResults });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-dashboard max-w-2xl">
      <h1 className="page-title">Send profile details to WhatsApp</h1>
      <p className="text-slate-600 mb-6">Select a profile and choose which details to send. After submit, click each link to open WhatsApp and send the message to each number.</p>

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

              {twilioConfigured && (
                <div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendViaTwilio}
                      onChange={(e) => setSendViaTwilio(e.target.checked)}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm font-medium">Send via Twilio (automatic)</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    When checked, messages are sent automatically via WhatsApp. Otherwise, click links to send manually.
                  </p>
                </div>
              )}

              <div>
                <label className="label">WhatsApp numbers (up to 5)</label>
                <p className="text-xs text-slate-500 mb-2">
                  Enter mobile numbers or type a Profile ID to search — select a profile to auto-fill their phone/WhatsApp.
                </p>
                <div className="space-y-2">
                  {whatsappNumbers.map((num, i) => (
                    <WhatsAppNumberInput
                      key={i}
                      value={num}
                      onChange={(v) => setWhatsappAt(i, v)}
                      placeholder={i === 0 ? 'e.g. 9876543210 or type Profile ID' : `Number ${i + 2}`}
                      otherValues={whatsappNumbers.filter((_, idx) => idx !== i)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {error && <p className="alert-error text-sm mt-2">{error}</p>}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={loading || !selectedProfile}>
          {loading ? 'Processing...' : 'Open WhatsApp links'}
        </button>
      </form>

      {result && (
        <div className="card card-accent alert-success">
          <h2 className="section-title-accent">Ready to send</h2>
          {result.twilioResults && result.twilioResults.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-slate-700 font-medium mb-2">Twilio send results:</p>
              <ul className="space-y-1 text-sm">
                {result.twilioResults.map((r) => (
                  <li key={r.number}>
                    {r.number}: {r.ok ? (
                      <span className="text-emerald-600">Sent ✓</span>
                    ) : (
                      <span className="text-red-600">{r.error || 'Failed'}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-slate-700 mb-3">
            {result.twilioResults ? 'Or click each button to send manually:' : 'Click each button to open WhatsApp and send the message:'}
          </p>
          {result.whatsappLinks && result.whatsappLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.whatsappLinks.map(({ number, url }) => (
                  <a
                    key={number}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                  >
                    Send to {number}
                  </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
