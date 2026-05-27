import React from 'react';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function ReauthModal({ open, onClose, email, onSuccess }: { open: boolean; onClose: () => void; email: string; onSuccess: () => void; }) {
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      const cred = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(auth.currentUser, cred);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Reauth failed', err);
      setError(err.message || 'Reauthentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl max-w-md w-full p-6">
        <h3 className="font-bold text-lg mb-2">Re-enter password</h3>
        <p className="text-sm text-muted mb-4">For security, please re-enter your password to continue.</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border ring-border focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 btn-accent">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
}
