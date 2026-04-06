"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error?.message || "unknown" };
  }

  render() {
    if (this.state.hasError) {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const isInAppBrowser = typeof navigator !== "undefined" &&
        /WhatsApp|Instagram|FBAN|FBAV|Line|wv/i.test(navigator.userAgent);

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-danger" />
            </div>
            {isInAppBrowser ? (
              <>
                <h2 className="text-lg font-bold mb-2">Abri en tu navegador</h2>
                <p className="text-sm text-muted mb-4">
                  Este link no funciona desde WhatsApp. Toca los 3 puntos (⋮) arriba a la derecha y selecciona &quot;Abrir en Chrome&quot; o copia el link y pegalo en tu navegador.
                </p>
                <button
                  onClick={() => {
                    try { navigator.clipboard.writeText(url); } catch {}
                  }}
                  className="inline-flex items-center gap-2 gradient-primary text-black font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity mb-3 w-full justify-center"
                >
                  Copiar link
                </button>
                <a
                  href={`intent:${url}#Intent;end`}
                  className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                >
                  Abrir en Chrome
                </a>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-2">Algo salio mal</h2>
                <p className="text-sm text-muted mb-4">
                  Ocurrio un error inesperado. Recarga la pagina para continuar.
                </p>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, errorMsg: "" });
                    window.location.reload();
                  }}
                  className="inline-flex items-center gap-2 gradient-primary text-black font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="h-4 w-4" /> Recargar
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
