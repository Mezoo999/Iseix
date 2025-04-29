'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-error/10 border border-error/30 rounded-lg text-center">
          <FaExclamationTriangle className="text-error text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-foreground-muted mb-4">
            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو الاتصال بالدعم إذا استمرت المشكلة.
          </p>
          <button
            className="px-4 py-2 bg-primary text-white rounded-lg flex items-center mx-auto"
            onClick={this.handleRetry}
          >
            <FaRedo className="ml-2" />
            إعادة المحاولة
          </button>
          {this.state.error && (
            <details className="mt-4 text-right">
              <summary className="cursor-pointer text-foreground-muted">تفاصيل الخطأ</summary>
              <pre className="mt-2 p-4 bg-background-light rounded-lg overflow-auto text-sm text-error">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
