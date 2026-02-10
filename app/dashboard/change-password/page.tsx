'use client';

import { useState } from 'react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'err', text: 'New password and confirm password do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'err', text: 'New password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error || 'Failed to change password' });
        return;
      }
      setMessage({ type: 'ok', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'err', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-dashboard max-w-md">
      <h1 className="page-title">Change password</h1>
      <p className="text-navy-600 mb-6">Enter your current password and choose a new one.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-navy-500 mt-1">At least 6 characters.</p>
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>
        {message && (
          <p className={`mt-4 text-sm ${message.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{message.text}</p>
        )}
        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto" disabled={loading}>
          {loading ? 'Updating...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
