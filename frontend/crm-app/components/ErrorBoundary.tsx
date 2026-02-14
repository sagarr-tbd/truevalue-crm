"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry, etc.)
    // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    //   reportError({ error, errorInfo });
    // }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-red-900">
                      Something went wrong
                    </h2>
                    <p className="text-sm text-red-700">
                      An unexpected error occurred
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  We apologize for the inconvenience. You can try refreshing the page
                  or returning to the dashboard.
                </p>

                {/* Error message preview */}
                {this.state.error && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 font-mono break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Page
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>

                {/* Expandable technical details */}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={this.toggleDetails}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {this.state.showDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      Technical Details
                    </button>
                    
                    {this.state.showDetails && (
                      <div className="mt-3 bg-gray-900 rounded-lg p-4 overflow-auto max-h-64">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                          {this.state.error?.stack}
                        </pre>
                        <pre className="text-xs text-gray-400 mt-4 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Minimal error boundary for specific sections
 * Shows a simpler error message that doesn't disrupt the whole page
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('SectionErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="h-8 w-8 text-amber-500 mb-3" />
          <p className="text-gray-600 text-sm mb-3">
            This section encountered an error
          </p>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
