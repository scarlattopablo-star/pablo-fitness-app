import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { AppDemoReel } from "./AppDemoReel";
import { InstagramReel2 } from "./InstagramReel2";
import { SigmaStory } from "./SigmaStory";
import { OrganicStory } from "./OrganicStory";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoReel"
        component={PromoVideo}
        durationInFrames={1000}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AppDemoReel"
        component={AppDemoReel}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="InstagramReel2"
        component={InstagramReel2}
        durationInFrames={826}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SigmaStory"
        component={SigmaStory}
        durationInFrames={630}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="OrganicStory"
        component={OrganicStory}
        durationInFrames={720}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
