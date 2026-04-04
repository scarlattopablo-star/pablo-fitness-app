import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

const macroItems = [
  { label: "Proteinas", value: "150g", color: "#FF6B6B", icon: "🥩" },
  { label: "Carbohidratos", value: "220g", color: "#4ECDC4", icon: "🍚" },
  { label: "Grasas", value: "70g", color: "#FFE66D", icon: "🥑" },
  { label: "Calorias", value: "2,100", color: "#00FF88", icon: "🔥" },
];

export const NutritionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #050505 0%, #081208 50%, #050505 100%)",
        fontFamily,
        padding: "0 55px",
        justifyContent: "center",
      }}
    >
      {/* Green accent glow */}
      <div style={{
        position: "absolute",
        width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 60%)",
        bottom: "15%", right: "-15%",
      }} />

      <div style={{ opacity: titleOpacity, marginBottom: 45 }}>
        <p style={{ color: "#00FF88", fontSize: 35, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 5 }}>
          Nutricion inteligente
        </p>
        <h2 style={{ color: "#fff", fontSize: 88, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
          Tus macros
          <br />
          <span style={{ color: "#00FF88", textShadow: "0 0 30px rgba(0,255,136,0.3)" }}>calculados por ciencia</span>
        </h2>
      </div>

      {/* Macro cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 35 }}>
        {macroItems.map((m, i) => {
          const delay = 0.4 + i * 0.2;
          const scale = interpolate(frame, [delay * fps, (delay + 0.35) * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const rotate = interpolate(frame, [delay * fps, (delay + 0.35) * fps], [-10, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                width: "calc(50% - 9px)",
                padding: "34px 24px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${m.color}22`,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 48 }}>{m.icon}</span>
              <p style={{ color: m.color, fontSize: 58, fontWeight: 900, margin: "8px 0 0" }}>{m.value}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 26, margin: "6px 0 0", fontWeight: 600 }}>{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Benefits */}
      {[
        { text: "Comidas reales con porciones en gramos", icon: "🍽️" },
        { text: "Horarios adaptados a tu dia", icon: "⏰" },
        { text: "Swap de alimentos sin alterar macros", icon: "🔄" },
        { text: "Restricciones alimentarias incluidas", icon: "✅" },
      ].map((item, i) => {
        const delay = 1.2 + i * 0.2;
        const opacity = interpolate(frame, [delay * fps, (delay + 0.3) * fps], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
        const x = interpolate(frame, [delay * fps, (delay + 0.3) * fps], [50, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
        return (
          <div key={i} style={{ opacity, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 34, margin: 0, fontWeight: 600 }}>{item.text}</p>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
