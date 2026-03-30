"use client";

import { useState } from "react";
import { User, Mail, Phone, Save, Shield } from "lucide-react";

export default function PerfilPage() {
  const [fullName, setFullName] = useState("Cliente Demo");
  const [email] = useState("cliente@email.com");
  const [phone, setPhone] = useState("+598 99 123 456");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Save to Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Mi Perfil</h1>
      <p className="text-muted mb-8">Administrá tu información personal</p>

      <div className="max-w-xl space-y-6">
        {/* Personal Info */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Información Personal
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted mt-1">El email no se puede cambiar</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Plan Info */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Mi Plan
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Plan</span>
              <span className="font-medium">Quema Grasa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Duración</span>
              <span className="font-medium">3 Meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Inicio</span>
              <span className="font-medium">1 Mar 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Vencimiento</span>
              <span className="font-medium">1 Jun 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Estado</span>
              <span className="text-primary font-bold">Activo</span>
            </div>
          </div>
        </div>

        {/* Survey Data */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Datos de mi Encuesta</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-card-bg rounded-xl p-3">
              <p className="text-xs text-muted">Edad</p>
              <p className="font-bold">28 años</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3">
              <p className="text-xs text-muted">Sexo</p>
              <p className="font-bold">Hombre</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3">
              <p className="text-xs text-muted">Peso inicial</p>
              <p className="font-bold">88 kg</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3">
              <p className="text-xs text-muted">Altura</p>
              <p className="font-bold">175 cm</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3">
              <p className="text-xs text-muted">Actividad</p>
              <p className="font-bold">Moderado</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3">
              <p className="text-xs text-muted">Restricciones</p>
              <p className="font-bold">Ninguna</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Save className="h-5 w-5" />
          {saved ? "Guardado!" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
