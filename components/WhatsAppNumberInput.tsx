'use client';

import { useState, useEffect, useRef } from 'react';

type ProfileSuggestion = {
  registration_id: string;
  name: string;
  role: string;
  phone: string | null;
  whatsapp_number: string | null;
};

function getDisplayNumber(reg: ProfileSuggestion): string {
  const num = reg.whatsapp_number || reg.phone;
  if (!num) return '';
  const digits = num.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91')) return digits;
  return digits;
}

function normalizeForCompare(num: string): string {
  const d = num.replace(/\D/g, '');
  if (d.length === 10) return `91${d}`;
  return d;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** Other WhatsApp values in the form (to detect duplicates) */
  otherValues?: string[];
};

export default function WhatsAppNumberInput({ value, onChange, placeholder, maxLength = 15, otherValues = [] }: Props) {
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    const digitsOnly = q.replace(/\D/g, '');
    // Skip search when value looks like a complete phone number (user selected or typed one)
    const looksLikePhone = digitsOnly.length >= 10 && /^\d+$/.test(digitsOnly);
    if (!q || q.length < 1 || looksLikePhone) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/registrations?search=${encodeURIComponent(q)}`)
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data.registrations) {
            setSuggestions(
              data.registrations.filter((r: ProfileSuggestion) => getDisplayNumber(r))
            );
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectProfile(reg: ProfileSuggestion) {
    const num = getDisplayNumber(reg);
    if (num) {
      onChange(num);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }

  const currentNormalized = value.trim() ? normalizeForCompare(value) : '';
  const isDuplicate = currentNormalized.length >= 10 && otherValues.some(
    (v) => v.trim() && normalizeForCompare(v) === currentNormalized
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.trim().length >= 1 && suggestions.length > 0 && setShowSuggestions(true)}
        maxLength={maxLength}
        autoComplete="off"
      />
      {isDuplicate && (
        <p className="text-xs text-amber-600 mt-1">This number is already added above.</p>
      )}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="dropdown-list top-full left-0 right-0 mt-1 max-h-56">
          {loading ? (
            <div className="px-3 py-2.5 text-sm text-navy-500">Searching...</div>
          ) : (
            suggestions.map((r) => {
              const num = getDisplayNumber(r);
              if (!num) return null;
              return (
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
                  <span className="text-navy-400 ml-1 text-xs">{num}</span>
                </button>
              );
            })
          )}
        </div>
      )}
      {showSuggestions && !loading && value.trim() && suggestions.length === 0 && (
        <p className="text-xs text-navy-500 mt-1">No profiles with phone/WhatsApp found.</p>
      )}
    </div>
  );
}
