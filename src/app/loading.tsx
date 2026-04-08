import { RatLoader } from "@/components/rat-loader";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <RatLoader size={80} />
    </div>
  );
}
