'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Home, Users, Calendar, LayoutDashboard, CheckSquare, Settings, LogOut } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Navigation items with icons
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/hierarchy', label: 'Hierarchy', icon: Users },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/members', label: 'Members', icon: Users },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
                <span className="text-xl font-bold text-white">✝</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-neutral-900">Older Apostolic Church</h1>
                <p className="text-xs text-neutral-500">Management System</p>
              </div>
            </Link>

            {/* Navigation links - Desktop */}
            {profile && profile.approval_status === 'approved' && (
              <nav className="hidden lg:flex items-center gap-1 ml-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          
          {profile && (
            <div className="flex items-center gap-3">
              {/* Approvals link for leaders */}
              {isLeader && (
                <Link
                  href="/dashboard/approvals"
                  className="relative px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-semibold transition-colors hidden md:flex items-center gap-2 text-neutral-700"
                >
                  <CheckSquare size={18} />
                  <span>Approvals</span>
                  {pendingApprovalsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white px-1.5 font-bold">
                      {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User menu - Desktop */}
              <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {displayRole}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-neutral-200 rounded-lg transition-colors text-neutral-600 hover:text-neutral-900"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* Mobile menu button */}
              {profile.approval_status === 'approved' && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && profile && profile.approval_status === 'approved' && (
        <div className="lg:hidden border-t border-neutral-200 bg-white shadow-lg">
          <nav className="px-4 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* User info - Mobile */}
            <div className="px-3 py-3 bg-neutral-50 rounded-lg mb-3">
              <p className="text-sm font-semibold text-neutral-900">
                {displayName}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {displayRole}
              </p>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Approvals link for leaders - Mobile */}
            {isLeader && (
              <Link
                href="/dashboard/approvals"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare size={20} />
                  <span>Approvals</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white px-1.5 font-bold">
                    {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Logout button - Mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-all mt-3 border-t border-neutral-200 pt-4"
            >
              <LogOut size={20} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
