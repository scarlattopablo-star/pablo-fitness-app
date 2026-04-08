import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { AppDemoReel } from "./AppDemoReel";

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
    </>
  );
};
