import apiClient from '@/lib/api-client';
import type { 
  Case, 
  CaseStatus, 
  PaginatedResponse, 
  ApiResponse,
  SubmitDiagnosisRequest,
  DoctorDashboardStats,
  SLAMetrics
} from '@/types';

export interface GetCasesParams {
  page?: number;
  pageSize?: number;
  status?: CaseStatus;
  priority?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const caseService = {
  /**
   * Get all cases waiting for doctor review
   */
  async getPendingCases(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    params.append('status', 'AwaitingDoctor');

    const response = await apiClient.get<PaginatedResponse<Case>>(
      `/doctor/cases/pending?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get all cases assigned to the current doctor
   */
  async getMyCases(
    page: number = 1,
    pageSize: number = 10,
    status?: CaseStatus
  ): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (status) params.append('status', status);

    const response = await apiClient.get<PaginatedResponse<Case>>(
      `/doctor/cases/my-cases?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single case by ID with full details
   */
  async getById(id: string): Promise<ApiResponse<Case>> {
    const response = await apiClient.get<ApiResponse<Case>>(`/doctor/cases/${id}`);
    return response.data;
  },

  /**
   * Claim a case for review
   */
  async claimCase(caseId: string): Promise<ApiResponse<Case>> {
    const response = await apiClient.post<ApiResponse<Case>>(
      `/doctor/cases/${caseId}/claim`
    );
    return response.data;
  },

  /**
   * Submit diagnosis and prescription
   */
  async submitDiagnosis(request: SubmitDiagnosisRequest): Promise<ApiResponse<Case>> {
    const response = await apiClient.post<ApiResponse<Case>>(
      `/doctor/cases/${request.caseId}/diagnosis`,
      request
    );
    return response.data;
  },

  /**
   * Save draft diagnosis (auto-save)
   */
  async saveDraft(
    caseId: string,
    draft: Partial<SubmitDiagnosisRequest>
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.patch<ApiResponse<void>>(
      `/doctor/cases/${caseId}/draft`,
      draft
    );
    return response.data;
  },

  /**
   * Get doctor dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DoctorDashboardStats>> {
    const response = await apiClient.get<ApiResponse<DoctorDashboardStats>>(
      '/doctor/dashboard/stats'
    );
    return response.data;
  },

  /**
   * Get SLA metrics for the doctor
   */
  async getSLAMetrics(): Promise<ApiResponse<SLAMetrics>> {
    const response = await apiClient.get<ApiResponse<SLAMetrics>>(
      '/doctor/dashboard/sla-metrics'
    );
    return response.data;
  },

  /**
   * Get case history/completed cases
   */
  async getCaseHistory(
    page: number = 1,
    pageSize: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<PaginatedResponse<Case>>(
      `/doctor/cases/history?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Release a claimed case back to the queue
   */
  async releaseCase(caseId: string): Promise<ApiResponse<Case>> {
    const response = await apiClient.post<ApiResponse<Case>>(
      `/doctor/cases/${caseId}/release`
    );
    return response.data;
  },
};

export default caseService;
