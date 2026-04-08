import { RatLoader } from "@/components/rat-loader";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <RatLoader size={72} />
    </div>
  );
}
