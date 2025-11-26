import React, { useState } from 'react';
import { Lock, AlertCircle, Shield, AlertTriangle } from 'lucide-react';
import * as api from '../api';

export default function UnlockScreen({ onUnlock, isFirstTime }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirstTime) {
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
      }

      const result = await api.login(password);
      if (result.success) {
        onUnlock();
      } else {
        setError(result.error || result.detail || 'Failed to unlock database');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <Lock className="text-white" size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800 font-poppins-black">
          {isFirstTime ? 'SET MASTER PASSWORD' : 'UNLOCK TILT DASHBOARD'}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isFirstTime 
            ? 'Create a master password to encrypt your database.'
            : 'Enter your master password to access the encrypted database.'}
        </p>

        {isFirstTime && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <span>⚠️ CRITICAL WARNING</span>
                </h3>
                <ul className="text-sm text-red-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>This password cannot be recovered</strong> if lost. There is no password reset feature.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>If you forget this password, <strong>all encrypted data will be permanently inaccessible</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>You must save this password in a secure password manager</strong> (e.g., 1Password, Bitwarden, LastPass) before proceeding.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {isFirstTime && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  <strong>Best Practice:</strong> Use a strong, unique password (12+ characters) and store it in a password manager. 
                  This ensures you can access your encrypted data while maintaining security.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>

          {isFirstTime && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="Confirm password"
                required
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isFirstTime && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                type="checkbox"
                id="password-saved"
                className="mt-1 shrink-0"
                required
              />
              <label htmlFor="password-saved" className="text-sm text-amber-800 cursor-pointer">
                <strong>I confirm that I have saved this password in a secure password manager</strong> and understand that it cannot be recovered if lost.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFirstTime 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {loading ? 'Unlocking...' : isFirstTime ? 'I Understand - Create & Unlock' : 'Unlock'}
          </button>
        </form>

        {!isFirstTime && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Forgot your password? You'll need to restore from a backup.
          </p>
        )}
      </div>
    </div>
  );
}

