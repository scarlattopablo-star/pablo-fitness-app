"use client";

// Nutrition v2 — F1 retrocompatibilidad: form de campos v2 para clientes ya creados
//
// Componente controlado que se monta dentro del editor de encuesta en
// /dashboard/perfil. Permite a clientes existentes completar los datos
// nuevos (% graso, trabajo, presupuesto, region, suplementos, etc.) que
// alimentan las tabs Compra / Presupuesto / Suplementos.
//
// El padre maneja el state via props (value + onChange) para integrarse
// con el flow de PATCH existente sin duplicar logica.

import type { JobActivity, ShoppingFrequency } from "@/types";

export interface SurveyV2Values {
  body_fat_pct?: number | null;
  training_time?: string | null;       // 'HH:MM'
  job_activity?: JobActivity | null;
  pathologies?: string[];
  intolerances?: string[];
  disliked_foods?: string[];           // sin parsear (lo guardamos como array)
  meals_per_day?: number | null;
  food_budget_monthly?: number | null;
  food_budget_currency?: string | null;
  country?: string | null;
  city?: string | null;
  uses_supplements?: boolean | null;
  current_supplements?: string[];
  wants_supplement_advice?: boolean | null;
  cooking_time_per_day?: number | null;
  shopping_frequency?: ShoppingFrequency | null;
}

interface Props {
  value: SurveyV2Values;
  onChange: (next: SurveyV2Values) => void;
}

const JOB_ACTIVITIES: { value: JobActivity; label: string }[] = [
  { value: "sedentario", label: "Sedentario" },
  { value: "de-pie",     label: "De pie" },
  { value: "manual",     label: "Manual" },
  { value: "muy-activo", label: "Muy activo" },
];

const PATHOLOGIES_OPTIONS = [
  "Hipertension","Diabetes tipo 1","Diabetes tipo 2","Hipotiroidismo",
  "Hipertiroidismo","Colesterol alto","Acido urico","Higado graso",
  "Sindrome ovario poliquistico","Reflujo",
];

const INTOLERANCES_OPTIONS = [
  "Gluten","Lactosa","Frutos secos","Mariscos","Soja","Huevo",
];

const COUNTRIES = [
  { value: "UY",   label: "Uruguay",   currency: "UYU" },
  { value: "AR",   label: "Argentina", currency: "ARS" },
  { value: "ES",   label: "Espana",    currency: "EUR" },
  { value: "BR",   label: "Brasil",    currency: "BRL" },
  { value: "CL",   label: "Chile",     currency: "CLP" },
  { value: "MX",   label: "Mexico",    currency: "MXN" },
  { value: "OTRO", label: "Otro",      currency: "USD" },
];

const SUPPLEMENTS_OPTIONS = [
  "Whey protein","Creatina","Omega 3","Multivitaminico","Magnesio",
  "Vitamina D","Cafeina","Pre-entreno","BCAAs","Glutamina",
];

const SHOPPING_FREQUENCIES: { value: ShoppingFrequency; label: string }[] = [
  { value: "semanal",    label: "Semanal" },
  { value: "quincenal",  label: "Cada 15 dias" },
  { value: "mensual",    label: "Mensual" },
];

function toggleInArray(list: string[] | undefined, value: string): string[] {
  const arr = list ?? [];
  return arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
}

export function ProfileSurveyV2Fields({ value, onChange }: Props) {
  const set = <K extends keyof SurveyV2Values>(key: K, v: SurveyV2Values[K]) => {
    onChange({ ...value, [key]: v });
  };

  const handleCountryChange = (newCountry: string) => {
    const found = COUNTRIES.find(c => c.value === newCountry);
    onChange({
      ...value,
      country: newCountry,
      food_budget_currency: found?.currency ?? value.food_budget_currency ?? "UYU",
    });
  };

  const dislikedFoodsText = (value.disliked_foods ?? []).join(", ");

  return (
    <div className="space-y-5 pt-4 border-t border-card-border/50 mt-4">
      <div>
        <h3 className="font-bold text-sm mb-1">Personalizacion avanzada</h3>
        <p className="text-xs text-muted">
          Datos opcionales que mejoran la precision de tus macros, lista de compras y suplementos.
        </p>
      </div>

      {/* %graso + trabajo + horario entreno */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">% graso (opcional)</label>
          <input
            type="number"
            min={3}
            max={50}
            step={0.1}
            value={value.body_fat_pct ?? ""}
            onChange={(e) => set("body_fat_pct", e.target.value ? Number(e.target.value) : null)}
            placeholder="Ej: 18"
            className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Horario entreno</label>
          <input
            type="time"
            value={value.training_time ?? ""}
            onChange={(e) => set("training_time", e.target.value || null)}
            className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Tipo de trabajo</label>
        <div className="grid grid-cols-2 gap-2">
          {JOB_ACTIVITIES.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("job_activity", opt.value)}
              className={`p-2.5 rounded-xl border text-sm transition-all ${
                value.job_activity === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Salud */}
      <div>
        <label className="block text-xs text-muted mb-2">Patologias o condiciones medicas</label>
        <div className="flex flex-wrap gap-2">
          {PATHOLOGIES_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => set("pathologies", toggleInArray(value.pathologies, p))}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                (value.pathologies ?? []).includes(p)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-2">Intolerancias / alergias alimentarias</label>
        <div className="flex flex-wrap gap-2">
          {INTOLERANCES_OPTIONS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => set("intolerances", toggleInArray(value.intolerances, i))}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                (value.intolerances ?? []).includes(i)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Alimentos que NO consumis (separados por coma)</label>
        <input
          type="text"
          value={dislikedFoodsText}
          onChange={(e) => {
            const arr = e.target.value
              .split(",")
              .map(s => s.trim())
              .filter(s => s.length > 0);
            set("disliked_foods", arr);
          }}
          placeholder="Ej: pescado, palta, brocoli"
          maxLength={200}
          className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Comidas por dia preferidas</label>
        <div className="grid grid-cols-4 gap-2">
          {[3, 4, 5, 6].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set("meals_per_day", n)}
              className={`p-2.5 rounded-xl border text-center font-medium transition-all text-sm ${
                value.meals_per_day === n
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Region + presupuesto */}
      <div>
        <label className="block text-xs text-muted mb-2">Pais</label>
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleCountryChange(c.value)}
              className={`p-2 rounded-xl border text-center text-xs font-medium transition-all ${
                value.country === c.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Ciudad (opcional)</label>
          <input
            type="text"
            value={value.city ?? ""}
            onChange={(e) => set("city", e.target.value || null)}
            placeholder="Ej: Montevideo"
            maxLength={50}
            className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">
            Presupuesto mensual ({value.food_budget_currency ?? "UYU"})
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={value.food_budget_monthly ?? ""}
            onChange={(e) => set("food_budget_monthly", e.target.value ? Number(e.target.value) : null)}
            placeholder="Ej: 8000"
            className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Tiempo cocina/dia (min)</label>
          <input
            type="number"
            min={0}
            max={240}
            step={5}
            value={value.cooking_time_per_day ?? ""}
            onChange={(e) => set("cooking_time_per_day", e.target.value ? Number(e.target.value) : null)}
            placeholder="Ej: 30"
            className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Frecuencia compras</label>
          <div className="grid grid-cols-3 gap-1">
            {SHOPPING_FREQUENCIES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("shopping_frequency", opt.value)}
                className={`p-2 rounded-lg border text-[11px] font-medium transition-all ${
                  value.shopping_frequency === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-card-border hover:border-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suplementacion */}
      <div>
        <label className="block text-xs text-muted mb-2">¿Usas suplementos actualmente?</label>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: true, l: "Si" }, { v: false, l: "No" }].map(opt => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => set("uses_supplements", opt.v)}
              className={`p-2.5 rounded-xl border font-medium transition-all text-sm ${
                value.uses_supplements === opt.v
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {value.uses_supplements === true && (
        <div>
          <label className="block text-xs text-muted mb-2">¿Cuales?</label>
          <div className="flex flex-wrap gap-2">
            {SUPPLEMENTS_OPTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set("current_supplements", toggleInArray(value.current_supplements, s))}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  (value.current_supplements ?? []).includes(s)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-card-border hover:border-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-muted mb-2">¿Queres recibir recomendaciones de suplementos?</label>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: true, l: "Si, recomienden" }, { v: false, l: "No, gracias" }].map(opt => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => set("wants_supplement_advice", opt.v)}
              className={`p-2.5 rounded-xl border font-medium transition-all text-sm ${
                value.wants_supplement_advice === opt.v
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-card-border hover:border-muted"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper: detecta cuales campos clave NO estan completos. Usado para mostrar
// banner "Completa tu perfil para mejores recomendaciones".
export function getMissingV2Fields(v: SurveyV2Values): string[] {
  const missing: string[] = [];
  if (v.body_fat_pct == null)        missing.push("% graso");
  if (!v.job_activity)               missing.push("tipo de trabajo");
  if (!v.country)                    missing.push("pais");
  if (v.food_budget_monthly == null) missing.push("presupuesto");
  if (v.wants_supplement_advice == null) missing.push("preferencia de suplementos");
  return missing;
}
