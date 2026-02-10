"use client";

import React, { useState } from 'react';
import { 
  Users, Music, BookOpen, UserPlus, 
  Settings, LogOut, LayoutDashboard, 
  ChevronRight, ClipboardCheck, Calendar, CheckCircle2, XCircle,
  Plus, ChevronDown
} from 'lucide-react';
import AddMemberModal from './AddMemberModal';

// =====================================================
// DYNAMIC REGISTER - Six Pillar Dropdowns
// =====================================================

interface Member {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  gift: string;
  category: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  apostleship_id: string | null;
  overseership_id: string | null;
  eldership_id: string | null;
  priestship_id: string | null;
  apostleship_name?: string | null;
  overseership_name?: string | null;
  eldership_name?: string | null;
  priestship_name?: string | null;
}

interface Props {
  profileName: string;
  profile: Profile;
  membersByCategory: Record<string, Member[]>;
}

const SERVICE_TYPES = [
  'Testify',
  'Practice',
  'Wednesday Service',
  'Sunday Service',
  'Special'
] as const;

const SIX_PILLARS = [
  'Officer',
  'Senior Citizen',
  'Adult',
  'Young Adult',
  'Youth',
  'Sunday School'
] as const;

export default function DynamicRegisterClient({ profileName, profile, membersByCategory }: Props) {
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState<typeof SERVICE_TYPES[number]>('Sunday Service');
  const [specialServiceName, setSpecialServiceName] = useState('');
  
  // Selected members for each category
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string[]>>({});
  
  // Officer + Sister tracking
  const [officerSpouses, setOfficerSpouses] = useState<Record<string, boolean>>({});
  
  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberCategory, setAddMemberCategory] = useState<string | null>(null);

  const handleAddMember = (category: string) => {
    setAddMemberCategory(category);
    setShowAddMemberModal(true);
  };

  const handleToggleMember = (category: string, memberId: string) => {
    setSelectedMembers(prev => {
      const current = prev[category] || [];
      const isSelected = current.includes(memberId);
      
      return {
        ...prev,
        [category]: isSelected 
          ? current.filter(id => id !== memberId)
          : [...current, memberId]
      };
    });
  };

  const handleToggleSpouse = (officerId: string) => {
    setOfficerSpouses(prev => ({
      ...prev,
      [officerId]: !prev[officerId]
    }));
  };

  const getTotalSelected = () => {
    return Object.values(selectedMembers).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getSpouseCount = () => {
    return Object.values(officerSpouses).filter(v => v).length;
  };

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
            <p className="text-sm text-slate-600 mt-1">Dynamic Register - Six Pillar Selection</p>
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

        {/* Service Metadata */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Service Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="date" 
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Type
              </label>
              <div className="relative">
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as typeof SERVICE_TYPES[number])}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                >
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
            
            {/* Special Service Name (conditional) */}
            {serviceType === 'Special' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Special Service Name
                </label>
                <input
                  type="text"
                  value={specialServiceName}
                  onChange={(e) => setSpecialServiceName(e.target.value)}
                  placeholder="e.g., Easter Sunday, Christmas Service"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <CheckCircle2 size={18} />
              <span className="text-xs font-semibold uppercase">Members Selected</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">{getTotalSelected()}</p>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
            <div className="flex items-center gap-2 text-pink-700 mb-1">
              <Users size={18} />
              <span className="text-xs font-semibold uppercase">+ Sister</span>
            </div>
            <p className="text-2xl font-bold text-pink-900">{getSpouseCount()}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <ClipboardCheck size={18} />
              <span className="text-xs font-semibold uppercase">Total Present</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{getTotalSelected() + getSpouseCount()}</p>
          </div>
        </div>

        {/* Six Pillar Dropdowns */}
        <div className="space-y-6">
          {SIX_PILLARS.map(category => {
            const categoryMembers = membersByCategory[category] || [];
            const selectedInCategory = selectedMembers[category] || [];
            
            return (
              <div key={category} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{category}</h3>
                    <p className="text-sm text-slate-600">
                      {selectedInCategory.length} of {categoryMembers.length} selected
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddMember(category)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Plus size={18} />
                    Add Member
                  </button>
                </div>
                
                <div className="p-6">
                  {categoryMembers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No members in this category. Click "Add Member" to register.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryMembers.map(member => {
                        const isSelected = selectedInCategory.includes(member.id);
                        const isOfficer = category === 'Officer';
                        const spouseSelected = officerSpouses[member.id] || false;
                        
                        return (
                          <div key={member.id} className="relative">
                            <button
                              onClick={() => handleToggleMember(category, member.id)}
                              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  member.gender === 'Sister' ? 'bg-pink-100' : 'bg-blue-100'
                                }`}>
                                  <span className={`font-semibold text-sm ${
                                    member.gender === 'Sister' ? 'text-pink-700' : 'text-blue-700'
                                  }`}>
                                    {member.first_name[0]}{member.last_name?.[0] || ''}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">{member.title}</span>
                                    <p className="font-medium text-slate-900">{member.full_name}</p>
                                  </div>
                                  <p className="text-xs text-slate-500">{member.gift}</p>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <CheckCircle2 className="text-emerald-600" size={24} />
                              )}
                            </button>
                            
                            {/* Officer + Sister Option */}
                            {isOfficer && isSelected && (
                              <button
                                onClick={() => handleToggleSpouse(member.id)}
                                className={`mt-2 w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${
                                  spouseSelected
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                                }`}
                              >
                                <span className="text-sm font-medium text-slate-700">+ Sister</span>
                                {spouseSelected && (
                                  <CheckCircle2 className="text-pink-600" size={20} />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end gap-4">
          <button className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-lg">
            Save Attendance Report
          </button>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddMemberModal && addMemberCategory && (
        <AddMemberModal
          category={addMemberCategory}
          profile={profile}
          onClose={() => {
            setShowAddMemberModal(false);
            setAddMemberCategory(null);
          }}
        />
      )}
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
