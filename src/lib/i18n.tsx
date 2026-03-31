"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "es" | "en" | "pt";

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
  pt: "🇧🇷",
};

type Translations = Record<string, Record<Locale, string>>;

const t: Translations = {
  // Navbar
  "nav.plans": { es: "Planes", en: "Plans", pt: "Planos" },
  "nav.howItWorks": { es: "Cómo Funciona", en: "How It Works", pt: "Como Funciona" },
  "nav.results": { es: "Resultados", en: "Results", pt: "Resultados" },
  "nav.startNow": { es: "Empezá Ahora", en: "Start Now", pt: "Comece Agora" },
  "nav.start": { es: "Empezá", en: "Start", pt: "Comece" },

  // Hero
  "hero.badge": { es: "Entrenamiento 100% Personalizado", en: "100% Personalized Training", pt: "Treino 100% Personalizado" },
  "hero.title1": { es: "TRANSFORMA TU", en: "TRANSFORM YOUR", pt: "TRANSFORME SEU" },
  "hero.title2": { es: "CUERPO Y TU VIDA", en: "BODY AND YOUR LIFE", pt: "CORPO E SUA VIDA" },
  "hero.subtitle": {
    es: "Planes de entrenamiento y nutrición diseñados a tu medida. Con el método Pablo Scarlatto obtendrás resultados reales.",
    en: "Training and nutrition plans designed just for you. With the Pablo Scarlatto method you'll get real results.",
    pt: "Planos de treino e nutrição feitos sob medida. Com o método Pablo Scarlatto você terá resultados reais.",
  },
  "hero.viewPlans": { es: "Ver Planes", en: "View Plans", pt: "Ver Planos" },
  "hero.online": { es: "100% Online", en: "100% Online", pt: "100% Online" },
  "hero.personalized": { es: "Personalizado", en: "Personalized", pt: "Personalizado" },
  "hero.tracking": { es: "Con seguimiento", en: "With tracking", pt: "Com acompanhamento" },

  // Plans section
  "plans.title1": { es: "NUESTROS", en: "OUR", pt: "NOSSOS" },
  "plans.title2": { es: "PLANES", en: "PLANS", pt: "PLANOS" },
  "plans.subtitle": {
    es: "10 planes diseñados para cada objetivo. Elegí el tuyo y empezá tu transformación.",
    en: "10 plans designed for every goal. Choose yours and start your transformation.",
    pt: "10 planos para cada objetivo. Escolha o seu e comece sua transformação.",
  },
  "plans.from": { es: "Desde", en: "From", pt: "A partir de" },
  "plans.month": { es: "mes", en: "month", pt: "mês" },

  // How it works
  "how.title1": { es: "CÓMO", en: "HOW IT", pt: "COMO" },
  "how.title2": { es: "FUNCIONA", en: "WORKS", pt: "FUNCIONA" },
  "how.step1.title": { es: "Elegí tu Plan", en: "Choose Your Plan", pt: "Escolha seu Plano" },
  "how.step1.desc": { es: "Seleccioná el plan que se ajuste a tu objetivo fitness.", en: "Select the plan that fits your fitness goal.", pt: "Selecione o plano que se adapta ao seu objetivo." },
  "how.step2.title": { es: "Completá la Encuesta", en: "Complete the Survey", pt: "Complete a Pesquisa" },
  "how.step2.desc": { es: "Respondé preguntas sobre tu cuerpo, actividad y restricciones.", en: "Answer questions about your body, activity and restrictions.", pt: "Responda perguntas sobre seu corpo, atividade e restrições." },
  "how.step3.title": { es: "Recibí tu Plan", en: "Get Your Plan", pt: "Receba seu Plano" },
  "how.step3.desc": { es: "Calculamos tus calorías y macros. Tu plan queda listo al instante.", en: "We calculate your calories and macros. Your plan is ready instantly.", pt: "Calculamos suas calorias e macros. Seu plano fica pronto na hora." },
  "how.step4.title": { es: "Seguí tu Progreso", en: "Track Your Progress", pt: "Acompanhe seu Progresso" },
  "how.step4.desc": { es: "Subí fotos, registrá tu peso y mirá cómo avanzás.", en: "Upload photos, log your weight and watch your progress.", pt: "Envie fotos, registre seu peso e veja como você avança." },

  // Features
  "features.title1": { es: "QUÉ", en: "WHAT'S", pt: "O QUE" },
  "features.title2": { es: "INCLUYE", en: "INCLUDED", pt: "INCLUI" },
  "features.macros.title": { es: "Cálculo de Macros", en: "Macro Calculation", pt: "Cálculo de Macros" },
  "features.macros.desc": {
    es: "Cálculo personalizado de tus calorías, proteínas, carbohidratos y grasas exactas.",
    en: "Personalized calculation of your exact calories, protein, carbs and fats.",
    pt: "Cálculo personalizado das suas calorias, proteínas, carboidratos e gorduras exatas.",
  },
  "features.videos.title": { es: "Videos de Ejercicios", en: "Exercise Videos", pt: "Vídeos de Exercícios" },
  "features.videos.desc": {
    es: "Cada ejercicio de tu plan tiene un video explicativo para que sepas exactamente cómo hacerlo.",
    en: "Every exercise in your plan has an explanatory video so you know exactly how to do it.",
    pt: "Cada exercício do seu plano tem um vídeo explicativo para você saber exatamente como fazer.",
  },
  "features.photos.title": { es: "Seguimiento con Fotos", en: "Photo Tracking", pt: "Acompanhamento com Fotos" },
  "features.photos.desc": {
    es: "Subí tus fotos de progreso y medidas para ver tu transformación semana a semana.",
    en: "Upload your progress photos and measurements to see your transformation week by week.",
    pt: "Envie suas fotos de progresso e medidas para ver sua transformação semana a semana.",
  },
  "features.nutrition.title": { es: "Plan de Nutrición", en: "Nutrition Plan", pt: "Plano de Nutrição" },
  "features.nutrition.desc": {
    es: "Comidas personalizadas según tus macros, restricciones y preferencias alimentarias.",
    en: "Personalized meals based on your macros, restrictions and food preferences.",
    pt: "Refeições personalizadas conforme seus macros, restrições e preferências alimentares.",
  },
  "features.training.title": { es: "Plan de Entrenamiento", en: "Training Plan", pt: "Plano de Treino" },
  "features.training.desc": {
    es: "Rutinas diseñadas para tu nivel y objetivo con progresión mensual.",
    en: "Routines designed for your level and goal with monthly progression.",
    pt: "Rotinas projetadas para seu nível e objetivo com progressão mensal.",
  },
  "features.support.title": { es: "Soporte Directo", en: "Direct Support", pt: "Suporte Direto" },
  "features.support.desc": {
    es: "Contacto directo conmigo para resolver dudas y ajustar tu plan.",
    en: "Direct contact with me to resolve doubts and adjust your plan.",
    pt: "Contato direto comigo para tirar dúvidas e ajustar seu plano.",
  },

  // Testimonials
  "testimonials.title1": { es: "RESULTADOS", en: "REAL", pt: "RESULTADOS" },
  "testimonials.title2": { es: "REALES", en: "RESULTS", pt: "REAIS" },
  "testimonials.subtitle": {
    es: "Historias de transformación de nuestros clientes.",
    en: "Transformation stories from our clients.",
    pt: "Histórias de transformação dos nossos clientes.",
  },

  // CTA
  "cta.title1": { es: "EMPEZÁ TU", en: "START YOUR", pt: "COMECE SUA" },
  "cta.title2": { es: "TRANSFORMACIÓN", en: "TRANSFORMATION", pt: "TRANSFORMAÇÃO" },
  "cta.subtitle": {
    es: "No esperes más. Elegí tu plan, completá la encuesta y recibí tu entrenamiento y nutrición personalizada hoy mismo.",
    en: "Don't wait any longer. Choose your plan, complete the survey and receive your personalized training and nutrition today.",
    pt: "Não espere mais. Escolha seu plano, complete a pesquisa e receba seu treino e nutrição personalizados hoje.",
  },
  "cta.viewAll": { es: "Ver Todos los Planes", en: "View All Plans", pt: "Ver Todos os Planos" },

  // App download section
  "app.title1": { es: "DESCARGÁ LA", en: "DOWNLOAD THE", pt: "BAIXE O" },
  "app.title2": { es: "APP", en: "APP", pt: "APP" },
  "app.desc": {
    es: "Descargando la app podrás hacer todo el seguimiento de tu proceso: ver tu plan de entrenamiento, nutrición, subir fotos de progreso y registrar tus medidas desde tu celular.",
    en: "By downloading the app you can track your entire process: view your training plan, nutrition, upload progress photos and log your measurements from your phone.",
    pt: "Baixando o app você pode acompanhar todo o seu processo: ver seu plano de treino, nutrição, enviar fotos de progresso e registrar suas medidas pelo celular.",
  },
  "app.feature1": {
    es: "Accedé a tu plan de entrenamiento y nutrición",
    en: "Access your training and nutrition plan",
    pt: "Acesse seu plano de treino e nutrição",
  },
  "app.feature2": {
    es: "Subí fotos de progreso (frente, lateral, espalda)",
    en: "Upload progress photos (front, side, back)",
    pt: "Envie fotos de progresso (frente, lateral, costas)",
  },
  "app.feature3": {
    es: "Registrá tu peso y medidas semanales",
    en: "Log your weekly weight and measurements",
    pt: "Registre seu peso e medidas semanais",
  },
  "app.feature4": {
    es: "Videos de cada ejercicio para técnica correcta",
    en: "Exercise videos for proper technique",
    pt: "Vídeos de cada exercício para técnica correta",
  },
  "app.installDesc": {
    es: "Instalá la app en tu celular después de comprar tu plan",
    en: "Install the app on your phone after purchasing your plan",
    pt: "Instale o app no celular após comprar seu plano",
  },

  // Footer
  "footer.rights": {
    es: "Pablo Scarlatto Entrenamientos. Todos los derechos reservados.",
    en: "Pablo Scarlatto Training. All rights reserved.",
    pt: "Pablo Scarlatto Treinamentos. Todos os direitos reservados.",
  },
  "footer.login": { es: "Iniciar Sesión", en: "Log In", pt: "Entrar" },

  // Plans page
  "plans.choosePlan": { es: "ELEGÍ TU", en: "CHOOSE YOUR", pt: "ESCOLHA SEU" },
  "plans.allInclude": {
    es: "Todos los planes incluyen entrenamiento + nutrición personalizada con cálculo de macros exclusivo, videos de ejercicios y seguimiento de progreso.",
    en: "All plans include training + personalized nutrition with exclusive macro calculation, exercise videos and progress tracking.",
    pt: "Todos os planos incluem treino + nutrição personalizada com cálculo de macros exclusivo, vídeos de exercícios e acompanhamento de progresso.",
  },
  "plans.choosePlanBtn": { es: "Elegir Plan", en: "Choose Plan", pt: "Escolher Plano" },
  "plans.viewDetails": { es: "Ver detalles", en: "View details", pt: "Ver detalhes" },
  "plans.1-mes": { es: "1 Mes", en: "1 Month", pt: "1 Mês" },
  "plans.3-meses": { es: "3 Meses", en: "3 Months", pt: "3 Meses" },
  "plans.6-meses": { es: "6 Meses", en: "6 Months", pt: "6 Meses" },
  "plans.1-ano": { es: "1 Año", en: "1 Year", pt: "1 Ano" },

  // Post-purchase
  "postpurchase.title": { es: "¡Compra Exitosa!", en: "Purchase Successful!", pt: "Compra Realizada!" },
  "postpurchase.subtitle": {
    es: "Tu plan está listo. Descargá la app para acceder a tu entrenamiento y nutrición personalizada.",
    en: "Your plan is ready. Download the app to access your personalized training and nutrition.",
    pt: "Seu plano está pronto. Baixe o app para acessar seu treino e nutrição personalizados.",
  },
  "postpurchase.install": { es: "Instalar App", en: "Install App", pt: "Instalar App" },
  "postpurchase.goToDashboard": { es: "Ir al Dashboard", en: "Go to Dashboard", pt: "Ir ao Dashboard" },
  "postpurchase.installInstructions": {
    es: "Tocá el botón para instalar la app en tu celular. Podrás acceder a tu plan sin abrir el navegador.",
    en: "Tap the button to install the app on your phone. You can access your plan without opening the browser.",
    pt: "Toque no botão para instalar o app no celular. Você pode acessar seu plano sem abrir o navegador.",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "es",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale;
      if (saved && saved in LOCALE_LABELS) return saved;
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === "pt") return "pt";
      if (browserLang === "en") return "en";
    }
    return "es";
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  }, []);

  const translate = useCallback(
    (key: string): string => {
      return t[key]?.[locale] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
