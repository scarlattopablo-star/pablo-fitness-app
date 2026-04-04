import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

export const AppScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });
  const phoneY = interpolate(frame, [0.3 * fps, 1 * fps], [200, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const phoneOpacity = interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d1a0d 100%)",
        fontFamily,
        padding: "0 60px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ opacity: titleOpacity, textAlign: "center", marginBottom: 50 }}>
        <p style={{ color: "#00FF88", fontSize: 38, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 4 }}>
          App en tu celular
        </p>
        <h2 style={{ color: "#fff", fontSize: 86, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
          Tu entrenador
          <br />
          <span style={{ color: "#00FF88" }}>24/7</span>
        </h2>
      </div>

      {/* Phone mockup */}
      <div style={{
        opacity: phoneOpacity,
        transform: `translateY(${phoneY}px)`,
        width: 380,
        height: 750,
        borderRadius: 40,
        border: "4px solid rgba(255,255,255,0.2)",
        background: "#111",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Phone notch */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 160,
          height: 30,
          borderRadius: "0 0 20px 20px",
          background: "#000",
          zIndex: 2,
        }} />

        {/* App screen content */}
        <div style={{ padding: "50px 24px 24px", height: "100%", background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)" }}>
          {/* App header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #00FF88, #00CC6A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 900, color: "#000",
            }}>PS</div>
            <div>
              <p style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>Hola, Maria!</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, margin: 0 }}>Tu plan esta listo</p>
            </div>
          </div>

          {/* Dashboard cards */}
          {[
            { icon: "🏋️", title: "Entrenamiento", sub: "Dia 1 - Upper Body", color: "#00FF88" },
            { icon: "🥗", title: "Nutricion", sub: "2,100 kcal · 6 comidas", color: "#4ECDC4" },
            { icon: "📊", title: "Progreso", sub: "-5.2 kg este mes", color: "#FFE66D" },
          ].map((card, i) => {
            const delay = 0.8 + i * 0.3;
            const cardOpacity = interpolate(frame, [delay * fps, (delay + 0.3) * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            return (
              <div key={i} style={{
                opacity: cardOpacity,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "22px 20px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 38 }}>{card.icon}</span>
                <div>
                  <p style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>{card.title}</p>
                  <p style={{ color: card.color, fontSize: 17, margin: "2px 0 0", fontWeight: 600 }}>{card.sub}</p>
                </div>
              </div>
            );
          })}

          {/* Bottom bar */}
          <div style={{
            position: "absolute",
            bottom: 20,
            left: 24,
            right: 24,
            display: "flex",
            justifyContent: "space-around",
            padding: "14px 0",
            borderRadius: 20,
            background: "rgba(255,255,255,0.05)",
          }}>
            {["🏠", "📋", "📊", "👤"].map((icon, i) => (
              <span key={i} style={{ fontSize: 32, opacity: i === 0 ? 1 : 0.4 }}>{icon}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Features below phone */}
      <div style={{
        display: "flex",
        gap: 30,
        marginTop: 40,
        opacity: interpolate(frame, [1.5 * fps, 2 * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        {["Offline", "PWA", "Gratis"].map((text) => (
          <div key={text} style={{
            padding: "12px 28px",
            borderRadius: 30,
            border: "1px solid rgba(0,255,136,0.3)",
            background: "rgba(0,255,136,0.05)",
          }}>
            <span style={{ color: "#00FF88", fontSize: 30, fontWeight: 700 }}>{text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
