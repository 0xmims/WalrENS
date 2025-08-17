import { useState, useCallback } from 'react'

export interface AppError {
  id: string
  message: string
  type: 'warning' | 'error' | 'info'
  timestamp: Date
  details?: string
  action?: {
    label: string
    handler: () => void
  }
}

export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([])

  const addError = useCallback((error: Omit<AppError, 'id' | 'timestamp'>) => {
    const newError: AppError = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    
    setErrors(prev => [newError, ...prev].slice(0, 10)) // Keep only last 10 errors
    
    // Auto-remove info messages after 5 seconds
    if (error.type === 'info') {
      setTimeout(() => {
        removeError(newError.id)
      }, 5000)
    }
    
    return newError.id
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Helper functions for common error types
  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`API Error in ${context}:`, error)
    
    let message = 'An unexpected error occurred'
    let details = error.message

    if (error.response) {
      // HTTP error response
      message = `Request failed: ${error.response.status}`
      details = error.response.data?.message || error.response.statusText
    } else if (error.request) {
      // Network error
      message = 'Network error - please check your connection'
      details = 'The request was made but no response was received'
    } else if (error.message) {
      // Other error
      message = error.message
    }

    return addError({
      message,
      type: 'error',
      details,
      action: {
        label: 'Retry',
        handler: () => window.location.reload()
      }
    })
  }, [addError])

  const handleValidationError = useCallback((field: string, message: string) => {
    return addError({
      message: `${field}: ${message}`,
      type: 'warning'
    })
  }, [addError])

  const handleSuccess = useCallback((message: string) => {
    return addError({
      message,
      type: 'info'
    })
  }, [addError])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    handleApiError,
    handleValidationError,
    handleSuccess
  }
}