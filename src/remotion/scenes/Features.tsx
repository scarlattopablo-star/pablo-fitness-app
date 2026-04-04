import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

const features = [
  { icon: "🔥", title: "Quema Grasa", desc: "Deficit inteligente calculado", highlight: "-20% grasa corporal" },
  { icon: "💪", title: "Ganancia Muscular", desc: "Superavit controlado", highlight: "+15% masa muscular" },
  { icon: "⚡", title: "Tonificacion", desc: "Define cada musculo", highlight: "Resultados en 8 semanas" },
  { icon: "🏋️", title: "Fuerza Funcional", desc: "Rendimiento real", highlight: "+40% fuerza" },
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 0.5 * fps], [40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #050505 0%, #0a0a0a 100%)",
        fontFamily,
        padding: "0 55px",
        justifyContent: "center",
      }}
    >
      {/* Accent glow */}
      <div style={{
        position: "absolute", width: 350, height: 350, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 60%)",
        top: "15%", right: "-5%",
      }} />

      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 50 }}>
        <p style={{ color: "#00FF88", fontSize: 35, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 5 }}>
          Elegi tu objetivo
        </p>
        <h2 style={{ color: "#fff", fontSize: 96, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
          Un plan hecho
          <br />
          <span style={{ color: "#00FF88", textShadow: "0 0 30px rgba(0,255,136,0.3)" }}>para vos</span>
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {features.map((f, i) => {
          const delay = 0.5 + i * 0.3;
          const cardOpacity = interpolate(frame, [delay * fps, (delay + 0.4) * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const cardX = interpolate(frame, [delay * fps, (delay + 0.4) * fps], [120, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `translateX(${cardX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "28px 36px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,255,136,0.12)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: 58, flexShrink: 0 }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontSize: 40, fontWeight: 700, margin: 0 }}>{f.title}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 26, margin: "4px 0 0", fontWeight: 600 }}>{f.desc}</p>
              </div>
              <div style={{
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(0,255,136,0.1)",
              }}>
                <span style={{ color: "#00FF88", fontSize: 24, fontWeight: 700 }}>{f.highlight}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "flex", gap: 30, marginTop: 45, justifyContent: "center",
        opacity: interpolate(frame, [2.2 * fps, 2.8 * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#00FF88", fontSize: 56, fontWeight: 900, margin: 0 }}>75+</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 24, margin: "4px 0 0", fontWeight: 600 }}>Ejercicios</p>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#00FF88", fontSize: 56, fontWeight: 900, margin: 0 }}>3-6</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 24, margin: "4px 0 0", fontWeight: 600 }}>Dias/semana</p>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#00FF88", fontSize: 56, fontWeight: 900, margin: 0 }}>GIFs</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 24, margin: "4px 0 0", fontWeight: 600 }}>Animados</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
