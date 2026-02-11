'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, formatRole } from '@/types';

export default function PendingApprovalPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData) {
        router.push('/onboarding');
        return;
      }

      if (!profileData.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      if (profileData.approval_status === 'approved') {
        router.push('/dashboard');
        return;
      }

      setProfile(profileData as Profile);
      setLoading(false);
    };

    checkStatus();

    // Set up realtime subscription to check for approval
    const channel = supabase
      .channel('profile-approval')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updated = payload.new as Profile;
          if (updated.approval_status === 'approved') {
            router.push('/dashboard');
          } else if (updated.approval_status === 'rejected') {
            setProfile(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Checking status...</p>
        </div>
      </div>
    );
  }

  const isRejected = profile?.approval_status === 'rejected';

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-green-800">Older Apostolic Church</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {isRejected ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <h2 className="text-xl font-semibold text-neutral-800">Registration Not Approved</h2>
                <p className="text-neutral-600 mt-2">
                  Your registration was not approved. Please contact your church leadership for more information.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  If you believe this is an error, please speak with your priest, elder, or overseer.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⏳</span>
                </div>
                <h2 className="text-xl font-semibold text-neutral-800">Awaiting Approval</h2>
                <p className="text-neutral-600 mt-2">
                  Your registration has been submitted and is pending review by church leadership.
                </p>
              </div>

              {profile && (
                <div className="bg-neutral-50 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Name:</span>
                    <span className="font-medium text-neutral-800">
                      {profile.first_name} {profile.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Role:</span>
                    <span className="font-medium text-neutral-800">{formatRole(profile.role)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Status:</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>What happens next?</strong>
                  <br />
                  A church leader will review your registration. You&apos;ll automatically be redirected once approved.
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Contact info */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Need help? Contact your local church leadership.
        </p>
      </div>
    </div>
  );
}

