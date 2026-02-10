'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type LookupResult = {
  registrationId: string;
  profile: { registration_id: string; name: string; role: string; phone: string; whatsapp_number: string } | null;
  sharedTo: { recipient_registration_id: string; name: string; role: string; shared_at: string; shared_via: string }[];
  receivedFrom: { sender_registration_id: string; name: string; role: string; shared_at: string; shared_via: string }[];
};

type RegistrationOption = { registration_id: string; name: string; role: string };

export default function LookupPage() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id')?.trim() ?? '';
  const [id, setId] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<RegistrationOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // When URL has ?id=..., run search and sync input
  useEffect(() => {
    if (!idFromUrl) return;
    setId(idFromUrl);
    if (result?.registrationId !== idFromUrl) {
      doSearch(idFromUrl);
    }
  }, [idFromUrl]);

  useEffect(() => {
    if (!id.trim()) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSuggestionsLoading(true);
      fetch(`/api/registrations?search=${encodeURIComponent(id.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.registrations || []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function doSearch(profileId: string) {
    setError('');
    setResult(null);
    if (!profileId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lookup?id=${encodeURIComponent(profileId.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed');
        return;
      }
      setResult(data);
      setShowSuggestions(false);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(id.trim());
  }

  function handleSelectSuggestion(reg: RegistrationOption) {
    setId(reg.registration_id);
    setShowSuggestions(false);
    doSearch(reg.registration_id);
  }

  return (
    <div className="container-dashboard">
      <h1 className="page-title">Search by profile ID</h1>

      <form onSubmit={handleSubmit} className="card mb-6">
        <label className="label">Profile ID</label>
        <div className="relative flex flex-col sm:flex-row gap-2" ref={wrapperRef}>
          <div className="flex-1 relative">
            <input
              type="text"
              className="input flex-1 w-full"
              placeholder="Type ID or name to search..."
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => id.trim() && setShowSuggestions(true)}
              autoComplete="off"
            />
            {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
              <div className="dropdown-list top-full left-0 right-0 mt-1 max-h-56">
                {suggestionsLoading ? (
                  <div className="px-3 py-3 text-sm text-navy-500">Searching...</div>
                ) : (
                  suggestions.map((reg) => (
                    <button
                      key={reg.registration_id}
                      type="button"
                      className="dropdown-item w-full text-left"
                      onClick={() => handleSelectSuggestion(reg)}
                    >
                      <span className="font-medium text-navy-800">{reg.registration_id}</span>
                      <span className="text-navy-500 ml-2">{reg.name}</span>
                      <span className="text-navy-400 ml-1 text-xs">({String(reg.role).charAt(0).toUpperCase() + String(reg.role).slice(1)})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary shrink-0" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p className="alert-error text-sm mt-2">{error}</p>}
      </form>

      {result && (
        <div className="space-y-6">
          {result.profile && (
            <div className="card">
              <h2 className="section-title-accent">Profile</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <dt className="text-navy-500">ID</dt>
                <dd className="font-medium">{result.profile.registration_id}</dd>
                <dt className="text-navy-500">Name</dt>
                <dd>{result.profile.name}</dd>
                <dt className="text-navy-500">Gender</dt>
                <dd>{String(result.profile.role).charAt(0).toUpperCase() + String(result.profile.role).slice(1)}</dd>
                {result.profile.phone && (
                  <>
                    <dt className="text-navy-500">Phone</dt>
                    <dd>{result.profile.phone}</dd>
                  </>
                )}
                {result.profile.whatsapp_number && (
                  <>
                    <dt className="text-navy-500">WhatsApp</dt>
                    <dd>{result.profile.whatsapp_number}</dd>
                  </>
                )}
              </dl>
            </div>
          )}
          {!result.profile && result.registrationId && (
            <p className="alert-warning text-amber-800">No profile found for ID <strong>{result.registrationId}</strong>. Share history is shown below.</p>
          )}

          {/* Two-column layout: Shared to (left) | Received from (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="card min-w-0">
              <h2 className="section-title-accent mb-3">Shared to (this profile was shared to these)</h2>
              {result.sharedTo.length === 0 ? (
                <p className="text-navy-600 text-sm py-2">Not shared to anyone.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-navy-200/60">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead>
                      <tr className="border-b border-navy-200 bg-navy-50/50">
                        <th className="text-left p-2.5 font-semibold text-navy-700">ID</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Name</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Gender</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Date & time</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Via</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.sharedTo.map((r) => (
                        <tr key={r.recipient_registration_id} className="border-b border-navy-100 last:border-0 hover:bg-navy-50/30">
                          <td className="p-2.5 align-top">
                            <Link href={`/dashboard/lookup?id=${r.recipient_registration_id}`} className="link font-medium">
                              {r.recipient_registration_id}
                            </Link>
                          </td>
                          <td className="p-2.5 align-top text-navy-800">{r.name}</td>
                          <td className="p-2.5 align-top text-navy-600">{String(r.role).charAt(0).toUpperCase() + String(r.role).slice(1)}</td>
                          <td className="p-2.5 align-top text-navy-600 whitespace-nowrap">{new Date(r.shared_at).toLocaleString()}</td>
                          <td className="p-2.5 align-top text-navy-600">{r.shared_via}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card min-w-0">
              <h2 className="section-title-accent mb-3">Received from (we got this profile from these)</h2>
              {result.receivedFrom.length === 0 ? (
                <p className="text-navy-600 text-sm py-2">Not received from anyone.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-navy-200/60">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead>
                      <tr className="border-b border-navy-200 bg-navy-50/50">
                        <th className="text-left p-2.5 font-semibold text-navy-700">ID</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Name</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Gender</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Date & time</th>
                        <th className="text-left p-2.5 font-semibold text-navy-700">Via</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.receivedFrom.map((r) => (
                        <tr key={r.sender_registration_id} className="border-b border-navy-100 last:border-0 hover:bg-navy-50/30">
                          <td className="p-2.5 align-top">
                            <Link href={`/dashboard/lookup?id=${r.sender_registration_id}`} className="link font-medium">
                              {r.sender_registration_id}
                            </Link>
                          </td>
                          <td className="p-2.5 align-top text-navy-800">{r.name}</td>
                          <td className="p-2.5 align-top text-navy-600">{String(r.role).charAt(0).toUpperCase() + String(r.role).slice(1)}</td>
                          <td className="p-2.5 align-top text-navy-600 whitespace-nowrap">{new Date(r.shared_at).toLocaleString()}</td>
                          <td className="p-2.5 align-top text-navy-600">{r.shared_via}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
