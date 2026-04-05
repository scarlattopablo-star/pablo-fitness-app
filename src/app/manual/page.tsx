"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronUp, Dumbbell, UtensilsCrossed,
  TrendingUp, User, Smartphone, HelpCircle, LogIn, LayoutDashboard,
  BookOpen, Target, Scale, Camera, RefreshCw, Search, Play, Save,
  Plus, BarChart3, Apple, Download,
} from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ icon, title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-card-border/10 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="flex-1 font-bold text-sm">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted space-y-4 border-t border-card-border/30 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shrink-0 text-black text-xs font-black">
        {number}
      </div>
      <div>
        <p className="font-bold text-foreground text-sm">{title}</p>
        <p className="text-muted text-xs mt-1">{desc}</p>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs">
      <span className="text-primary font-bold">Tip: </span>
      <span className="text-muted">{children}</span>
    </div>
  );
}

export default function ManualPage() {
  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-muted hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Manual de Usuario</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">Como usar la App</h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Guia completa para aprovechar al maximo tu plan de entrenamiento y nutricion personalizado.
          </p>
        </div>

        <div className="space-y-3">
          {/* 1. PRIMEROS PASOS */}
          <Section
            icon={<LogIn className="h-5 w-5 text-black" />}
            title="Primeros Pasos"
            defaultOpen={true}
          >
            <p className="text-foreground font-semibold">Registro y primer acceso</p>

            <div className="space-y-3">
              <Step
                number={1}
                title="Crea tu cuenta"
                desc="Ingresa tu nombre, email y una contraseña de al menos 6 caracteres. Acepta los terminos y condiciones."
              />
              <Step
                number={2}
                title="Completa la encuesta"
                desc="Respondemos unas preguntas sobre tu cuerpo, objetivos, nivel de actividad, dias de entrenamiento y horarios. Esto nos permite calcular tus macros y crear tu plan personalizado."
              />
              <Step
                number={3}
                title="Fotos iniciales (opcional)"
                desc="Subi fotos de frente, perfil y espalda. Son privadas y te serviran para comparar tu progreso mas adelante."
              />
              <Step
                number={4}
                title="Tu plan se genera automaticamente"
                desc="En base a tus respuestas, se calcula tu TMB, TDEE y macros. Se genera un plan de entrenamiento y nutricion exclusivo para vos."
              />
            </div>

            <Tip>Si olvidaste tu contraseña, usa el link &quot;Olvidaste tu contraseña?&quot; en la pantalla de login para recibir un email de recuperacion.</Tip>
          </Section>

          {/* 2. DASHBOARD */}
          <Section
            icon={<LayoutDashboard className="h-5 w-5 text-black" />}
            title="Tu Dashboard"
          >
            <p>El dashboard es tu pantalla principal. Aca ves todo de un vistazo:</p>

            <div className="space-y-2">
              <div className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-foreground text-xs flex items-center gap-2"><Target className="h-3.5 w-3.5 text-primary" /> Macros Diarios</p>
                <p className="text-xs mt-1">Tus calorias, proteinas, carbohidratos y grasas calculados para el dia. Estos valores se recalculan cada vez que actualizas tu peso.</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-foreground text-xs flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Progreso Rapido</p>
                <p className="text-xs mt-1">Peso actual, kilos perdidos/ganados y dias activos en el programa.</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-foreground text-xs flex items-center gap-2"><Dumbbell className="h-3.5 w-3.5 text-primary" /> Accesos Directos</p>
                <p className="text-xs mt-1">Botones rapidos para ir a tu plan de entrenamiento, nutricion o progreso.</p>
              </div>
            </div>

            <Tip>Si ves una alerta naranja pidiendo actualizar tu progreso, es porque pasaron mas de 20 dias desde tu ultimo registro. Mantene tu progreso al dia para mejores resultados.</Tip>
          </Section>

          {/* 3. ENTRENAMIENTO */}
          <Section
            icon={<Dumbbell className="h-5 w-5 text-black" />}
            title="Plan de Entrenamiento"
          >
            <p>Tu rutina personalizada organizada por dias.</p>

            <p className="text-foreground font-semibold mt-2">Ver tu rutina</p>
            <p>Cada dia de entrenamiento muestra los ejercicios con series, repeticiones y descanso. Toca un ejercicio para ver el GIF animado de como ejecutarlo.</p>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><Play className="h-4 w-4 text-primary" /> Iniciar sesion de entrenamiento</p>
            <div className="space-y-2">
              <Step number={1} title="Toca 'Iniciar Sesion'" desc="En el dia que vas a entrenar, toca el boton para activar el modo de registro." />
              <Step number={2} title="Registra peso y reps" desc="Para cada ejercicio, ingresa el peso (kg) y las repeticiones de cada serie. La app te muestra tu ultimo peso como referencia." />
              <Step number={3} title="Guarda la sesion" desc="Al terminar, toca 'Guardar Sesion'. Tus datos quedan registrados para ver tu progreso de fuerza." />
            </div>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Biblioteca de ejercicios</p>
            <p>En la seccion Ejercicios podes buscar cualquier ejercicio por nombre o filtrar por grupo muscular (pecho, espalda, piernas, etc.). Cada ejercicio tiene descripcion, pasos de ejecucion y video demostrativo.</p>

            <Tip>Tu ultimo peso registrado aparece en verde si mejoraste respecto a la sesion anterior. Usa esto como guia para progresion.</Tip>
          </Section>

          {/* 4. NUTRICION */}
          <Section
            icon={<UtensilsCrossed className="h-5 w-5 text-black" />}
            title="Plan de Nutricion"
          >
            <p>Tu plan de alimentacion con comidas reales y porciones exactas en gramos.</p>

            <p className="text-foreground font-semibold mt-2">Como leer tu plan</p>
            <p>Cada comida muestra el horario, los alimentos con sus gramos, y los macros totales (calorias, proteinas, carbos y grasas).</p>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" /> Cambiar un alimento (Swap)</p>
            <div className="space-y-2">
              <Step number={1} title="Toca el alimento que queres cambiar" desc="Aparece un boton de swap (intercambio) al lado de cada alimento." />
              <Step number={2} title="Elegi el reemplazo" desc="La app te muestra alimentos de la misma categoria (proteinas, carbos, grasas). Podes buscar por nombre." />
              <Step number={3} title="Los gramos se ajustan solos" desc="Al elegir un nuevo alimento, la app calcula automaticamente cuantos gramos necesitas para mantener los mismos macros." />
            </div>

            <Tip>Podes cambiar alimentos todas las veces que quieras sin alterar los macros de tu plan. La app recalcula todo automaticamente.</Tip>
          </Section>

          {/* 5. PROGRESO */}
          <Section
            icon={<TrendingUp className="h-5 w-5 text-black" />}
            title="Seguimiento de Progreso"
          >
            <p>Registra tu evolucion para ver resultados reales.</p>

            <p className="text-foreground font-semibold mt-2 flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Registrar peso y medidas</p>
            <div className="space-y-2">
              <Step number={1} title="Toca '+ Registrar'" desc="Ingresa tu peso actual en kg." />
              <Step number={2} title="Medidas corporales (opcional)" desc="Podes agregar pecho, cintura, cadera, brazos y piernas en cm." />
              <Step number={3} title="Fotos de progreso (opcional)" desc="Subi fotos de frente, perfil y espalda para comparar visualmente." />
            </div>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Graficos</p>
            <p>La seccion de progreso muestra graficos interactivos de:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Evolucion de peso en el tiempo</li>
              <li>Cambios en medidas corporales</li>
              <li>Progresion de fuerza por ejercicio</li>
              <li>Distribucion de macros</li>
            </ul>

            <Tip>Cada vez que registras un nuevo peso, tus macros se recalculan automaticamente. Vas a ver un banner verde confirmando la actualizacion.</Tip>
          </Section>

          {/* 6. PERFIL */}
          <Section
            icon={<User className="h-5 w-5 text-black" />}
            title="Tu Perfil"
          >
            <p>Gestiona tu informacion personal y ve el estado de tu suscripcion.</p>

            <div className="space-y-2">
              <div className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-foreground text-xs">Datos personales</p>
                <p className="text-xs mt-1">Podes editar tu nombre y telefono. El email no se puede cambiar.</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-foreground text-xs">Suscripcion</p>
                <p className="text-xs mt-1">Ve tu plan actual, fecha de inicio, fecha de vencimiento y estado (activo/expirado).</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-foreground text-xs">Datos de encuesta</p>
                <p className="text-xs mt-1">Tu edad, sexo, peso inicial, altura, nivel de actividad y restricciones alimentarias.</p>
              </div>
            </div>
          </Section>

          {/* 7. INSTALAR APP */}
          <Section
            icon={<Smartphone className="h-5 w-5 text-black" />}
            title="Instalar la App en tu Celular"
          >
            <p>La app se puede instalar en tu celular como si fuera de la tienda de aplicaciones.</p>

            <p className="text-foreground font-semibold mt-2 flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Android</p>
            <div className="space-y-2">
              <Step number={1} title="Abri la app en Chrome" desc="Ingresa a pabloscarlattoentrenamientos.com desde Google Chrome." />
              <Step number={2} title="Toca 'Instalar' o 'Agregar a pantalla de inicio'" desc="Chrome te mostrara un banner o podes ir al menu (3 puntos) > 'Instalar aplicacion'." />
              <Step number={3} title="Listo!" desc="La app aparece en tu pantalla de inicio como cualquier otra aplicacion." />
            </div>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><Apple className="h-4 w-4 text-primary" /> iPhone (iOS)</p>
            <div className="space-y-2">
              <Step number={1} title="Abri la app en Safari" desc="Ingresa a pabloscarlattoentrenamientos.com desde Safari (no Chrome)." />
              <Step number={2} title="Toca el boton de compartir" desc="Es el icono con la flecha hacia arriba en la barra inferior." />
              <Step number={3} title="Selecciona 'Agregar a pantalla de inicio'" desc="Ponele un nombre y toca 'Agregar'. La app aparece en tu inicio." />
            </div>

            <Tip>Una vez instalada, la app funciona incluso sin conexion a internet. Tus datos se sincronizan cuando vuelvas a tener señal.</Tip>
          </Section>

          {/* 8. FAQ */}
          <Section
            icon={<HelpCircle className="h-5 w-5 text-black" />}
            title="Preguntas Frecuentes"
          >
            <div className="space-y-4">
              <div>
                <p className="font-bold text-foreground text-xs">Puedo cambiar mi objetivo despues de empezar?</p>
                <p className="text-xs mt-1">Contacta a tu entrenador por Instagram (@pabloscarlattoentrenamientos) para que ajuste tu plan segun tu nuevo objetivo.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Cada cuanto debo registrar mi progreso?</p>
                <p className="text-xs mt-1">Lo ideal es registrar tu peso y medidas cada 1-2 semanas. Las fotos cada 4 semanas para ver cambios visuales.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">No me gusta un alimento del plan, puedo cambiarlo?</p>
                <p className="text-xs mt-1">Si! Usa la funcion de Swap (intercambio) en tu plan de nutricion. La app te sugiere alternativas que mantienen los mismos macros.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Como se que estoy progresando?</p>
                <p className="text-xs mt-1">En la seccion Progreso ves graficos de peso, medidas y fuerza. Tambien compara tus fotos de antes y despues.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">La app funciona sin internet?</p>
                <p className="text-xs mt-1">Si, una vez instalada la app cachea tus datos. Podes ver tu plan y ejercicios sin conexion. Los cambios se sincronizan cuando vuelvas a tener internet.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Que pasa cuando vence mi plan?</p>
                <p className="text-xs mt-1">Veras un banner indicando que tu suscripcion expiro. Podes renovar eligiendo un nuevo plan desde la seccion de planes.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Como contacto a mi entrenador?</p>
                <p className="text-xs mt-1">Por Instagram: <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a>. Tambien podes encontrar el link en tu dashboard.</p>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted">
          <p>Necesitas mas ayuda?</p>
          <a
            href="https://instagram.com/pabloscarlattoentrenamientos"
            className="text-primary font-bold hover:underline"
          >
            Contacta a Pablo por Instagram
          </a>
        </div>
      </div>
    </main>
  );
}
