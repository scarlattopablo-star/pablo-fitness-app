import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./scenes/Intro";
import { HeroScene } from "./scenes/Hero";
import { FeaturesScene } from "./scenes/Features";
import { NutritionScene } from "./scenes/Nutrition";
import { ProgressScene } from "./scenes/Progress";
import { AppScene } from "./scenes/App";
import { CTAScene } from "./scenes/CTA";
import { VideoClipScene } from "./scenes/VideoClip";

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <TransitionSeries>
        {/* 1. Logo intro */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* 2. Hero text */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <HeroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 3. VIDEO CLIP 1 - Training footage */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <VideoClipScene
            src="clip1.mp4"
            overlayText="ENTRENA CON PROPOSITO"
            subtitleText="Rutinas diseñadas para vos"
            startFrom={1}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 4. Features */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <FeaturesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 5. Nutrition */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <NutritionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 6. VIDEO CLIP 2 - More training footage */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <VideoClipScene
            src="clip2.mp4"
            overlayText="RESULTADOS REALES"
            subtitleText="Transformaciones que se ven"
            startFrom={1}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 7. Progress */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <ProgressScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 8. App mockup */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <AppScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* 9. CTA final */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
