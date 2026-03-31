"use client";

import { useState } from "react";
import { Dumbbell, UtensilsCrossed, Info, Play, X } from "lucide-react";
import { getExerciseById, getVideoUrl } from "@/lib/exercises-data";

// Mock training plan - similar to Pablo's format
const TRAINING_DAYS = [
  {
    day: "Lunes - Pecho y Tríceps",
    exercises: [
      { id: "press-banca-plano", name: "Press Banca Plano", sets: 4, reps: "10", rest: "90s" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas", sets: 4, reps: "12", rest: "60s" },
      { id: "extension-triceps-polea", name: "Extensión Tríceps Polea", sets: 4, reps: "12", rest: "60s" },
      { id: "fondos-triceps", name: "Fondos de Tríceps", sets: 3, reps: "15", rest: "60s" },
    ],
    instructions: "Descanso entre series: como indicado. Calentar 5 min en cinta.",
  },
  {
    day: "Martes - Espalda y Bíceps",
    exercises: [
      { id: "jalon-polea-alta", name: "Jalón Polea Alta", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-con-barra", name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-mancuerna", name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-biceps-barra", name: "Curl Bíceps Barra", sets: 4, reps: "10", rest: "60s" },
      { id: "curl-martillo", name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
    ],
    instructions: "Trabajar con control en la fase excéntrica (bajada lenta).",
  },
  {
    day: "Miércoles - Piernas",
    exercises: [
      { id: "sentadilla", name: "Sentadilla con Barra", sets: 4, reps: "10", rest: "120s" },
      { id: "prensa-piernas", name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "45s", rest: "30s" },
    ],
    instructions: "En sentadilla: bajar hasta paralelo o más abajo. Usar cinturón si es necesario.",
  },
  {
    day: "Jueves - Hombros y Abdomen",
    exercises: [
      { id: "press-hombros", name: "Press Hombros Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", sets: 4, reps: "15", rest: "60s" },
      { id: "crunch-polea", name: "Crunch en Polea", sets: 4, reps: "15", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "60s", rest: "30s" },
    ],
    instructions: "Elevaciones laterales con peso controlado, no usar impulso.",
  },
  {
    day: "Viernes - Circuito Full Body + Cardio",
    exercises: [
      { id: "sentadilla", name: "Sentadilla", sets: 3, reps: "15", rest: "30s" },
      { id: "press-banca-plano", name: "Press Banca", sets: 3, reps: "12", rest: "30s" },
      { id: "jalon-polea-alta", name: "Jalón Polea", sets: 3, reps: "12", rest: "30s" },
      { id: "press-hombros", name: "Press Hombros", sets: 3, reps: "12", rest: "30s" },
      { id: "hiit-cinta", name: "HIIT Cinta", sets: 1, reps: "15 min", rest: "-" },
    ],
    instructions: "Trabajar en circuito sin descanso entre ejercicios. Descanso de 90s entre vueltas. Ejecutar 3 vueltas.",
  },
];

const MEAL_PLAN = {
  meals: [
    {
      name: "DESAYUNO",
      time: "7:00",
      foods: ["2 huevos revueltos", "30g avena", "1 fruta", "1 café", "1 cápsula omega 3 + creatina"],
    },
    {
      name: "COMIDA 2",
      time: "10:00",
      foods: ["Yogurt descremado", "30g avena", "1 manzana", "1 cucharada de miel", "10g nueces"],
    },
    {
      name: "COMIDA 3",
      time: "13:00",
      foods: ["150g pollo", "150g boniato", "Ensalada verde", "1 cucharada aceite oliva"],
    },
    {
      name: "COMIDA 4",
      time: "16:00",
      foods: ["4 claras de huevo", "2 galletas de arroz", "1 banana"],
    },
    {
      name: "COMIDA 5",
      time: "19:00",
      foods: ["150g pescado o pollo (suprema)", "200g zapallo y zanahoria al vapor"],
    },
    {
      name: "COMIDA 6",
      time: "21:00",
      foods: ["3 claras", "1 galleta de arroz", "Infusión de cola de caballo"],
    },
  ],
  importantNotes: [
    "COMER CADA 3 HORAS",
    "TOMAR 3 LITROS DE AGUA AL DÍA",
    "NO AZÚCAR, ENDULZAR CON EDULCORANTE",
    "NO ALCOHOL",
  ],
};

export default function PlanPage() {
  const [tab, setTab] = useState<"entrenamiento" | "nutricion">("entrenamiento");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exerciseDetail = selectedExercise ? getExerciseById(selectedExercise) : null;

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Mi Plan</h1>
      <p className="text-muted mb-6">Plan Quema Grasa - Semana 5</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("entrenamiento")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            tab === "entrenamiento"
              ? "gradient-primary text-black"
              : "glass-card text-muted hover:text-white"
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          Entrenamiento
        </button>
        <button
          onClick={() => setTab("nutricion")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            tab === "nutricion"
              ? "gradient-primary text-black"
              : "glass-card text-muted hover:text-white"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Nutrición
        </button>
      </div>

      {/* TRAINING */}
      {tab === "entrenamiento" && (
        <div className="space-y-4">
          {TRAINING_DAYS.map((day) => (
            <div key={day.day} className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h3 className="font-bold">{day.day}</h3>
                {day.instructions && (
                  <p className="text-xs text-muted mt-1">{day.instructions}</p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted text-xs border-b border-card-border">
                      <th className="text-left p-3 font-medium">Ejercicio</th>
                      <th className="text-center p-3 font-medium">Series</th>
                      <th className="text-center p-3 font-medium">Reps</th>
                      <th className="text-center p-3 font-medium">Descanso</th>
                      <th className="text-center p-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.exercises.map((ex, i) => (
                      <tr key={i} className="border-b border-card-border/50 last:border-0">
                        <td className="p-3 font-medium">{ex.name}</td>
                        <td className="p-3 text-center text-primary font-bold">{ex.sets}</td>
                        <td className="p-3 text-center">{ex.reps}</td>
                        <td className="p-3 text-center text-muted">{ex.rest}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedExercise(ex.id)}
                            className="text-primary hover:text-primary-light transition-colors"
                            title="Ver cómo se hace"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NUTRITION */}
      {tab === "nutricion" && (
        <div>
          <div className="glass-card rounded-2xl p-4 mb-4 border-l-4 border-warning">
            <p className="font-bold text-warning text-sm mb-1">IMPORTANTE</p>
            <ul className="space-y-1">
              {MEAL_PLAN.importantNotes.map((note) => (
                <li key={note} className="text-sm text-muted">{note}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {MEAL_PLAN.meals.map((meal) => (
              <div key={meal.name} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-primary">{meal.name}</h3>
                  <span className="text-xs text-muted">{meal.time}</span>
                </div>
                <ul className="space-y-1">
                  {meal.foods.map((food, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-2">
                      <span className="text-primary mt-1">&#8226;</span>
                      {food}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {exerciseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedExercise(null)}>
          <div className="glass-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{exerciseDetail.name}</h3>
              <button onClick={() => setSelectedExercise(null)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-card-bg rounded-xl p-3 mb-4 flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                {exerciseDetail.muscleGroup}
              </span>
            </div>

            <p className="text-sm text-muted mb-4">{exerciseDetail.description}</p>

            <a
              href={getVideoUrl(exerciseDetail)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card-bg rounded-xl p-4 mb-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Play className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Ver Video Demostrativo</p>
                <p className="text-xs text-muted">Ejecución correcta paso a paso</p>
              </div>
            </a>

            <h4 className="font-bold text-sm mb-3">Paso a Paso</h4>
            <ol className="space-y-2">
              {exerciseDetail.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
