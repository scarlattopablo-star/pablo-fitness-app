"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, Search,
  Apple, Beef, Wheat, Droplets, Leaf,
} from "lucide-react";
import Link from "next/link";

interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  category: string;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: "protein", label: "Proteina", icon: Beef, color: "text-red-400" },
  { value: "carb", label: "Carbohidrato", icon: Wheat, color: "text-amber-400" },
  { value: "fat", label: "Grasa", icon: Droplets, color: "text-yellow-400" },
  { value: "vegetable", label: "Vegetal", icon: Leaf, color: "text-green-400" },
  { value: "fruit", label: "Fruta", icon: Apple, color: "text-pink-400" },
  { value: "dairy", label: "Lacteo", icon: Droplets, color: "text-blue-400" },
  { value: "other", label: "Otro", icon: Apple, color: "text-muted" },
];

const UNIT_OPTIONS = [
  { value: "g", label: "Gramos" },
  { value: "unidad", label: "Unidad" },
  { value: "scoop", label: "Scoop" },
  { value: "cucharada", label: "Cucharada" },
];

function getCategoryInfo(cat: string) {
  return CATEGORY_OPTIONS.find(c => c.value === cat) || CATEGORY_OPTIONS[6];
}

function getUnitLabel(unit: string): string {
  if (unit === "g") return "por 100g";
  const m = unit.match(/\((\d+)\s*g\)/);
  if (m) return `por ${unit.split(" (")[0]} (${m[1]}g)`;
  return `por ${unit}`;
}

export default function AlimentosPage() {
  const { loading: authLoading } = useAuth();
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "", calories: "", protein: "", carbs: "", fat: "",
    unit: "g", gramsPerUnit: "", category: "other",
  });

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  // Load foods
  useEffect(() => {
    if (authLoading) return;
    loadFoods();
  }, [authLoading]);

  const loadFoods = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/custom-foods", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setFoods(json.foods || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const startEdit = (food: CustomFood) => {
    setEditingId(food.id);
    setShowAddForm(false);
    // Parse unit to detect unit-based foods
    const unitBase = food.unit.split(" (")[0];
    const gpuMatch = food.unit.match(/\((\d+)\s*g\)/);
    const gramsPerUnit = gpuMatch ? gpuMatch[1] : "";
    // If unit-based, convert macros back from per-100g to per-unit
    let cal = food.calories;
    let pro = food.protein;
    let carb = food.carbs;
    let fatVal = food.fat;
    if (gramsPerUnit && parseInt(gramsPerUnit) > 0) {
      const gpu = parseInt(gramsPerUnit);
      const factor = gpu / 100;
      cal = Math.round(food.calories * factor);
      pro = Math.round(food.protein * factor * 10) / 10;
      carb = Math.round(food.carbs * factor * 10) / 10;
      fatVal = Math.round(food.fat * factor * 10) / 10;
    }
    setFormData({
      name: food.name,
      calories: String(cal),
      protein: String(pro),
      carbs: String(carb),
      fat: String(fatVal),
      unit: unitBase === "g" ? "g" : unitBase,
      gramsPerUnit,
      category: food.category || "other",
    });
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ name: "", calories: "", protein: "", carbs: "", fat: "", unit: "g", gramsPerUnit: "", category: "other" });
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const buildPayload = () => {
    const gpuVal = parseInt(formData.gramsPerUnit) || 0;
    let unitStr = "g";
    if (formData.unit !== "g" && gpuVal > 0) {
      unitStr = `${formData.unit} (${gpuVal}g)`;
    }
    // Convert from per-unit to per-100g if needed
    let cal100 = Number(formData.calories) || 0;
    let pro100 = Number(formData.protein) || 0;
    let carb100 = Number(formData.carbs) || 0;
    let fat100 = Number(formData.fat) || 0;
    if (formData.unit !== "g" && gpuVal > 0) {
      const factor = 100 / gpuVal;
      cal100 = Math.round(cal100 * factor);
      pro100 = Math.round(pro100 * factor * 10) / 10;
      carb100 = Math.round(carb100 * factor * 10) / 10;
      fat100 = Math.round(fat100 * factor * 10) / 10;
    }
    return {
      name: formData.name.trim(),
      calories: cal100,
      protein: pro100,
      carbs: carb100,
      fat: fat100,
      unit: unitStr,
      category: formData.category,
    };
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      alert("Nombre requerido (min 2 caracteres)");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const payload = buildPayload();
      const isEdit = !!editingId;
      const res = await fetch("/api/admin/custom-foods", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });
      if (res.ok) {
        await loadFoods();
        cancelForm();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (foodId: string) => {
    if (!confirm("Eliminar este alimento? No se puede deshacer.")) return;
    setDeletingId(foodId);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/custom-foods?id=${foodId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFoods(prev => prev.filter(f => f.id !== foodId));
        if (editingId === foodId) cancelForm();
      } else {
        alert("Error al eliminar");
      }
    } catch {
      alert("Error de conexion");
    }
    setDeletingId(null);
  };

  const filtered = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-muted hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black">Alimentos personalizados</h1>
          <p className="text-xs text-muted">{foods.length} alimento{foods.length !== 1 ? "s" : ""} creado{foods.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={startAdd}
          className="gradient-primary text-black font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar alimento..."
          className="w-full bg-card-bg border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Add / Edit form */}
      {(showAddForm || editingId) && (
        <div className="glass-card rounded-2xl p-4 mb-4 border border-primary/30">
          <p className="text-sm font-bold text-primary mb-3">
            {editingId ? "Editar alimento" : "Nuevo alimento"}
          </p>

          {/* Name */}
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre del alimento"
            className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-primary"
          />

          {/* Category */}
          <div className="mb-3">
            <span className="text-[10px] text-muted block mb-1.5">Categoria:</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 ${
                    formData.category === cat.value
                      ? "bg-primary text-black"
                      : "bg-card-border/20 text-muted hover:text-white"
                  }`}
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unit type */}
          <div className="mb-3">
            <span className="text-[10px] text-muted block mb-1.5">Tipo de unidad:</span>
            <div className="flex rounded-lg overflow-hidden border border-card-border">
              {UNIT_OPTIONS.map(u => (
                <button
                  key={u.value}
                  onClick={() => setFormData({ ...formData, unit: u.value })}
                  className={`flex-1 px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                    formData.unit === u.value ? "bg-primary text-black" : "bg-card-border/20 text-muted hover:text-white"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grams per unit */}
          {formData.unit !== "g" && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-muted">Gramos por {formData.unit}:</span>
              <input
                type="number"
                value={formData.gramsPerUnit}
                onChange={e => setFormData({ ...formData, gramsPerUnit: e.target.value })}
                className="w-20 bg-card-bg border border-card-border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-primary"
                placeholder="ej: 50"
              />
              <span className="text-[10px] text-muted">g</span>
            </div>
          )}

          {/* Macros label */}
          <p className="text-[10px] text-muted mb-2">
            {formData.unit === "g"
              ? "Valores por cada 100g:"
              : `Valores por cada ${formData.unit} (${formData.gramsPerUnit || "?"}g):`
            }
          </p>

          {/* Macro inputs */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { key: "calories", label: "Calorias", color: "text-amber-400" },
              { key: "protein", label: "Proteina", color: "text-red-400" },
              { key: "carbs", label: "Carbos", color: "text-blue-400" },
              { key: "fat", label: "Grasas", color: "text-yellow-400" },
            ].map(field => (
              <div key={field.key}>
                <label className={`text-[9px] block mb-0.5 ${field.color}`}>{field.label}</label>
                <input
                  type="number"
                  value={formData[field.key as keyof typeof formData]}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full bg-card-bg border border-card-border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary text-black text-sm font-bold py-2 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "Guardar cambios" : "Crear alimento"}
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 text-sm text-muted hover:text-white border border-card-border rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Foods list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Apple className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">
            {search ? "No se encontraron alimentos" : "No hay alimentos personalizados"}
          </p>
          {!search && (
            <p className="text-xs text-muted mt-1">
              Crea uno desde aca o desde el editor de nutricion de un cliente
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(food => {
            const catInfo = getCategoryInfo(food.category);
            const CatIcon = catInfo.icon;
            const isEditing = editingId === food.id;
            return (
              <div
                key={food.id}
                className={`glass-card rounded-xl p-3 transition-all ${isEditing ? "ring-1 ring-primary" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-card-bg flex items-center justify-center ${catInfo.color}`}>
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{food.name}</p>
                    <p className="text-[10px] text-muted">
                      {food.calories} kcal · {food.protein}P · {food.carbs}C · {food.fat}G
                      <span className="ml-1 text-muted/60">{getUnitLabel(food.unit)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(food)}
                      className="w-8 h-8 rounded-lg bg-card-bg flex items-center justify-center text-muted hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(food.id)}
                      disabled={deletingId === food.id}
                      className="w-8 h-8 rounded-lg bg-card-bg flex items-center justify-center text-muted hover:text-danger transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingId === food.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
