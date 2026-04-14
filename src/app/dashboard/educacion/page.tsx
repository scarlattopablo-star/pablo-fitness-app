"use client";

import { useState } from "react";
import { ArrowLeft, Clock, Dumbbell, Apple, Moon, Brain, ChevronDown } from "lucide-react";
import Link from "next/link";

type Category = "todos" | "entrenamiento" | "nutricion" | "recuperacion" | "mentalidad";

interface Article {
  id: string;
  title: string;
  category: Exclude<Category, "todos">;
  readTime: number; // minutes
  content: string;
}

const CATEGORY_CONFIG: Record<Exclude<Category, "todos">, { label: string; icon: typeof Dumbbell; color: string; bg: string }> = {
  entrenamiento: { label: "Entrenamiento", icon: Dumbbell, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  nutricion: { label: "Nutricion", icon: Apple, color: "text-amber-400", bg: "bg-amber-400/10" },
  recuperacion: { label: "Recuperacion", icon: Moon, color: "text-blue-400", bg: "bg-blue-400/10" },
  mentalidad: { label: "Mentalidad", icon: Brain, color: "text-purple-400", bg: "bg-purple-400/10" },
};

const ARTICLES: Article[] = [
  // ENTRENAMIENTO
  {
    id: "calentamiento",
    title: "Como calentar correctamente",
    category: "entrenamiento",
    readTime: 3,
    content: `El calentamiento es la parte mas ignorada del entrenamiento, pero puede ser la diferencia entre progresar y lesionarte.

Un buen calentamiento tiene 3 fases:

1. ACTIVACION GENERAL (3-5 min)
Camina rapido, trota suave o hace jumping jacks. El objetivo es subir la temperatura corporal y el flujo sanguineo.

2. MOVILIDAD ARTICULAR (3-5 min)
Circulos de hombros, rotacion de cadera, circulos de rodilla, rotacion de tobillos. Mueve TODAS las articulaciones que vas a usar.

3. SERIES DE APROXIMACION (2-3 series)
Haz 2-3 series del primer ejercicio con peso liviano. Por ejemplo, si vas a hacer press banca con 80kg, haz: 1x10 con barra vacia, 1x8 con 40kg, 1x5 con 60kg.

NUNCA hagas estiramientos estaticos ANTES de entrenar fuerza. Los estiramientos estaticos reducen la fuerza un 5-10%. Dejá los estiramientos para DESPUES del entrenamiento.`,
  },
  {
    id: "sobrecarga-progresiva",
    title: "Sobrecarga progresiva: la clave del crecimiento",
    category: "entrenamiento",
    readTime: 4,
    content: `Si haces lo mismo semana tras semana, tu cuerpo no tiene razon para cambiar. La sobrecarga progresiva es el principio mas importante del entrenamiento.

HAY 4 FORMAS DE PROGRESAR:

1. MAS PESO
La mas obvia. Subi 2.5kg por semana en ejercicios compuestos y 1kg en aislados. No necesitas subir mucho — la consistencia hace la diferencia.

2. MAS REPETICIONES
Si la semana pasada hiciste 3x8 con 60kg, intenta 3x9 o 3x10. Cuando llegues al tope del rango (ej: 12 reps), subi el peso y volve a 8.

3. MAS SERIES
Agregar una serie extra al ejercicio mas importante del dia. Pasa de 3 series a 4. No agregues mas de 1-2 series por semana.

4. MENOS DESCANSO
Reducir el descanso entre series de 90s a 75s aumenta la densidad del entrenamiento. Solo usá esto para hipertrofia, no para fuerza.

REGLA: Registra SIEMPRE tus pesos en la app. Si no lo anotas, no sabes si estas progresando.`,
  },
  {
    id: "tecnica-sentadilla",
    title: "Sentadilla: errores comunes y como corregirlos",
    category: "entrenamiento",
    readTime: 4,
    content: `La sentadilla es el rey de los ejercicios pero tambien el mas mal ejecutado. Estos son los errores mas comunes:

ERROR 1: RODILLAS HACIA ADENTRO
Las rodillas deben seguir la linea de los pies. Si se van hacia adentro, tus gluteos son debiles. Solucion: haz sentadillas con banda elastica en las rodillas.

ERROR 2: NO BAJAR SUFICIENTE
La cadera debe bajar al menos hasta que los muslos esten paralelos al piso. Media sentadilla = medio resultado. Si no podes bajar, trabaja movilidad de tobillos.

ERROR 3: REDONDEAR LA ESPALDA
La espalda debe mantenerse recta y el pecho arriba. Si se te redondea, el peso es demasiado. Baja el peso y trabaja la tecnica.

ERROR 4: TALONES SE LEVANTAN
Los talones deben estar siempre pegados al piso. Si se levantan, tenes poca movilidad de tobillo. Solucion: pon un disco de 5kg debajo de cada talon.

CONSEJO PRO: Graba un video desde el costado y revisá tu tecnica. Un pequeño ajuste puede hacer una gran diferencia.`,
  },
  {
    id: "frecuencia-entrenamiento",
    title: "Cuantas veces por semana entrenar cada musculo",
    category: "entrenamiento",
    readTime: 3,
    content: `La ciencia es clara: entrenar cada musculo 2 veces por semana produce mas hipertrofia que 1 vez por semana (Schoenfeld, 2016).

FRECUENCIA OPTIMA POR OBJETIVO:

HIPERTROFIA: 2x por semana por musculo
El estimulo de crecimiento dura 48-72 horas. Despues, el musculo ya esta recuperado y necesita un nuevo estimulo.

FUERZA: 2-3x por semana en ejercicios principales
La fuerza es una habilidad motora. Cuanto mas practiques el movimiento (sentadilla, press banca, peso muerto), mejor lo ejecutas.

PRINCIPIANTES: 3x por semana full body
Los principiantes se recuperan mas rapido y necesitan mas practica del movimiento. Full body 3 veces es ideal.

TU PLAN YA ESTA DISEÑADO CON FRECUENCIA 2
Cada musculo aparece 2 veces por semana en tu rutina. No necesitas cambiar nada — solo seguir el plan consistentemente.`,
  },
  {
    id: "series-al-fallo",
    title: "Entrenar al fallo: cuando si y cuando no",
    category: "entrenamiento",
    readTime: 3,
    content: `Llevar las series al fallo muscular (no poder hacer ni una rep mas) es una herramienta poderosa pero hay que saber usarla.

CUANDO SI:
- En la ULTIMA serie del ejercicio
- En ejercicios de AISLAMIENTO (curl, extensiones, elevaciones)
- En las ultimas semanas de un ciclo de entrenamiento

CUANDO NO:
- En ejercicios COMPUESTOS pesados (sentadilla, peso muerto) — riesgo de lesion
- En las PRIMERAS series — te quedas sin fuerza para las siguientes
- Si sos PRINCIPIANTE — primero domina la tecnica

REGLA: Dejá 1-2 reps en reserva (RIR) en la mayoria de las series. Solo la ultima serie puede ir al fallo. Esto maximiza el estimulo sin acumular fatiga excesiva.`,
  },

  // NUTRICION
  {
    id: "macros-explicados",
    title: "Macros explicados: proteina, carbohidratos y grasas",
    category: "nutricion",
    readTime: 5,
    content: `Los macronutrientes son los 3 componentes principales de la comida. Entenderlos te da el control total de tu nutricion.

PROTEINA (4 kcal/gramo)
Para que sirve: construir y reparar musculo.
Cuanta: 1.6-2.2g por kg de peso corporal. Si pesas 70kg, necesitas 112-154g por dia.
Fuentes: pollo, carne, pescado, huevos, lacteos, legumbres, proteina en polvo.

CARBOHIDRATOS (4 kcal/gramo)
Para que sirve: energia para entrenar y funciones cerebrales.
Cuantos: depende del objetivo. Deficit: 2-3g/kg. Volumen: 4-6g/kg.
Fuentes: arroz, avena, batata, pan integral, frutas, quinoa.

GRASAS (9 kcal/gramo)
Para que sirve: hormonas (testosterona), absorcion de vitaminas, saciedad.
Cuantas: 0.8-1.2g/kg de peso corporal. Nunca bajar de 0.5g/kg.
Fuentes: aceite de oliva, palta, frutos secos, salmon, huevos.

TU PLAN DE NUTRICION ya tiene los macros calculados para tu objetivo. Segui las porciones indicadas y vas a ver resultados.`,
  },
  {
    id: "hidratacion",
    title: "Hidratacion: cuanta agua tomar y por que importa",
    category: "nutricion",
    readTime: 3,
    content: `La deshidratacion es el enemigo silencioso del rendimiento. Con solo 2% de deshidratacion, tu fuerza baja un 20%.

CUANTA AGUA:
- Minimo: 35ml por kg de peso corporal (70kg = 2.5 litros)
- Si entrenas: sumá 500ml-1L extra
- Si hace calor: sumá 500ml mas

CUANDO TOMAR:
- Al despertar: 500ml (tu cuerpo lleva 8 horas sin agua)
- Antes de entrenar: 500ml 30 min antes
- Durante el entreno: sorbos cada 15 min
- Despues: 500ml en la primera hora post-entreno

SEÑALES DE DESHIDRATACION:
- Orina amarillo oscuro (debe ser clara o amarillo palido)
- Dolor de cabeza
- Fatiga inexplicable
- Calambres musculares

TRUCO: Lleva siempre una botella de 1L. Llenarla 2-3 veces al dia te asegura buena hidratacion.`,
  },
  {
    id: "timing-comidas",
    title: "Cuando comer: el timing importa",
    category: "nutricion",
    readTime: 3,
    content: `El TOTAL de lo que comes importa mas que cuando lo comes. Pero el timing puede darte una ventaja extra.

PRE-ENTRENAMIENTO (1-2 horas antes):
Comida con carbohidratos + proteina. Ejemplo: arroz con pollo, avena con proteina, banana con mantequilla de mani.

DURANTE EL ENTRENAMIENTO:
Solo agua si entrenas menos de 90 min. Si entrenas mas, una bebida deportiva o BCAA pueden ayudar.

POST-ENTRENAMIENTO (dentro de 2 horas):
Proteina + carbohidratos. Es el momento donde tu cuerpo absorbe mejor los nutrientes. Un batido de proteina con banana es perfecto.

ANTES DE DORMIR:
Proteina de absorcion lenta (caseina, queso cottage, yogurt griego). Alimenta tus musculos durante la noche.

LO MAS IMPORTANTE: Come cada 3-4 horas para mantener los niveles de energia estables y la sintesis de proteina activa.`,
  },
  {
    id: "suplementos",
    title: "Suplementos: cuales funcionan y cuales no",
    category: "nutricion",
    readTime: 4,
    content: `El 90% de los suplementos son innecesarios. Estos son los unicos con evidencia cientifica solida:

FUNCIONAN:
1. CREATINA MONOHIDRATADA — El suplemento mas estudiado. 3-5g/dia mejora fuerza, potencia y volumen muscular. Seguro, barato y efectivo.

2. PROTEINA EN POLVO — No es magica, es comida concentrada. Util si no llegas a tu cuota de proteina con alimentos.

3. CAFEINA — 200-400mg (1-2 cafes) 30 min pre-entreno mejora rendimiento 3-5%.

4. VITAMINA D — Si vivis en latitudes altas o no tomas sol. 2000-4000 UI/dia.

NO FUNCIONAN (o no valen lo que cuestan):
- BCAA: si comes suficiente proteina, son innecesarios
- Quemadores de grasa: no queman grasa, solo te ponen nervioso
- Glutamina: tu cuerpo ya produce suficiente
- Pre-entrenos con 50 ingredientes: la cafeina hace el trabajo, el resto es marketing

REGLA: Primero come bien y entrena bien. Los suplementos son el 5% del resultado.`,
  },
  {
    id: "deficit-superavit",
    title: "Deficit vs superavit: que necesitas segun tu objetivo",
    category: "nutricion",
    readTime: 3,
    content: `Tu cuerpo es una ecuacion de energia. Entendela y controlas tus resultados.

DEFICIT CALORICO (perder grasa):
Come 300-500 kcal MENOS de lo que gastas. Tu cuerpo usa la grasa almacenada como energia. No hagas deficit mayor a 500 kcal — perderas musculo.

SUPERAVIT CALORICO (ganar musculo):
Come 200-300 kcal MAS de lo que gastas. Tu cuerpo necesita energia extra para construir musculo nuevo. Superavit mayor a 500 kcal = ganar grasa innecesaria.

MANTENIMIENTO (recomposicion):
Come lo que gastas. Ideal para principiantes que pueden ganar musculo y perder grasa al mismo tiempo durante los primeros 6-12 meses.

TU PLAN YA LO CALCULA:
Las calorias y macros de tu plan de nutricion estan calculados segun tu objetivo (quema de grasa, ganancia muscular, etc). Solo segui las porciones.`,
  },

  // RECUPERACION
  {
    id: "importancia-sueno",
    title: "El sueño: tu arma secreta para resultados",
    category: "recuperacion",
    readTime: 3,
    content: `Podes entrenar perfecto y comer perfecto, pero si no dormis bien, tus resultados van a ser mediocres.

QUE PASA CUANDO DORMIS:
- Se libera hormona de crecimiento (pico maximo en sueño profundo)
- Se reparan las fibras musculares dañadas en el gym
- Se consolida la memoria motora (mejor tecnica)
- Se regulan las hormonas del hambre (menos antojos)

CUANTO DORMIR:
7-9 horas por noche. Menos de 6 horas reduce la testosterona un 15% y la capacidad de recuperacion un 40%.

TIPS PARA DORMIR MEJOR:
1. Misma hora de acostarte y levantarte (incluso fines de semana)
2. No pantallas 30 min antes de dormir
3. Habitacion oscura y fresca (18-20°C)
4. No cafeina despues de las 14:00
5. Cena liviana 2-3 horas antes de acostarte`,
  },
  {
    id: "stretching",
    title: "Estiramientos: cuando y como hacerlos",
    category: "recuperacion",
    readTime: 3,
    content: `Los estiramientos mejoran la flexibilidad, reducen el riesgo de lesiones y aceleran la recuperacion. Pero hay que hacerlos en el momento correcto.

ANTES DE ENTRENAR: NO hagas estiramientos estaticos
Reducen la fuerza temporalmente. En su lugar, haz movilidad dinamica: rotaciones, circulos articulares, movimientos activos.

DESPUES DE ENTRENAR: SI haz estiramientos estaticos
Mantene cada posicion 20-30 segundos. Respira profundo y relajá el musculo.

MUSCULOS CLAVE PARA ESTIRAR:
- Isquiotibiales (detras del muslo)
- Cuadriceps (frente del muslo)
- Hip flexors (frente de la cadera) — especialmente si trabajas sentado
- Pectoral (pecho)
- Dorsales (espalda)
- Hombros

TIEMPO: 5-10 minutos post-entreno es suficiente. No necesitas una sesion entera de yoga — solo los musculos que trabajaste ese dia.`,
  },
  {
    id: "foam-rolling",
    title: "Foam rolling: que es y como usarlo",
    category: "recuperacion",
    readTime: 3,
    content: `El foam roller (rodillo de espuma) es una de las herramientas mas efectivas y baratas para la recuperacion.

QUE HACE:
- Libera tension en la fascia (tejido que envuelve el musculo)
- Mejora el flujo sanguineo a los musculos
- Reduce agujetas (DOMS)
- Mejora el rango de movimiento

COMO USARLO:
1. Pon el rodillo en el piso
2. Coloca el musculo que queres trabajar sobre el rodillo
3. Rueda lentamente (2-3 cm por segundo)
4. Cuando encuentres un punto doloroso, quedate ahi 20-30 segundos
5. Respira profundo y relajá

ZONAS CLAVE:
- Cuadriceps, isquiotibiales, gluteos
- IT band (costado del muslo)
- Espalda alta (no baja)
- Pantorrillas

CUANDO: 5-10 minutos antes o despues de entrenar. Tambien podes usarlo en dias de descanso.`,
  },

  // MENTALIDAD
  {
    id: "habitos-consistencia",
    title: "Como crear el habito de entrenar",
    category: "mentalidad",
    readTime: 3,
    content: `La motivacion te lleva al gym la primera semana. El habito te lleva los proximos 10 años.

COMO CREAR EL HABITO:

1. EMPIEZA PEQUEÑO
No intentes ir 6 veces por semana desde el dia 1. Empieza con 3 y subi cuando se sienta facil.

2. MISMA HORA, MISMO LUGAR
Tu cerebro asocia patrones. Si siempre entrenas a las 7am, despues de un mes tu cuerpo automaticamente se prepara a esa hora.

3. PREPARA TODO LA NOCHE ANTERIOR
Ropa lista, bolso armado, comida preparada. Elimina excusas y fricciones.

4. REGLA DE LOS 2 MINUTOS
Los dias que no tenes ganas, decite: "solo voy a hacer 2 minutos". El 90% de las veces, una vez que empezas, seguis.

5. NO ROMPAS LA CADENA
Cada dia que entrenas, marcalo en el calendario. La racha visual te motiva a no romperla.

TU APP TIENE RACHA: Fijate en tu dashboard cuantos dias consecutivos llevas. No la pierdas.`,
  },
  {
    id: "metas-inteligentes",
    title: "Como poner metas que realmente cumplas",
    category: "mentalidad",
    readTime: 3,
    content: `"Quiero estar en forma" no es una meta. Es un deseo. Las metas que funcionan son ESPECIFICAS y MEDIBLES.

METAS MALAS vs METAS BUENAS:

Malo: "Quiero perder peso"
Bueno: "Quiero perder 5kg en 2 meses entrenando 4 veces por semana"

Malo: "Quiero ser mas fuerte"
Bueno: "Quiero hacer press banca con 80kg para fin de mes"

Malo: "Quiero comer mejor"
Bueno: "Voy a seguir mi plan de nutricion 5 de 7 dias esta semana"

TIPS:
1. Escribe tus metas y ponelas donde las veas todos los dias
2. Divide metas grandes en semanales (micro-metas)
3. Mide tu progreso: la app te muestra peso, repeticiones y racha
4. Celebra cada logro, por pequeño que sea
5. Si fallas una semana, no abandones — solo retoma

RECORDÁ: No necesitas ser perfecto. Necesitas ser consistente.`,
  },
  {
    id: "plateau-estancamiento",
    title: "Que hacer cuando te estancas",
    category: "mentalidad",
    readTime: 3,
    content: `Todos llegan a un punto donde dejan de progresar. Es normal y tiene solucion.

SEÑALES DE ESTANCAMIENTO:
- No podes subir peso en 2-3 semanas seguidas
- El cuerpo no cambia a pesar de entrenar y comer bien
- Te sientes cansado y desmotivado

SOLUCIONES:

1. DELOAD (semana de descarga)
Entrena con 50-60% de tu peso normal durante una semana. Tu cuerpo se recupera y vuelves mas fuerte.

2. CAMBIA LOS ESTIMULOS
Cambia el orden de ejercicios, agrega variantes, modifica reps o descanso. Tu cuerpo se adapto al estimulo actual.

3. REVISA TU NUTRICION
Puede que necesites mas calorias si queres crecer, o ajustar macros si queres definir.

4. REVISA TU SUEÑO
El sueño pobre = recuperacion pobre = estancamiento.

5. DESCANSA MAS
A veces la solucion es hacer MENOS, no mas. El sobreentrenamiento parece estancamiento.

ESCRIBIME por el chat de la app si te sentis estancado. Te ayudo a ajustar tu plan.`,
  },
];

export default function EducacionPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("todos");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filtered = selectedCategory === "todos"
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCategory);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="flex items-center gap-2 text-muted hover:text-white mb-4 transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
        <Brain className="h-6 w-6 text-accent" />
        Aprende
      </h1>
      <p className="text-sm text-muted mb-6">Mejora tu conocimiento para mejores resultados</p>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        {(["todos", "entrenamiento", "nutricion", "recuperacion", "mentalidad"] as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-accent text-black"
                : "bg-card-bg text-muted hover:text-white border border-card-border"
            }`}
          >
            {cat === "todos" ? "Todos" : CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filtered.map(article => {
          const config = CATEGORY_CONFIG[article.category];
          const Icon = config.icon;
          const isExpanded = expandedArticle === article.id;

          return (
            <div key={article.id} className="card-premium rounded-xl overflow-hidden border border-card-border/50">
              <button
                onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{article.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold ${config.color}`}>{config.label}</span>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {article.readTime} min
                    </span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-card-border/30">
                  <div className="pt-3 text-sm text-muted leading-relaxed whitespace-pre-line">
                    {article.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
