'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Profile, LeadershipAssignment, ViewContext, formatRole, LEADERSHIP_ROLES } from '@/types';
import ViewSwitcher from './ViewSwitcher';

interface HeaderProps {
  profile: Profile | null;
  userEmail: string | null;
  assignments?: LeadershipAssignment[];
  pendingApprovalsCount?: number;
}

export default function Header({ 
  profile, 
  userEmail, 
  assignments = [],
  pendingApprovalsCount = 0
}: HeaderProps) {
  const [viewContext, setViewContext] = useState<ViewContext | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : profile?.full_name || userEmail || 'User';
  const displayRole = profile?.role ? formatRole(profile.role) : 'Member';
  const isLeader = profile && LEADERSHIP_ROLES.includes(profile.role);

  // Navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/hierarchy', label: 'Hierarchy', icon: '🏛️' },
  ];

  return (
    <header className="bg-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">✝</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold">Older Apostolic Church</h1>
                <p className="text-green-200 text-xs">Church Management System</p>
              </div>
            </Link>

            {/* Navigation links */}
            {profile && profile.approval_status === 'approved' && (
              <nav className="hidden sm:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      pathname === item.href
                        ? 'bg-white/20 text-white'
                        : 'text-green-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          
          {profile && (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* View Switcher (for users with multiple assignments) */}
              {assignments.length > 1 && (
                <ViewSwitcher
                  assignments={assignments}
                  currentContext={viewContext}
                  onContextChange={setViewContext}
                />
              )}

              {/* Approvals link for leaders */}
              {isLeader && (
                <Link
                  href="/dashboard/approvals"
                  className="relative px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors hidden sm:flex items-center gap-1"
                >
                  <span>✓</span>
                  <span className="hidden md:inline">Approvals</span>
                  {pendingApprovalsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User info */}
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium">
                  {displayName}
                </p>
                <p className="text-green-200 text-xs">
                  {displayRole}
                </p>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
