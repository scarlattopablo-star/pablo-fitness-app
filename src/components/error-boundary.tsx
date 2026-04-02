"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-danger" />
            </div>
            <h2 className="text-lg font-bold mb-2">Algo salio mal</h2>
            <p className="text-sm text-muted mb-4">
              Ocurrio un error inesperado. Recarga la pagina para continuar.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 gradient-primary text-black font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" /> Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
