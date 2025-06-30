/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Extracts a readable error message from any error type
 * @param error The caught error (of unknown type)
 * @param fallbackMessage Optional fallback message if error doesn't have a message
 * @returns A string error message
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return fallbackMessage;
}

/**
 * Creates a standardized error response object for node operations
 * @param error The caught error
 * @param processingTime Optional processing time to include
 * @param customFallbackMessage Optional custom fallback message
 * @returns A standardized error response object
 */
export function createErrorResponse(
  error: unknown, 
  processingTime?: number,
  customFallbackMessage = 'Operation failed'
): { error: string; processingTime?: number } {
  return {
    error: getErrorMessage(error, customFallbackMessage),
    ...(processingTime !== undefined ? { processingTime } : {})
  };
}
