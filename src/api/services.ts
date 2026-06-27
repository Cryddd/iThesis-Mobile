import { apiClient } from './client';
import { absoluteMediaUrl } from '@/config/env';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import type {
  AccessCode,
  AccessCodeStatus,
  ActivityEntry,
  AdminDashboardSummary,
  AnalyticsSummary,
  BrowseParams,
  BrowseResponse,
  CreateStaffInput,
  DashboardSummary,
  DeletedThesis,
  Department,
  LoginResponse,
  Paginated,
  StaffUser,
  SystemLogsResponse,
  Thesis,
  ThesisStatus,
  TrackingResult,
} from '@/types';

// ---- Wire types (camelCase, as returned by the Django views) ----------------

interface ApiThesis {
  id: number;
  title: string;
  abstract?: string;
  keywords?: string | null;
  aiTags?: string[];
  yearSubmitted?: number | null;
  yearPublished?: number | null;
  authors?: string[];
  adviserName?: string | null;
  department?: string;
  departmentCode?: string;
  status?: ThesisStatus;
  submittedAt?: string;
  approvedAt?: string | null;
  statusUpdatedAt?: string | null;
  trackingCode?: string;
  viewCount?: number;
  downloadCount?: number;
  documentUrl?: string;
  hasExecutiveSummary?: boolean;
  rejectionReason?: string;
}

function splitKeywords(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

/** Normalise a backend thesis payload into the UI's `Thesis` model. */
function mapThesis(raw: ApiThesis): Thesis {
  return {
    id: raw.id,
    title: raw.title,
    abstract: raw.abstract,
    authors: raw.authors ?? [],
    adviser: raw.adviserName ?? undefined,
    department: raw.department && raw.department !== 'N/A' ? raw.department : undefined,
    departmentCode:
      raw.departmentCode && raw.departmentCode !== 'N/A' ? raw.departmentCode : undefined,
    publicationYear: raw.yearPublished ?? raw.yearSubmitted ?? undefined,
    status: raw.status,
    thumbnailUrl: absoluteMediaUrl(`/api/theses/${raw.id}/thumbnail`),
    documentUrl: raw.documentUrl ? absoluteMediaUrl(raw.documentUrl) : undefined,
    hasExecutiveSummary: raw.hasExecutiveSummary,
    viewCount: raw.viewCount,
    downloadCount: raw.downloadCount,
    aiTags: raw.aiTags ?? [],
    keywords: splitKeywords(raw.keywords),
    trackingCode: raw.trackingCode,
    submittedAt: raw.submittedAt,
    approvedAt: raw.approvedAt ?? undefined,
    rejectionReason: raw.rejectionReason,
  };
}

// ---- Auth -------------------------------------------------------------------

export const authApi = {
  /** POST /auth/login → session cookie + profile (+ staff sessionToken). */
  async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    const deviceId = await getOrCreateDeviceId();
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      usernameOrEmail: usernameOrEmail.trim(),
      password: password.trim(),
      deviceId,
    });
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email: email.trim() });
  },

  /** Best-effort server-side session/lock release. */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout').catch(() => undefined);
  },
};

// ---- Theses -----------------------------------------------------------------

function buildBrowseQuery(params: BrowseParams): string {
  const sp = new URLSearchParams();
  if (params.query) sp.set('q', params.query);
  if (params.departmentCode) sp.set('department', params.departmentCode);
  if (params.year) sp.set('year', String(params.year));
  sp.set('sort_by', params.sort ?? 'newest');
  sp.set('page', String(params.page ?? 1));
  sp.set('page_size', String(params.pageSize ?? 12));
  return sp.toString();
}

export const thesisApi = {
  /** GET /theses/browse — approved theses only, paginated. */
  async browse(params: BrowseParams): Promise<BrowseResponse> {
    const { data } = await apiClient.get<BrowseResponse<ApiThesis>>(
      `/theses/browse?${buildBrowseQuery(params)}`,
    );
    return { ...data, results: data.results.map(mapThesis) };
  },

  async detail(id: number): Promise<Thesis> {
    const { data } = await apiClient.get<ApiThesis>(`/theses/${id}`);
    return mapThesis(data);
  },

  /** GET /departments → flat array of { id, name, code }. */
  async departments(): Promise<Department[]> {
    const { data } = await apiClient.get<Department[]>('/departments');
    return data;
  },

  /** GET /theses/track?code= */
  async track(trackingCode: string): Promise<TrackingResult> {
    const { data } = await apiClient.get<TrackingResult>(
      `/theses/track?code=${encodeURIComponent(trackingCode.trim())}`,
    );
    return data;
  },

  /** Record a view (analytics) — fire-and-forget. */
  async recordView(id: number): Promise<void> {
    await apiClient.post(`/theses/${id}/record-view`, {}).catch(() => undefined);
  },

  /**
   * POST /theses/submit (multipart). Field names match the Django view:
   *   file, title, abstract, adviser, authors (JSON array string),
   *   department / department_code, year_published, executive_summary,
   *   uploader_name / uploader_email / uploader_sr_code.
   */
  async submit(payload: {
    title: string;
    abstract: string;
    adviser: string;
    authors: string[];
    departmentCode?: string;
    department?: string;
    yearPublished?: string;
    file: { uri: string; name: string; mimeType?: string };
    summary?: { uri: string; name: string; mimeType?: string } | null;
    uploaderName?: string;
    uploaderEmail?: string;
    uploaderSrCode?: string;
  }): Promise<{ trackingCode: string }> {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('abstract', payload.abstract);
    form.append('adviser', payload.adviser);
    form.append('authors', JSON.stringify(payload.authors));
    if (payload.departmentCode) form.append('department_code', payload.departmentCode);
    if (payload.department) form.append('department', payload.department);
    if (payload.yearPublished) form.append('year_published', payload.yearPublished);
    if (payload.uploaderName) form.append('uploader_name', payload.uploaderName);
    if (payload.uploaderEmail) form.append('uploader_email', payload.uploaderEmail);
    if (payload.uploaderSrCode) form.append('uploader_sr_code', payload.uploaderSrCode);

    form.append('file', {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType ?? 'application/pdf',
    } as unknown as Blob);

    if (payload.summary) {
      form.append('executive_summary', {
        uri: payload.summary.uri,
        name: payload.summary.name,
        type: payload.summary.mimeType ?? 'application/pdf',
      } as unknown as Blob);
    }

    const { data } = await apiClient.post<{ trackingCode?: string }>('/theses/submit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { trackingCode: data.trackingCode ?? '' };
  },

  /** PATCH /theses/{id}/details — librarian metadata fix (title/adviser/authors). */
  async updateDetails(
    id: number,
    patch: { title?: string; adviser?: string | null; authors?: string[] },
  ): Promise<void> {
    await apiClient.patch(`/theses/${id}/details`, patch);
  },

  /** PATCH /theses/{id}/publication-year — set or clear the year. */
  async updatePublicationYear(id: number, year: number | null): Promise<void> {
    await apiClient.patch(`/theses/${id}/publication-year`, { year });
  },

  /** DELETE /theses/{id} — soft delete (librarian). */
  async softDelete(id: number): Promise<void> {
    await apiClient.delete(`/theses/${id}`);
  },
};

// ---- Deleted theses (soft-delete recovery) ----------------------------------

export const deletedThesesApi = {
  async list(query = '', page = 1): Promise<{ items: DeletedThesis[]; count: number }> {
    const { data } = await apiClient.get<Paginated<ApiThesis & {
      deletedAt?: string;
      deletedBy?: string;
      deletedByName?: string;
    }>>('/theses/deleted', { params: { q: query || undefined, page, page_size: 20 } });
    const items = data.results.map((raw) => ({
      ...mapThesis(raw),
      deletedAt: raw.deletedAt,
      deletedBy: raw.deletedBy,
      deletedByName: raw.deletedByName,
    }));
    return { items, count: data.count };
  },

  async recover(id: number): Promise<void> {
    await apiClient.post(`/theses/${id}/recover`, {});
  },

  async permanentDelete(ids: number[]): Promise<void> {
    await apiClient.post('/theses/deleted/permanent-delete', { thesis_ids: ids });
  },
};

// ---- Access codes (librarian) ----------------------------------------------

export const accessCodesApi = {
  async list(
    status: 'all' | AccessCodeStatus = 'all',
    page = 1,
  ): Promise<Paginated<AccessCode>> {
    const { data } = await apiClient.get<Paginated<AccessCode>>('/librarian/access-codes', {
      params: { status, page, page_size: 20 },
    });
    return data;
  },

  async generate(count: number): Promise<AccessCode[]> {
    const { data } = await apiClient.post<{ created: AccessCode[] }>(
      '/librarian/access-codes/generate',
      { count },
    );
    return data.created ?? [];
  },

  async clearAll(): Promise<number> {
    const { data } = await apiClient.delete<{ deleted_count?: number }>(
      '/librarian/access-codes/clear',
    );
    return data.deleted_count ?? 0;
  },
};

// ---- Analytics --------------------------------------------------------------

export const analyticsApi = {
  async summary(): Promise<AnalyticsSummary> {
    const { data } = await apiClient.get<AnalyticsSummary>('/analytics/summary');
    return data;
  },
};

// ---- Admin ------------------------------------------------------------------

export const adminApi = {
  async dashboard(): Promise<AdminDashboardSummary> {
    const { data } = await apiClient.get<AdminDashboardSummary>('/admin/dashboard/summary');
    return data;
  },

  async recentActivity(): Promise<ActivityEntry[]> {
    const { data } = await apiClient.get<ActivityEntry[] | { data: ActivityEntry[] }>(
      '/admin/dashboard/recent-activity',
    );
    return Array.isArray(data) ? data : (data.data ?? []);
  },

  async systemLogs(params: {
    page?: number;
    userType?: 'all' | 'authenticated' | 'guest';
    days?: number | 'all';
  } = {}): Promise<SystemLogsResponse> {
    const { data } = await apiClient.get<SystemLogsResponse>('/admin/system-logs', {
      params: {
        page: params.page ?? 1,
        page_size: 20,
        user_type: params.userType ?? 'all',
        days: params.days ?? 14,
      },
    });
    return data;
  },

  async errorLogs(page = 1): Promise<SystemLogsResponse> {
    const { data } = await apiClient.get<SystemLogsResponse>('/admin/error-logs', {
      params: { page, page_size: 20 },
    });
    return data;
  },

  // --- Librarian accounts ---
  async listLibrarians(q = ''): Promise<StaffUser[]> {
    const { data } = await apiClient.get<StaffUser[]>('/admin/librarians', {
      params: { q: q || undefined },
    });
    return data;
  },

  async createLibrarian(input: CreateStaffInput): Promise<StaffUser> {
    const { data } = await apiClient.post<StaffUser>('/admin/librarians/create', input);
    return data;
  },

  async updateLibrarian(id: number, patch: Partial<StaffUser & { password: string }>): Promise<void> {
    await apiClient.put(`/admin/librarians/${id}`, patch);
  },

  async deactivateLibrarian(id: number): Promise<void> {
    await apiClient.delete(`/admin/librarians/${id}/delete`);
  },

  // --- Admin accounts ---
  async listAdmins(q = ''): Promise<StaffUser[]> {
    const { data } = await apiClient.get<StaffUser[]>('/admin/admins', {
      params: { q: q || undefined },
    });
    return data;
  },

  async createAdmin(input: CreateStaffInput): Promise<StaffUser> {
    const { data } = await apiClient.post<StaffUser>('/admin/admins/create', input);
    return data;
  },

  async updateAdmin(id: number, patch: Partial<StaffUser & { password: string }>): Promise<void> {
    await apiClient.put(`/admin/admins/${id}`, patch);
  },

  async deactivateAdmin(id: number): Promise<void> {
    await apiClient.delete(`/admin/admins/${id}/deactivate`);
  },
};

// ---- Similar theses (AI) ----------------------------------------------------

export const aiApi = {
  async similar(thesisId: number, limit = 5): Promise<Thesis[]> {
    const { data } = await apiClient.get<{ similar_theses?: ApiThesis[] }>(
      `/ai/similar-theses/${thesisId}`,
      { params: { limit } },
    );
    return (data.similar_theses ?? []).map(mapThesis);
  },
};

// ---- Certifications & generated documents (librarian) -----------------------

export interface GeneratedDoc {
  id: number;
  thesis: number;
  type: 'certificate' | 'form';
  file: string | null;
  created_at?: string;
}

export const certificationsApi = {
  /** List generated documents for a thesis. */
  async list(thesisId: number, type?: 'certificate' | 'form'): Promise<GeneratedDoc[]> {
    const { data } = await apiClient.get<{ results: GeneratedDoc[] }>('/generated-docs', {
      params: { thesis: thesisId, type },
    });
    return data.results ?? [];
  },

  async remove(docId: number): Promise<void> {
    await apiClient.delete(`/generated-docs/${docId}`);
  },

  /**
   * Build the authenticated URL that generates a certificate/form PDF on the
   * fly (GET /generate-document-from-library). The caller streams it via
   * `downloadAndOpen`, which attaches the staff auth headers.
   */
  generateUrl(params: {
    thesisId: number;
    type: 'certificate' | 'form';
    date?: string;
    includeESignature?: boolean;
    chapters?: boolean[];
  }): string {
    const sp = new URLSearchParams();
    sp.set('thesis', String(params.thesisId));
    sp.set('type', params.type);
    if (params.date) sp.set('date', params.date);
    if (params.includeESignature) sp.set('include_e_signature', 'true');
    if (params.type === 'form' && params.chapters) {
      params.chapters.forEach((on, i) => sp.set(`chapter_${i + 1}`, on ? 'true' : 'false'));
    }
    return `/api/v1/generate-document-from-library?${sp.toString()}`;
  },

  /** GET/PUT signatory settings (name + title shown on certificates). */
  async getSignatory(): Promise<{ signatory_name?: string; signatory_title?: string }> {
    const { data } = await apiClient.get('/librarian/certificate-signatory-settings');
    return data;
  },

  async setSignatory(patch: { signatory_name?: string; signatory_title?: string }): Promise<void> {
    await apiClient.put('/librarian/certificate-signatory-settings', patch);
  },
};

// ---- Reports & exports (analytics) ------------------------------------------

/** Authenticated download paths for the analytics report exports. */
export const reportPaths = {
  monthlyPdf: (year: number, month: number) =>
    `/api/v1/analytics/export-monthly-pdf?year=${year}&month=${month}`,
  monthlyCsv: (year: number, month: number) =>
    `/api/v1/analytics/export-monthly-csv?year=${year}&month=${month}`,
  monthlyXlsx: (year: number, month: number) =>
    `/api/v1/analytics/export-monthly-xlsx?year=${year}&month=${month}`,
  officialUsage: (year: number, month: number) =>
    `/api/v1/analytics/export-official-usage-report?year=${year}&month=${month}`,
  certificationReport: () => `/api/v1/analytics/export-certification-report`,
  uploadUsageReport: () => `/api/v1/analytics/export-upload-usage-report`,
};

// ---- Guest session tracking -------------------------------------------------

export const guestApi = {
  /** POST /track/guest-session — analytics for a guest's verified session. */
  async trackSession(input: {
    name?: string;
    email?: string;
    accessLevel?: 'browse' | 'upload';
    sessionId?: string;
    srCode?: string;
  }): Promise<void> {
    await apiClient
      .post('/track/guest-session', {
        name: input.name ?? 'Guest',
        email: input.email ?? '',
        accessLevel: input.accessLevel ?? 'browse',
        sessionId: input.sessionId,
        srCode: input.srCode,
      })
      .catch(() => undefined);
  },
};

// ---- Guest access codes -----------------------------------------------------

export const accessApi = {
  /** POST /access/verify { code, name, email, srCode } → { ok }. */
  async verify(input: {
    code: string;
    name?: string;
    email?: string;
    srCode?: string;
  }): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean; error?: string }>('/access/verify', {
      code: input.code.trim(),
      name: input.name ?? '',
      email: input.email ?? '',
      srCode: input.srCode ?? '',
    });
    return data;
  },
};

// ---- Librarian --------------------------------------------------------------

interface DashboardSummaryRaw {
  pendingReviews: number;
  approvedThisWeek: number;
  totalTheses: number;
  uniqueUsers: number;
}

export const librarianApi = {
  async dashboard(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummaryRaw>('/dashboard/summary');
    return data;
  },

  /**
   * GET /dashboard/recent-submissions?statuses=&limit= → { submissions }.
   * This is the source for the review queue (student submissions, newest first).
   */
  async recentSubmissions(
    statuses: ThesisStatus[] = ['pending'],
    limit = 50,
  ): Promise<Thesis[]> {
    const { data } = await apiClient.get<{ submissions: ApiThesis[] }>(
      '/dashboard/recent-submissions',
      { params: { statuses: statuses.join(','), limit } },
    );
    return (data.submissions ?? []).map(mapThesis);
  },

  /** POST /theses/{id}/approve */
  async approve(id: number): Promise<void> {
    await apiClient.post(`/theses/${id}/approve`, {});
  },

  /** POST /theses/{id}/reject { reason } (reason required). */
  async reject(id: number, reason: string): Promise<void> {
    await apiClient.post(`/theses/${id}/reject`, { reason });
  },
};
