import React, { ReactNode, ReactElement } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactElement;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <h2>Something went wrong</h2>
            <p className="error-message">{this.state.error.message}</p>
            <details className="error-details">
              <summary>Show stack trace</summary>
              <pre>{this.state.error.stack}</pre>
            </details>
            <button
              className="btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error) => ReactElement
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
