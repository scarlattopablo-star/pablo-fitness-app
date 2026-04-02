"use client";

import { Dumbbell } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface ProgressEntry {
  id: string;
  date: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  legs: number | null;
  notes: string | null;
}

interface MacrosData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "#888" },
};

const MEASUREMENT_COLORS: Record<string, string> = {
  cintura: "#f59e0b",
  pecho: "#ef4444",
  cadera: "#a855f7",
  brazos: "#3b82f6",
  piernas: "#22c55e",
};

const MACRO_COLORS = ["#ef4444", "#f59e0b", "#3b82f6"];

// 1. Weight Evolution (Line Chart)
export function WeightChart({ entries, initialWeight }: { entries: ProgressEntry[]; initialWeight?: number | null }) {
  const weightEntries = [...entries].filter(e => e.weight).reverse();
  if (weightEntries.length === 0 && !initialWeight) return null;

  const data = [];
  if (initialWeight && (weightEntries.length === 0 || weightEntries[0].weight !== initialWeight)) {
    const firstDate = weightEntries.length > 0
      ? new Date(new Date(weightEntries[0].date).getTime() - 86400000)
      : new Date();
    data.push({ date: firstDate.toLocaleDateString("es", { day: "2-digit", month: "short" }), peso: initialWeight });
  }
  data.push(...weightEntries.map(e => ({
    date: new Date(e.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
    peso: e.weight,
  })));
  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3">Evolucion de Peso</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#888" }} width={40} />
          <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: "#00f593" }} formatter={(value) => [`${value} kg`, "Peso"]} />
          <Line type="monotone" dataKey="peso" stroke="#00f593" strokeWidth={2.5} dot={{ fill: "#00f593", r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Body Measurements Over Time (Line Chart)
export function MeasurementsLineChart({ entries }: { entries: ProgressEntry[] }) {
  const data = [...entries].reverse()
    .filter(e => e.waist || e.chest || e.hips || e.arms || e.legs)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
      cintura: e.waist, pecho: e.chest, cadera: e.hips, brazos: e.arms, piernas: e.legs,
    }));
  if (data.length < 1) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3">Medidas Corporales en el Tiempo</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis tick={{ fontSize: 10, fill: "#888" }} width={40} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "10px" }} />
          {Object.entries(MEASUREMENT_COLORS).map(([key, color]) => (
            <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Measurements Comparison Bar Chart (Initial vs Current)
export function MeasurementsBarChart({ entries }: { entries: ProgressEntry[] }) {
  const reversed = [...entries].reverse();
  const first = reversed.find(e => e.waist || e.chest || e.hips || e.arms || e.legs);
  const last = entries.find(e => e.waist || e.chest || e.hips || e.arms || e.legs);
  if (!first || !last || first.id === last.id) return null;

  const mappings: { label: string; get: (e: ProgressEntry) => number | null }[] = [
    { label: "Pecho", get: e => e.chest },
    { label: "Cintura", get: e => e.waist },
    { label: "Cadera", get: e => e.hips },
    { label: "Brazos", get: e => e.arms },
    { label: "Piernas", get: e => e.legs },
  ];

  const data = mappings
    .filter(m => m.get(first) != null)
    .map(m => ({ name: m.label, inicial: m.get(first) || 0, actual: m.get(last) || 0 }));
  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3">Medidas: Inicio vs Actual (cm)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis tick={{ fontSize: 10, fill: "#888" }} width={35} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "10px" }} />
          <Bar dataKey="inicial" fill="#6b7280" name="Inicio" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" fill="#00f593" name="Actual" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Change per Measurement (Horizontal Bar)
export function MeasurementsChangeChart({ entries }: { entries: ProgressEntry[] }) {
  const reversed = [...entries].reverse();
  const first = reversed.find(e => e.waist || e.chest || e.hips || e.arms || e.legs);
  const last = entries.find(e => e.waist || e.chest || e.hips || e.arms || e.legs);
  if (!first || !last || first.id === last.id) return null;

  const mappings: { label: string; get: (e: ProgressEntry) => number | null }[] = [
    { label: "Pecho", get: e => e.chest },
    { label: "Cintura", get: e => e.waist },
    { label: "Cadera", get: e => e.hips },
    { label: "Brazos", get: e => e.arms },
    { label: "Piernas", get: e => e.legs },
  ];

  const data = mappings
    .filter(m => m.get(first) != null && m.get(last) != null)
    .map(m => ({ name: m.label, cambio: Number(((m.get(last) || 0) - (m.get(first) || 0)).toFixed(1)) }));
  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3">Cambio por Medida (cm)</p>
      <ResponsiveContainer width="100%" height={data.length * 45 + 30}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#ccc" }} width={60} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value) > 0 ? "+" : ""}${value} cm`, "Cambio"]} />
          <Bar dataKey="cambio" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.cambio <= 0 ? "#00f593" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 5. Macros Distribution (Pie/Donut Chart)
export function MacrosPieChart({ macros }: { macros: MacrosData | null }) {
  if (!macros || !macros.protein) return null;

  const proteinCal = macros.protein * 4;
  const carbsCal = macros.carbs * 4;
  const fatsCal = macros.fats * 9;
  const total = proteinCal + carbsCal + fatsCal;

  const data = [
    { name: "Proteinas", value: macros.protein, cal: proteinCal, pct: Math.round((proteinCal / total) * 100) },
    { name: "Carbos", value: macros.carbs, cal: carbsCal, pct: Math.round((carbsCal / total) * 100) },
    { name: "Grasas", value: macros.fats, cal: fatsCal, pct: Math.round((fatsCal / total) * 100) },
  ];

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3">Distribucion de Macros</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => (<Cell key={i} fill={MACRO_COLORS[i]} />))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} formatter={(value, name) => [`${value}g`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MACRO_COLORS[i] }} />
              <div className="flex-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted">{item.pct}%</span>
                </div>
                <p className="text-[10px] text-muted">{item.value}g — {item.cal} kcal</p>
              </div>
            </div>
          ))}
          <div className="pt-1 border-t border-card-border">
            <p className="text-xs font-bold text-primary">{macros.calories} kcal/dia</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Weight Change Bar Chart (per entry)
export function WeightChangeBarChart({ entries }: { entries: ProgressEntry[] }) {
  const withWeight = [...entries].filter(e => e.weight).reverse();
  if (withWeight.length < 2) return null;

  const data = withWeight.slice(1).map((entry, i) => {
    const prev = withWeight[i];
    return {
      date: new Date(entry.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
      cambio: Number(((entry.weight || 0) - (prev.weight || 0)).toFixed(1)),
    };
  });

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3">Cambio de Peso por Registro (kg)</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis tick={{ fontSize: 10, fill: "#888" }} width={35} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value) > 0 ? "+" : ""}${value} kg`, "Cambio"]} />
          <Bar dataKey="cambio" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={`wc-${i}`} fill={entry.cambio <= 0 ? "#00f593" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 7. Exercise Progress Mini Charts
interface ExerciseLog {
  exercise_id: string;
  exercise_name: string;
  sets_data: { set: number; weight: number; reps: number }[];
  date: string;
}

export function ExerciseProgressCharts({ logs }: { logs: ExerciseLog[] }) {
  if (!logs || logs.length === 0) return null;

  const byExercise: Record<string, { name: string; sessions: { date: string; weight: number }[] }> = {};
  for (const log of logs) {
    if (!byExercise[log.exercise_id]) {
      byExercise[log.exercise_id] = { name: log.exercise_name, sessions: [] };
    }
    const maxSet = log.sets_data.reduce((best, s) => s.weight > best.weight ? s : best, log.sets_data[0]);
    byExercise[log.exercise_id].sessions.push({ date: log.date, weight: maxSet.weight });
  }

  const exercises = Object.entries(byExercise)
    .map(([id, data]) => ({
      id,
      name: data.name,
      sessions: data.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }))
    .filter(e => e.sessions.length > 0)
    .sort((a, b) => b.sessions.length - a.sessions.length);

  if (exercises.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-bold text-muted mb-3 flex items-center gap-1">
        <Dumbbell className="h-3 w-3" />
        Progresion por Ejercicio
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {exercises.map(ex => {
          const latest = ex.sessions[ex.sessions.length - 1];
          const first = ex.sessions[0];
          const diff = ex.sessions.length > 1 ? latest.weight - first.weight : 0;
          const chartData = ex.sessions.map(s => ({
            date: new Date(s.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
            kg: s.weight,
          }));

          return (
            <div key={ex.id} className="bg-card-bg rounded-xl p-3">
              <p className="text-[10px] font-bold truncate mb-1" title={ex.name}>{ex.name}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-sm font-black text-primary">{latest.weight}kg</span>
                {diff !== 0 && (
                  <span className={`text-[10px] font-bold ${diff > 0 ? "text-primary" : "text-danger"}`}>
                    {diff > 0 ? "+" : ""}{diff}kg
                  </span>
                )}
              </div>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "10px", padding: "4px 8px" }}
                      labelStyle={{ color: "#888", fontSize: "9px" }}
                      itemStyle={{ color: "#00f593" }}
                      formatter={(value) => [`${value} kg`, ""]}
                    />
                    <Line type="monotone" dataKey="kg" stroke="#00f593" strokeWidth={1.5} dot={{ fill: "#00f593", r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[9px] text-muted">1 registro</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
