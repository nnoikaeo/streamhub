/**
 * Error Message Mapper
 * Converts technical errors to user-friendly messages
 */

export interface ErrorInfo {
  title: string
  message: string
  showRequestAccess: boolean
}

export const mapErrorMessage = (error: any): ErrorInfo => {
  const errorMessage = error?.message || ''

  // User not found in system
  if (errorMessage.includes('not found in system')) {
    return {
      title: 'Account Not Found',
      message:
        'Your account has not been set up in the system yet. Please contact your administrator to request access.',
      showRequestAccess: true
    }
  }

  // Firebase auth errors
  if (errorMessage.includes('cancelled')) {
    return {
      title: 'Sign In Cancelled',
      message: 'You cancelled the sign-in process. Please try again.',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('popup-closed-by-user')) {
    return {
      title: 'Sign In Cancelled',
      message: 'The sign-in window was closed. Please try again.',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('popup-blocked')) {
    return {
      title: 'Sign In Blocked',
      message: 'Your browser blocked the sign-in popup. Please allow popups and try again.',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('network')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('permission')) {
    return {
      title: 'Permission Denied',
      message:
        'You do not have permission to access this system. Please contact your administrator.',
      showRequestAccess: true
    }
  }

  // Default error
  return {
    title: 'Sign In Failed',
    message: 'An unexpected error occurred. Please try again or contact support.',
    showRequestAccess: true
  }
}

export const getDefaultErrorMessage = (): ErrorInfo => {
  return {
    title: 'Error',
    message: 'An error occurred. Please try again.',
    showRequestAccess: false
  }
}
