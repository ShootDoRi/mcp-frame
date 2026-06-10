import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

export interface FrameErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface FrameErrorBoundaryState {
  error?: Error;
}

export class FrameErrorBoundary extends Component<
  FrameErrorBoundaryProps,
  FrameErrorBoundaryState
> {
  state: FrameErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): FrameErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error);
      }

      return (
        this.props.fallback ?? (
          <div role="alert">Something went wrong in this MCP frame.</div>
        )
      );
    }

    return this.props.children;
  }
}
