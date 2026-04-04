import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = interpolate(frame, [0, 0.5 * fps], [0.7, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0.4 * fps, 1.2 * fps], [80, 0], { extrapolateRight: "clamp" });
  const titleOpacity = interpolate(frame, [0.4 * fps, 1 * fps], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [1 * fps, 1.6 * fps], [0, 1], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 700], { extrapolateRight: "clamp" });
  const badgeOpacity = interpolate(frame, [1.5 * fps, 2 * fps], [0, 1], { extrapolateRight: "clamp" });
  const badgeScale = interpolate(frame, [1.5 * fps, 2 * fps], [0.5, 1], { extrapolateRight: "clamp" });
  const bottomOpacity = interpolate(frame, [2 * fps, 2.5 * fps], [0, 1], { extrapolateRight: "clamp" });

  // Continuous glow pulse
  const glowScale = 1 + 0.08 * Math.sin(frame * 0.08);
  const glowScale2 = 1 + 0.06 * Math.sin(frame * 0.06 + 2);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #050505 0%, #0a1a0d 40%, #050505 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Animated glows */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 60%)",
        top: "25%", left: "50%",
        transform: `translate(-50%, -50%) scale(${glowScale})`,
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,106,0.08) 0%, transparent 60%)",
        top: "65%", left: "30%",
        transform: `scale(${glowScale2})`,
      }} />

      {/* Corner accents */}
      <div style={{ position: "absolute", top: 60, left: 60, width: 40, height: 40, borderLeft: "3px solid rgba(0,255,136,0.3)", borderTop: "3px solid rgba(0,255,136,0.3)", opacity: subtitleOpacity }} />
      <div style={{ position: "absolute", bottom: 60, right: 60, width: 40, height: 40, borderRight: "3px solid rgba(0,255,136,0.3)", borderBottom: "3px solid rgba(0,255,136,0.3)", opacity: subtitleOpacity }} />

      {/* Logo */}
      <div style={{
        position: "absolute", top: 100,
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
      }}>
        <Img
          src={staticFile("logo-pablo.jpg")}
          style={{
            width: 320,
            height: "auto",
            filter: "invert(1)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Main title */}
      <div style={{
        transform: `translateY(${titleY}px)`,
        opacity: titleOpacity,
        textAlign: "center",
        padding: "0 50px",
        marginTop: 80,
      }}>
        <h1 style={{
          fontSize: 160, fontWeight: 900, color: "#fff",
          lineHeight: 1.05, margin: 0, textTransform: "uppercase", letterSpacing: -3,
        }}>
          TRANSFORMA
          <br />
          <span style={{
            color: "#00FF88",
            textShadow: "0 0 40px rgba(0,255,136,0.4)",
          }}>TU CUERPO</span>
          <br />
          <span style={{ fontSize: 108, color: "rgba(255,255,255,0.6)" }}>Y TU VIDA</span>
        </h1>
      </div>

      {/* Animated green line */}
      <div style={{
        width: lineWidth, height: 5, marginTop: 30, borderRadius: 3,
        background: "linear-gradient(90deg, transparent, #00FF88, #00CC6A, transparent)",
        boxShadow: "0 0 20px rgba(0,255,136,0.3)",
      }} />

      {/* Subtitle */}
      <p style={{
        opacity: subtitleOpacity, fontSize: 48,
        color: "rgba(255,255,255,0.6)", textAlign: "center",
        marginTop: 35, padding: "0 80px", lineHeight: 1.5, fontWeight: 700,
      }}>
        Planes de entrenamiento y nutricion
        <br />
        diseñados <span style={{ color: "#00FF88" }}>exclusivamente para vos</span>
      </p>

      {/* Feature badges */}
      <div style={{
        display: "flex", gap: 16, marginTop: 45,
        opacity: badgeOpacity, transform: `scale(${badgeScale})`,
      }}>
        {["Entrenamiento", "Nutricion", "Progreso"].map((text, i) => (
          <div key={i} style={{
            padding: "18px 34px", borderRadius: 40,
            border: "1.5px solid rgba(0,255,136,0.25)",
            background: "rgba(0,255,136,0.06)",
          }}>
            <span style={{ color: "#00FF88", fontSize: 30, fontWeight: 700 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Bottom social proof */}
      <div style={{
        position: "absolute", bottom: 100, opacity: bottomOpacity,
        textAlign: "center",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 32, fontWeight: 600, margin: 0 }}>
          Resultados reales · Ciencia aplicada · 100% online
        </p>
      </div>
    </AbsoluteFill>
  );
};
