'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type LookupResult = {
  registrationId: string;
  profile: { registration_id: string; name: string; role: string; phone: string; whatsapp_number: string } | null;
  profileDetailsSentTo: { recipient_whatsapp: string; fields_sent: string; sent_at: string; match_registration_id?: string; match_name?: string; match_role?: string }[];
};

type RegistrationOption = { registration_id: string; name: string; role: string };

export default function ProfileDetailsSentSearchPage() {
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
    const debug = searchParams.get('debug') === '1';
    try {
      const res = await fetch(`/api/lookup?id=${encodeURIComponent(profileId.trim())}${debug ? '&debug=1' : ''}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data.debug ? `${data.error}: ${data.debug}` : (data.error || 'Search failed');
        setError(msg);
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
      <div className="mb-4">
        <Link href="/dashboard/profile-search" className="link text-sm">← Back to Profile search</Link>
      </div>
      <h1 className="page-title">Details sent to</h1>
      <p className="text-navy-600 mb-6">
        Search by profile ID to see who received this profile&apos;s details (from Send profile details).
      </p>

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
            <p className="alert-warning text-amber-800">No profile found for ID <strong>{result.registrationId}</strong>.</p>
          )}

          <div className="card min-w-0">
            <h2 className="section-title-accent mb-3">Profile details sent to</h2>
            <p className="text-xs text-navy-500 mb-2">From Send profile details when this profile&apos;s info was sent to these numbers.</p>
            {result.profileDetailsSentTo.length === 0 ? (
              <p className="text-navy-600 text-sm py-2">Not sent to anyone yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-navy-200/60">
                <table className="w-full min-w-[280px] text-sm">
                  <thead>
                    <tr className="border-b border-navy-200 bg-navy-50/50">
                      <th className="text-left p-2.5 font-semibold text-navy-700">Recipient</th>
                      <th className="text-left p-2.5 font-semibold text-navy-700">Fields sent</th>
                      <th className="text-left p-2.5 font-semibold text-navy-700">Date & time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.profileDetailsSentTo.map((r, i) => {
                      const fields = typeof r.fields_sent === 'string' ? (() => { try { return JSON.parse(r.fields_sent); } catch { return []; } })() : (r.fields_sent || []);
                      return (
                        <tr key={`${r.recipient_whatsapp}-${r.sent_at}-${i}`} className="border-b border-navy-100 last:border-0 hover:bg-navy-50/30">
                          <td className="p-2.5 align-top">
                            {r.match_registration_id ? (
                              <Link href={`/dashboard/profile-details-sent-search?id=${r.match_registration_id}`} className="link font-medium">
                                {r.match_registration_id}
                              </Link>
                            ) : (
                              <span className="text-navy-800">{r.recipient_whatsapp}</span>
                            )}
                            {r.match_name && <span className="text-navy-600 ml-1">({r.match_name})</span>}
                          </td>
                          <td className="p-2.5 align-top text-navy-600">{Array.isArray(fields) ? fields.join(', ') : '—'}</td>
                          <td className="p-2.5 align-top text-navy-600 whitespace-nowrap">{new Date(r.sent_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
