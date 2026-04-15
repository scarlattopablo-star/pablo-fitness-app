"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronUp, Dumbbell, UtensilsCrossed,
  TrendingUp, User, Smartphone, HelpCircle, LogIn, LayoutDashboard,
  BookOpen, Target, Scale, Camera, RefreshCw, Search, Play, Save,
  Plus, BarChart3, Apple, Download, MessageCircle, Bell, Users,
  Trophy, Flame, Gift, Star,
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

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><Play className="h-4 w-4 text-primary" /> Timer de descanso</p>
            <p>Al marcar una serie como completada, se activa automaticamente un timer de descanso con sonido y vibracion. Podes pausar o saltar el timer si preferis descansar mas o menos.</p>

            <p className="text-foreground font-semibold mt-3">Metodos avanzados de entrenamiento</p>
            <p>Dependiendo de tu nivel y objetivo, tu plan puede incluir metodos avanzados:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs mt-1">
              <li><strong className="text-foreground">Super Series:</strong> dos ejercicios seguidos sin descanso</li>
              <li><strong className="text-foreground">Drop Sets:</strong> al terminar, baja el peso 20-25% y segui sin descanso</li>
              <li><strong className="text-foreground">Rest-Pause:</strong> reps hasta casi el fallo, descansa 15-20s, segui</li>
              <li><strong className="text-foreground">Cluster Sets:</strong> 2 reps, descansa 15s, 2 reps mas, descansa 15s, 2 mas</li>
              <li><strong className="text-foreground">Series Gigantes:</strong> 3+ ejercicios seguidos sin descanso</li>
              <li><strong className="text-foreground">Piramidal:</strong> subi el peso y baja las reps cada serie</li>
            </ul>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Biblioteca de ejercicios</p>
            <p>En la seccion Ejercicios podes buscar cualquier ejercicio por nombre o filtrar por grupo muscular (pecho, espalda, piernas, etc.). Cada ejercicio tiene descripcion, pasos de ejecucion y GIF animado.</p>

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

          {/* 4B. CONTENIDO EXTRA */}
          <Section
            icon={<Star className="h-5 w-5 text-black" />}
            title="Tips, Recetas y Retos"
          >
            <p className="text-foreground font-semibold">Tips Diarios</p>
            <p>Cada dia ves un tip nuevo en tu dashboard sobre entrenamiento, nutricion, recuperacion o mentalidad. Son 60 tips rotativos basados en evidencia cientifica.</p>

            <p className="text-foreground font-semibold mt-3">Recetas</p>
            <p>En tu plan de nutricion, algunos alimentos tienen una receta sugerida. Toca el icono del chef para ver la receta completa con ingredientes y preparacion.</p>

            <p className="text-foreground font-semibold mt-3">Retos Semanales</p>
            <p>Cada lunes se renuevan 2 retos nuevos. Completar retos te da XP bonus. Los retos pueden ser de entrenamiento, nutricion o habitos saludables.</p>

            <p className="text-foreground font-semibold mt-3">Aprende</p>
            <p>La seccion Educacion tiene 15 articulos sobre temas de fitness, nutricion y bienestar. Ideal para entender mejor tu proceso.</p>
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

          {/* 7. GYM BRO CHAT */}
          <Section
            icon={<MessageCircle className="h-5 w-5 text-black" />}
            title="Gym Bro - Chat"
          >
            <p>Comunicate con otros miembros del gym y con tu entrenador.</p>

            <p className="text-foreground font-semibold mt-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Chat General</p>
            <p>Una sala abierta para todos los usuarios. Comparte tips, motivacion y consultas con toda la comunidad del gym.</p>
            <div className="space-y-2 mt-2">
              <Step number={1} title="Anda a Gym Bro" desc="Desde el menu, toca 'Gym Bro' para ir al chat." />
              <Step number={2} title="Toca 'General'" desc="Entras al chat grupal donde estan todos los miembros." />
              <Step number={3} title="Escribi tu mensaje" desc="Todos los usuarios van a poder ver y responder tu mensaje." />
            </div>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Chat Privado</p>
            <p>Manda mensajes directos a otros miembros.</p>
            <div className="space-y-2 mt-2">
              <Step number={1} title="Toca 'Privado'" desc="En la pantalla de Gym Bro, selecciona la pestaña Privado." />
              <Step number={2} title="Elegi a quien escribir" desc="Arriba ves tus conversaciones existentes. Abajo aparece la lista completa de todos los usuarios para iniciar un chat nuevo." />
              <Step number={3} title="Chatea" desc="Los mensajes son privados entre vos y la otra persona. Ves cuando estan en linea." />
            </div>

            <Tip>El chat tiene moderacion automatica. El uso de lenguaje inapropiado genera advertencias y puede resultar en suspension del chat.</Tip>
          </Section>

          {/* 8. NOTIFICACIONES */}
          <Section
            icon={<Bell className="h-5 w-5 text-black" />}
            title="Notificaciones"
          >
            <p>Recibí alertas de mensajes nuevos con sonido y vibracion, incluso con la app cerrada.</p>

            <p className="text-foreground font-semibold mt-2">Activar notificaciones</p>
            <p>La primera vez que entres al dashboard, te va a aparecer un banner &quot;Activar notificaciones&quot;. Toca &quot;Activar&quot; y acepta el permiso.</p>

            <p className="text-foreground font-semibold mt-3">Notificaciones con la app abierta</p>
            <p>Si estas navegando en la app y alguien te escribe, vas a ver una notificacion tipo WhatsApp arriba de la pantalla con sonido. Toca la notificacion para ir directo al chat.</p>

            <p className="text-foreground font-semibold mt-3">Notificaciones con la app cerrada</p>
            <p>Si tenes la app instalada y activaste las notificaciones, recibis alertas del sistema aunque no estes usando la app. Funcionan en Android y en iPhone (con la app instalada desde Safari).</p>

            <Tip>Si no recibis notificaciones, verifica en los ajustes de tu celular que las notificaciones del navegador o de la app esten habilitadas. En iPhone, las push solo funcionan si instalaste la app desde Safari.</Tip>
          </Section>

          {/* 9. INSTALAR APP */}
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

          {/* 10. RANKING Y LOGROS */}
          <Section
            icon={<Trophy className="h-5 w-5 text-black" />}
            title="Ranking y Logros"
          >
            <p>Competi con otros usuarios y desbloquea logros para ganar XP y subir de nivel.</p>

            <p className="text-foreground font-semibold mt-2 flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Sistema de XP y Niveles</p>
            <p>Cada accion te da puntos de experiencia (XP). A medida que acumulas XP, subis de nivel:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs mt-2">
              <li><span className="text-primary font-bold">Novato</span> — 0 XP</li>
              <li><span className="text-primary font-bold">Iniciado</span> — 200 XP</li>
              <li><span className="text-primary font-bold">Intermedio</span> — 500 XP</li>
              <li><span className="text-primary font-bold">Avanzado</span> — 1.200 XP</li>
              <li><span className="text-primary font-bold">Experto</span> — 2.500 XP</li>
              <li><span className="text-primary font-bold">Elite</span> — 5.000 XP</li>
              <li><span className="text-primary font-bold">Leyenda</span> — 10.000 XP</li>
            </ul>

            <p className="text-foreground font-semibold mt-3 flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Rachas</p>
            <p>Cada dia que entrenas se suma a tu racha. Si dejas de entrenar un dia, la racha se reinicia a 0. Mantene la racha para ganar XP extra cada dia.</p>

            <p className="text-foreground font-semibold mt-3">Como ganar XP</p>
            <ul className="list-disc pl-5 space-y-1 text-xs mt-1">
              <li>Guardar sesion de entrenamiento: +30 XP</li>
              <li>Marca personal (superar tu mejor peso): +50 XP</li>
              <li>Foto de progreso: +20 XP</li>
              <li>Racha diaria (bonus): +10 XP</li>
              <li>Cambiar alimento en dieta: +5 XP</li>
              <li>Mensaje en el chat: +2 XP</li>
            </ul>

            <p className="text-foreground font-semibold mt-3">Logros (Badges)</p>
            <p>Hay 17 logros para desbloquear en 5 categorias: entrenamiento, rachas, nutricion, social y hitos. Cada logro te da XP bonus. Anda a la seccion Ranking para ver todos los logros y cuales ya desbloqueaste.</p>

            <p className="text-foreground font-semibold mt-3">Ranking Semanal y General</p>
            <p>En la seccion Ranking ves dos tablas: el ranking de la semana (se reinicia cada lunes) y el ranking general por XP total. Competi con otros usuarios para estar en el top!</p>

            <Tip>Vas a recibir notificaciones cuando tu racha este en riesgo o cuando alguien te supere en el ranking. Usa eso como motivacion para no faltar!</Tip>
          </Section>

          {/* 11. REFERIDOS */}
          <Section
            icon={<Gift className="h-5 w-5 text-black" />}
            title="Programa de Referidos"
          >
            <p>Invita amigos y ambos ganan.</p>

            <div className="space-y-2">
              <Step number={1} title="Obtene tu codigo" desc="Anda a la seccion 'Invitar' en el menu. Ahi ves tu codigo unico de referido." />
              <Step number={2} title="Compartilo" desc="Envialo por WhatsApp, Instagram o como quieras. Tu amigo lo usa al registrarse." />
              <Step number={3} title="Tu amigo recibe 15% OFF" desc="El descuento se aplica automaticamente en su primer plan." />
              <Step number={4} title="Vos ganas +7 dias gratis" desc="Por cada amigo que se registre con tu codigo, se suman 7 dias a tu suscripcion." />
            </div>

            <Tip>No hay limite de referidos. Cuantos mas amigos invites, mas dias gratis ganas!</Tip>
          </Section>

          {/* 12. FAQ */}
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
                <p className="text-xs mt-1">Por Instagram: <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a>. Tambien podes encontrar el link en tu dashboard o escribirle por el chat de la app.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">No me llegan las notificaciones del chat, que hago?</p>
                <p className="text-xs mt-1">Asegurate de haber tocado &quot;Activar&quot; en el banner de notificaciones. En Android verifica que Chrome tenga permisos de notificacion. En iPhone, las notificaciones solo funcionan si instalaste la app desde Safari (Compartir &gt; Agregar a pantalla de inicio).</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Que es el Chat General?</p>
                <p className="text-xs mt-1">Es una sala de chat abierta donde todos los miembros del gym pueden escribir. Ideal para compartir tips, motivarse y hacer consultas a la comunidad.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Si salgo de la sesion de entrenamiento pierdo los datos?</p>
                <p className="text-xs mt-1">No. Los pesos y repeticiones que vayas cargando se guardan automaticamente. Podes salir de la pagina, cerrar la app y volver — tus datos siguen ahi hasta que guardes la sesion.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Como funciona el ranking?</p>
                <p className="text-xs mt-1">El ranking semanal se reinicia cada lunes. Ganas XP entrenando, registrando progreso y siendo activo en la app. El ranking general muestra tu XP total acumulado.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Que pasa si pierdo mi racha?</p>
                <p className="text-xs mt-1">La racha se reinicia a 0, pero tu racha maxima queda guardada. Recibiras una notificacion cuando tu racha este en riesgo para que no te olvides de entrenar.</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-xs">Como invito a un amigo?</p>
                <p className="text-xs mt-1">Anda a la seccion &quot;Invitar&quot; en el menu. Ahi encontras tu codigo unico y un boton para compartirlo por WhatsApp. Tu amigo recibe 15% de descuento y vos ganas 7 dias gratis.</p>
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
