import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from "remotion";

const SCREENS = [
  { src: "/reel-frames/01-landing.png", label: "Tu pagina profesional" },
  { src: "/reel-frames/02-planes.png", label: "11 planes disponibles" },
  { src: "/reel-frames/06-plan-detail.png", label: "Detalle de cada plan" },
  { src: "/reel-frames/04-registro.png", label: "Registro en 1 minuto" },
  { src: "/reel-frames/05-manual.png", label: "Manual de uso incluido" },
];

const SCENE_DURATION = 75; // 2.5s per screen at 30fps
const TRANSITION = 15;

function PhoneMockup({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) {
  return (
    <div
      style={{
        width: 360 * scale,
        height: 740 * scale,
        borderRadius: 44 * scale,
        border: `${4 * scale}px solid #333`,
        background: "#1a1a1a",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,230,118,0.15), 0 0 0 1px rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 120 * scale, height: 26 * scale,
          background: "#1a1a1a",
          borderRadius: `0 0 ${16 * scale}px ${16 * scale}px`,
          zIndex: 10,
        }}
      />
      <div style={{ width: "100%", height: "100%", borderRadius: 40 * scale, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function ScreenScene({ src, label, index }: { src: string; label: string; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const labelOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const labelY = interpolate(frame, [20, 35], [30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#09090b", justifyContent: "center", alignItems: "center" }}>
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "20%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Phone */}
      <div style={{ transform: `scale(${phoneScale})`, marginBottom: 60 }}>
        <PhoneMockup>
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        </PhoneMockup>
      </div>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 0, right: 0,
          textAlign: "center",
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(0,230,118,0.15)",
            border: "2px solid rgba(0,230,118,0.3)",
            borderRadius: 50,
            padding: "14px 32px",
            fontSize: 28,
            fontWeight: 800,
            color: "#00e676",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {label}
        </div>
      </div>

      {/* Page indicator dots */}
      <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10 }}>
        {SCREENS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 28 : 10,
              height: 10,
              borderRadius: 5,
              background: i === index ? "#00e676" : "rgba(255,255,255,0.2)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}

function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const subOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#09090b",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, background: "radial-gradient(circle, rgba(0,230,118,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />

      <div style={{ textAlign: "center", transform: `scale(${titleScale})`, fontFamily: "Outfit, sans-serif" }}>
        <div style={{ fontSize: 90, fontWeight: 900, lineHeight: 0.95, letterSpacing: -3, color: "white" }}>
          TU PLAN
        </div>
        <div
          style={{
            fontSize: 90, fontWeight: 900, lineHeight: 0.95, letterSpacing: -3,
            background: "linear-gradient(135deg, #00e676, #00c853)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          COMPLETO
        </div>
        <div style={{ fontSize: 90, fontWeight: 900, lineHeight: 0.95, letterSpacing: -3, color: "white" }}>
          EN TU CELULAR
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 350, opacity: subOpacity, textAlign: "center", fontFamily: "Outfit, sans-serif" }}>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
          Entrenamiento + Nutricion personalizado
        </div>
      </div>
    </AbsoluteFill>
  );
}

function OutroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaScale = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 70 } });

  return (
    <AbsoluteFill style={{ background: "#09090b", justifyContent: "center", alignItems: "center", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.1, color: "white", marginBottom: 40, letterSpacing: -2 }}>
          EMPEZA TU<br />
          <span style={{ background: "linear-gradient(135deg, #00e676, #00c853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TRANSFORMACION
          </span>
        </div>

        <div
          style={{
            transform: `scale(${Math.max(0, ctaScale)})`,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(135deg, #00e676, #00c853)",
            color: "#09090b",
            fontSize: 36,
            fontWeight: 900,
            padding: "24px 56px",
            borderRadius: 20,
            letterSpacing: 1,
          }}
        >
          LINK EN BIO →
        </div>

        <div style={{ marginTop: 30, fontSize: 24, color: "rgba(255,255,255,0.4)" }}>
          pabloscarlattoentrenamientos.com
        </div>

        <div style={{ marginTop: 50, fontSize: 28, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
          @pabloscarlattoentrenamientos
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const AppDemoReel: React.FC = () => {
  const introDuration = 75; // 2.5s
  const outroDuration = 90; // 3s

  return (
    <AbsoluteFill>
      {/* Intro */}
      <Sequence from={0} durationInFrames={introDuration}>
        <IntroScene />
      </Sequence>

      {/* Screen demos */}
      {SCREENS.map((screen, i) => (
        <Sequence
          key={i}
          from={introDuration + i * SCENE_DURATION}
          durationInFrames={SCENE_DURATION}
        >
          <ScreenScene src={screen.src} label={screen.label} index={i} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={introDuration + SCREENS.length * SCENE_DURATION} durationInFrames={outroDuration}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
