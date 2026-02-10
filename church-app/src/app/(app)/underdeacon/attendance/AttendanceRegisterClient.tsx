"use client";

import React, { useState } from 'react';
import { 
  Users, Music, BookOpen, UserPlus, 
  Settings, LogOut, LayoutDashboard, 
  ChevronRight, ClipboardCheck, Calendar, CheckCircle2, XCircle
} from 'lucide-react';

// =====================================================
// ATTENDANCE REGISTER CLIENT COMPONENT
// =====================================================

interface Member {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  office: string;
  category: string;
}

interface Props {
  profileName: string;
  members: Member[];
  groupedMembers: Record<string, Record<string, Member[]>>;
}

export default function AttendanceRegisterClient({ profileName, members, groupedMembers }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});

  const handleMarkAttendance = (memberId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const unmarkedCount = members.length - presentCount - absentCount;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col p-4 shadow-xl fixed h-screen">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-[#34d399] rounded-lg flex items-center justify-center">
            <span className="font-bold text-slate-900">U</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">OAC UDA</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" href="/underdeacon/dashboard" />
          <NavItem icon={UserPlus} label="Soul Pipeline" />
          <NavItem icon={Music} label="Music Vault" />
          <NavItem icon={BookOpen} label="Sunday School" />
          <NavItem icon={Users} label="Young Adults" />
          
          <div className="pt-10 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Church Services</div>
          <NavItem icon={ClipboardCheck} label="Attendance Register" active />
          
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

      {/* Main Content Area */}
      <main className="flex-1 ml-64 overflow-y-auto p-8 h-screen">
        {/* Header */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <p className="text-slate-500 text-sm font-medium">Centurion South | Priestship</p>
            <h2 className="text-3xl font-bold text-slate-900">Attendance Register</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{profileName}</p>
              <p className="text-xs text-slate-500">Underdeacon</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
               <span className="text-slate-600 text-lg font-bold">
                 {profileName.split(' ').map(n => n[0]).join('')}
               </span>
            </div>
          </div>
        </header>

        {/* Date Selector & Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle2 size={18} />
                <span className="text-xs font-semibold uppercase">Present</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{presentCount}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle size={18} />
                <span className="text-xs font-semibold uppercase">Absent</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{absentCount}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 mb-1">
                <ClipboardCheck size={18} />
                <span className="text-xs font-semibold uppercase">Unmarked</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{unmarkedCount}</p>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Members List</h3>
            <p className="text-sm text-slate-600">Mark attendance for today's service</p>
          </div>
          
          <div className="p-6">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No members found in your priestship</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Six Pillars Category Order */}
                {['Officer', 'Senior Citizen', 'Adult', 'Young Adult', 'Youth', 'Sunday School'].map(category => {
                  if (!groupedMembers[category]) return null;
                  
                  return (
                    <div key={category} className="space-y-4">
                      {/* Category Header - Six Pillars */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent"></div>
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                          {category}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-slate-300 to-transparent"></div>
                      </div>
                      
                      {/* Office groups within this category */}
                      {Object.entries(groupedMembers[category]).map(([office, officeMembers]) => (
                        <div key={office} className="space-y-2">
                          {/* Office Header (only show for Officers or if there are multiple offices) */}
                          {(category === 'Officer' || Object.keys(groupedMembers[category]).length > 1) && (
                            <div className="pl-4 py-2 bg-slate-100 border-l-4 border-emerald-500 rounded">
                              <p className="font-semibold text-slate-700">{office}</p>
                            </div>
                          )}
                          
                          {/* Members in this office */}
                          <div className="space-y-2">
                            {officeMembers.map((member) => (
                              <div 
                                key={member.id} 
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    member.gender === 'Sister' ? 'bg-pink-100' : 'bg-blue-100'
                                  }`}>
                                    <span className={`font-semibold text-sm ${
                                      member.gender === 'Sister' ? 'text-pink-700' : 'text-blue-700'
                                    }`}>
                                      {member.full_name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-600">
                                        {member.title}
                                      </span>
                                      <p className="font-medium text-slate-900">{member.full_name}</p>
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        member.gender === 'Sister' 
                                          ? 'bg-pink-100 text-pink-700' 
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {member.gender}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{member.office} • {member.category}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleMarkAttendance(member.id, 'present')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                      attendance[member.id] === 'present'
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'bg-white border border-slate-300 text-slate-700 hover:border-green-500'
                                    }`}
                                  >
                                    <CheckCircle2 size={18} className="inline mr-1" />
                                    Present
                                  </button>
                                  <button
                                    onClick={() => handleMarkAttendance(member.id, 'absent')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                      attendance[member.id] === 'absent'
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'bg-white border border-slate-300 text-slate-700 hover:border-red-500'
                                    }`}
                                  >
                                    <XCircle size={18} className="inline mr-1" />
                                    Absent
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {members.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-lg">
                Save Attendance
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-components
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
