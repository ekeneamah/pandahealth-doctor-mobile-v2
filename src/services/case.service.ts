import apiClient from '@/src/lib/api-client';
import type {
    ApiResponse,
    Case,
    CaseStatus,
    DoctorDashboardStats,
    PaginatedResponse,
    SLAMetrics,
    SubmitDiagnosisRequest,
} from '@/src/types';

export interface GetCasesParams {
  page?: number;
  pageSize?: number;
  status?: CaseStatus;
  priority?: string;
  searchTerm?: string;
}

export const caseService = {
  async getPendingCases(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      status: 'AwaitingDoctor',
    });
    const response = await apiClient.get<PaginatedResponse<Case>>(`/doctor/cases/pending?${params}`);
    return response.data;
  },

  async getMyCases(page: number = 1, pageSize: number = 10, status?: CaseStatus): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (status) params.append('status', status);
    const response = await apiClient.get<PaginatedResponse<Case>>(`/doctor/cases/my-cases?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Case>> {
    const response = await apiClient.get<ApiResponse<Case>>(`/doctor/cases/${id}`);
    return response.data;
  },

  async claimCase(caseId: string): Promise<ApiResponse<Case>> {
    const response = await apiClient.post<ApiResponse<Case>>(`/doctor/cases/${caseId}/claim`);
    return response.data;
  },

  async submitDiagnosis(request: SubmitDiagnosisRequest): Promise<ApiResponse<Case>> {
    const response = await apiClient.post<ApiResponse<Case>>(
      `/doctor/cases/${request.caseId}/diagnosis`,
      request
    );
    return response.data;
  },

  async getStats(): Promise<ApiResponse<DoctorDashboardStats>> {
    const response = await apiClient.get<ApiResponse<DoctorDashboardStats>>('/doctor/dashboard/stats');
    return response.data;
  },

  async getSLAMetrics(): Promise<ApiResponse<SLAMetrics>> {
    const response = await apiClient.get<ApiResponse<SLAMetrics>>('/doctor/dashboard/sla-metrics');
    return response.data;
  },

  async getCompletedCases(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      status: 'Completed',
    });
    const response = await apiClient.get<PaginatedResponse<Case>>(`/doctor/cases/history?${params}`);
    return response.data;
  },
};

export default caseService;
