"use client";

import React, { useState } from 'react';
import { 
  Users, Music, BookOpen, UserPlus, 
  Settings, LogOut, LayoutDashboard, 
  TrendingUp, AlertTriangle, ChevronRight,
  Sparkles, ClipboardCheck, Menu, X
} from 'lucide-react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';

// =====================================================
// UNDERDEACON COMMAND CENTER UI
// Production-ready dashboard with Mint-and-Slate palette
// =====================================================

interface RecruitmentRecord {
  id: string;
  soul_name: string;
  status: string;
  demarcation_area: string;
  value_shared: string;
  notes: string;
  created_at: string;
}

interface Props {
  profileName: string;
  totalProspects: number;
  prospectCount: number;
  firstVisitCount: number;
  secondVisitCount: number;
  regularCount: number;
  recruitment: RecruitmentRecord[];
}

export default function UnderdeaconDashboardClient({
  profileName,
  totalProspects,
  prospectCount,
  firstVisitCount,
  secondVisitCount,
  regularCount,
  recruitment
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Build funnel data from real database counts
  const funnelData = [
    { value: prospectCount, name: 'Prospects', fill: '#82ca9d' },
    { value: firstVisitCount + secondVisitCount, name: 'Visitors', fill: '#529d71' },
    { value: regularCount, name: 'Members', fill: '#2d5a41' },
  ].filter(item => item.value > 0); // Only show stages with data

  // Calculate growth trend
  const growthTrend = totalProspects > 0 ? '+' + Math.round((regularCount / totalProspects) * 100) + '%' : '0%';

  const stats = [
    { label: 'Total Prospects', value: totalProspects.toString(), trend: growthTrend, icon: UserPlus },
    { label: 'Choir Practice', value: '1 Day', sub: 'Next Event', icon: Music },
    { label: 'Asset Health', value: '85% Good', sub: 'Instruments', icon: AlertTriangle },
    { label: 'Active Demarcation', value: 'Centurion West', icon: LayoutDashboard },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-[#1e293b] text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Hidden on mobile, slide in when open */}
      <aside className={`
        w-64 bg-[#1e293b] text-white flex flex-col p-4 shadow-xl fixed h-screen z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-[#34d399] rounded-lg flex items-center justify-center">
            <span className="font-bold text-slate-900">U</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">OAC UDA</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={UserPlus} label="Soul Pipeline" />
          <NavItem icon={Music} label="Music Vault" />
          <NavItem icon={BookOpen} label="Sunday School" />
          <NavItem icon={Users} label="Young Adults" />
          
          <div className="pt-10 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Church Services</div>
          <NavItem icon={ClipboardCheck} label="Attendance Register" href="/underdeacon/attendance" />
          
          <div className="pt-10 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-4">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - No left margin on mobile */}
      <main className="flex-1 lg:ml-64 overflow-y-auto p-4 sm:p-6 lg:p-8 h-screen pt-16 lg:pt-8">
        {/* Header - Stack on Mobile */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">Centurion South | Priestship</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1">Underdeacon Command Center</h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right flex-1 sm:flex-initial">
              <p className="text-sm font-bold text-slate-900">{profileName}</p>
              <p className="text-xs text-slate-500">Underdeacon</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
               <span className="text-slate-600 text-lg font-bold">
                 {profileName.split(' ').map(n => n[0]).join('')}
               </span>
            </div>
          </div>
        </header>

        {/* Top KPI Cards - One Column on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <stat.icon size={20} />
                </div>
                {stat.trend && <span className="text-xs font-bold text-emerald-600">{stat.trend}</span>}
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              {stat.sub && <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Central Stage: Funnel & AI Consultant - Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Soul Progress</h3>
            <div className="h-[300px] w-full">
              {funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400">No recruitment data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#f0fdf4] p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold">
                <Sparkles size={20} />
                <h3>AI Consultant</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="bg-white/60 p-3 rounded-lg border border-emerald-200">
                  <p className="font-bold text-emerald-900 mb-1">Growth Suggestion</p>
                  <p className="text-emerald-700">Recruitment is up in Centurion Central. Focus on Centurion West this Sat.</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg border border-emerald-200">
                  <p className="font-bold text-emerald-900 mb-1">Preparation</p>
                  <p className="text-emerald-700">Review Socials Song List for the upcoming district festival.</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-200/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Dual-Track Action Center - Stack on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Movement of Souls Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold">Movement of Souls</h3>
              <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
            </div>
            <div className="p-5 space-y-4">
              {recruitment.length > 0 ? (
                recruitment.slice(0, 3).map((record) => (
                  <ActivityItem 
                    key={record.id}
                    name={record.soul_name} 
                    area={record.demarcation_area} 
                    type={record.status === 'prospect' ? 'New Soul' : 'Follow-up'} 
                    status={
                      record.status === 'prospect' ? 'In Progress' :
                      record.status === 'first_visit' ? 'Due' :
                      record.status === 'second_visit' ? 'Active' :
                      'Completed'
                    }
                    color={
                      record.status === 'first_visit' ? 'text-amber-500' :
                      record.status === 'second_visit' ? 'text-blue-500' :
                      'text-emerald-600'
                    }
                  />
                ))
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

          {/* Music & Arts Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold">Music & Arts Prep</h3>
            </div>
            <div className="p-5 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Rehearsal Song</p>
                  <Music size={16} className="text-slate-400" />
                </div>
                <p className="text-xl font-bold text-slate-900">Ancient of Days</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Choir</span>
                  <span>Sheet Music Attached</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-red-100 bg-red-50/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900">PA System: Needs Repair</p>
                    <p className="text-xs text-red-700">Reported: Sunday School Unit</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-red-300" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components for cleaner structure
function NavItem({ icon: Icon, label, active = false, href }: { icon: any, label: string, active?: boolean, href?: string }) {
  const content = (
    <>
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </>
  );

  const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all ${
    active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
  }`;

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button className={className}>
      {content}
    </button>
  );
}

function ActivityItem({ name, area, type, status, color = "text-emerald-600" }: { name: string, area: string, type: string, status: string, color?: string }) {
  return (
    <div className="flex items-center justify-between group hover:bg-slate-50 p-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        <div>
          <p className="text-sm font-bold text-slate-900">{type}: {name}</p>
          <p className="text-xs text-slate-500">{area}</p>
        </div>
      </div>
      <span className={`text-xs font-bold ${color}`}>{status}</span>
    </div>
  );
}

