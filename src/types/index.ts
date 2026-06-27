export type UserRole = 'admin' | 'librarian' | 'student' | 'guest';

export type ThesisStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
}

/** Response of POST /auth/login (Django session auth). */
export interface LoginResponse extends AuthUser {
  /** Present for staff — the single-device session token. */
  sessionToken?: string;
  deviceId?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

/**
 * Internal thesis model used across the UI. The backend returns camelCase
 * fields (see `mapThesis` in api/services.ts) which are normalised into this
 * shape so screens stay decoupled from the wire format.
 */
export interface Thesis {
  id: number;
  title: string;
  abstract?: string;
  authors: string[];
  adviser?: string;
  department?: string;
  departmentCode?: string;
  publicationYear?: number;
  status?: ThesisStatus;
  thumbnailUrl?: string;
  documentUrl?: string;
  hasExecutiveSummary?: boolean;
  viewCount?: number;
  downloadCount?: number;
  aiTags?: string[];
  keywords?: string[];
  trackingCode?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

/** GET /theses/browse response (camelCase + Django paginator metadata). */
export interface BrowseResponse<T = Thesis> {
  results: T[];
  count: number;
  num_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export type BrowseSort = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

export interface BrowseParams {
  query?: string;
  /** Department CODE (e.g. "CICS"), not the display name. */
  departmentCode?: string;
  year?: string | number;
  sort?: BrowseSort;
  page?: number;
  pageSize?: number;
}

/** GET /dashboard/summary */
export interface DashboardSummary {
  pendingReviews: number;
  approvedThisWeek: number;
  totalTheses: number;
  uniqueUsers: number;
}

/** GET /theses/track?code= */
export interface TrackingResult {
  trackingCode: string;
  status: ThesisStatus;
  title?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
}

// ---- Access codes (librarian) ----------------------------------------------

export type AccessCodeStatus = 'unused' | 'used' | 'expired';

export interface AccessCode {
  id: number;
  code: string;
  status: AccessCodeStatus;
  usedBy?: string;
  usedAt?: string | null;
  date?: string;
}

export interface Paginated<T> {
  results: T[];
  count: number;
  num_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
}

// ---- Deleted theses (soft delete) ------------------------------------------

export interface DeletedThesis extends Thesis {
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
}

// ---- Admin: staff accounts --------------------------------------------------

export interface StaffUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
  lastLoginAt?: string | null;
  role: 'librarian' | 'admin';
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

/** GET /admin/dashboard/summary */
export interface AdminDashboardSummary {
  activeLibrarians: number;
  activeAdmins: number;
  totalTheses: number;
}

// ---- Activity / system logs -------------------------------------------------

export interface ActivityEntry {
  id: number;
  date: string;
  time?: string;
  user: string;
  action: string;
  description?: string;
  details?: Record<string, unknown> | null;
  severity?: string;
}

export interface SystemLogsResponse {
  logs: ActivityEntry[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
    total_pages: number;
  };
}

// ---- Analytics --------------------------------------------------------------

export interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalTheses: number;
  viewedTheses: number;
  uniqueUsers: number;
  avgReads: number;
  topDept: string;
  demographics: {
    maleUsers: number;
    femaleUsers: number;
    studentUsers: number;
    facultyNonTeachingUsers: number;
    outsideResearchers: number;
  };
  series?: unknown;
}
