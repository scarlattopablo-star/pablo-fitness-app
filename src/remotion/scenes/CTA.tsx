import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: "clamp" });
  const titleOpacity = interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = interpolate(frame, [0.3 * fps, 0.8 * fps], [0.8, 1], { extrapolateRight: "clamp" });
  const buttonOpacity = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], { extrapolateRight: "clamp" });
  const buttonScale = interpolate(frame, [0.8 * fps, 1.2 * fps], [0.5, 1], { extrapolateRight: "clamp" });
  const pulseScale = 1 + 0.04 * Math.sin(frame * 0.18);
  const infoOpacity = interpolate(frame, [1.2 * fps, 1.7 * fps], [0, 1], { extrapolateRight: "clamp" });
  const discountOpacity = interpolate(frame, [1.5 * fps, 2 * fps], [0, 1], { extrapolateRight: "clamp" });
  const discountScale = interpolate(frame, [1.5 * fps, 2 * fps], [0.5, 1], { extrapolateRight: "clamp" });

  // Floating particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: 80 + (i * 90) % 920,
    y: 200 + Math.sin(frame * 0.04 + i * 0.8) * 120 + i * 120,
    size: 3 + (i % 4) * 2,
    opacity: 0.06 + (i % 5) * 0.04,
  }));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #050505 0%, #001a0a 35%, #050505 100%)",
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x, top: p.y,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#00FF88", opacity: p.opacity,
        }} />
      ))}

      {/* Large glow */}
      <div style={{
        position: "absolute", width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 55%)",
        top: "35%", left: "50%", transform: "translate(-50%, -50%)",
      }} />

      {/* Logo */}
      <div style={{ opacity: logoOpacity, marginBottom: 30 }}>
        <Img
          src={staticFile("logo-pablo.jpg")}
          style={{
            width: 340,
            height: "auto",
            filter: "invert(1)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Main CTA */}
      <div style={{
        opacity: titleOpacity, transform: `scale(${titleScale})`,
        textAlign: "center", padding: "0 50px",
      }}>
        <h2 style={{
          color: "#fff", fontSize: 134, fontWeight: 900,
          lineHeight: 1.05, margin: 0, textTransform: "uppercase",
        }}>
          EMPEZA
          <br />
          <span style={{ color: "#00FF88", textShadow: "0 0 50px rgba(0,255,136,0.5)" }}>HOY</span>
        </h2>
        <p style={{
          color: "rgba(255,255,255,0.5)", fontSize: 40, fontWeight: 600, marginTop: 15,
        }}>
          Tu transformacion esta a un click
        </p>
      </div>

      {/* CTA Button */}
      <div style={{
        opacity: buttonOpacity,
        transform: `scale(${buttonScale * pulseScale})`,
        marginTop: 40,
        padding: "32px 90px",
        borderRadius: 60,
        background: "linear-gradient(135deg, #00FF88, #00CC6A)",
        boxShadow: "0 0 50px rgba(0,255,136,0.4), 0 8px 32px rgba(0,0,0,0.3)",
      }}>
        <span style={{ color: "#000", fontSize: 46, fontWeight: 900, letterSpacing: 3 }}>
          VER PLANES
        </span>
      </div>

      {/* Discount badge */}
      <div style={{
        opacity: discountOpacity, transform: `scale(${discountScale})`,
        marginTop: 25,
        padding: "16px 36px",
        borderRadius: 30,
        background: "rgba(255,107,107,0.15)",
        border: "1.5px solid rgba(255,107,107,0.3)",
      }}>
        <span style={{ color: "#FF6B6B", fontSize: 32, fontWeight: 700 }}>
          Hasta 50% OFF en planes anuales
        </span>
      </div>

      {/* URL and social */}
      <div style={{
        opacity: infoOpacity, textAlign: "center", marginTop: 45,
      }}>
        <p style={{
          color: "#00FF88", fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: 1,
        }}>
          pabloscarlattoentrenamientos.com
        </p>
        <p style={{
          color: "rgba(255,255,255,0.4)", fontSize: 32, fontWeight: 600, marginTop: 14,
        }}>
          IG: @pabloscarlattoentrenamientos
        </p>
      </div>

      {/* Bottom line */}
      <div style={{
        position: "absolute", bottom: 70, opacity: infoOpacity,
        display: "flex", gap: 24, alignItems: "center",
      }}>
        {["Resultados reales", "Ciencia aplicada", "100% online"].map((text, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <div style={{ width: 4, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />}
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 26, fontWeight: 600 }}>{text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
