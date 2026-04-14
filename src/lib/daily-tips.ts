// Daily fitness tips - rotated daily so users see a new one each day
// Categories: entrenamiento, nutricion, recuperacion, mentalidad

export interface DailyTip {
  category: "entrenamiento" | "nutricion" | "recuperacion" | "mentalidad";
  title: string;
  content: string;
}

export const DAILY_TIPS: DailyTip[] = [
  // ENTRENAMIENTO (20 tips)
  { category: "entrenamiento", title: "Controla la fase excentrica", content: "Baja el peso en 2-3 segundos. La fase excentrica (bajar) es donde mas fibras musculares se rompen y donde mas creces. No dejes que la gravedad haga el trabajo." },
  { category: "entrenamiento", title: "Calienta siempre", content: "5-10 minutos de calentamiento previenen lesiones y mejoran tu rendimiento. Haz movilidad articular + 2 series livianas del primer ejercicio." },
  { category: "entrenamiento", title: "Respira correctamente", content: "Exhala durante el esfuerzo (subir) e inhala en la fase excentrica (bajar). Una buena respiracion mejora tu fuerza y previene mareos." },
  { category: "entrenamiento", title: "No te saltes piernas", content: "Las piernas son el grupo muscular mas grande. Entrenarlas libera mas hormona de crecimiento y testosterona, lo que ayuda a todo tu cuerpo a crecer." },
  { category: "entrenamiento", title: "Sobrecarga progresiva", content: "Cada semana intenta agregar un poco mas de peso, una rep extra, o una serie mas. El musculo crece cuando lo obligas a hacer algo que antes no podia." },
  { category: "entrenamiento", title: "Conexion mente-musculo", content: "Concéntrate en sentir el musculo que estas trabajando. No se trata de mover peso, se trata de trabajar el musculo correcto." },
  { category: "entrenamiento", title: "Descanso entre series", content: "Para hipertrofia: 60-90 segundos. Para fuerza: 2-3 minutos. El descanso correcto es clave para el rendimiento." },
  { category: "entrenamiento", title: "Rango completo de movimiento", content: "Siempre haz el recorrido completo del ejercicio. Media sentadilla = medio resultado. El rango completo activa mas fibras musculares." },
  { category: "entrenamiento", title: "Varia los estimulos", content: "Cada 4-6 semanas cambia el orden de ejercicios o agrega variantes. El musculo se adapta y necesita nuevos estimulos para seguir creciendo." },
  { category: "entrenamiento", title: "La tecnica es primero", content: "Nunca sacrifiques la tecnica por levantar mas peso. Una mala tecnica lleva a lesiones y no trabaja el musculo correctamente." },
  { category: "entrenamiento", title: "Entrena tu core todos los dias", content: "El core estabiliza todo tu cuerpo. Agrega 2-3 ejercicios de abdomen al final de cada sesion, incluso en dias de tren superior." },
  { category: "entrenamiento", title: "No te olvides de la espalda", content: "Por cada ejercicio de empuje (pecho), haz uno de traccion (espalda). El balance previene lesiones de hombro y mejora tu postura." },
  { category: "entrenamiento", title: "Los compuestos primero", content: "Empieza la sesion con ejercicios compuestos (press, sentadilla, peso muerto) cuando estas fresco. Deja los aislados para el final." },
  { category: "entrenamiento", title: "Registra tus pesos", content: "Si no lo registras, no sabes si estas progresando. Anota el peso de cada ejercicio para poder subir la proxima semana." },
  { category: "entrenamiento", title: "No entrenes mas de 60-75 minutos", content: "Despues de 60-75 min el cortisol sube y la testosterona baja. Sesiones cortas e intensas son mas efectivas que largas y lentas." },
  { category: "entrenamiento", title: "Frecuencia > Volumen", content: "Entrenar un musculo 2 veces por semana produce mas hipertrofia que 1 vez, segun la ciencia. Tu plan ya esta diseñado asi." },
  { category: "entrenamiento", title: "Agarre y estabilizadores", content: "Usa straps solo cuando sea necesario. Entrenar sin straps fortalece el agarre, que es limitante en muchos ejercicios." },
  { category: "entrenamiento", title: "La ultima serie es la que cuenta", content: "Las primeras series preparan al musculo. La ultima serie, donde llegas cerca del fallo, es donde ocurre el estimulo real de crecimiento." },
  { category: "entrenamiento", title: "No copies rutinas de redes", content: "Tu plan esta personalizado para tu objetivo, nivel y cuerpo. Una rutina generica de Instagram puede ser demasiado o muy poco para vos." },
  { category: "entrenamiento", title: "Simetria bilateral", content: "Si un lado es mas debil, empieza con ese lado en ejercicios unilaterales. Iguala las reps con ambos lados para corregir desbalances." },

  // NUTRICION (20 tips)
  { category: "nutricion", title: "Proteina en cada comida", content: "Distribuir la proteina en 4-5 comidas es mas efectivo que comer todo en una. El cuerpo absorbe mejor 30-40g por comida." },
  { category: "nutricion", title: "Hidratacion = rendimiento", content: "Toma al menos 2-3 litros de agua por dia. La deshidratacion reduce tu fuerza un 20-30%. Toma agua antes, durante y despues de entrenar." },
  { category: "nutricion", title: "No le tengas miedo a las grasas", content: "Las grasas saludables (palta, aceite de oliva, frutos secos) son esenciales para las hormonas y la absorcion de vitaminas. 20-30% de tus calorias deben venir de grasas." },
  { category: "nutricion", title: "Come carbohidratos complejos", content: "Arroz integral, avena, batata, quinoa. Los carbohidratos complejos liberan energia lenta y sostenida, ideal para entrenar y recuperarte." },
  { category: "nutricion", title: "Post-entrenamiento: ventana anabolica", content: "Come proteina + carbohidratos dentro de las 2 horas post-entreno. Un batido de proteina con banana es perfecto para la recuperacion." },
  { category: "nutricion", title: "Lee las etiquetas", content: "Muchos alimentos 'saludables' tienen azucar oculta. Revisa los ingredientes: si el azucar esta en los primeros 3, evitalo." },
  { category: "nutricion", title: "Preparacion de comidas", content: "Cocina en cantidad los domingos. Tener tuppers listos elimina la excusa de comer mal por falta de tiempo." },
  { category: "nutricion", title: "Verduras en cada comida principal", content: "Las verduras aportan fibra, vitaminas y minerales con muy pocas calorias. Llena medio plato con verduras de colores variados." },
  { category: "nutricion", title: "Evita el azucar procesada", content: "El azucar procesada causa picos de insulina, acumula grasa y te deja sin energia. Usa stevia o frutas si necesitas algo dulce." },
  { category: "nutricion", title: "El deficit calorico quema grasa", content: "Para perder grasa necesitas comer menos calorias de las que gastas. No hay suplemento ni ejercicio que lo reemplace. Tu plan de nutricion ya lo calcula." },
  { category: "nutricion", title: "Superavit para ganar musculo", content: "Para ganar masa muscular necesitas comer un poco mas de lo que gastas (200-300 kcal extra). El cuerpo necesita material para construir." },
  { category: "nutricion", title: "El alcohol frena tus resultados", content: "El alcohol reduce la sintesis de proteina un 20-30%, deshidrata y altera el sueño. Si tu objetivo es serio, minimiza el consumo." },
  { category: "nutricion", title: "Desayuna con proteina", content: "Empezar el dia con proteina (huevos, yogurt griego, batido) activa el metabolismo y reduce los antojos durante el dia." },
  { category: "nutricion", title: "Fibra para la saciedad", content: "La fibra te mantiene lleno por mas tiempo. Avena, legumbres, verduras y frutas son tus aliados para no tener hambre entre comidas." },
  { category: "nutricion", title: "No cuentes calorias obsesivamente", content: "Tu plan ya tiene los macros calculados. Segui las porciones indicadas y no te estreses con cada caloria. La consistencia importa mas que la perfeccion." },
  { category: "nutricion", title: "Creatina: el suplemento que funciona", content: "La creatina monohidratada es el suplemento mas estudiado y seguro. 3-5g por dia mejora fuerza y rendimiento. Tomala a cualquier hora." },
  { category: "nutricion", title: "Cafe antes de entrenar", content: "La cafeina mejora el rendimiento un 3-5%. Un cafe negro 30 min antes del gym aumenta la energia y la concentracion." },
  { category: "nutricion", title: "Sodio no es el enemigo", content: "Si entrenas fuerte y transpiras, necesitas sodio para mantener la hidratacion y la funcion muscular. No elimines la sal de tu dieta." },
  { category: "nutricion", title: "Come frutas enteras, no jugos", content: "La fruta entera tiene fibra que frena la absorcion de azucar. El jugo es basicamente agua con azucar sin la fibra protectora." },
  { category: "nutricion", title: "Planifica tus snacks", content: "Ten siempre snacks saludables a mano: frutos secos, yogurt, frutas, barras de proteina. Asi evitas caer en la maquina de snacks." },

  // RECUPERACION (10 tips)
  { category: "recuperacion", title: "Dormi 7-8 horas minimo", content: "El musculo crece mientras dormis. La hormona de crecimiento se libera durante el sueño profundo. Menos de 7 horas = menos resultados." },
  { category: "recuperacion", title: "Estira despues de entrenar", content: "5-10 minutos de estiramientos post-entreno reducen la rigidez, mejoran la recuperacion y previenen lesiones a largo plazo." },
  { category: "recuperacion", title: "Dias de descanso son entrenamiento", content: "El musculo no crece en el gym, crece durante el descanso. Respeta tus dias off como parte fundamental del programa." },
  { category: "recuperacion", title: "Foam rolling", content: "Usar un rodillo de espuma antes o despues de entrenar libera tension muscular, mejora el rango de movimiento y acelera la recuperacion." },
  { category: "recuperacion", title: "Maneja el estres", content: "El estres cronico sube el cortisol, que destruye musculo y acumula grasa. Meditacion, caminatas y hobbies ayudan a bajar el cortisol." },
  { category: "recuperacion", title: "Dolor muscular vs lesion", content: "Las agujetas (DOMS) son normales 24-48h despues de entrenar. Si el dolor es agudo, punzante o en articulaciones, para y consulta." },
  { category: "recuperacion", title: "Ducha fria post-entreno", content: "30-60 segundos de agua fria al final de la ducha reduce la inflamacion y acelera la recuperacion muscular." },
  { category: "recuperacion", title: "Descanso activo", content: "En tus dias off, camina 20-30 min. El movimiento suave aumenta el flujo sanguineo y acelera la recuperacion sin estresar los musculos." },
  { category: "recuperacion", title: "Escucha a tu cuerpo", content: "Si te sientes agotado, con dolor de cabeza o desmotivado, toma un dia extra de descanso. Sobreentrenar es peor que descansar." },
  { category: "recuperacion", title: "Magnesio para la recuperacion", content: "El magnesio reduce calambres, mejora el sueño y la recuperacion muscular. Encontralo en bananas, espinacas, frutos secos o suplemento." },

  // MENTALIDAD (10 tips)
  { category: "mentalidad", title: "La consistencia vence al talento", content: "No importa si hoy no estas motivado. Lo que importa es que vayas igual. Los resultados vienen de meses de consistencia, no de dias perfectos." },
  { category: "mentalidad", title: "Compara con vos de ayer", content: "No te compares con otros en el gym. Cada cuerpo es diferente. Tu unica competencia sos vos mismo de la semana pasada." },
  { category: "mentalidad", title: "Metas pequeñas, grandes resultados", content: "No pienses en 'quiero perder 20kg'. Pensa en 'esta semana voy a entrenar 4 veces'. Las metas chicas se acumulan en grandes cambios." },
  { category: "mentalidad", title: "El progreso no es lineal", content: "Vas a tener semanas buenas y malas. El peso va a subir y bajar. Lo que importa es la tendencia de meses, no de dias." },
  { category: "mentalidad", title: "Celebra cada logro", content: "Subiste 2.5kg en sentadilla? Celebralo. Fuiste al gym 4 veces esta semana? Celebralo. Los pequeños logros mantienen la motivacion." },
  { category: "mentalidad", title: "El gym es tu terapia", content: "El ejercicio libera endorfinas, reduce ansiedad y mejora el animo. Cuando menos ganas tengas de ir, mas lo necesitas." },
  { category: "mentalidad", title: "Encuentra tu hora", content: "No importa si entrenas a las 6am o a las 10pm. La mejor hora para entrenar es la hora que puedas mantener consistentemente." },
  { category: "mentalidad", title: "Rodéate de gente que entrena", content: "Tu entorno influye en tus habitos. Juntate con gente que entrena y come bien. Usa la comunidad Gym Bro de la app para motivarte." },
  { category: "mentalidad", title: "No busques motivacion, crea disciplina", content: "La motivacion va y viene. La disciplina es hacer lo que tenes que hacer aunque no tengas ganas. Eso es lo que separa a los que logran resultados." },
  { category: "mentalidad", title: "Visualiza tu objetivo", content: "Imagina como vas a lucir y sentirte en 6 meses. Esa imagen mental te ayuda a tomar mejores decisiones cada dia." },
];

// Get today's tip using date-based hash (same pattern as daily messages)
export function getTodaysTip(): DailyTip {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export const CATEGORY_LABELS: Record<DailyTip["category"], { label: string; emoji: string }> = {
  entrenamiento: { label: "Entrenamiento", emoji: "💪" },
  nutricion: { label: "Nutrición", emoji: "🥗" },
  recuperacion: { label: "Recuperación", emoji: "😴" },
  mentalidad: { label: "Mentalidad", emoji: "🧠" },
};
