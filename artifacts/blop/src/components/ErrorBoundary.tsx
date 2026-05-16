import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Blop render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-background">
          <div className="w-14 h-14 rounded-[18px] bg-destructive/10 flex items-center justify-center mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[18px] font-bold text-foreground mb-2">Something went wrong</p>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            The app encountered an unexpected error.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.href = "/";
            }}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold"
          >
            Restart app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
