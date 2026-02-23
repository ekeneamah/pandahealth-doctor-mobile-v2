import apiClient from '@/src/lib/api-client';
import type { ApiResponse } from '@/src/types';

export interface PMVDetail {
  id: string;
  businessName: string;
  ownerName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  state?: string;
  lga?: string;
  licenseNumber?: string;
  registrationDate?: string;
  totalCases?: number;
  activeCases?: number;
}

function logPMV(action: string, data?: any) {
  console.log(`[PMV Service ${new Date().toISOString()}] ${action}:`, data);
}

class PMVService {
  /**
   * Get PMV details by ID
   */
  async getById(pmvId: string): Promise<PMVDetail> {
    logPMV('REQUEST: Get PMV by ID', { pmvId });
    const startTime = Date.now();

    try {
      const response = await apiClient.get<ApiResponse<PMVDetail>>(
        `/doctor/pmvs/${pmvId}`
      );

      const duration = Date.now() - startTime;
      logPMV('RESPONSE: Get PMV by ID', {
        pmvId,
        businessName: response.data.data.businessName,
        duration: `${duration}ms`,
      });

      return response.data.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logPMV('ERROR: Get PMV by ID', {
        pmvId,
        error: error.message,
        status: error.response?.status,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

const pmvService = new PMVService();
export default pmvService;
