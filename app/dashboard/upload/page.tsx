'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(Array(MAX_WHATSAPP_NUMBERS).fill(''));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    path: string;
    url: string;
    whatsappSent?: boolean;
    whatsappError?: string;
    whatsappLink: string | null;
    sentTo?: string[];
    failed?: { number: string; error: string }[];
    registration_id?: string;
  } | null>(null);
  const [error, setError] = useState('');

  function setWhatsappAt(index: number, value: string) {
    setWhatsappNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

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
    if (!file || file.size === 0) {
      setError('Please select a horoscope file');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const regId = selectedProfile?.registration_id ?? '';
      if (regId) formData.set('registration_id', regId);
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
        Upload a horoscope (PDF or image). Optionally link to a profile and enter up to 5 WhatsApp numbers. The document can be sent to each number.
      </p>

      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="space-y-4">
          <div>
            <label className="label">Horoscope file *</label>
            <input
              type="file"
              accept=".pdf,image/*"
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div ref={searchRef} className="relative">
            <label className="label">Link to profile (optional)</label>
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
            <p className="text-xs text-navy-500 mt-1">Select a profile to link this file. It will show under that profile.</p>
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

          <div>
            <label className="label">WhatsApp numbers (optional, up to 5)</label>
            <p className="text-xs text-navy-500 mb-2">Enter mobile numbers; 91 will be prefixed if you enter 10 digits.</p>
            <div className="space-y-2">
              {whatsappNumbers.map((num, i) => (
                <input
                  key={i}
                  type="text"
                  className="input"
                  placeholder={i === 0 ? 'e.g. 9876543210 or 919876543210' : `Number ${i + 2}`}
                  value={num}
                  onChange={(e) => setWhatsappAt(i, e.target.value)}
                  maxLength={15}
                />
              ))}
            </div>
          </div>
        </div>
        {error && <p className="alert-error text-sm mt-2">{error}</p>}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={loading}>
          {loading ? 'Uploading horoscope & sending...' : 'Upload horoscope & send to WhatsApp'}
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
          {result.whatsappSent && (
            <div className="mt-2">
              <p className="text-sm text-emerald-700 font-medium">Sent to WhatsApp.</p>
              {result.sentTo && result.sentTo.length > 0 && (
                <p className="text-xs text-navy-600 mt-1">Sent to: <strong>{result.sentTo.join(', ')}</strong></p>
              )}
              {result.failed && result.failed.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Failed: {result.failed.map((f) => `${f.number} (${f.error})`).join('; ')}
                </p>
              )}
              <p className="text-xs text-navy-600 mt-1">
                If not received: check WhatsApp Message requests and Meta → WhatsApp → API Setup → To.
              </p>
            </div>
          )}
          {result.whatsappError && (
            <div className="text-sm text-amber-700 mt-2">
              <p className="font-medium">Could not send: {result.whatsappError}</p>
              {result.whatsappLink && (
                <p className="mt-2">
                  <a href={result.whatsappLink} target="_blank" rel="noopener noreferrer" className="link">
                    Send via WhatsApp link
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
