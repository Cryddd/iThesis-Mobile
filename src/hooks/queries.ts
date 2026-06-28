import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  accessCodesApi,
  adminApi,
  aiApi,
  analyticsApi,
  certificationsApi,
  deletedThesesApi,
  librarianApi,
  thesisApi,
} from '@/api/services';
import type { AccessCodeStatus, BrowseParams, Thesis, ThesisStatus } from '@/types';

const PAGE_SIZE = 12;

export const queryKeys = {
  browse: (params: Omit<BrowseParams, 'page'>) => ['browse', params] as const,
  thesis: (id: number) => ['thesis', id] as const,
  departments: ['departments'] as const,
  dashboard: ['librarian', 'dashboard'] as const,
  review: (statuses: ThesisStatus[]) => ['librarian', 'review', statuses] as const,
};

/** Infinite, paginated browse list (approved theses). */
export function useBrowseTheses(params: Omit<BrowseParams, 'page'>, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.browse(params),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      thesisApi.browse({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.has_next ? lastPage.current_page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useThesisDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.thesis(id),
    queryFn: () => thesisApi.detail(id),
  });
}

export function useSimilarTheses(id: number) {
  return useQuery({
    queryKey: ['thesis', id, 'similar'],
    queryFn: () => aiApi.similar(id),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useGeneratedDocs(thesisId: number) {
  return useQuery({
    queryKey: ['generated-docs', thesisId],
    queryFn: () => certificationsApi.list(thesisId),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => thesisApi.departments(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => librarianApi.dashboard(),
  });
}

/** Review queue / submissions list, filtered by status. */
export function useRecentSubmissions(statuses: ThesisStatus[] = ['pending']) {
  return useQuery({
    queryKey: queryKeys.review(statuses),
    queryFn: () => librarianApi.recentSubmissions(statuses),
  });
}

/** Flatten infinite-query pages into a single list. */
export function flattenPages(pages?: { results: Thesis[] }[]): Thesis[] {
  return pages?.flatMap((p) => p.results) ?? [];
}

export function useReviewDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: number;
      decision: 'approve' | 'reject';
      reason?: string;
    }) => {
      if (input.decision === 'approve') {
        await librarianApi.approve(input.id);
      } else {
        await librarianApi.reject(input.id, input.reason ?? '');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['librarian'] });
    },
  });
}

// ---- Thesis management (librarian) -----------------------------------------

export function useThesisManagement(id: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.thesis(id) });
    qc.invalidateQueries({ queryKey: ['librarian'] });
    qc.invalidateQueries({ queryKey: ['browse'] });
  };
  const updateDetails = useMutation({
    mutationFn: (patch: { title?: string; adviser?: string | null; authors?: string[] }) =>
      thesisApi.updateDetails(id, patch),
    onSuccess: invalidate,
  });
  const updateYear = useMutation({
    mutationFn: (year: number | null) => thesisApi.updatePublicationYear(id, year),
    onSuccess: invalidate,
  });
  const softDelete = useMutation({
    mutationFn: () => thesisApi.softDelete(id),
    onSuccess: invalidate,
  });
  return { updateDetails, updateYear, softDelete };
}

// ---- Access codes -----------------------------------------------------------

export function useAccessCodes(status: 'all' | AccessCodeStatus = 'all') {
  return useQuery({
    queryKey: ['access-codes', status],
    queryFn: () => accessCodesApi.list(status),
  });
}

export function useAccessCodeActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['access-codes'] });
  const generate = useMutation({
    mutationFn: (count: number) => accessCodesApi.generate(count),
    onSuccess: invalidate,
  });
  const clearAll = useMutation({
    mutationFn: () => accessCodesApi.clearAll(),
    onSuccess: invalidate,
  });
  return { generate, clearAll };
}

// ---- Deleted theses ---------------------------------------------------------

export function useDeletedTheses(query = '') {
  return useQuery({
    queryKey: ['deleted-theses', query],
    queryFn: () => deletedThesesApi.list(query),
  });
}

export function useRecoverThesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletedThesesApi.recover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deleted-theses'] });
      qc.invalidateQueries({ queryKey: ['librarian'] });
    },
  });
}

// ---- Analytics --------------------------------------------------------------

export function useAnalyticsSummary() {
  return useQuery({ queryKey: ['analytics', 'summary'], queryFn: () => analyticsApi.summary() });
}

// ---- Admin ------------------------------------------------------------------

export function useAdminDashboard() {
  return useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => adminApi.dashboard() });
}

export function useAdminRecentActivity() {
  return useQuery({
    queryKey: ['admin', 'recent-activity'],
    queryFn: () => adminApi.recentActivity(),
  });
}

export function useSystemLogs(userType: 'all' | 'authenticated' | 'guest' = 'all') {
  return useQuery({
    queryKey: ['admin', 'system-logs', userType],
    queryFn: () => adminApi.systemLogs({ userType }),
  });
}

export function useErrorLogs() {
  return useQuery({
    queryKey: ['admin', 'error-logs'],
    queryFn: () => adminApi.errorLogs(),
  });
}

export function useStaffList(role: 'librarian' | 'admin', q = '') {
  return useQuery({
    queryKey: ['admin', 'staff', role, q],
    queryFn: () => (role === 'librarian' ? adminApi.listLibrarians(q) : adminApi.listAdmins(q)),
  });
}

export function useStaffActions(role: 'librarian' | 'admin') {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const create = useMutation({
    mutationFn: (input: Parameters<typeof adminApi.createLibrarian>[0]) =>
      role === 'librarian' ? adminApi.createLibrarian(input) : adminApi.createAdmin(input),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: (vars: { id: number; isActive: boolean }) =>
      role === 'librarian'
        ? vars.isActive
          ? adminApi.updateLibrarian(vars.id, { isActive: true })
          : adminApi.deactivateLibrarian(vars.id)
        : vars.isActive
          ? adminApi.updateAdmin(vars.id, { isActive: true })
          : adminApi.deactivateAdmin(vars.id),
    onSuccess: invalidate,
  });
  return { create, setActive };
}
