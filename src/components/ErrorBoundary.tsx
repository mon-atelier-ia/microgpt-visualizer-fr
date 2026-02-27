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
        <div className="panel error-fallback">
          <h2 className="error-fallback__title">
            Oups, quelque chose s'est mal passé.
          </h2>
          <p className="error-fallback__desc">
            Une erreur inattendue est survenue dans cette page.
          </p>
          <button className="btn" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
