import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="panel"
          style={{ margin: 32, textAlign: "center", padding: 32 }}
        >
          <h2 style={{ color: "var(--red)", marginBottom: 12 }}>
            Oups, quelque chose s'est mal passé.
          </h2>
          <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
            Une erreur inattendue est survenue dans cette page.
          </p>
          <button
            className="btn"
            onClick={() => this.setState({ hasError: false })}
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
