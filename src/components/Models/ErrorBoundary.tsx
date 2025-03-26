import React from 'react';
import { ModelErrorBoundaryProps, ModelErrorBoundaryState } from './types';

/**
 * Error boundary component for handling errors in React components
 * This component catches errors in its children and displays a fallback UI
 */
class ErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Display detailed information in the fallback
      return React.cloneElement(this.props.fallback, { 
        errorDetails: this.state.error ? this.state.error.message : 'Unknown error'
      });
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 