import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 0.8 * fps], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = interpolate(frame, [0, 0.8 * fps], [0.6, 1], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [0.5 * fps, 1.5 * fps], [0, 0.25], { extrapolateRight: "clamp" });
  const glowScale = 1 + 0.1 * Math.sin(frame * 0.06);

  // Fade out at the end
  const fadeOut = interpolate(frame, [2.5 * fps, 3 * fps], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #050505 0%, #0a1a0d 50%, #050505 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Background glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 55%)",
          opacity: glowOpacity,
          transform: `scale(${glowScale})`,
        }}
      />

      {/* Second subtle glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 60%)",
          opacity: glowOpacity * 0.6,
          transform: `scale(${1 + 0.08 * Math.sin(frame * 0.04 + 1)})`,
        }}
      />

      {/* Logo - large, centered, inverted to blend with dark bg */}
      <Img
        src={staticFile("logo-pablo.jpg")}
        style={{
          width: 550,
          height: "auto",
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          filter: "invert(1)",
          mixBlendMode: "screen",
        }}
      />

      {/* Subtle line under logo */}
      <div
        style={{
          width: interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 400], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          height: 3,
          background: "linear-gradient(90deg, transparent, #00FF88, transparent)",
          marginTop: 30,
          borderRadius: 2,
          boxShadow: "0 0 20px rgba(0,255,136,0.3)",
        }}
      />
    </AbsoluteFill>
  );
};
