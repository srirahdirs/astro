'use client';

import { useState, useEffect, useRef } from 'react';
import WhatsAppNumberInput from '@/components/WhatsAppNumberInput';

const MAX_WHATSAPP_NUMBERS = 5;

type ProfileSuggestion = {
  registration_id: string;
  name: string;
  role: string;
  phone: string | null;
  whatsapp_number: string | null;
};
type SelectedProfile = {
  registration_id: string;
  name: string;
  role: string;
  phone: string | null;
  whatsapp_number: string | null;
  notes: string | null;
  created_at: string;
};

export default function UploadHoroscopePage() {
  const [file, setFile] = useState<File | null>(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(Array(MAX_WHATSAPP_NUMBERS).fill(''));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    path: string;
    url: string;
    whatsappLinks?: { number: string; url: string }[];
    twilioResults?: { number: string; ok: boolean; sid?: string; error?: string }[];
    registration_id?: string;
  } | null>(null);
  const [sendViaTwilio, setSendViaTwilio] = useState(false);
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [error, setError] = useState('');

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
      setProfileSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(() => {
      setSuggestionsLoading(true);
      fetch(`/api/registrations?search=${encodeURIComponent(profileSearch.trim())}`)
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data.registrations) setProfileSuggestions(data.registrations);
          else setProfileSuggestions([]);
          setShowSuggestions(true);
        })
        .catch(() => setProfileSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
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
    setProfileSuggestions([]);
    setShowSuggestions(false);
    const roleDisplay = String(reg.role).charAt(0).toUpperCase() + String(reg.role).slice(1);
    setSelectedProfile({
      registration_id: reg.registration_id,
      name: reg.name,
      role: roleDisplay,
      phone: reg.phone ?? null,
      whatsapp_number: reg.whatsapp_number ?? null,
      notes: null,
      created_at: '',
    });
    try {
      const res = await fetch(`/api/registrations?registration_id=${encodeURIComponent(reg.registration_id)}`);
      if (res.ok) {
        const profile = await res.json();
        setSelectedProfile({
          registration_id: profile.registration_id,
          name: profile.name,
          role: profile.role,
          phone: profile.phone ?? null,
          whatsapp_number: profile.whatsapp_number ?? null,
          notes: profile.notes ?? null,
          created_at: profile.created_at ?? '',
        });
      }
    } catch {
      // keep initial selection
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    // Read file from input ref as fallback (state can be lost on re-renders)
    const fileToUpload = fileInputRef.current?.files?.[0] || file;
    if (!fileToUpload || fileToUpload.size === 0) {
      setError('Please select a horoscope PDF file');
      return;
    }
    const ext = fileToUpload.name.toLowerCase().slice(fileToUpload.name.lastIndexOf('.'));
    if (ext !== '.pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    if (!selectedProfile) {
      setError('Please select a profile to store the horoscope with');
      return;
    }
    const numbers = whatsappNumbers.map((n) => n.trim().replace(/\D/g, '')).filter(Boolean);
    const normalized = numbers.map((n) => (n.length === 10 ? `91${n}` : n.startsWith('91') ? n : n));
    if (numbers.length > 0 && new Set(normalized).size < normalized.length) {
      setError('Remove duplicate numbers before sending.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('file', fileToUpload);
      formData.set('registration_id', selectedProfile.registration_id);
      formData.set('send_via_twilio', String(sendViaTwilio));
      whatsappNumbers.forEach((num, i) => {
        const digits = num.trim().replace(/\D/g, '');
        if (digits) formData.set(`whatsapp_${i + 1}`, digits);
      });
      const res = await fetch('/api/upload-horoscope', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      setResult(data);
      setFile(null);
      setSelectedProfile(null);
      setWhatsappNumbers(Array(MAX_WHATSAPP_NUMBERS).fill(''));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-dashboard">
      <h1 className="page-title">Upload horoscope</h1>
      <p className="text-navy-600 mb-6">
        Upload a horoscope PDF. Select a profile to store it with, then enter up to 5 WhatsApp numbers. After upload, click each link to open WhatsApp and send (message includes PDF link).
      </p>

      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="space-y-4">
          <div>
            <label className="label">Horoscope PDF *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-navy-500 mt-1">PDF only. The file will be stored with the profile.</p>
          </div>

          <div ref={searchRef} className="relative">
            <label className="label">Link to profile *</label>
            <input
              type="text"
              className="input"
              placeholder="Type ID or name to search..."
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              onFocus={() => profileSuggestions.length > 0 && setShowSuggestions(true)}
              disabled={!!selectedProfile}
            />
            {suggestionsLoading && <p className="text-xs text-navy-500 mt-1">Searching...</p>}
            {showSuggestions && profileSuggestions.length > 0 && (
              <div className="dropdown-list top-full left-0 right-0 mt-1 max-h-56">
                {profileSuggestions.map((r) => (
                  <button
                    key={r.registration_id}
                    type="button"
                    className="dropdown-item w-full text-left"
                    onClick={() => selectProfile(r)}
                  >
                    <span className="font-medium text-navy-800">{r.registration_id}</span>
                    <span className="text-navy-500 ml-2">{r.name}</span>
                    <span className="text-navy-400 ml-1 text-xs">
                      ({String(r.role).charAt(0).toUpperCase() + String(r.role).slice(1)})
                    </span>
                    <span className="text-navy-400 ml-1 text-xs">
                      {r.phone || r.whatsapp_number || '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && !suggestionsLoading && profileSearch.trim() && profileSuggestions.length === 0 && (
              <p className="text-xs text-navy-500 mt-1">No profiles found.</p>
            )}
            <p className="text-xs text-navy-500 mt-1">Required. PDF will be stored with this profile and shown under their profile.</p>
          </div>

          {selectedProfile && (
            <div className="rounded-xl border border-navy-200/60 bg-navy-50/30 p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-semibold text-navy-800">Selected profile</h3>
                <button type="button" className="link text-sm shrink-0" onClick={() => setSelectedProfile(null)}>
                  Clear
                </button>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-navy-500">Profile ID</dt>
                <dd className="font-medium">{selectedProfile.registration_id}</dd>
                <dt className="text-navy-500">Name</dt>
                <dd>{selectedProfile.name}</dd>
                <dt className="text-navy-500">Gender</dt>
                <dd>{String(selectedProfile.role).charAt(0).toUpperCase() + String(selectedProfile.role).slice(1)}</dd>
                <dt className="text-navy-500">Phone</dt>
                <dd>{selectedProfile.phone || '—'}</dd>
                <dt className="text-navy-500">WhatsApp</dt>
                <dd>{selectedProfile.whatsapp_number || '—'}</dd>
                {selectedProfile.notes && (
                  <>
                    <dt className="text-navy-500">Notes</dt>
                    <dd>{selectedProfile.notes}</dd>
                  </>
                )}
                <dt className="text-navy-500">Created</dt>
                <dd>{selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : '—'}</dd>
              </dl>
            </div>
          )}

          {twilioConfigured && (
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendViaTwilio}
                  onChange={(e) => setSendViaTwilio(e.target.checked)}
                  className="rounded border-navy-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm font-medium">Send via Twilio (automatic)</span>
              </label>
              <p className="text-xs text-navy-500 mt-1">
                When checked, the PDF is sent as a WhatsApp attachment. Set NEXT_PUBLIC_APP_URL to your production URL.
              </p>
            </div>
          )}

          <div>
            <label className="label">WhatsApp numbers (optional, up to 5)</label>
            <p className="text-xs text-navy-500 mb-2">
              Enter mobile numbers or type a Profile ID to search — select a profile to auto-fill their phone/WhatsApp.
            </p>
            <div className="space-y-2">
              {whatsappNumbers.map((num, i) => (
                <WhatsAppNumberInput
                  key={i}
                  value={num}
                  onChange={(v) => setWhatsappAt(i, v)}
                  placeholder={i === 0 ? 'e.g. 9876543210 or type Profile ID (e.g. 40001)' : `Number ${i + 2}`}
                  otherValues={whatsappNumbers.filter((_, idx) => idx !== i)}
                />
              ))}
            </div>
          </div>
        </div>
        {error && <p className="alert-error text-sm mt-2">{error}</p>}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload horoscope'}
        </button>
      </form>

      {result && (
        <div className="card card-accent alert-success">
          <h2 className="section-title-accent">Done</h2>
          <p className="text-sm text-navy-700 mb-2">Horoscope saved.</p>
          <p className="text-sm mb-2">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="link">
              Open horoscope
            </a>
          </p>
          {result.twilioResults && result.twilioResults.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-navy-700 font-medium mb-2">Twilio send results:</p>
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
          {result.whatsappLinks && result.whatsappLinks.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-navy-700 font-medium mb-2">
                {result.twilioResults ? 'Or send manually — click each to open chat:' : 'Send via WhatsApp — click each to open chat and send:'}
              </p>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
