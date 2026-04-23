// Tracker minimo. Emite a GTM dataLayer y a GA4 gtag si estan cargados.
// En dev imprime por consola para poder verificar eventos.

export type TrackEventName =
  | "cta_hero_click"
  | "cta_oferta_click"
  | "cta_final_click"
  | "whatsapp_click"
  | "scroll_oferta"
  | "pain_points_view";

type GtagFn = (cmd: "event", evt: string, params?: Record<string, unknown>) => void;

export function trackEvent(event: TrackEventName, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: GtagFn };
  const payload = { event, ...(props ?? {}), ts: Date.now() };
  w.dataLayer?.push(payload);
  w.gtag?.("event", event, props ?? {});
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[track]", event, props ?? "");
  }
}
