'use client';

import { useState, useEffect, useRef } from 'react';

type RegistrationOption = { registration_id: string; name: string; role: string };
type FullProfile = {
  registration_id: string;
  name: string;
  role: string;
  phone: string | null;
  whatsapp_number: string | null;
  notes: string | null;
  created_at: string;
};

export default function RecordSharePage() {
  const [senderId, setSenderId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [senderProfile, setSenderProfile] = useState<FullProfile | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<FullProfile | null>(null);
  const [sharedVia, setSharedVia] = useState<'whatsapp' | 'manual' | 'other'>('whatsapp');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [senderSuggestions, setSenderSuggestions] = useState<RegistrationOption[]>([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState<RegistrationOption[]>([]);
  const [showSenderSuggestions, setShowSenderSuggestions] = useState(false);
  const [showRecipientSuggestions, setShowRecipientSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const senderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recipientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const senderWrapperRef = useRef<HTMLDivElement>(null);
  const recipientWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!senderId.trim()) {
      setSenderSuggestions([]);
      return;
    }
    if (senderDebounceRef.current) clearTimeout(senderDebounceRef.current);
    senderDebounceRef.current = setTimeout(() => {
      setSuggestionsLoading(true);
      fetch(`/api/registrations?search=${encodeURIComponent(senderId.trim())}`)
        .then((r) => r.json())
        .then((d) => setSenderSuggestions(d.registrations || []))
        .catch(() => setSenderSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
    }, 250);
    return () => {
      if (senderDebounceRef.current) clearTimeout(senderDebounceRef.current);
    };
  }, [senderId]);

  useEffect(() => {
    if (!recipientId.trim()) {
      setRecipientSuggestions([]);
      return;
    }
    if (recipientDebounceRef.current) clearTimeout(recipientDebounceRef.current);
    recipientDebounceRef.current = setTimeout(() => {
      setSuggestionsLoading(true);
      fetch(`/api/registrations?search=${encodeURIComponent(recipientId.trim())}`)
        .then((r) => r.json())
        .then((d) => setRecipientSuggestions(d.registrations || []))
        .catch(() => setRecipientSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
    }, 250);
    return () => {
      if (recipientDebounceRef.current) clearTimeout(recipientDebounceRef.current);
    };
  }, [recipientId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (senderWrapperRef.current && !senderWrapperRef.current.contains(e.target as Node)) setShowSenderSuggestions(false);
      if (recipientWrapperRef.current && !recipientWrapperRef.current.contains(e.target as Node)) setShowRecipientSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!senderId.trim() || !recipientId.trim()) {
      setMessage({ type: 'err', text: 'Sender and recipient required' });
      return;
    }
    if (senderId.trim() === recipientId.trim()) {
      setMessage({ type: 'err', text: 'Sender and recipient must be different' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_registration_id: senderId.trim(),
          recipient_registration_id: recipientId.trim(),
          shared_via: sharedVia,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error || 'Failed' });
        return;
      }
      setMessage({ type: 'ok', text: 'Share recorded.' });
      setSenderId('');
      setRecipientId('');
      setSenderProfile(null);
      setRecipientProfile(null);
      setShowSenderSuggestions(false);
      setShowRecipientSuggestions(false);
    } catch {
      setMessage({ type: 'err', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  function renderSuggestion(reg: RegistrationOption) {
    const role = String(reg.role).charAt(0).toUpperCase() + String(reg.role).slice(1);
    return (
      <>
        <span className="font-medium text-navy-800">{reg.registration_id}</span>
        <span className="text-navy-500 ml-2">{reg.name}</span>
        <span className="text-navy-400 ml-1 text-xs">({role})</span>
      </>
    );
  }

  async function fetchAndSetSender(reg: RegistrationOption) {
    setSenderId(reg.registration_id);
    setShowSenderSuggestions(false);
    try {
      const res = await fetch(`/api/registrations?registration_id=${encodeURIComponent(reg.registration_id)}`);
      if (res.ok) {
        const p = await res.json();
        setSenderProfile({
          registration_id: p.registration_id,
          name: p.name,
          role: p.role,
          phone: p.phone ?? null,
          whatsapp_number: p.whatsapp_number ?? null,
          notes: p.notes ?? null,
          created_at: p.created_at ?? '',
        });
      } else {
        setSenderProfile({
          registration_id: reg.registration_id,
          name: reg.name,
          role: reg.role,
          phone: null,
          whatsapp_number: null,
          notes: null,
          created_at: '',
        });
      }
    } catch {
      setSenderProfile({
        registration_id: reg.registration_id,
        name: reg.name,
        role: reg.role,
        phone: null,
        whatsapp_number: null,
        notes: null,
        created_at: '',
      });
    }
  }

  async function fetchAndSetRecipient(reg: RegistrationOption) {
    setRecipientId(reg.registration_id);
    setShowRecipientSuggestions(false);
    try {
      const res = await fetch(`/api/registrations?registration_id=${encodeURIComponent(reg.registration_id)}`);
      if (res.ok) {
        const p = await res.json();
        setRecipientProfile({
          registration_id: p.registration_id,
          name: p.name,
          role: p.role,
          phone: p.phone ?? null,
          whatsapp_number: p.whatsapp_number ?? null,
          notes: p.notes ?? null,
          created_at: p.created_at ?? '',
        });
      } else {
        setRecipientProfile({
          registration_id: reg.registration_id,
          name: reg.name,
          role: reg.role,
          phone: null,
          whatsapp_number: null,
          notes: null,
          created_at: '',
        });
      }
    } catch {
      setRecipientProfile({
        registration_id: reg.registration_id,
        name: reg.name,
        role: reg.role,
        phone: null,
        whatsapp_number: null,
        notes: null,
        created_at: '',
      });
    }
  }

  function SelectedProfileCard({
    profile,
    title,
    onClear,
  }: {
    profile: FullProfile;
    title: string;
    onClear: () => void;
  }) {
    const roleDisplay = String(profile.role).charAt(0).toUpperCase() + String(profile.role).slice(1);
    return (
      <div className="rounded-xl border border-navy-200/60 bg-navy-50/30 p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-navy-800">{title}</h3>
          <button type="button" className="link text-sm shrink-0" onClick={onClear}>
            Clear
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-navy-500">Profile ID</dt>
          <dd className="font-medium">{profile.registration_id}</dd>
          <dt className="text-navy-500">Name</dt>
          <dd>{profile.name}</dd>
          <dt className="text-navy-500">Gender</dt>
          <dd>{roleDisplay}</dd>
          <dt className="text-navy-500">Phone</dt>
          <dd>{profile.phone || '—'}</dd>
          <dt className="text-navy-500">WhatsApp</dt>
          <dd>{profile.whatsapp_number || '—'}</dd>
          {profile.notes && (
            <>
              <dt className="text-navy-500">Notes</dt>
              <dd>{profile.notes}</dd>
            </>
          )}
          <dt className="text-navy-500">Created</dt>
          <dd>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</dd>
        </dl>
      </div>
    );
  }

  return (
    <div className="container-dashboard max-w-xl">
      <h1 className="page-title">Add share</h1>
      <p className="text-navy-600 mb-6">Record that one profile was shared to another (e.g. profile 40001 shared to profile 40002).</p>

      <form onSubmit={handleSubmit} className="card">
        <h2 className="section-title-accent mb-4">Record share</h2>
        <div className="space-y-4">
          <div ref={senderWrapperRef} className="relative">
            <label className="label">From profile ID (who shared) *</label>
            <input
              className="input w-full"
              value={senderId}
              onChange={(e) => {
                setSenderId(e.target.value);
                setShowSenderSuggestions(true);
              }}
              onFocus={() => senderId.trim() && setShowSenderSuggestions(true)}
              placeholder="Type ID or name to search..."
              required
              autoComplete="off"
            />
            {showSenderSuggestions && (senderSuggestions.length > 0 || suggestionsLoading) && (
              <div className="dropdown-list top-full left-0 right-0 mt-1 max-h-56">
                {suggestionsLoading ? (
                  <div className="px-3 py-3 text-sm text-navy-500">Searching...</div>
                ) : (
                  senderSuggestions.map((r) => (
                    <button
                      key={r.registration_id}
                      type="button"
                      className="dropdown-item w-full text-left"
                      onClick={() => fetchAndSetSender(r)}
                    >
                      {renderSuggestion(r)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div ref={recipientWrapperRef} className="relative">
            <label className="label">To profile ID (who received) *</label>
            <input
              className="input w-full"
              value={recipientId}
              onChange={(e) => {
                setRecipientId(e.target.value);
                setShowRecipientSuggestions(true);
              }}
              onFocus={() => recipientId.trim() && setShowRecipientSuggestions(true)}
              placeholder="Type ID or name to search..."
              required
              autoComplete="off"
            />
            {showRecipientSuggestions && (recipientSuggestions.length > 0 || suggestionsLoading) && (
              <div className="dropdown-list top-full left-0 right-0 mt-1 max-h-56">
                {suggestionsLoading ? (
                  <div className="px-3 py-3 text-sm text-navy-500">Searching...</div>
                ) : (
                  recipientSuggestions.map((r) => (
                    <button
                      key={r.registration_id}
                      type="button"
                      className="dropdown-item w-full text-left"
                      onClick={() => fetchAndSetRecipient(r)}
                    >
                      {renderSuggestion(r)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              {senderProfile ? (
                <SelectedProfileCard
                  profile={senderProfile}
                  title="From profile (who shared)"
                  onClear={() => {
                    setSenderId('');
                    setSenderProfile(null);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/20 p-4 text-center text-navy-500 text-sm">
                  From profile (who shared) — select above
                </div>
              )}
            </div>
            <div className="min-w-0">
              {recipientProfile ? (
                <SelectedProfileCard
                  profile={recipientProfile}
                  title="To profile (who received)"
                  onClear={() => {
                    setRecipientId('');
                    setRecipientProfile(null);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/20 p-4 text-center text-navy-500 text-sm">
                  To profile (who received) — select above
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">How was it shared?</label>
            <select className="input" value={sharedVia} onChange={(e) => setSharedVia(e.target.value as 'whatsapp' | 'manual' | 'other')}>
              <option value="whatsapp">WhatsApp</option>
              <option value="manual">In person</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input min-h-[80px]" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        {message && (
          <p className={`mt-4 text-sm ${message.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{message.text}</p>
        )}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
