import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

/** Évite une page blanche silencieuse si un acte plante au rendu. */
export default class AppErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;

  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Al-Rihla] render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#020100] px-6 text-center text-[#ead7a4]">
          <p className="font-serif text-lg tracking-wide">Le voyage a rencontré un obstacle.</p>
          <p className="max-w-md text-sm text-[#ead7a4]/65">
            Rechargez la page. Si le problème persiste, essayez un autre navigateur.
          </p>
          <button
            type="button"
            className="rounded-sm border border-[#c5a059]/45 px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-[#c5a059] transition-colors hover:border-[#c5a059]/70"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
