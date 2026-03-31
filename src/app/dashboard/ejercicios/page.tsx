"use client";

import { useState } from "react";
import { Search, Play, X, ChevronDown } from "lucide-react";
import { EXERCISES, MUSCLE_GROUP_LABELS, getVideoUrl } from "@/lib/exercises-data";
import type { Exercise } from "@/types";

const ALL_GROUPS = Object.keys(MUSCLE_GROUP_LABELS);

export default function EjerciciosPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const filtered = EXERCISES.filter((ex) => {
    const matchesGroup = selectedGroup === "todos" || ex.muscleGroup === selectedGroup;
    const matchesSearch = search === "" || ex.name.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Biblioteca de Ejercicios</h1>
      <p className="text-muted mb-6">Aprendé la técnica correcta de cada ejercicio</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full bg-card-bg border border-card-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedGroup("todos")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedGroup === "todos"
              ? "gradient-primary text-black"
              : "glass-card text-muted hover:text-white"
          }`}
        >
          Todos
        </button>
        {ALL_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedGroup === group
                ? "gradient-primary text-black"
                : "glass-card text-muted hover:text-white"
            }`}
          >
            {MUSCLE_GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => setSelectedExercise(exercise)}
            className="glass-card rounded-2xl p-5 text-left hover-glow transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
              </span>
              {exercise.videoUrl && (
                <Play className="h-4 w-4 text-primary" />
              )}
            </div>
            <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">
              {exercise.name}
            </h3>
            <p className="text-sm text-muted line-clamp-2">{exercise.description}</p>
            <p className="text-xs text-primary mt-3 flex items-center gap-1">
              Ver detalles <ChevronDown className="h-3 w-3" />
            </p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p>No se encontraron ejercicios</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedExercise(null)}>
          <div className="glass-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedExercise.name}</h3>
              <button onClick={() => setSelectedExercise(null)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <span className="inline-block text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize mb-4">
              {MUSCLE_GROUP_LABELS[selectedExercise.muscleGroup]}
            </span>

            <p className="text-muted mb-4">{selectedExercise.description}</p>

            <a
              href={getVideoUrl(selectedExercise)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card-bg rounded-xl p-4 mb-6 hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <Play className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="font-medium">Ver Video Demostrativo</p>
                <p className="text-xs text-muted">Ejecución correcta paso a paso</p>
              </div>
            </a>

            <h4 className="font-bold mb-3">Ejecución Paso a Paso</h4>
            <ol className="space-y-3">
              {selectedExercise.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-muted text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
