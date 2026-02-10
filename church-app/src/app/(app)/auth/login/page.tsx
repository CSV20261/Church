'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // After signup, sign in automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Account created! Please check your email to confirm, then sign in.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleSubmit = mode === 'signin' ? handleSignIn : handleSignUp;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-green-800">Older Apostolic Church</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              onClick={() => setMode('signin')}
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${
                mode === 'signin'
                  ? 'bg-green-700 hover:bg-green-800 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {loading && mode === 'signin' ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setMode('signup')}
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${
                mode === 'signup'
                  ? 'bg-green-700 hover:bg-green-800 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {loading && mode === 'signup' ? 'Creating...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-green-700 hover:text-green-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
