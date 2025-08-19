import { ref } from 'vue'
import { useToast } from './useToast'
import { ApiError } from '../services/api'

export interface ErrorState {
  hasError: boolean
  message: string
  code?: string
  details?: any
}

export function useErrorHandler() {
  const { showError, showWarning } = useToast()
  const error = ref<ErrorState>({ hasError: false, message: '' })

  function clearError() {
    error.value = { hasError: false, message: '' }
  }

  function handleError(err: unknown, context?: string) {
    console.error('Error occurred:', err, context ? `Context: ${context}` : '')
    
    if (err instanceof ApiError) {
      const errorMessage = err.message || 'An API error occurred'
      const contextMessage = context ? `${context}: ${errorMessage}` : errorMessage
      
      error.value = {
        hasError: true,
        message: errorMessage,
        code: err.code,
        details: err.details
      }

      // Show different toast types based on error status
      if (err.status >= 500) {
        showError('Server Error', contextMessage, true) // Persistent for server errors
      } else if (err.status === 404) {
        showWarning('Not Found', contextMessage)
      } else if (err.status >= 400) {
        showError('Request Error', contextMessage)
      } else {
        showError('Network Error', contextMessage)
      }
    } else if (err instanceof Error) {
      const errorMessage = err.message || 'An unexpected error occurred'
      const contextMessage = context ? `${context}: ${errorMessage}` : errorMessage
      
      error.value = {
        hasError: true,
        message: errorMessage
      }
      
      showError('Error', contextMessage)
    } else {
      const errorMessage = 'An unknown error occurred'
      const contextMessage = context ? `${context}: ${errorMessage}` : errorMessage
      
      error.value = {
        hasError: true,
        message: errorMessage
      }
      
      showError('Unknown Error', contextMessage)
    }
  }

  function handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: string,
    onSuccess?: (result: T) => void,
    onError?: (error: unknown) => void
  ): Promise<T | null> {
    clearError()
    
    return operation()
      .then((result) => {
        if (onSuccess) {
          onSuccess(result)
        }
        return result
      })
      .catch((err) => {
        handleError(err, context)
        if (onError) {
          onError(err)
        }
        return null
      })
  }

  return {
    error: error.value,
    clearError,
    handleError,
    handleAsyncOperation
  }
}