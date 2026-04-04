"use client";

import { useState } from "react";
import { EXERCISES, MUSCLE_GROUP_LABELS, getVideoUrl } from "@/lib/exercises-data";
import { getExerciseGif } from "@/lib/exercise-images";
import { Search, Plus, Edit, Play, Video, X } from "lucide-react";

export default function AdminEjerciciosPage() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("todos");
  const [expandedGif, setExpandedGif] = useState<{ src: string; name: string } | null>(null);

  const filtered = EXERCISES.filter((ex) => {
    const matchesGroup = selectedGroup === "todos" || ex.muscleGroup === selectedGroup;
    const matchesSearch = search === "" || ex.name.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Biblioteca de Ejercicios</h1>
          <p className="text-muted">{EXERCISES.length} ejercicios registrados</p>
        </div>
        <button className="gradient-primary text-black font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="w-full bg-card-bg border border-card-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedGroup("todos")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedGroup === "todos" ? "gradient-primary text-black" : "glass-card text-muted hover:text-white"
          }`}
        >
          Todos ({EXERCISES.length})
        </button>
        {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => {
          const count = EXERCISES.filter(e => e.muscleGroup === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedGroup(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedGroup === key ? "gradient-primary text-black" : "glass-card text-muted hover:text-white"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="text-left p-4 font-medium">Ejercicio</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Músculo</th>
                <th className="text-center p-4 font-medium">Video</th>
                <th className="text-center p-4 font-medium">Pasos</th>
                <th className="text-center p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exercise) => (
                <tr key={exercise.id} className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {getExerciseGif(exercise.id) && (
                        <button onClick={() => setExpandedGif({ src: getExerciseGif(exercise.id)!, name: exercise.name })} className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 hover:ring-2 hover:ring-primary/50 transition-all">
                          <img src={getExerciseGif(exercise.id)} alt={exercise.name} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      )}
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-xs text-muted line-clamp-1 sm:hidden capitalize">{exercise.muscleGroup}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <a
                      href={getVideoUrl(exercise)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Play className="h-3 w-3" /> Ver Video
                    </a>
                  </td>
                  <td className="p-4 text-center text-muted">{exercise.steps.length}</td>
                  <td className="p-4 text-center">
                    <button className="text-muted hover:text-primary transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expandedGif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setExpandedGif(null)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setExpandedGif(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white/10 rounded-2xl overflow-hidden">
              <img src={expandedGif.src} alt={expandedGif.name} className="w-72 h-72 sm:w-80 sm:h-80 object-contain" />
            </div>
            <p className="text-center text-sm font-bold mt-3">{expandedGif.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
