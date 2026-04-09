"use client";

import { Loader2 } from "lucide-react";

interface RatLoaderProps {
  size?: number;
  className?: string;
}

export function RatLoader({ size = 64, className = "" }: RatLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="text-primary animate-spin" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}
