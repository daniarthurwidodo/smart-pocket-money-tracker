export interface Pocket {
  id: number;
  name: string;
  balance: number;
  currency: string;
  description: string | null;
  date: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePocketInput {
  name: string;
  balance?: number;
  currency?: string;
  description?: string;
  date?: string | Date;
  isActive?: boolean;
}

export interface UpdatePocketInput {
  name?: string;
  balance?: number;
  currency?: string;
  description?: string;
  date?: string | Date;
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

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  total: number;
}
