// ============================================================
// OLDER APOSTOLIC CHURCH - TYPE DEFINITIONS
// Version: 2.0 - Foundation Rebuild
// ============================================================

// ============================================================
// ENUM TYPES
// ============================================================

// Role hierarchy: Level 1 (highest) to Level 6 (lowest)
export type Role = 
  | 'apostle'           // Level 1 - Highest
  | 'evangelist'        // Level 2 - Fourfold
  | 'prophet'           // Level 2 - Fourfold
  | 'overseer_shepherd' // Level 2 - Fourfold
  | 'elder'             // Level 3
  | 'priest'            // Level 4
  | 'underdeacon'       // Level 5
  | 'member';           // Level 6 - No app access until approved

// Role subtype
export type RoleSubtype = 'shepherd' | 'specialist';

// Specialist types (for administrative divisions)
export type SpecialistType = 
  | 'youth'
  | 'young_adult'
  | 'adult'
  | 'senior_citizen'
  | 'sunday_school'
  | 'evangelism';

// Approval status
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Assignment type
export type AssignmentType = 'primary' | 'additional';

// Unit type for leadership assignments
export type UnitType = 
  | 'apostleship'
  | 'overseership'
  | 'eldership'
  | 'priestship'
  | 'specialist';

// Administrative division types
export type AdminDivisionType = 
  | 'youth'
  | 'adult'
  | 'young_adult'
  | 'senior_citizen'
  | 'sunday_school'
  | 'evangelism';

// Administrative division level
export type AdminDivisionLevel = 'apostleship' | 'overseership' | 'eldership';

// ============================================================
// ROLE HIERARCHY HELPERS
// ============================================================

// Role hierarchy level (lower number = higher authority)
export const ROLE_HIERARCHY: Record<Role, number> = {
  apostle: 1,
  evangelist: 2,
  prophet: 2,
  overseer_shepherd: 2,
  elder: 3,
  priest: 4,
  underdeacon: 5,
  member: 6,
};

// Fourfold officer roles
export const FOURFOLD_ROLES: Role[] = ['evangelist', 'prophet', 'overseer_shepherd'];

// Leadership roles (can approve others)
export const LEADERSHIP_ROLES: Role[] = [
  'apostle', 
  'evangelist', 
  'prophet', 
  'overseer_shepherd', 
  'elder', 
  'priest'
];

// Helper function to check if role can approve another role
export function canApprove(approverRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[approverRole] < ROLE_HIERARCHY[targetRole];
}

// Helper function to capitalize role for display
export function formatRole(role: Role): string {
  const roleNames: Record<Role, string> = {
    apostle: 'Apostle',
    evangelist: 'Evangelist',
    prophet: 'Prophet',
    overseer_shepherd: 'Overseer/Shepherd',
    elder: 'Elder',
    priest: 'Priest',
    underdeacon: 'Underdeacon',
    member: 'Member',
  };
  return roleNames[role] || role;
}

// Helper function to format specialist type for display
export function formatSpecialistType(type: SpecialistType): string {
  const typeNames: Record<SpecialistType, string> = {
    youth: 'Youth',
    young_adult: 'Young Adult',
    adult: 'Adult',
    senior_citizen: 'Senior Citizens',
    sunday_school: 'Sunday School',
    evangelism: 'Evangelism',
  };
  return typeNames[type] || type;
}

// ============================================================
// HIERARCHICAL STRUCTURE INTERFACES
// ============================================================

// Apostleship (Top level - led by Apostle)
export interface Apostleship {
  id: string;
  name: string;
  apostle_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  apostle?: Profile;
  overseerships?: Overseership[];
}

// Overseership (Led by Fourfold Officers)
export interface Overseership {
  id: string;
  name: string;
  apostleship_id: string;
  overseer_id: string | null;
  description: string | null;
  location: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  apostleship?: Apostleship;
  overseer?: Profile;
  elderships?: Eldership[];
}

// Eldership (Led by Elders)
export interface Eldership {
  id: string;
  name: string;
  overseership_id: string;
  elder_id: string | null;
  description: string | null;
  location: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  overseership?: Overseership;
  elder?: Profile;
  priestships?: Priestship[];
}

// Priestship (Led by Priests - lowest pastoral unit)
export interface Priestship {
  id: string;
  name: string;
  eldership_id: string;
  priest_id: string | null;
  description: string | null;
  location: string | null;
  meeting_address: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  eldership?: Eldership;
  priest?: Profile;
  members?: Member[];
}

// Administrative Division (Cross-cutting divisions)
export interface AdministrativeDivision {
  id: string;
  name: string;
  type: AdminDivisionType;
  level: AdminDivisionLevel;
  apostleship_id: string | null;
  overseership_id: string | null;
  eldership_id: string | null;
  leader_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  leader?: Profile;
}

// Leadership Assignment
export interface LeadershipAssignment {
  id: string;
  profile_id: string;
  assignment_type: AssignmentType;
  unit_type: UnitType;
  apostleship_id: string | null;
  overseership_id: string | null;
  eldership_id: string | null;
  priestship_id: string | null;
  admin_division_id: string | null;
  specialist_type: SpecialistType | null;
  is_active: boolean;
  assigned_at: string;
  assigned_by: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data
  apostleship?: Apostleship;
  overseership?: Overseership;
  eldership?: Eldership;
  priestship?: Priestship;
  admin_division?: AdministrativeDivision;
}

// ============================================================
// USER & PROFILE INTERFACES
// ============================================================

// Profile (linked to Supabase auth.users)
export interface Profile {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  role: Role;
  role_subtype: RoleSubtype | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  primary_assignment_id: string | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  primary_assignment?: LeadershipAssignment;
  all_assignments?: LeadershipAssignment[];
}

// Member (church member, can be linked to a profile)
export interface Member {
  id: string;
  profile_id: string | null;
  priestship_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  marital_status: 'single' | 'married' | 'widowed' | 'divorced' | null;
  occupation: string | null;
  role: Role;
  is_active: boolean;
  joined_date: string | null;
  baptism_date: string | null;
  notes: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data
  profile?: Profile;
  priestship?: Priestship;
}

// ============================================================
// EXISTING FEATURE INTERFACES (Updated)
// ============================================================

// Event
export interface Event {
  id: string;
  priestship_id: string | null;
  eldership_id: string | null;
  overseership_id: string | null;
  apostleship_id: string | null;
  title: string;
  description: string | null;
  event_type: 'service' | 'meeting' | 'celebration' | 'outreach' | 'funeral' | 'wedding' | 'baptism' | 'other';
  date_time: string; // timestamp from database
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
}

// Attendance Record
export interface AttendanceRecord {
  id: string;
  member_id: string;
  event_id: string | null;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes: string | null;
  recorded_by: string | null;
  created_at?: string;
  // Joined data
  member?: Member;
  event?: Event;
}

// Tithing Record
export interface TithingRecord {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other' | null;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at?: string;
  // Joined data
  member?: Member;
}

// Spiritual Gift
export type GiftType = 'dream' | 'vision' | 'prophecy' | 'tongue' | 'interpretation' | 'healing' | 'other';

export interface SpiritualGift {
  id: string;
  member_id: string;
  gift_type: GiftType;
  title: string;
  description: string | null;
  date_received: string;
  is_private: boolean;
  is_fulfilled: boolean;
  fulfilled_date: string | null;
  fulfillment_notes: string | null;
  recorded_by: string | null;
  is_reviewed: boolean;
  assessed_by: string | null;
  assessment_notes: string | null;
  assessed_at: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data
  member?: Member;
}

// Report (Generated reports)
export interface Report {
  id: string;
  priestship_id: string | null;
  eldership_id: string | null;
  overseership_id: string | null;
  apostleship_id: string | null;
  report_type: 'attendance' | 'tithing' | 'membership' | 'spiritual_gifts' | 'general';
  title: string;
  content: Record<string, unknown> | null;
  period_start: string | null;
  period_end: string | null;
  generated_by: string | null;
  created_at?: string;
}

// Wellness Report
export type WellnessReportType = 'wellness' | 'absence' | 'prayer_need' | 'follow_up' | 'other';

export interface WellnessReport {
  id: string;
  member_id: string;
  priestship_id: string | null;
  eldership_id: string | null;
  overseership_id: string | null;
  apostleship_id: string | null;
  report_type: WellnessReportType;
  title: string;
  details: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  auto_mark_absent: boolean;
  reported_by: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data
  member?: Member;
}

// ============================================================
// ONBOARDING TYPES
// ============================================================

// Onboarding step data
export interface OnboardingData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl?: string;
  
  // Step 2: Role
  role: Role;
  
  // Step 3: Primary Assignment
  assignmentType: 'unit' | 'specialist';
  unitType?: UnitType;
  selectedUnitId?: string;
  
  // Step 4: Specialist Type (if applicable)
  specialistType?: SpecialistType;
  
  // Step 5: Additional Responsibilities
  additionalDivisions: SpecialistType[];
}

// Onboarding step
export type OnboardingStep = 
  | 'personal_info'
  | 'select_role'
  | 'primary_assignment'
  | 'specialist_type'
  | 'additional_responsibilities'
  | 'review';

// ============================================================
// VIEW CONTEXT TYPES
// ============================================================

// Current view context for users with multiple assignments
export interface ViewContext {
  assignmentId: string;
  assignmentType: AssignmentType;
  unitType: UnitType;
  unitId: string | null;
  unitName: string;
  specialistType?: SpecialistType;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

// Pending approval item
export interface PendingApproval {
  id: string;
  profile: Profile;
  requestedRole: Role;
  requestedAssignment: LeadershipAssignment | null;
  submittedAt: string;
}

// Hierarchy path (for navigation/context)
export interface HierarchyPath {
  apostleship?: { id: string; name: string };
  overseership?: { id: string; name: string };
  eldership?: { id: string; name: string };
  priestship?: { id: string; name: string };
}

// ============================================================
// UTILITY TYPES
// ============================================================

// Generic API response
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
