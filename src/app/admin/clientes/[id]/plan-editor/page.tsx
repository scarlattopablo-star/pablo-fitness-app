"use client";

import { use } from "react";
import PlanEditor from "@/components/plan-editor";

export default function PlanEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  return <PlanEditor clientId={clientId} mode="admin" />;
}
