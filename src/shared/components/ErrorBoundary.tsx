import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 m-4 rounded-2xl border border-red-500/30 bg-red-950/20 text-center backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-red-200 mb-1">
            {this.props.fallbackTitle || 'Component Rendering Error'}
          </h3>
          <p className="text-xs text-red-300/80 mb-4 max-w-sm">
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected error occurred while rendering this module.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-red-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
