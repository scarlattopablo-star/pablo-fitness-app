"use client";

import { use } from "react";
import TrainClientSession from "@/components/train-client-session";

export default function AdminEntrenarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  return <TrainClientSession clientId={clientId} mode="admin" />;
}
