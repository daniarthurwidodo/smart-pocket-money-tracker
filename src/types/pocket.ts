export interface Pocket {
  id: number;
  name: string | null;
  balance: number;
  currency: string;
  description: string | null;
  targetDate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePocketInput {
  name?: string | null;
  balance?: number;
  currency?: string;
  description?: string | null;
  targetDate?: string | null;
  isActive?: boolean;
}

export interface UpdatePocketInput {
  name?: string | null;
  balance?: number;
  currency?: string;
  description?: string | null;
  targetDate?: string | null;
  isActive?: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiListSuccessResponse<T> {
  success: true;
  data: T[];
  total: number;
}

export type ApiListResponse<T> = ApiListSuccessResponse<T> | ApiErrorResponse;
