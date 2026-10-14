"use client";

import { useAuth } from "@/lib/auth-context";
import PlanEditor from "@/components/plan-editor";

// El entrenador suplente edita (o genera) su propio plan.
export default function MiPlanPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <PlanEditor clientId={user.id} mode="self" />
    </div>
  );
}
