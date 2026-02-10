'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, approval_status')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        // Already completed onboarding
        if (profile.approval_status === 'approved') {
          router.push('/dashboard');
        } else {
          router.push('/pending-approval');
        }
        return;
      }

      setUserId(user.id);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-green-800">Older Apostolic Church</h1>
          <p className="text-gray-600 mt-2">Complete your registration</p>
        </div>

        {/* Wizard */}
        {userId && <OnboardingWizard userId={userId} />}
      </div>
    </div>
  );
}
