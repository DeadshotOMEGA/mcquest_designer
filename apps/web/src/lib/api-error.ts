import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

/**
 * HTTP status codes mapped to error types
 */
const STATUS_CODES: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.VALIDATION_ERROR]: 400,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.RATE_LIMIT]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.BAD_REQUEST]: 400,
}

/**
 * Structured API error with code, message, and optional details
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get status(): number {
    return STATUS_CODES[this.code]
  }

  toJSON() {
    const result: { error: { code: string; message: string; details?: unknown } } = {
      error: {
        code: this.code,
        message: this.message,
      },
    }
    if (this.details) {
      result.error.details = this.details
    }
    return result
  }
}

/**
 * Handle any error and return a structured NextResponse
 *
 * @example
 * ```ts
 * try {
 *   // ... route logic
 * } catch (error) {
 *   return handleApiError(error)
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  // Known ApiError
  if (error instanceof ApiError) {
    console.error(`API Error [${error.code}]:`, error.message, error.details)
    return NextResponse.json(error.toJSON(), { status: error.status })
  }

  // Zod validation error - check using duck typing
  if (
    error &&
    typeof error === 'object' &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown }).issues)
  ) {
    const zodError = error as ZodError
    const details = zodError.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }))
    console.error('Validation Error:', details)
    return NextResponse.json(
      {
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details,
        },
      },
      { status: 400 }
    )
  }

  // Generic Error with message
  if (error instanceof Error) {
    // Check for common auth error patterns
    if (error.message.includes('Unauthorized') || error.message.includes('unauthenticated')) {
      console.error('Auth Error:', error.message)
      return NextResponse.json(
        {
          error: {
            code: ApiErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    console.error('Unexpected Error:', error.message, error.stack)
    return NextResponse.json(
      {
        error: {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }

  // Unknown error type
  console.error('Unknown Error:', error)
  return NextResponse.json(
    {
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    },
    { status: 500 }
  )
}

/**
 * Convenience factory functions for common errors
 */
export const ApiErrors = {
  unauthorized: (message = 'Authentication required') =>
    new ApiError(ApiErrorCode.UNAUTHORIZED, message),

  forbidden: (message = 'Access denied') => new ApiError(ApiErrorCode.FORBIDDEN, message),

  notFound: (resource: string) => new ApiError(ApiErrorCode.NOT_FOUND, `${resource} not found`),

  validation: (message: string, details?: unknown) =>
    new ApiError(ApiErrorCode.VALIDATION_ERROR, message, details),

  conflict: (message: string) => new ApiError(ApiErrorCode.CONFLICT, message),

  rateLimit: (message = 'Too many requests') => new ApiError(ApiErrorCode.RATE_LIMIT, message),

  internal: (message = 'Internal server error') =>
    new ApiError(ApiErrorCode.INTERNAL_ERROR, message),

  badRequest: (message: string) => new ApiError(ApiErrorCode.BAD_REQUEST, message),
}
