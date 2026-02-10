'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen h-full flex items-center justify-center p-4 bg-page w-full">
      <div className="w-full max-w-sm">
        <div className="card shadow-card-hover border-navy-200/80 overflow-hidden">
          <div className="bg-sidebar text-white px-6 py-6 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
                <span className="font-heading font-bold text-gold-400 text-xl">W</span>
              </div>
              <div>
                <h1 className="font-heading text-xl font-semibold tracking-tight text-white">Welcome back</h1>
                <p className="text-navy-200 text-sm">Wedding Profile Matcher</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="alert-error text-sm text-red-700">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full py-3.5" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
