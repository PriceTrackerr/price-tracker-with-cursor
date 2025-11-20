import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';

type ResetStatus = 'validating' | 'ready' | 'success' | 'error';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { bootstrapSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<ResetStatus>('validating');
  const [sessionTokens, setSessionTokens] = useState<{ access: string; refresh?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const parseTokens = async () => {
      try {
        const supabase = getSupabaseClient();
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const queryParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');

        console.log('[ResetPassword] hash params:', hashParams.toString());
        console.log('[ResetPassword] query params:', queryParams.toString());
        console.log('[ResetPassword] detected tokens:', { accessToken, refreshToken, type });

        if (accessToken && refreshToken && (!type || type === 'recovery')) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('[ResetPassword] setSession error:', error);
            setErrorMessage(error.message);
            setStatus('error');
            return;
          }
          const sessionAccess = data.session?.access_token || accessToken;
          const sessionRefresh = data.session?.refresh_token || refreshToken;
          console.log('[ResetPassword] session established:', { sessionAccess, sessionRefresh });
          setSessionTokens({ access: sessionAccess, refresh: sessionRefresh });
          setStatus('ready');
        } else {
          console.warn('[ResetPassword] missing tokens in URL');
          setErrorMessage('Reset link is invalid or has expired.');
          setStatus('error');
        }
      } catch (error) {
        console.error('Reset token validation failed:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to validate reset link.');
        setStatus('error');
      }
    };

    parseTokens();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTokens) {
      toast.error('Reset link is invalid or expired.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }
      await bootstrapSession(sessionTokens.access, sessionTokens.refresh);
      setStatus('success');
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (status === 'validating') {
      return (
        <div className="text-center space-y-4">
          <div className="w-10 h-10 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Validating secure link...</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center space-y-4">
          <p className="text-red-600 font-semibold">{errorMessage || 'Reset link invalid or expired.'}</p>
          <Link to="/auth" className="text-blue-600 hover:text-blue-700 underline">
            Return to sign in
          </Link>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="text-gray-700 font-medium">Password updated! Redirecting you...</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm new password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all duration-200 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Password Reset</h1>
          <p className="text-gray-600">Choose a new password to regain access to your account.</p>
        </div>
        {renderContent()}
        <div className="mt-8 text-center text-sm text-gray-500">
          Remembered your password?{' '}
          <Link to="/auth" className="text-blue-600 hover:text-blue-700 underline">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

