import { NextResponse } from 'next/server';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  total?: number;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export type ApiListResponse<T> = { success: true; data: T[]; total: number } | ApiErrorResponse;

interface ErrorResponseOptions {
  status?: number;
  details?: Record<string, string[]>;
}

interface SuccessResponseOptions {
  status?: number;
  message?: string;
  total?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(
  data: T,
  options: SuccessResponseOptions = {}
): NextResponse<ApiSuccessResponse<T>> {
  const {
    status = 200,
    message,
    total,
    metadata,
  } = options;

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) response.message = message;
  if (total !== undefined) response.total = total;
  if (metadata) Object.assign(response, metadata);

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  error: string,
  options: ErrorResponseOptions = {}
): NextResponse<ApiErrorResponse> {
  const { status = 400, details } = options;

  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (details) response.details = details;

  return NextResponse.json(response, { status });
}

/**
 * Creates a validation error response (422)
 */
export function validationError(
  fieldErrors: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return errorResponse('Validation failed', {
    status: 422,
    details: fieldErrors,
  });
}

/**
 * Creates a not found error response (404)
 */
export function notFoundResponse(message: string = 'Resource not found'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, { status: 404 });
}

/**
 * Creates an unauthorized error response (401)
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, { status: 401 });
}

/**
 * Creates a server error response (500)
 */
export function serverErrorResponse(message: string = 'Internal server error'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, { status: 500 });
}

/**
 * Creates a bad request response (400)
 */
export function badRequestResponse(message: string = 'Bad request'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, { status: 400 });
}

/**
 * Wraps an async handler with standardized error handling
 */
export function withErrorHandler(
  handler: () => Promise<NextResponse>,
  errorMessage: string = 'An unexpected error occurred'
): Promise<NextResponse> {
  return handler().catch((error) => {
    console.error(`${errorMessage}:`, error);
    return serverErrorResponse(errorMessage);
  });
}
