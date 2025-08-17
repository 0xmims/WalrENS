import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { AppError } from '../hooks/useErrorHandler'

interface ErrorToastProps {
  errors: AppError[]
  onRemove: (id: string) => void
}

interface ToastState {
  [key: string]: {
    isVisible: boolean
    isEntering: boolean
    isLeaving: boolean
  }
}

export default function ErrorToast({ errors, onRemove }: ErrorToastProps) {
  const [toastStates, setToastStates] = useState<ToastState>({})

  useEffect(() => {
    // Initialize state for new errors
    errors.forEach(error => {
      if (!toastStates[error.id]) {
        setToastStates(prev => ({
          ...prev,
          [error.id]: {
            isVisible: true,
            isEntering: true,
            isLeaving: false
          }
        }))
        
        // Remove entering state after animation
        setTimeout(() => {
          setToastStates(prev => ({
            ...prev,
            [error.id]: {
              ...prev[error.id],
              isEntering: false
            }
          }))
        }, 300)
      }
    })

    // Clean up removed errors
    Object.keys(toastStates).forEach(id => {
      if (!errors.find(e => e.id === id)) {
        setToastStates(prev => {
          const newState = { ...prev }
          delete newState[id]
          return newState
        })
      }
    })
  }, [errors, toastStates])

  const getIcon = (type: AppError['type']) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      case 'info':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />
    }
  }

  const getColorClasses = (type: AppError['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const handleRemove = (id: string) => {
    setToastStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isLeaving: true
      }
    }))
    
    setTimeout(() => {
      onRemove(id)
    }, 100)
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error) => {
        const state = toastStates[error.id]
        if (!state?.isVisible) return null

        const animationClasses = state.isEntering 
          ? 'transform translate-x-2 opacity-0 transition-all duration-300 ease-out'
          : state.isLeaving 
          ? 'transform translate-x-2 opacity-0 transition-all duration-100 ease-in'
          : 'transform translate-x-0 opacity-100 transition-all duration-300 ease-out'

        return (
          <div 
            key={error.id}
            className={`rounded-lg border p-4 shadow-lg ${getColorClasses(error.type)} ${animationClasses}`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {getIcon(error.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {error.message}
                </p>
                {error.details && (
                  <p className="mt-1 text-xs opacity-75">
                    {error.details}
                  </p>
                )}
                {error.action && (
                  <div className="mt-2">
                    <button
                      onClick={error.action.handler}
                      className="text-xs font-medium underline hover:no-underline"
                    >
                      {error.action.label}
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => handleRemove(error.id)}
                  className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}