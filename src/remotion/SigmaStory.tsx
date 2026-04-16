import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, OffthreadVideo, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800", "900"],
  subsets: ["latin"],
});

// Overlay text with animation
const AnimatedText: React.FC<{
  text: string;
  subtitle?: string;
  delay?: number;
  color?: string;
  size?: number;
  position?: "top" | "center" | "bottom";
}> = ({ text, subtitle, delay = 0, color = "#CDFF00", size = 72, position = "center" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, delay });
  const subtitleOp = interpolate(frame, [delay + 15, delay + 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const posStyle = position === "top" ? { top: 180 } : position === "bottom" ? { bottom: 250 } : { top: "50%", transform: `translateY(-50%) scale(${scale})` };

  return (
    <div style={{
      position: "absolute", left: 0, right: 0,
      textAlign: "center", padding: "0 50px", zIndex: 10,
      ...posStyle,
      ...(position !== "center" ? { transform: `scale(${scale})` } : {}),
    }}>
      {/* Text shadow backdrop */}
      <div style={{
        position: "absolute", inset: -40, borderRadius: 30,
        background: "radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 70%)",
        zIndex: -1,
      }} />
      <h2 style={{
        color, fontSize: size, fontWeight: 900, margin: 0, lineHeight: 1.1,
        textShadow: `0 0 40px ${color}66, 0 4px 20px rgba(0,0,0,0.8)`,
        fontFamily,
      }}>
        {text}
      </h2>
      {subtitle && (
        <p style={{
          color: "#fff", fontSize: size * 0.45, fontWeight: 700, margin: "12px 0 0",
          opacity: subtitleOp,
          textShadow: "0 2px 15px rgba(0,0,0,0.9)",
          fontFamily,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

// Bottom bar with app info
const AppBar: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideUp = spring({ frame, fps, config: { damping: 15, stiffness: 60 }, delay });

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
      transform: `translateY(${(1 - slideUp) * 200}px)`,
      background: "linear-gradient(transparent, rgba(0,0,0,0.95))",
      padding: "80px 50px 60px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: "linear-gradient(135deg, #CDFF00, #88CC00)",
          display: "flex", justifyContent: "center", alignItems: "center",
          fontSize: 30, fontWeight: 900, color: "#000", fontFamily,
        }}>
          GR
        </div>
        <div>
          <p style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0, fontFamily }}>GymRat by Pablo Scarlatto</p>
          <p style={{ color: "#CDFF00", fontSize: 22, fontWeight: 600, margin: "2px 0 0", fontFamily }}>Primer mes GRATIS</p>
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 22, fontWeight: 600, margin: 0, fontFamily }}>
        pabloscarlattoentrenamientos.com
      </p>
    </div>
  );
};

// Each clip segment with overlay
const ClipSegment: React.FC<{
  videoSrc: string;
  startFrom: number;
  endAt: number;
  text: string;
  subtitle?: string;
  textPosition?: "top" | "center" | "bottom";
  textColor?: string;
  textSize?: number;
  showAppBar?: boolean;
}> = ({ videoSrc, startFrom, text, subtitle, textPosition = "center", textColor = "#CDFF00", textSize = 72, showAppBar = false }) => {
  return (
    <AbsoluteFill>
      {/* Video background */}
      <OffthreadVideo
        src={staticFile(videoSrc)}
        startFrom={startFrom * 30}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      {/* Animated text */}
      <AnimatedText text={text} subtitle={subtitle} delay={5} color={textColor} size={textSize} position={textPosition} />
      {/* App bar */}
      {showAppBar && <AppBar delay={10} />}
    </AbsoluteFill>
  );
};

// ━━━━━━ MAIN COMPOSITION ━━━━━━
export const SigmaStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = 27 * fps; // 27 seconds

  // Scene timing (in frames at 30fps)
  const scenes = [
    { start: 0, dur: 90 },      // 0-3s: Hook
    { start: 90, dur: 90 },     // 3-6s: Clip 1
    { start: 180, dur: 90 },    // 6-9s: Clip 2
    { start: 270, dur: 75 },    // 9-11.5s: Clip 3
    { start: 345, dur: 75 },    // 11.5-14s: Clip 4
    { start: 420, dur: 90 },    // 14-17s: Clip 5
    { start: 510, dur: 120 },   // 17-21s: CTA
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily }}>
      {/* Scene 1: Hook - text only */}
      {frame < scenes[0].dur && (
        <AbsoluteFill style={{ background: "#050505", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(205,255,0,0.1) 0%, transparent 50%)" }} />
          <div style={{ textAlign: "center", padding: "0 50px" }}>
            <div style={{ transform: `scale(${spring({ frame, fps, config: { damping: 10, stiffness: 80 }, delay: 3 })})` }}>
              <p style={{ color: "#CDFF00", fontSize: 38, fontWeight: 700, letterSpacing: 5, margin: "0 0 15px", textTransform: "uppercase", fontFamily }}>Entrenas en</p>
              <h1 style={{ color: "#fff", fontSize: 120, fontWeight: 900, margin: 0, lineHeight: 1, fontFamily }}>SIGMA?</h1>
            </div>
            <div style={{ transform: `scale(${spring({ frame, fps, config: { damping: 12, stiffness: 80 }, delay: 18 })})`, marginTop: 30 }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 42, fontWeight: 700, margin: 0, fontFamily }}>
                Tenes tu plan de
              </p>
              <p style={{ color: "#CDFF00", fontSize: 52, fontWeight: 900, margin: "5px 0 0", textShadow: "0 0 30px rgba(205,255,0,0.4)", fontFamily }}>
                entrenamiento + nutricion?
              </p>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Scene 2: Clip 1 - training footage */}
      {frame >= scenes[1].start && frame < scenes[1].start + scenes[1].dur && (
        <ClipSegment
          videoSrc="sigma/clip1.mp4"
          startFrom={0}
          endAt={3}
          text="ENTRENA CON"
          subtitle="Rutinas personalizadas por Pablo Scarlatto"
          textColor="#CDFF00"
          textSize={80}
          textPosition="top"
        />
      )}

      {/* Scene 3: Clip 2 */}
      {frame >= scenes[2].start && frame < scenes[2].start + scenes[2].dur && (
        <ClipSegment
          videoSrc="sigma/clip2.mp4"
          startFrom={0}
          endAt={3}
          text="NUTRICION"
          subtitle="Macros calculados para tu objetivo"
          textColor="#00D4AA"
          textSize={85}
          textPosition="center"
        />
      )}

      {/* Scene 4: Clip 3 */}
      {frame >= scenes[3].start && frame < scenes[3].start + scenes[3].dur && (
        <ClipSegment
          videoSrc="sigma/clip3.mp4"
          startFrom={0}
          endAt={2.5}
          text="PROGRESO REAL"
          subtitle="Seguimiento de fuerza, peso y medidas"
          textColor="#FF6B6B"
          textSize={80}
          textPosition="center"
        />
      )}

      {/* Scene 5: Clip 4 */}
      {frame >= scenes[4].start && frame < scenes[4].start + scenes[4].dur && (
        <ClipSegment
          videoSrc="sigma/clip4.mp4"
          startFrom={0}
          endAt={2.5}
          text="BOT IA 24/7"
          subtitle="Tu entrenador siempre disponible"
          textColor="#A78BFA"
          textSize={85}
          textPosition="center"
        />
      )}

      {/* Scene 6: Clip 5 */}
      {frame >= scenes[5].start && frame < scenes[5].start + scenes[5].dur && (
        <ClipSegment
          videoSrc="sigma/clip5.mp4"
          startFrom={0}
          endAt={3}
          text="RANKING Y XP"
          subtitle="Competi con otros miembros del gym"
          textColor="#FFD93D"
          textSize={80}
          textPosition="top"
          showAppBar
        />
      )}

      {/* Scene 7: CTA Final */}
      {frame >= scenes[6].start && (
        <AbsoluteFill style={{
          background: "linear-gradient(180deg, #050505 0%, #0a1a00 50%, #050505 100%)",
          justifyContent: "center", alignItems: "center",
        }}>
          <div style={{
            position: "absolute", width: 900, height: 900, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(205,255,0,${0.1 + 0.05 * Math.sin((frame - scenes[6].start) * 0.1)}) 0%, transparent 45%)`,
          }} />
          <div style={{ textAlign: "center", zIndex: 1 }}>
            <div style={{ transform: `scale(${spring({ frame: frame - scenes[6].start, fps, config: { damping: 10, stiffness: 60 }, delay: 3 })})` }}>
              <p style={{ color: "#CDFF00", fontSize: 34, fontWeight: 700, letterSpacing: 6, margin: "0 0 15px", textTransform: "uppercase", fontFamily }}>
                Exclusivo socios Sigma
              </p>
              <h1 style={{ color: "#fff", fontSize: 85, fontWeight: 900, margin: 0, lineHeight: 1.1, fontFamily }}>
                Primer mes
              </h1>
              <h1 style={{ color: "#CDFF00", fontSize: 105, fontWeight: 900, margin: 0, lineHeight: 1.1, textShadow: "0 0 60px rgba(205,255,0,0.5)", fontFamily }}>
                GRATIS
              </h1>
            </div>

            <div style={{
              transform: `scale(${spring({ frame: frame - scenes[6].start, fps, config: { damping: 8, stiffness: 100 }, delay: 20 }) * (1 + 0.02 * Math.sin((frame - scenes[6].start) * 0.2))})`,
              marginTop: 45,
            }}>
              <div style={{
                display: "inline-block", padding: "25px 70px", borderRadius: 22,
                background: "linear-gradient(135deg, #CDFF00, #88CC00)",
                boxShadow: "0 0 60px rgba(205,255,0,0.4)",
              }}>
                <p style={{ color: "#000", fontSize: 42, fontWeight: 900, margin: 0, fontFamily }}>EMPEZAR GRATIS</p>
              </div>
            </div>

            <div style={{
              marginTop: 35,
              opacity: interpolate(frame - scenes[6].start, [30, 45], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
            }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 28, fontWeight: 600, margin: 0, fontFamily }}>
                pabloscarlattoentrenamientos.com
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 24, fontWeight: 600, margin: "8px 0 0", fontFamily }}>
                @pabloscarlattoentrenamientos
              </p>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
