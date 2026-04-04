import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, OffthreadVideo } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

interface VideoClipProps {
  src: string;
  overlayText: string;
  subtitleText: string;
  startFrom?: number;
}

export const VideoClipScene: React.FC<VideoClipProps> = ({ src, overlayText, subtitleText, startFrom = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], { extrapolateRight: "clamp" });
  const textY = interpolate(frame, [0.3 * fps, 0.8 * fps], [40, 0], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [0.8 * fps, 1.3 * fps], [0, 1], { extrapolateRight: "clamp" });
  const borderOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });

  // Vignette pulse
  const vignetteIntensity = 0.6 + 0.05 * Math.sin(frame * 0.08);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Video background */}
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom * fps}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.55) contrast(1.15) saturate(0.85)",
        }}
      />

      {/* Green tint overlay */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(0,255,136,0.08) 0%, transparent 40%, transparent 60%, rgba(0,255,136,0.08) 100%)",
        }}
      />

      {/* Dark vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
        }}
      />

      {/* Top gradient for text readability */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Corner accents */}
      <div style={{
        position: "absolute", top: 50, left: 50,
        width: 50, height: 50,
        borderLeft: "3px solid rgba(0,255,136,0.4)",
        borderTop: "3px solid rgba(0,255,136,0.4)",
        opacity: borderOpacity,
      }} />
      <div style={{
        position: "absolute", bottom: 50, right: 50,
        width: 50, height: 50,
        borderRight: "3px solid rgba(0,255,136,0.4)",
        borderBottom: "3px solid rgba(0,255,136,0.4)",
        opacity: borderOpacity,
      }} />

      {/* Overlay text */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0 60px 200px",
          fontFamily,
        }}
      >
        <h2
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            color: "#fff",
            fontSize: 80,
            fontWeight: 900,
            textAlign: "center",
            textTransform: "uppercase",
            lineHeight: 1.1,
            textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)",
            margin: 0,
          }}
        >
          {overlayText}
        </h2>
        <p
          style={{
            opacity: subtitleOpacity,
            color: "#00FF88",
            fontSize: 38,
            fontWeight: 700,
            textAlign: "center",
            marginTop: 20,
            textShadow: "0 2px 15px rgba(0,0,0,0.9)",
          }}
        >
          {subtitleText}
        </p>
      </AbsoluteFill>

      {/* Thin green line at bottom */}
      <div style={{
        position: "absolute",
        bottom: 140,
        left: "50%",
        transform: "translateX(-50%)",
        width: interpolate(frame, [0.5 * fps, 1.2 * fps], [0, 500], { extrapolateRight: "clamp" }),
        height: 3,
        background: "linear-gradient(90deg, transparent, #00FF88, transparent)",
        boxShadow: "0 0 15px rgba(0,255,136,0.4)",
      }} />
    </AbsoluteFill>
  );
};
