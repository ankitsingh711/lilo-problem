import axios from 'axios';
import { APIResponse, OptimizationResult, PriceComparisonResult, PriceComparisonRequest, CSVRow } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout. Please try again.');
    } else if (error.response?.status >= 500) {
      console.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export const csvApi = {
  /**
   * Upload and optimize CSV file
   */
  optimizeCSV: async (file: File): Promise<OptimizationResult[]> => {
    const formData = new FormData();
    formData.append('csvFile', file);

    const response = await api.post<APIResponse<OptimizationResult[]>>('/csv/optimize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'CSV optimization failed');
    }

    return response.data.data!;
  },

  /**
   * Optimize CSV data sent as JSON
   */
  optimizeCSVData: async (rows: CSVRow[]): Promise<OptimizationResult[]> => {
    const response = await api.post<APIResponse<OptimizationResult[]>>('/csv/optimize-data', { rows });

    if (!response.data.success) {
      throw new Error(response.data.error || 'CSV optimization failed');
    }

    return response.data.data!;
  },
};

export const priceApi = {
  /**
   * Compare prices across multiple sites
   */
  comparePrices: async (request: PriceComparisonRequest): Promise<PriceComparisonResult> => {
    const response = await api.post<APIResponse<PriceComparisonResult>>('/price/compare', request);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Price comparison failed');
    }

    return response.data.data!;
  },

  /**
   * Compare prices using GET request
   */
  comparePricesByItemNumber: async (itemNumber: string): Promise<PriceComparisonResult> => {
    const response = await api.get<APIResponse<PriceComparisonResult>>(`/price/compare/${encodeURIComponent(itemNumber)}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Price comparison failed');
    }

    return response.data.data!;
  },

  /**
   * Health check for price service
   */
  healthCheck: async (): Promise<void> => {
    await api.get('/price/health');
  },
};

export default api;
