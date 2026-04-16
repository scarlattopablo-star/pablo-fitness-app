import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
});

// ━━━━━━ SCENE 1: HOOK (0-3s) ━━━━━━
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale1 = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, delay: 5 });
  const scale2 = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, delay: 20 });
  const scale3 = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, delay: 35 });
  const lineW = interpolate(frame, [10, 40], [0, 600], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const fadeOut = interpolate(frame, [75, 90], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#050505", fontFamily, justifyContent: "center", alignItems: "center", opacity: fadeOut }}>
      {/* Animated gradient orb */}
      <div style={{
        position: "absolute", width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(205,255,0,0.12) 0%, transparent 50%)",
        transform: `scale(${1 + 0.05 * Math.sin(frame * 0.08)})`,
      }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ transform: `scale(${scale1})`, marginBottom: 20 }}>
          <p style={{ color: "#CDFF00", fontSize: 42, fontWeight: 700, margin: 0, letterSpacing: 6, textTransform: "uppercase" }}>
            Cansado de
          </p>
        </div>
        <div style={{ transform: `scale(${scale2})`, marginBottom: 30 }}>
          <h1 style={{ color: "#fff", fontSize: 110, fontWeight: 900, margin: 0, lineHeight: 1 }}>
            ENTRENAR
          </h1>
          <h1 style={{ color: "#CDFF00", fontSize: 110, fontWeight: 900, margin: 0, lineHeight: 1, textShadow: "0 0 60px rgba(205,255,0,0.4)" }}>
            SIN PLAN?
          </h1>
        </div>
        <div style={{ width: lineW, height: 4, background: "linear-gradient(90deg, transparent, #CDFF00, transparent)", margin: "0 auto", borderRadius: 2 }} />
        <div style={{ transform: `scale(${scale3})`, marginTop: 30 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 34, fontWeight: 600, margin: 0 }}>
            Tu transformacion empieza hoy
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 2: PRIMER MES GRATIS (3-6s) ━━━━━━
const FreeMonthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({ frame, fps, config: { damping: 8, stiffness: 100 }, delay: 5 });
  const textY = spring({ frame, fps, config: { damping: 15, stiffness: 60 }, delay: 15 });
  const subtitleOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const pulse = 1 + 0.03 * Math.sin(frame * 0.15);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a1a00 0%, #050505 100%)", fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", width: 1000, height: 1000, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(205,255,0,0.08) 0%, transparent 50%)",
        transform: `scale(${pulse})`,
      }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ transform: `scale(${badgeScale})`, marginBottom: 40 }}>
          <div style={{
            display: "inline-block", padding: "25px 70px", borderRadius: 30,
            background: "linear-gradient(135deg, #CDFF00, #88CC00)",
            boxShadow: "0 0 80px rgba(205,255,0,0.4), 0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <p style={{ color: "#000", fontSize: 80, fontWeight: 900, margin: 0 }}>GRATIS</p>
          </div>
        </div>

        <div style={{ transform: `translateY(${(1 - textY) * 60}px)`, opacity: textY }}>
          <h2 style={{ color: "#fff", fontSize: 85, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
            Primer mes
          </h2>
          <h2 style={{ color: "#CDFF00", fontSize: 85, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
            completamente gratis
          </h2>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 36, fontWeight: 600, margin: "30px 0 0", opacity: subtitleOp }}>
          Sin tarjeta de credito. Sin compromiso.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 3: QUE INCLUYE (6-10s) ━━━━━━
const IncludesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { icon: "🏋️", text: "Plan de entrenamiento personalizado", color: "#CDFF00" },
    { icon: "🥗", text: "Plan de nutricion con macros", color: "#00D4AA" },
    { icon: "📊", text: "Seguimiento de progreso", color: "#FF6B6B" },
    { icon: "💬", text: "Chat directo con tu entrenador", color: "#4ECDC4" },
    { icon: "🏆", text: "Ranking, logros y XP", color: "#FFD93D" },
    { icon: "🤖", text: "Asistente IA 24/7", color: "#A78BFA" },
  ];

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, delay: 3 });

  return (
    <AbsoluteFill style={{ background: "#050505", fontFamily, padding: "0 60px", justifyContent: "center" }}>
      <div style={{ transform: `scale(${titleScale})`, marginBottom: 50 }}>
        <p style={{ color: "#CDFF00", fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: 5, textTransform: "uppercase" }}>
          Todo incluido
        </p>
        <h2 style={{ color: "#fff", fontSize: 80, fontWeight: 900, margin: "8px 0 0", lineHeight: 1.1 }}>
          Tu pack
          <span style={{ color: "#CDFF00" }}> completo</span>
        </h2>
      </div>

      {items.map((item, i) => {
        const delay = 8 + i * 8;
        const itemScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 }, delay });
        const itemX = interpolate(frame, [delay, delay + 12], [80, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

        return (
          <div key={i} style={{
            transform: `scale(${itemScale}) translateX(${itemX}px)`,
            display: "flex", alignItems: "center", gap: 24,
            padding: "22px 32px", marginBottom: 14, borderRadius: 20,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${item.color}22`,
          }}>
            <span style={{ fontSize: 48 }}>{item.icon}</span>
            <p style={{ color: "#fff", fontSize: 36, fontWeight: 700, margin: 0 }}>{item.text}</p>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 4: METODOS AVANZADOS (10-13s) ━━━━━━
const MethodsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const methods = ["SUPER SERIES", "DROP SETS", "REST-PAUSE", "CLUSTER SETS", "PIRAMIDAL", "SERIES GIGANTES"];
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050505 0%, #1a0a00 50%, #050505 100%)", fontFamily, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 50%)" }} />

      <div style={{ textAlign: "center", opacity: titleOp }}>
        <p style={{ color: "#FF6B6B", fontSize: 32, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", margin: 0 }}>
          Basado en ciencia
        </p>
        <h2 style={{ color: "#fff", fontSize: 75, fontWeight: 900, margin: "10px 0 40px", lineHeight: 1.1 }}>
          Metodos
          <span style={{ color: "#FF6B6B" }}> avanzados</span>
        </h2>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", padding: "0 50px" }}>
        {methods.map((m, i) => {
          const delay = 10 + i * 6;
          const s = spring({ frame, fps, config: { damping: 10, stiffness: 120 }, delay });
          const rotate = interpolate(frame, [delay, delay + 10], [-5, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div key={i} style={{
              transform: `scale(${s}) rotate(${rotate}deg)`,
              padding: "18px 36px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05))",
              border: "1px solid rgba(255,107,107,0.25)",
            }}>
              <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: 0 }}>{m}</p>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 50,
        opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 28, fontWeight: 600, textAlign: "center", margin: 0 }}>
          ACSM 2026 · NSCA · Schoenfeld
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 5: GAMIFICACION (13-16s) ━━━━━━
const GamificationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const xpCount = Math.round(interpolate(frame, [15, 60], [0, 2500], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
  const streakCount = Math.round(interpolate(frame, [25, 55], [0, 14], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
  const levelOp = spring({ frame, fps, config: { damping: 10, stiffness: 80 }, delay: 40 });

  const badges = ["🏅", "💪", "🔥", "⚡", "🏆"];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a1a 50%, #050505 100%)", fontFamily, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,217,61,0.08) 0%, transparent 50%)" }} />

      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <p style={{ color: "#FFD93D", fontSize: 32, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", margin: 0,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          Competi y mejora
        </p>
        <h2 style={{ color: "#fff", fontSize: 80, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1,
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          Gamificacion
          <span style={{ color: "#FFD93D" }}> total</span>
        </h2>
      </div>

      {/* XP Counter */}
      <div style={{ display: "flex", gap: 40, marginBottom: 40 }}>
        <div style={{ textAlign: "center", padding: "30px 50px", borderRadius: 24, background: "rgba(255,217,61,0.08)", border: "1px solid rgba(255,217,61,0.2)" }}>
          <p style={{ color: "#FFD93D", fontSize: 72, fontWeight: 900, margin: 0 }}>{xpCount}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 26, fontWeight: 600, margin: "4px 0 0" }}>XP</p>
        </div>
        <div style={{ textAlign: "center", padding: "30px 50px", borderRadius: 24, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)" }}>
          <p style={{ color: "#FF6B6B", fontSize: 72, fontWeight: 900, margin: 0 }}>🔥 {streakCount}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 26, fontWeight: 600, margin: "4px 0 0" }}>Racha</p>
        </div>
      </div>

      {/* Level badge */}
      <div style={{ transform: `scale(${levelOp})`, padding: "20px 60px", borderRadius: 20, background: "linear-gradient(135deg, #FFD93D, #FF8C00)", marginBottom: 35 }}>
        <p style={{ color: "#000", fontSize: 42, fontWeight: 900, margin: 0 }}>NIVEL: EXPERTO</p>
      </div>

      {/* Achievement badges */}
      <div style={{ display: "flex", gap: 20 }}>
        {badges.map((b, i) => {
          const s = spring({ frame, fps, config: { damping: 8, stiffness: 120 }, delay: 50 + i * 6 });
          return (
            <div key={i} style={{
              transform: `scale(${s})`, width: 90, height: 90, borderRadius: 20,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", justifyContent: "center", alignItems: "center", fontSize: 48,
            }}>
              {b}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 6: BOT IA (16-19s) ━━━━━━
const BotScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const messages = [
    { from: "user", text: "Pablo, cuantas calorias deberia comer hoy?", delay: 10 },
    { from: "bot", text: "Con tu peso de 85kg y actividad moderada, tu TDEE es 2,800 kcal. Para tu objetivo de quema grasa, apunta a 2,350 kcal 💪", delay: 35 },
    { from: "user", text: "Y si no tengo pollo para la cena?", delay: 60 },
    { from: "bot", text: "Cambialo por 200g de merluza o 3 huevos. Mismos macros, mismo resultado 🔥", delay: 75 },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a1a 50%, #050505 100%)", fontFamily, justifyContent: "center", padding: "0 50px" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 50%)", top: "20%", left: "10%" }} />

      <div style={{ marginBottom: 40, opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) }}>
        <p style={{ color: "#A78BFA", fontSize: 32, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", margin: 0 }}>
          Respuestas al instante
        </p>
        <h2 style={{ color: "#fff", fontSize: 75, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
          Asistente
          <span style={{ color: "#A78BFA" }}> IA 24/7</span>
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => {
          const s = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, delay: m.delay });
          const isBot = m.from === "bot";

          return (
            <div key={i} style={{
              transform: `scale(${s})`,
              alignSelf: isBot ? "flex-start" : "flex-end",
              maxWidth: "85%",
              padding: "20px 28px", borderRadius: 22,
              background: isBot ? "rgba(167,139,250,0.12)" : "rgba(205,255,0,0.1)",
              border: `1px solid ${isBot ? "rgba(167,139,250,0.25)" : "rgba(205,255,0,0.2)"}`,
            }}>
              {isBot && <p style={{ color: "#A78BFA", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Pablo (IA)</p>}
              <p style={{ color: "#fff", fontSize: 28, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{m.text}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 7: SOCIAL PROOF (19-22s) ━━━━━━
const SocialProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countUp = Math.round(interpolate(frame, [10, 50], [0, 50], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
  const starsScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 }, delay: 30 });

  return (
    <AbsoluteFill style={{ background: "#050505", fontFamily, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(205,255,0,0.06) 0%, transparent 50%)" }} />

      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#CDFF00", fontSize: 160, fontWeight: 900, margin: 0, textShadow: "0 0 80px rgba(205,255,0,0.3)" }}>
          {countUp}+
        </p>
        <h2 style={{ color: "#fff", fontSize: 65, fontWeight: 900, margin: "0 0 15px", lineHeight: 1.1 }}>
          personas ya entrenan
          <br />con Pablo
        </h2>

        <div style={{ transform: `scale(${starsScale})`, display: "flex", gap: 12, justifyContent: "center", marginTop: 30 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ fontSize: 50 }}>⭐</span>
          ))}
        </div>

        <div style={{
          marginTop: 40, padding: "24px 40px", borderRadius: 20,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 32, fontWeight: 600, margin: 0, fontStyle: "italic" }}>
            &ldquo;Baje 12kg en 4 meses. El plan es brutal.&rdquo;
          </p>
          <p style={{ color: "#CDFF00", fontSize: 26, fontWeight: 700, margin: "10px 0 0" }}>— Martin R.</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ SCENE 8: CTA FINAL (22-27s) ━━━━━━
const CTAFinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 10, stiffness: 60 }, delay: 5 });
  const btnScale = spring({ frame, fps, config: { damping: 8, stiffness: 100 }, delay: 25 });
  const urlOp = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const pulse = 1 + 0.02 * Math.sin(frame * 0.2);
  const glowPulse = 0.3 + 0.15 * Math.sin(frame * 0.1);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050505 0%, #0a1a00 50%, #050505 100%)", fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Pulsing glow */}
      <div style={{
        position: "absolute", width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(205,255,0,${glowPulse}) 0%, transparent 45%)`,
      }} />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ transform: `scale(${titleScale})` }}>
          <p style={{ color: "#CDFF00", fontSize: 36, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", margin: "0 0 15px" }}>
            Empeza hoy
          </p>
          <h1 style={{ color: "#fff", fontSize: 90, fontWeight: 900, margin: 0, lineHeight: 1.05 }}>
            Tu primer mes
          </h1>
          <h1 style={{ color: "#CDFF00", fontSize: 110, fontWeight: 900, margin: 0, lineHeight: 1.05, textShadow: "0 0 60px rgba(205,255,0,0.5)" }}>
            es GRATIS
          </h1>
        </div>

        <div style={{ transform: `scale(${btnScale * pulse})`, marginTop: 50 }}>
          <div style={{
            display: "inline-block", padding: "28px 80px", borderRadius: 24,
            background: "linear-gradient(135deg, #CDFF00, #88CC00)",
            boxShadow: "0 0 60px rgba(205,255,0,0.4), 0 15px 40px rgba(0,0,0,0.5)",
          }}>
            <p style={{ color: "#000", fontSize: 46, fontWeight: 900, margin: 0 }}>EMPEZAR GRATIS</p>
          </div>
        </div>

        <div style={{ opacity: urlOp, marginTop: 35 }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 30, fontWeight: 600, margin: 0 }}>
            pabloscarlattoentrenamientos.com
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 24, fontWeight: 600, margin: "10px 0 0" }}>
            @pabloscarlattoentrenamientos
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ━━━━━━ COMPOSICION COMPLETA ━━━━━━
export const InstagramReel2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <FreeMonthScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={120}>
          <IncludesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <MethodsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <GamificationScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <BotScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <SocialProofScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <CTAFinalScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
