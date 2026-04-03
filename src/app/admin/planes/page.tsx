"use client";

import { PLANS, DURATION_LABELS } from "@/lib/plans-data";
import {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home, Edit,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home,
};

export default function AdminPlanesPage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Gestionar Planes</h1>
      <p className="text-muted mb-6">Administrá los 10 planes de entrenamiento y nutrición</p>

      <div className="space-y-4">
        {PLANS.map((plan) => {
          const Icon = ICON_MAP[plan.icon] || Dumbbell;
          return (
            <div key={plan.slug} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted">{plan.shortDescription}</p>
                    <div className="flex gap-4 mt-2">
                      {(["1-mes", "3-meses", "6-meses", "1-ano"] as const).map((d) => (
                        <div key={d} className="text-xs">
                          <span className="text-muted">{DURATION_LABELS[d]}: </span>
                          <span className="font-bold text-primary">${plan.prices[d]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="text-muted hover:text-primary transition-colors p-2">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
