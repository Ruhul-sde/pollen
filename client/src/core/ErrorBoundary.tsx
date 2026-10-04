import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 my-4 text-center rounded-2xl border border-neutral-800 bg-neutral-950/80 text-white backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold tracking-tight">
            {this.props.fallbackTitle || "Something went wrong"}
          </h3>
          <p className="mt-2 text-xs text-neutral-400 max-w-md">
            {this.props.fallbackMessage ||
              "An unexpected error occurred while rendering this component. Your data is safe."}
          </p>
          {this.state.error && import.meta.env.DEV && (
            <div className="mt-4 max-w-md w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left">
              <p className="text-[11px] font-semibold text-amber-300 break-words">
                {this.state.error.message}
              </p>
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition-colors"
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
