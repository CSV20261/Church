"use client";

import React, { useState } from 'react';
import { 
  Users, Music, BookOpen, UserPlus, 
  Settings, LogOut, LayoutDashboard, 
  ChevronRight, ClipboardCheck, Calendar, CheckCircle2, XCircle,
  Plus, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import AddMemberModal from './AddMemberModal';

// =====================================================
// ACCORDION REGISTER - Six Pillar Expandable Cards
// Display format: [Title] [Surname] (e.g., UD Shange)
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
  'OFFICERS',
  'SENIOR CITIZEN',
  'ADULT',
  'YOUNG ADULT',
  'YOUTH',
  'SUNDAY SCHOOL'
] as const;

// Map display names to database values
const CATEGORY_MAP: Record<string, string> = {
  'OFFICERS': 'Officer',
  'SENIOR CITIZEN': 'Senior Citizen',
  'ADULT': 'Adult',
  'YOUNG ADULT': 'Young Adult',
  'YOUTH': 'Youth',
  'SUNDAY SCHOOL': 'Sunday School'
};

export default function AccordionRegisterClient({ profileName, profile, membersByCategory }: Props) {
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState<typeof SERVICE_TYPES[number]>('Sunday Service');
  const [specialServiceName, setSpecialServiceName] = useState('');
  
  // Expanded state for accordions
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'OFFICERS': true // Officers expanded by default
  });
  
  // Selected members for attendance
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string[]>>({});
  
  // Officer + Sister tracking
  const [officerSpouses, setOfficerSpouses] = useState<Record<string, boolean>>({});
  
  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberCategory, setAddMemberCategory] = useState<string | null>(null);

  // Get display name: [Title] [Surname]
  const getDisplayName = (member: Member) => {
    return `${member.title} ${member.last_name || member.full_name}`;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAddMember = (category: string) => {
    setAddMemberCategory(CATEGORY_MAP[category]);
    setShowAddMemberModal(true);
  };

  const handleSelectMember = (category: string, memberId: string) => {
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

  const handleRemoveMember = (category: string, memberId: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(id => id !== memberId)
    }));
    
    // Also remove spouse if it was selected
    if (officerSpouses[memberId]) {
      setOfficerSpouses(prev => {
        const updated = { ...prev };
        delete updated[memberId];
        return updated;
      });
    }
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
    <div className="flex flex-col lg:flex-row min-h-screen overflow-x-hidden bg-[#f8fafc] text-slate-800 font-sans">
      {/* Sidebar Navigation - Hidden on mobile, fixed on desktop */}
      <aside className="hidden lg:flex lg:w-64 bg-[#1e293b] text-white flex-col p-3 shadow-xl lg:fixed lg:h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 bg-[#34d399] rounded-lg flex items-center justify-center">
            <span className="font-bold text-slate-900">U</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">OAC UDA</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" href="/underdeacon/dashboard" />
          <NavItem icon={UserPlus} label="Soul Pipeline" />
          <NavItem icon={Music} label="Music Vault" />
          <NavItem icon={BookOpen} label="Sunday School" />
          <NavItem icon={Users} label="Young Adults" />
          
          <div className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Church Services</div>
          <NavItem icon={ClipboardCheck} label="Attendance Register" active />
          
          <div className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-4">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Mobile First */}
      <main className="flex-1 lg:ml-64 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen w-full max-w-full">
        {/* Header - Mobile Optimized */}
        <header className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  {profile.priestship_name || 'Monavoni'} | {profile.eldership_name || 'MANYANO'}
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1">Attendance Register</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-900">{profileName}</p>
                  <p className="text-xs text-slate-500">Underdeacon</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                   <span className="text-slate-600 text-base sm:text-lg font-bold">
                     {profileName.split(' ').map(n => n[0]).join('')}
                   </span>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">Select members by category</p>
          </div>
        </header>

        {/* Service Information Card - Compact Mobile */}
        <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm p-3 sm:p-4 md:p-5 mb-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3 uppercase tracking-wide">Service Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Service Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Service Type</label>
              <div className="relative">
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as typeof SERVICE_TYPES[number])}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white font-medium"
                >
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>
            
            {serviceType === 'Special' && (
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Special Service Name</label>
                <input
                  type="text"
                  value={specialServiceName}
                  onChange={(e) => setSpecialServiceName(e.target.value)}
                  placeholder="e.g., Easter Sunday"
                  className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats - Compact Mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4">
          <div className="bg-emerald-50 p-2.5 sm:p-3 md:p-4 rounded-lg border-2 border-emerald-300">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-emerald-700 mb-1">
              <CheckCircle2 size={16} className="hidden sm:block" />
              <span className="text-[10px] sm:text-xs font-black uppercase leading-tight">Members</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-900">{getTotalSelected()}</p>
          </div>
          
          <div className="bg-pink-50 p-2.5 sm:p-3 md:p-4 rounded-lg border-2 border-pink-300">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-pink-700 mb-1">
              <Users size={16} className="hidden sm:block" />
              <span className="text-[10px] sm:text-xs font-black uppercase leading-tight">+ Sister</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-pink-900">{getSpouseCount()}</p>
          </div>
          
          <div className="bg-blue-50 p-2.5 sm:p-3 md:p-4 rounded-lg border-2 border-blue-300">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-blue-700 mb-1">
              <ClipboardCheck size={16} className="hidden sm:block" />
              <span className="text-[10px] sm:text-xs font-black uppercase leading-tight">Total</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-blue-900">{getTotalSelected() + getSpouseCount()}</p>
          </div>
        </div>

        {/* Six Pillar Accordion Cards - Mobile Optimized */}
        <div className="space-y-2 sm:space-y-3">
          {SIX_PILLARS.map(displayCategory => {
            const dbCategory = CATEGORY_MAP[displayCategory];
            const categoryMembers = membersByCategory[dbCategory] || [];
            const selectedInCategory = selectedMembers[displayCategory] || [];
            const isExpanded = expandedCategories[displayCategory];
            const isOfficerCategory = displayCategory === 'OFFICERS';
            
            return (
              <div key={displayCategory} className="bg-white rounded-lg border-2 border-slate-300 shadow-sm overflow-hidden">
                {/* Accordion Header - Compact */}
                <div className="w-full px-3 sm:px-4 py-3 sm:py-3.5 flex justify-between items-center">
                  <button
                    onClick={() => toggleCategory(displayCategory)}
                    className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    {isExpanded ? <ChevronUp size={18} className="text-slate-600 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-600 flex-shrink-0" />}
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 uppercase tracking-wide truncate">{displayCategory}</h3>
                    <span className="text-xs sm:text-sm text-slate-600 font-bold whitespace-nowrap">
                      ({selectedInCategory.length})
                    </span>
                  </button>
                  <button
                    onClick={() => handleAddMember(displayCategory)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors ml-2 flex-shrink-0 font-bold text-xs sm:text-sm"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
                
                {/* Accordion Content - Compact Mobile */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-slate-200 bg-slate-50">
                    {/* Dropdown to select members */}
                    <div className="mt-3 mb-3">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        Select Members from {displayCategory}
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectMember(displayCategory, e.target.value);
                            e.target.value = ''; // Reset dropdown
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                      >
                        <option value="">-- Select a member to add --</option>
                        {categoryMembers
                          .filter(m => !selectedInCategory.includes(m.id))
                          .map(member => (
                            <option key={member.id} value={member.id}>
                              {getDisplayName(member)} ({member.gift})
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    {/* Selected Members List - Compact Mobile */}
                    {selectedInCategory.length === 0 ? (
                      <div className="text-center py-4 sm:py-6 text-slate-500 text-xs sm:text-sm font-medium">
                        No members selected. Use the dropdown above to add members.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedInCategory.map(memberId => {
                          const member = categoryMembers.find(m => m.id === memberId);
                          if (!member) return null;
                          
                          const spouseSelected = officerSpouses[memberId] || false;
                          
                          return (
                            <div key={memberId} className="space-y-2">
                              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-black text-sm sm:text-base text-slate-900 truncate">{getDisplayName(member)}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-600 font-semibold truncate">{member.gift}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                                  {isOfficerCategory && (
                                    <button
                                      onClick={() => handleToggleSpouse(memberId)}
                                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm rounded-lg transition-all font-bold whitespace-nowrap ${
                                        spouseSelected
                                          ? 'bg-pink-500 text-white'
                                          : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-pink-400'
                                      }`}
                                    >
                                      + SR
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveMember(displayCategory, memberId)}
                                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Show spouse if selected - Compact */}
                              {spouseSelected && (
                                <div className="ml-4 sm:ml-8 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-pink-50 border-2 border-pink-300 rounded-lg">
                                  <Users className="text-pink-600 flex-shrink-0" size={18} />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-black text-sm sm:text-base text-slate-900 truncate">SR/UD {member.last_name}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-600 font-semibold">Sister & Deacon</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button - Mobile Optimized */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0 bg-[#f8fafc] py-3 sm:py-0 sm:bg-transparent -mx-3 px-3 sm:mx-0 sm:px-0 border-t sm:border-t-0 border-slate-200">
          <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors text-sm sm:text-base">
            Cancel
          </button>
          <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors shadow-lg text-sm sm:text-base">
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
      <Icon size={18} />
      <span className="font-semibold text-xs">{label}</span>
    </>
  );

  const className = `flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full transition-all ${
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
