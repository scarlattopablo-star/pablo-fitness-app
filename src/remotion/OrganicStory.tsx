import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, OffthreadVideo, staticFile, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

// Minimal text overlay — subtle, not salesy
const SubtleText: React.FC<{
  text: string;
  small?: string;
  delay?: number;
  position?: "top" | "bottom";
}> = ({ text, small, delay = 8, position = "bottom" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = interpolate(frame, [delay, delay + 12], [20, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      position: "absolute",
      left: 50, right: 50,
      ...(position === "top" ? { top: 160 } : { bottom: 200 }),
      opacity: op,
      transform: `translateY(${y}px)`,
      zIndex: 10,
    }}>
      <p style={{
        color: "#fff", fontSize: 52, fontWeight: 800, margin: 0, lineHeight: 1.2,
        textShadow: "0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)",
        fontFamily,
      }}>
        {text}
      </p>
      {small && (
        <p style={{
          color: "rgba(255,255,255,0.7)", fontSize: 30, fontWeight: 600, margin: "10px 0 0",
          textShadow: "0 2px 15px rgba(0,0,0,0.9)",
          fontFamily,
        }}>
          {small}
        </p>
      )}
    </div>
  );
};

// Small watermark — just the @ handle
const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [15, 25], [0, 0.7], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      position: "absolute", top: 80, left: 50, zIndex: 20, opacity: op,
    }}>
      <p style={{
        color: "rgba(255,255,255,0.8)", fontSize: 24, fontWeight: 700, margin: 0,
        textShadow: "0 1px 10px rgba(0,0,0,0.8)",
        fontFamily,
      }}>
        @pabloscarlattoentrenamientos
      </p>
    </div>
  );
};

export const OrganicStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily }}>

      {/* Clip 1: 0-5s — Training footage, just watermark */}
      <Sequence from={0} durationInFrames={150}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("sigma/clip1.mp4")}
            startFrom={0}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Watermark />
        </AbsoluteFill>
      </Sequence>

      {/* Clip 2: 5-9s — Training + subtle text */}
      <Sequence from={150} durationInFrames={120}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("sigma/clip2.mp4")}
            startFrom={0}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
          <Watermark />
          <SubtleText
            text="Cada repeticion cuenta"
            small="Entrenamiento personalizado"
            position="bottom"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Clip 3: 9-13s — More training */}
      <Sequence from={270} durationInFrames={120}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("sigma/clip3.mp4")}
            startFrom={0}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
          <Watermark />
          <SubtleText
            text="Tu plan. Tu ritmo."
            small="Nutricion + entrenamiento a medida"
            position="bottom"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Clip 4: 13-17s — Training */}
      <Sequence from={390} durationInFrames={120}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("sigma/clip4.mp4")}
            startFrom={0}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
          <Watermark />
          <SubtleText
            text="Resultados que se ven"
            small="Seguimiento de progreso en la app"
            position="bottom"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Clip 5: 17-21s — Last clip + soft CTA */}
      <Sequence from={510} durationInFrames={120}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("sigma/clip5.mp4")}
            startFrom={0}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <Watermark />
          <SubtleText
            text="Entrena conmigo"
            small="Primer mes gratis — link en bio"
            position="bottom"
          />
        </AbsoluteFill>
      </Sequence>

      {/* End card: 21-24s — Clean, minimal */}
      <Sequence from={630} durationInFrames={90}>
        <AbsoluteFill style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
          justifyContent: "center", alignItems: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ transform: `scale(${spring({ frame: frame - 630, fps, config: { damping: 12, stiffness: 60 }, delay: 3 })})` }}>
              <p style={{ color: "#CDFF00", fontSize: 34, fontWeight: 700, letterSpacing: 4, margin: "0 0 15px", textTransform: "uppercase", fontFamily }}>
                Pablo Scarlatto
              </p>
              <p style={{ color: "#fff", fontSize: 50, fontWeight: 900, margin: 0, fontFamily }}>
                Entrenamiento Personal
              </p>
              <div style={{
                width: interpolate(frame - 630, [10, 35], [0, 500], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
                height: 3, background: "linear-gradient(90deg, transparent, #CDFF00, transparent)",
                margin: "25px auto", borderRadius: 2,
              }} />
              <p style={{
                color: "rgba(255,255,255,0.5)", fontSize: 28, fontWeight: 600, margin: "20px 0 0", fontFamily,
                opacity: interpolate(frame - 630, [25, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
              }}>
                pabloscarlattoentrenamientos.com
              </p>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
