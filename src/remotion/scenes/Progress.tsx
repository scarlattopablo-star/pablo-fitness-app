import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

export const ProgressScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });

  // Animated weight counter
  const weightValue = interpolate(frame, [0.5 * fps, 1.5 * fps], [85.0, 72.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Progress bar
  const barWidth = interpolate(frame, [0.8 * fps, 1.8 * fps], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
        fontFamily,
        padding: "0 60px",
        justifyContent: "center",
      }}
    >
      <div style={{ opacity: titleOpacity, marginBottom: 50 }}>
        <p style={{ color: "#00FF88", fontSize: 38, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 4 }}>
          Segui tu progreso
        </p>
        <h2 style={{ color: "#fff", fontSize: 92, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
          Resultados
          <br />
          <span style={{ color: "#00FF88" }}>en tiempo real</span>
        </h2>
      </div>

      {/* Weight card */}
      <div style={{
        padding: "48px",
        borderRadius: 28,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(0,255,136,0.2)",
        marginBottom: 30,
        textAlign: "center",
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 32, margin: 0, fontWeight: 600 }}>Peso actual</p>
        <p style={{ color: "#fff", fontSize: 128, fontWeight: 900, margin: "10px 0 0" }}>
          {weightValue.toFixed(1)}
          <span style={{ fontSize: 48, color: "rgba(255,255,255,0.5)" }}> kg</span>
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ color: "#00FF88", fontSize: 40, fontWeight: 700 }}>-12.5 kg</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 30 }}>en 3 meses</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        padding: "36px 42px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(0,255,136,0.1)",
        marginBottom: 30,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ color: "#fff", fontSize: 32, fontWeight: 700 }}>Progreso del plan</span>
          <span style={{ color: "#00FF88", fontSize: 32, fontWeight: 700 }}>{Math.round(barWidth)}%</span>
        </div>
        <div style={{ width: "100%", height: 20, borderRadius: 10, background: "rgba(255,255,255,0.1)" }}>
          <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 10, background: "linear-gradient(90deg, #00FF88, #00CC6A)" }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: "Cintura", value: "-8cm", icon: "📏" },
          { label: "Fuerza", value: "+40%", icon: "💪" },
          { label: "Energia", value: "+100%", icon: "⚡" },
        ].map((stat, i) => {
          const delay = 1 + i * 0.2;
          const opacity = interpolate(frame, [delay * fps, (delay + 0.3) * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{
              opacity,
              flex: 1,
              padding: "28px 20px",
              borderRadius: 16,
              background: "rgba(0,255,136,0.05)",
              border: "1px solid rgba(0,255,136,0.1)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 48, margin: 0 }}>{stat.icon}</p>
              <p style={{ color: "#00FF88", fontSize: 42, fontWeight: 900, margin: "8px 0 0" }}>{stat.value}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 24, margin: "4px 0 0", fontWeight: 600 }}>{stat.label}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
