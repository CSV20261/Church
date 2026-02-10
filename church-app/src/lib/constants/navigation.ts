// =====================================================
// OAC-UDA ROLE-BASED NAVIGATION
// Defines sidebar navigation based on user roles
// =====================================================

import { 
  Users, 
  Calendar, 
  Music, 
  GraduationCap, 
  HeartHandshake,
  BarChart3,
  DollarSign,
  UserCheck,
  FileText,
  TrendingUp,
  Users2,
  Building2,
  type LucideIcon 
} from 'lucide-react';

export type UserRole = 'apostle' | 'overseer' | 'elder' | 'priest' | 'underdeacon' | 'member';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
}

export interface RoleNavigation {
  role: UserRole;
  displayName: string;
  primaryColor: string;
  navigation: NavigationItem[];
}

// =====================================================
// UNDERDEACON NAVIGATION
// Focus: Recruitment, Music, Youth/Sunday School
// =====================================================
const underdeaconNav: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/underdeacon/dashboard',
    icon: BarChart3,
    description: 'My activity overview'
  },
  {
    label: 'Recruitment',
    href: '/underdeacon/recruitment',
    icon: HeartHandshake,
    description: 'Soul Pipeline & Prospects'
  },
  {
    label: 'Music Vault',
    href: '/underdeacon/music',
    icon: Music,
    description: 'Scores, Lyrics & Instruments'
  },
  {
    label: 'Sunday School',
    href: '/underdeacon/sunday-school',
    icon: GraduationCap,
    description: 'Lessons & Activities'
  },
  {
    label: 'Young Adults',
    href: '/underdeacon/young-adults',
    icon: Users2,
    description: 'Youth Programs & Events'
  },
  {
    label: 'My Activities',
    href: '/underdeacon/activities',
    icon: Calendar,
    description: 'Scheduled events'
  }
];

// =====================================================
// PRIEST NAVIGATION
// Focus: Branch Management, Attendance, Financials
// =====================================================
const priestNav: NavigationItem[] = [
  {
    label: 'Branch Overview',
    href: '/priest/dashboard',
    icon: Building2,
    description: 'Priestship metrics'
  },
  {
    label: 'Members',
    href: '/priest/members',
    icon: Users,
    description: 'Member directory'
  },
  {
    label: 'Attendance',
    href: '/priest/attendance',
    icon: UserCheck,
    description: 'Service & event attendance'
  },
  {
    label: 'Tithing',
    href: '/priest/tithing',
    icon: DollarSign,
    description: 'Financial tracking'
  },
  {
    label: 'Recruitment Reports',
    href: '/priest/recruitment',
    icon: HeartHandshake,
    description: 'View underdeacon pipeline'
  },
  {
    label: 'Activities',
    href: '/priest/activities',
    icon: Calendar,
    description: 'Branch events & programs'
  },
  {
    label: 'Music & Arts',
    href: '/priest/music',
    icon: Music,
    description: 'Branch music resources'
  },
  {
    label: 'Reports',
    href: '/priest/reports',
    icon: FileText,
    description: 'Generate branch reports'
  }
];

// =====================================================
// ELDER NAVIGATION
// Focus: District Analytics, Multi-Branch Oversight
// =====================================================
const elderNav: NavigationItem[] = [
  {
    label: 'District Analytics',
    href: '/elder/dashboard',
    icon: TrendingUp,
    description: 'Eldership-wide metrics'
  },
  {
    label: 'Growth Stats',
    href: '/elder/growth',
    icon: BarChart3,
    description: 'Cross-priestship trends'
  },
  {
    label: 'Priestships',
    href: '/elder/priestships',
    icon: Building2,
    description: 'Manage branches'
  },
  {
    label: 'Recruitment Overview',
    href: '/elder/recruitment',
    icon: HeartHandshake,
    description: 'District-wide pipeline'
  },
  {
    label: 'Attendance Reports',
    href: '/elder/attendance',
    icon: UserCheck,
    description: 'All branches'
  },
  {
    label: 'Financial Summary',
    href: '/elder/financials',
    icon: DollarSign,
    description: 'District tithing'
  },
  {
    label: 'Activities Calendar',
    href: '/elder/activities',
    icon: Calendar,
    description: 'District events'
  }
];

// =====================================================
// OVERSEER NAVIGATION
// Focus: Regional Management
// =====================================================
const overseerNav: NavigationItem[] = [
  {
    label: 'Regional Dashboard',
    href: '/overseer/dashboard',
    icon: TrendingUp,
    description: 'Overseership metrics'
  },
  {
    label: 'Elderships',
    href: '/overseer/elderships',
    icon: Building2,
    description: 'Manage districts'
  },
  {
    label: 'Regional Analytics',
    href: '/overseer/analytics',
    icon: BarChart3,
    description: 'Multi-district insights'
  },
  {
    label: 'Reports',
    href: '/overseer/reports',
    icon: FileText,
    description: 'Regional reporting'
  }
];

// =====================================================
// APOSTLE NAVIGATION
// Focus: Global Leadership
// =====================================================
const apostleNav: NavigationItem[] = [
  {
    label: 'Apostleship Dashboard',
    href: '/apostle/dashboard',
    icon: TrendingUp,
    description: 'Global metrics'
  },
  {
    label: 'Overseerships',
    href: '/apostle/overseerships',
    icon: Building2,
    description: 'Manage regions'
  },
  {
    label: 'Strategic Analytics',
    href: '/apostle/analytics',
    icon: BarChart3,
    description: 'Church-wide insights'
  },
  {
    label: 'Leadership',
    href: '/apostle/leadership',
    icon: Users,
    description: 'Manage leaders'
  }
];

// =====================================================
// MEMBER NAVIGATION
// Focus: Basic access
// =====================================================
const memberNav: NavigationItem[] = [
  {
    label: 'Home',
    href: '/member/dashboard',
    icon: BarChart3,
    description: 'My profile'
  },
  {
    label: 'Events',
    href: '/member/events',
    icon: Calendar,
    description: 'Upcoming events'
  },
  {
    label: 'My Attendance',
    href: '/member/attendance',
    icon: UserCheck,
    description: 'My attendance history'
  }
];

// =====================================================
// ROLE CONFIGURATION MAP
// =====================================================
export const ROLE_NAVIGATION: Record<UserRole, RoleNavigation> = {
  underdeacon: {
    role: 'underdeacon',
    displayName: 'Underdeacon',
    primaryColor: '#3b82f6', // Blue
    navigation: underdeaconNav
  },
  priest: {
    role: 'priest',
    displayName: 'Priest',
    primaryColor: '#8b5cf6', // Purple
    navigation: priestNav
  },
  elder: {
    role: 'elder',
    displayName: 'Elder',
    primaryColor: '#10b981', // Green
    navigation: elderNav
  },
  overseer: {
    role: 'overseer',
    displayName: 'Overseer',
    primaryColor: '#f59e0b', // Amber
    navigation: overseerNav
  },
  apostle: {
    role: 'apostle',
    displayName: 'Apostle',
    primaryColor: '#ef4444', // Red
    navigation: apostleNav
  },
  member: {
    role: 'member',
    displayName: 'Member',
    primaryColor: '#6b7280', // Gray
    navigation: memberNav
  }
};

// Helper function to get navigation for a specific role
export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return ROLE_NAVIGATION[role]?.navigation || memberNav;
}

// Helper function to check if user has access to a route
export function hasAccessToRoute(userRole: UserRole, route: string): boolean {
  const navigation = getNavigationForRole(userRole);
  return navigation.some(item => route.startsWith(item.href));
}
