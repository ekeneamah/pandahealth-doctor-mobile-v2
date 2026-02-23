import apiClient from '@/src/lib/api-client';
import type {
    ApiResponse,
    Case,
    CaseStatus,
    DoctorDashboardStats,
    SLAMetrics,
    SubmitDiagnosisRequest,
} from '@/src/types';

const logCase = (action: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[CaseService ${timestamp}] ${action}:`, JSON.stringify(data, null, 2));
};

export interface GetCasesParams {
  page?: number;
  pageSize?: number;
  status?: CaseStatus;
  priority?: string;
  searchTerm?: string;
}

export interface PaginatedCaseResponse {
  data: Case[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const caseService = {
  async getPendingCases(page: number = 1, pageSize: number = 10, priority?: string): Promise<ApiResponse<PaginatedCaseResponse>> {
    try {
      logCase('GET_PENDING_CASES_START', { page, pageSize, priority });
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (priority) params.append('priority', priority);
      
      const response = await apiClient.get<ApiResponse<PaginatedCaseResponse>>(`/doctor/cases/pending?${params}`);
      
      logCase('GET_PENDING_CASES_SUCCESS', {
        total: response.data.data?.total,
        count: response.data.data?.data?.length,
        page: response.data.data?.page,
        totalPages: response.data.data?.totalPages,
      });

      return response.data;
    } catch (error) {
      logCase('GET_PENDING_CASES_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async getMyCases(page: number = 1, pageSize: number = 10, status?: CaseStatus): Promise<ApiResponse<PaginatedCaseResponse>> {
    try {
      logCase('GET_MY_CASES_START', { page, pageSize, status });

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (status) params.append('status', status);
      
      const response = await apiClient.get<ApiResponse<PaginatedCaseResponse>>(`/doctor/cases/my-cases?${params}`);
      
      logCase('GET_MY_CASES_SUCCESS', {
        total: response.data.data?.total,
        count: response.data.data?.data?.length,
        page: response.data.data?.page,
      });

      return response.data;
    } catch (error) {
      logCase('GET_MY_CASES_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async getById(id: string): Promise<ApiResponse<Case>> {
    try {
      logCase('GET_CASE_BY_ID_START', { caseId: id });

      const response = await apiClient.get<ApiResponse<Case>>(`/doctor/cases/${id}`);
      
      logCase('GET_CASE_BY_ID_SUCCESS', {
        caseId: id,
        caseNumber: response.data.data?.caseNumber,
        status: response.data.data?.status,
        priority: response.data.data?.priority,
      });

      return response.data;
    } catch (error) {
      logCase('GET_CASE_BY_ID_ERROR', {
        caseId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async claimCase(caseId: string): Promise<ApiResponse<Case>> {
    try {
      logCase('CLAIM_CASE_START', { caseId });

      const response = await apiClient.post<ApiResponse<Case>>(`/doctor/cases/${caseId}/claim`);
      
      logCase('CLAIM_CASE_SUCCESS', {
        caseId,
        caseNumber: response.data.data?.caseNumber,
        status: response.data.data?.status,
      });

      return response.data;
    } catch (error) {
      logCase('CLAIM_CASE_ERROR', {
        caseId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async submitDiagnosis(caseId: string, request: SubmitDiagnosisRequest): Promise<ApiResponse<Case>> {
    try {
      logCase('SUBMIT_DIAGNOSIS_START', {
        caseId,
        hasDiagnosis: !!request.diagnosis,
        hasDoctorAdvice: !!request.doctorAdvice,
        prescriptionCount: request.prescriptions?.length || 0,
        prescriptions: request.prescriptions?.map(p => ({
          drugName: p.drugName,
          dosage: p.dosage,
          frequency: p.frequency,
          durationDays: p.durationDays,
        })),
      });

      const response = await apiClient.post<ApiResponse<Case>>(
        `/doctor/cases/${caseId}/diagnosis`,
        request
      );
      
      logCase('SUBMIT_DIAGNOSIS_SUCCESS', {
        caseId,
        caseNumber: response.data.data?.caseNumber,
        status: response.data.data?.status,
        type: response.data.data?.type,
      });

      return response.data;
    } catch (error) {
      logCase('SUBMIT_DIAGNOSIS_ERROR', {
        caseId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async getStats(): Promise<ApiResponse<DoctorDashboardStats>> {
    try {
      logCase('GET_STATS_START', {});

      const response = await apiClient.get<ApiResponse<DoctorDashboardStats>>('/doctor/dashboard/stats');
      
      logCase('GET_STATS_SUCCESS', {
        stats: response.data.data,
      });

      return response.data;
    } catch (error) {
      logCase('GET_STATS_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async getSLAMetrics(): Promise<ApiResponse<SLAMetrics>> {
    try {
      logCase('GET_SLA_METRICS_START', {});

      const response = await apiClient.get<ApiResponse<SLAMetrics>>('/doctor/dashboard/sla-metrics');
      
      logCase('GET_SLA_METRICS_SUCCESS', {
        metrics: response.data.data,
      });

      return response.data;
    } catch (error) {
      logCase('GET_SLA_METRICS_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async getCompletedCases(page: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedCaseResponse>> {
    try {
      logCase('GET_COMPLETED_CASES_START', { page, pageSize });

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await apiClient.get<ApiResponse<PaginatedCaseResponse>>(`/doctor/cases/history?${params}`);
      
      logCase('GET_COMPLETED_CASES_SUCCESS', {
        total: response.data.data?.total,
        count: response.data.data?.data?.length,
        page: response.data.data?.page,
      });

      return response.data;
    } catch (error) {
      logCase('GET_COMPLETED_CASES_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};

export default caseService;
