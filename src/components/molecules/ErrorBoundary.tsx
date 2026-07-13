"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: string | null;
}

export class FatalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error, info: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, info: errorInfo.componentStack ?? null });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(13,11,20,0.97)",
            color: "#fff",
            padding: 20,
            fontFamily: "monospace",
            fontSize: 13,
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          <div
            style={{ color: "#A78BFA", fontWeight: "bold", marginBottom: 12 }}
          >
            ⚠ REACT ERROR
          </div>
          {this.state.error.message}
          {"\n\n"}
          {this.state.error.stack}
          {this.state.info && (
            <>
              {"\n\n--- component stack ---\n"}
              {this.state.info}
            </>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
