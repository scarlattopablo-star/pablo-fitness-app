import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} from "docx";
import fs from "fs";
import path from "path";

// ── Colors ──
const GREEN = "22C55E";
const DARK_GREEN = "16A34A";
const LIGHT_GREEN = "DCFCE7";
const WHITE = "FFFFFF";
const BLACK = "000000";
const DARK_GRAY = "333333";
const MED_GRAY = "6B7280";
const LIGHT_GRAY = "F3F4F6";
const TABLE_HEADER_BG = "166534";

// ── Borders ──
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

// ── Helpers ──
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 500, after: 200 },
    children: [new TextRun({ text, bold: true, color: GREEN, font: "Arial", size: 36 })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 150 },
    children: [new TextRun({ text, bold: true, color: DARK_GREEN, font: "Arial", size: 28 })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true, color: DARK_GRAY, font: "Arial", size: 24 })],
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 24, color: DARK_GRAY })],
  });
}

function bodyBold(label, text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: label, bold: true, font: "Arial", size: 24, color: DARK_GRAY }),
      new TextRun({ text, font: "Arial", size: 24, color: DARK_GRAY }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: DARK_GRAY })],
  });
}

function bulletBold(label, rest, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: label, bold: true, font: "Arial", size: 22, color: DARK_GRAY }),
      new TextRun({ text: rest, font: "Arial", size: 22, color: DARK_GRAY }),
    ],
  });
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { before: pts, after: 0 }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function tHeaderCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: TABLE_HEADER_BG, fill: TABLE_HEADER_BG },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 22 })],
      }),
    ],
  });
}

function tCell(text, widthPct, opts = {}) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading } : undefined,
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { before: 50, after: 50 },
        children: [
          new TextRun({
            text,
            bold: opts.bold || false,
            color: opts.color || DARK_GRAY,
            font: "Arial",
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function simpleTable(headers, rows) {
  const colWidth = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => tHeaderCell(h, colWidth)) }),
      ...rows.map((row, i) =>
        new TableRow({
          children: row.map(cell =>
            tCell(cell, colWidth, { shading: i % 2 === 1 ? LIGHT_GRAY : undefined })
          ),
        })
      ),
    ],
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// PORTADA
// ══════════════════════════════════════════════════════════════════════════════
function buildPortada() {
  return [
    spacer(1200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "PABLO SCARLATTO", bold: true, font: "Arial", size: 56, color: GREEN })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "ENTRENAMIENTOS", bold: true, font: "Arial", size: 56, color: DARK_GRAY })],
    }),
    spacer(200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: "Plataforma Digital de Entrenamiento y Nutricion Personalizada",
        font: "Arial", size: 28, color: MED_GRAY,
      })],
    }),
    spacer(100),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: "Documento de Producto, Know-How Tecnico y Guia Completa",
        bold: true, font: "Arial", size: 24, color: DARK_GRAY,
      })],
    }),
    spacer(400),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({
        text: "Version 2.0 \u2014 Abril 2026 \u2014 Todos los derechos reservados",
        font: "Arial", size: 22, color: MED_GRAY,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({
        text: "pabloscarlattoentrenamientos.com",
        font: "Arial", size: 22, color: GREEN, bold: true,
      })],
    }),
    pageBreak(),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// INDICE
// ══════════════════════════════════════════════════════════════════════════════
function buildIndice() {
  const items = [
    ["PARTE 1: PRODUCTO", ""],
    ["", "1. Vision General"],
    ["", "2. Flujo del Cliente"],
    ["", "3. Panel de Administracion"],
    ["", "4. Sistema de Pagos"],
    ["", "5. Apps Nativas"],
    ["PARTE 2: SEGURIDAD Y CUMPLIMIENTO", ""],
    ["", "6. Seguridad"],
    ["", "7. Proteccion de Datos"],
    ["", "8. Cumplimiento Legal"],
    ["PARTE 3: TECNICO", ""],
    ["", "9. Stack Tecnologico"],
    ["", "10. Metricas del Proyecto"],
    ["", "11. Propiedad Intelectual"],
    ["", "12. Fuentes Cientificas"],
  ];

  return [
    heading1("INDICE"),
    spacer(100),
    ...items.map(([part, section]) => {
      if (part) {
        return new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [new TextRun({ text: part, bold: true, font: "Arial", size: 24, color: GREEN })],
        });
      }
      return new Paragraph({
        spacing: { before: 40, after: 40 },
        indent: { left: 720 },
        children: [new TextRun({ text: section, font: "Arial", size: 22, color: DARK_GRAY })],
      });
    }),
    pageBreak(),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTE 1: PRODUCTO
// ══════════════════════════════════════════════════════════════════════════════
function buildParte1() {
  const sections = [];

  // ── Encabezado Parte 1 ──
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 400 },
      children: [new TextRun({ text: "PARTE 1: PRODUCTO", bold: true, font: "Arial", size: 40, color: GREEN })],
    }),
    pageBreak(),
  );

  // ── 1. Vision General ──
  sections.push(
    heading1("1. Vision General"),
    body("GymRat by Pablo Scarlatto Entrenamientos es una plataforma digital integral de entrenamiento personalizado y nutricion, disenada para ofrecer una experiencia completa tanto en web como en dispositivos moviles."),
    spacer(100),
    bulletBold("Tipo de aplicacion: ", "Progressive Web App (PWA) + apps nativas iOS/Android via Capacitor 8"),
    bulletBold("Marca: ", "GymRat by Pablo Scarlatto Entrenamientos"),
    bulletBold("URL: ", "pabloscarlattoentrenamientos.com"),
    bulletBold("Modelo de negocio: ", "Suscripcion mensual, trimestral, semestral y anual + prueba gratis de 7 dias sin tarjeta"),
    bulletBold("Plataformas: ", "Web (PWA), Android (AAB firmado), iOS (en proceso)"),
    bulletBold("Deploy: ", "Vercel con CDN global"),
    bulletBold("Backend: ", "Supabase (PostgreSQL, Auth, Realtime, Storage)"),
    pageBreak(),
  );

  // ── 2. Flujo del Cliente ──
  sections.push(heading1("2. Flujo del Cliente"));

  // 2.1 Onboarding
  sections.push(
    heading2("2.1 Onboarding"),
    body("La experiencia de primer uso esta disenada para captar la atencion del usuario y guiarlo hacia la conversion:"),
    bullet("Splash screen con foto profesional de Pablo + logo GymRat animado"),
    bullet("Carrusel interactivo de 5 slides:"),
    bullet("Slide 1: Entrenamiento personalizado", 1),
    bullet("Slide 2: Nutricion a medida", 1),
    bullet("Slide 3: Comunidad Gym Bro", 1),
    bullet("Slide 4: Seguimiento de progreso", 1),
    bullet("Slide 5: Call-to-Action (registro)", 1),
    bullet("Opcion destacada: \"Probar Gratis 7 dias\" o elegir plan de pago directamente"),
  );

  // 2.2 Registro y Evaluacion
  sections.push(
    heading2("2.2 Registro y Evaluacion Inicial"),
    heading3("Registro"),
    bullet("Campos: email, contrasena, nombre completo, telefono"),
    bullet("Checkbox de consentimiento explicito obligatorio (Terminos de Servicio + Politica de Privacidad)"),
    bullet("Validacion en tiempo real de todos los campos"),
    heading3("Encuesta de Evaluacion (6-7 pasos)"),
    bullet("Paso 1: Datos basicos (edad, sexo, peso, altura)"),
    bullet("Paso 2: Objetivo (perder grasa, ganar musculo, recomposicion, mantenimiento)"),
    bullet("Paso 3: Nivel de experiencia (principiante, intermedio, avanzado)"),
    bullet("Paso 4: Frecuencia semanal de entrenamiento (3-6 dias)"),
    bullet("Paso 5: Nivel de actividad diaria (sedentario a muy activo)"),
    bullet("Paso 6: Restricciones alimentarias y lesiones"),
    bullet("Paso 7: Preferencias de equipamiento"),
    heading3("Validaciones de datos"),
    bullet("Edad: 14-80 anos"),
    bullet("Peso: 30-250 kg"),
    bullet("Altura: 100-230 cm"),
    bullet("Todos los campos obligatorios con mensajes de error claros"),
  );

  // 2.3 Calculo de Macros
  sections.push(
    heading2("2.3 Calculo de Macronutrientes"),
    body("El sistema calcula automaticamente los macronutrientes basandose en evidencia cientifica:"),
    heading3("Tasa Metabolica Basal (TMB)"),
    bullet("Formula: Harris-Benedict revisada"),
    bullet("Hombres: TMB = 88.362 + (13.397 x peso kg) + (4.799 x altura cm) - (5.677 x edad)"),
    bullet("Mujeres: TMB = 447.593 + (9.247 x peso kg) + (3.098 x altura cm) - (4.330 x edad)"),
    heading3("Gasto Energetico Total Diario (TDEE)"),
    bullet("TDEE = TMB x Factor de Actividad"),
    bullet("Sedentario: x1.2 | Ligero: x1.375 | Moderado: x1.55 | Activo: x1.725 | Muy activo: x1.9"),
    heading3("Ajuste segun Objetivo"),
    bullet("Deficit calorico (quema de grasa): TDEE - 25%"),
    bullet("Superavit calorico (ganancia muscular): TDEE + 15%"),
    bullet("Mantenimiento / Recomposicion: TDEE sin ajuste"),
    bullet("Etiqueta visible en el plan: \"DEFICIT CALORICO\" o \"SUPERAVIT CALORICO\""),
    heading3("Distribucion de Macros"),
    bullet("Proteina: 2.0-2.2 g/kg de peso corporal"),
    bullet("Grasa: 25-30% de calorias totales"),
    bullet("Carbohidratos: calorias restantes"),
  );

  // 2.4 Generacion de Planes
  sections.push(
    heading2("2.4 Generacion Automatica de Planes"),
    heading3("Plan de Entrenamiento"),
    body("El algoritmo genera planes de entrenamiento siguiendo principios de periodizacion y biomecanioca:"),
    bullet("Metodologia agonista-antagonista para optimizar el tiempo de sesion"),
    bullet("8 ejercicios por sesion + cardio al final"),
    bullet("Ejercicios base/compuestos primero, aislamiento despues"),
    bulletBold("Hombres: ", "1 musculo grande + 1 musculo chico por sesion"),
    bulletBold("Mujeres: ", "1 musculo grande + 2 musculos chicos (enfoque tren inferior por defecto)"),
    bullet("Abdominales: 2 ejercicios, 2 veces por semana en dias de carga liviana"),
    bullet("Sin dominadas para mujeres (sustituidas por alternativas)"),
    bullet("Sin burpees en rutinas de gimnasio"),
    bullet("Cada ejercicio incluye: nombre, series, repeticiones, descanso, video/GIF demostrativo"),
    bullet("Biblioteca de +70 ejercicios con +90 GIFs animados"),
    heading3("Plan de Nutricion"),
    bullet("4 a 6 comidas diarias distribuidas a lo largo del dia"),
    bullet("Macronutrientes calculados y desglosados por comida"),
    bullet("Respeta restricciones alimentarias del usuario"),
    bullet("Sistema de sustitucion de alimentos manteniendo macros equivalentes"),
    bullet("Base de datos de 88 alimentos con valores nutricionales"),
    bullet("Notas importantes personalizadas (objetivo, hidratacion, suplementos)"),
  );

  // 2.5 Dashboard
  sections.push(
    heading2("2.5 Dashboard del Cliente"),
    body("El dashboard es el centro de operaciones del cliente, con acceso a todas las funcionalidades:"),
    heading3("Funcionalidades principales"),
    bullet("Plan de entrenamiento interactivo con videos y GIFs demostrativos"),
    bullet("Plan de nutricion con macros detallados por comida"),
    bullet("Registro de entrenamiento: peso levantado, repeticiones, notas por ejercicio"),
    bullet("Seguimiento de progreso: fotos de progreso, peso corporal, medidas corporales"),
    bullet("Graficos de evolucion con Recharts"),
    heading3("Comunidad y Social"),
    bullet("Chat Gym Bro: comunidad grupal + mensajeria directa con el entrenador"),
    bullet("Ranking semanal de actividad con gamificacion"),
    bullet("Sistema de rachas, badges, XP y niveles"),
    bullet("Notificaciones motivacionales automaticas"),
    heading3("Referidos y Monetizacion"),
    bullet("Programa de referidos: 15% de descuento para quien refiere y quien es referido"),
    bullet("Codigo unico por usuario para compartir"),
    heading3("Perfil y Configuracion"),
    bullet("Perfil editable con foto de perfil"),
    bullet("Actualizacion de encuesta desde el perfil: regenera plan automaticamente"),
    bullet("Banner de trial visible para usuarios gratuitos"),
    bullet("Paywall modal con opciones de suscripcion al vencer el trial"),
  );

  // 2.6 Actualizacion de Plan
  sections.push(
    heading2("2.6 Actualizacion de Plan"),
    bullet("El cliente puede actualizar su encuesta de evaluacion en cualquier momento desde su perfil"),
    bullet("Al guardar nuevos datos, el plan de entrenamiento y nutricion se regenera automaticamente"),
    bullet("Las ediciones realizadas por el administrador se reflejan en tiempo real gracias a Supabase Realtime"),
    bullet("Historial de cambios mantenido en audit logs"),
    pageBreak(),
  );

  // ── 3. Panel de Administracion ──
  sections.push(
    heading1("3. Panel de Administracion"),
    body("El panel de administracion es una herramienta completa para que Pablo gestione todos los aspectos de su negocio:"),
    heading2("3.1 Dashboard de Estadisticas"),
    bullet("Clientes activos, nuevos, en trial, churn"),
    bullet("Ingresos mensuales y acumulados"),
    bullet("Metricas de engagement y retencion"),
    heading2("3.2 Gestion de Clientes"),
    bullet("Lista completa de clientes con busqueda y filtros"),
    bullet("Detalle individual de cada cliente"),
    bullet("Aprobacion/rechazo de nuevos registros"),
    bullet("Cambiar email de un cliente"),
    bullet("Transferir plan completo entre usuarios"),
    heading2("3.3 Editor de Planes"),
    bullet("Editor completo de planes de entrenamiento"),
    bullet("Editor completo de planes de nutricion"),
    bullet("Regenerar todos los planes con un solo boton"),
    bullet("Cambios reflejados en tiempo real en la app del cliente"),
    heading2("3.4 Gestion de Contenido"),
    bullet("Gestion de ejercicios (crear, editar, eliminar)"),
    bullet("Gestion de planes predefinidos"),
    bullet("Gestion de precios y suscripciones"),
    bullet("Gestion de pagos y estados"),
    heading2("3.5 Herramientas Adicionales"),
    bullet("Codigos QR generados para clientes directos (presenciales)"),
    bullet("Papelera con opcion de restaurar o eliminar permanentemente"),
    bullet("Chat admin con broadcast (mensajes masivos)"),
    bullet("2FA con PIN de 6 digitos + lockout despues de 3 intentos fallidos"),
    bullet("Audit logs de todas las operaciones administrativas"),
    pageBreak(),
  );

  // ── 4. Sistema de Pagos ──
  sections.push(
    heading1("4. Sistema de Pagos"),
    body("La plataforma integra MercadoPago como pasarela de pagos para el mercado latinoamericano:"),
    heading2("4.1 Integracion con MercadoPago"),
    bullet("Webhook verificado con HMAC-SHA256 para garantizar autenticidad de notificaciones"),
    bullet("Verificacion obligatoria de firma en entorno de produccion"),
    bullet("Soporte para pagos unicos y suscripciones recurrentes"),
    bullet("Estados de pago sincronizados con la base de datos en tiempo real"),
    heading2("4.2 Planes de Suscripcion"),
    bullet("Mensual"),
    bullet("Trimestral (con descuento)"),
    bullet("Semestral (con descuento)"),
    bullet("Anual (mayor descuento)"),
    heading2("4.3 Trial y Referidos"),
    bullet("Prueba gratuita de 7 dias sin necesidad de tarjeta de credito"),
    bullet("Programa de referidos: 15% de descuento para ambas partes"),
    bullet("Codigo de referido unico por usuario"),
    pageBreak(),
  );

  // ── 5. Apps Nativas ──
  sections.push(
    heading1("5. Apps Nativas (iOS y Android)"),
    body("La aplicacion se distribuye como app nativa utilizando Capacitor 8 como bridge:"),
    bullet("Capacitor 8 para compilacion nativa en iOS y Android"),
    bullet("Iconos y splash screens generados profesionalmente para todas las resoluciones"),
    bullet("Codemagic CI/CD para builds firmados automaticos"),
    bullet("Push notifications nativas (Web Push VAPID)"),
    bullet("AAB (Android App Bundle) firmado y listo para Google Play"),
    bullet("Pendiente: publicacion final en stores (cuenta Google Play en proceso de verificacion)"),
    bullet("Experiencia nativa: navegacion fluida, gestos, rendimiento optimizado"),
    pageBreak(),
  );

  return sections;
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTE 2: SEGURIDAD Y CUMPLIMIENTO
// ══════════════════════════════════════════════════════════════════════════════
function buildParte2() {
  const sections = [];

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 400 },
      children: [new TextRun({ text: "PARTE 2: SEGURIDAD Y CUMPLIMIENTO", bold: true, font: "Arial", size: 40, color: GREEN })],
    }),
    pageBreak(),
  );

  // ── 6. Seguridad ──
  sections.push(
    heading1("6. Seguridad"),
    body("La plataforma implementa multiples capas de seguridad para proteger datos de usuarios y operaciones:"),
    heading2("6.1 Autenticacion y Autorizacion"),
    bullet("JWT (JSON Web Tokens) con Bearer tokens para todas las peticiones autenticadas"),
    bullet("Row Level Security (RLS) activado en todas las tablas de la base de datos"),
    bullet("Funcion is_admin() para evitar recursion infinita en politicas RLS"),
    bullet("Contraseñas hasheadas con bcrypt (salt rounds configurados)"),
    heading2("6.2 Proteccion del Panel Admin"),
    bullet("Autenticacion de dos factores (2FA) con PIN de 6 digitos"),
    bullet("Lockout automatico despues de 3 intentos fallidos"),
    bullet("Sesiones administrativas con timeout configurable"),
    heading2("6.3 Proteccion de APIs"),
    bullet("Rate limiting implementado en todos los endpoints"),
    bullet("Content Security Policy (CSP) header estricto"),
    bullet("CORS restringido solo a dominios autorizados"),
    bullet("Webhook de MercadoPago verificado con HMAC-SHA256"),
    bullet("Input validation exhaustiva en encuestas y formularios"),
    heading2("6.4 Auditoria"),
    bullet("Audit logs de todas las operaciones administrativas"),
    bullet("Registro de accesos, modificaciones y eliminaciones"),
    bullet("Trazabilidad completa de cambios en planes de clientes"),
    pageBreak(),
  );

  // ── 7. Proteccion de Datos ──
  sections.push(
    heading1("7. Proteccion de Datos"),
    body("Medidas tecnicas implementadas para la proteccion de datos personales y sensibles:"),
    heading2("7.1 Encriptacion"),
    bullet("PostgreSQL con encriptacion en reposo (at-rest encryption)"),
    bullet("HTTPS/TLS 1.3 para todas las comunicaciones en transito"),
    bullet("Fotos de progreso almacenadas con URLs firmadas (expiran en 1 hora)"),
    heading2("7.2 Infraestructura"),
    bullet("Backups automaticos diarios de la base de datos (Supabase)"),
    bullet("Service keys utilizadas exclusivamente en el servidor (nunca expuestas al cliente)"),
    bullet("Variables de entorno gestionadas de forma segura en Vercel"),
    bullet("Separacion estricta entre entorno de desarrollo y produccion"),
    pageBreak(),
  );

  // ── 8. Cumplimiento Legal ──
  sections.push(
    heading1("8. Cumplimiento Legal"),
    body("La plataforma cumple con la normativa vigente en Uruguay y aplica medidas de cumplimiento internacional:"),
    heading2("8.1 Documentos Legales"),
    bullet("Politica de Privacidad completa y accesible"),
    bullet("Terminos y Condiciones (incluye uso de app movil)"),
    bullet("Politica de Cookies + banner informativo con consentimiento"),
    heading2("8.2 Normativa Uruguaya"),
    bullet("Ley 18.331 de Proteccion de Datos Personales de Uruguay (URCDP)"),
    bullet("Derechos ARCO implementados: Acceso, Rectificacion, Cancelacion y Oposicion"),
    bullet("Consentimiento explicito obligatorio en el registro"),
    heading2("8.3 Normativa Internacional"),
    bullet("Medidas GDPR implementadas como buena practica:"),
    bullet("Minimizacion de datos recolectados", 1),
    bullet("Derecho al olvido implementado", 1),
    bullet("Portabilidad de datos disponible", 1),
    bullet("Registro de actividades de tratamiento", 1),
    pageBreak(),
  );

  return sections;
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTE 3: TECNICO
// ══════════════════════════════════════════════════════════════════════════════
function buildParte3() {
  const sections = [];

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 400 },
      children: [new TextRun({ text: "PARTE 3: TECNICO", bold: true, font: "Arial", size: 40, color: GREEN })],
    }),
    pageBreak(),
  );

  // ── 9. Stack Tecnologico ──
  sections.push(
    heading1("9. Stack Tecnologico"),
    body("La plataforma esta construida con tecnologias modernas de alto rendimiento:"),
    spacer(100),
    simpleTable(
      ["Capa", "Tecnologia", "Version / Detalle"],
      [
        ["Frontend", "Next.js + React + TypeScript", "16.2.1 / 19.2.4 / 5"],
        ["Estilos", "Tailwind CSS", "4"],
        ["Backend / DB", "Supabase PostgreSQL", "Auth + Realtime + Storage"],
        ["Pagos", "MercadoPago", "SDK + Webhook HMAC"],
        ["Push Notifications", "Web Push VAPID", "Servidor + cliente"],
        ["Graficos", "Recharts", "Graficos de progreso"],
        ["Deploy", "Vercel", "CDN global, edge functions"],
        ["Mobile", "Capacitor", "8 (iOS + Android)"],
        ["CI/CD", "Codemagic + Vercel", "Builds firmados"],
        ["Animaciones", "Framer Motion", "Transiciones y micro-interacciones"],
      ]
    ),
    pageBreak(),
  );

  // ── 10. Metricas ──
  sections.push(
    heading1("10. Metricas del Proyecto"),
    body("Numeros que reflejan la envergadura y complejidad del proyecto:"),
    spacer(100),
    simpleTable(
      ["Metrica", "Valor"],
      [
        ["Lineas de codigo", "20,000+"],
        ["Paginas / rutas", "70+"],
        ["API endpoints", "25+"],
        ["Componentes React", "20+"],
        ["Tablas en base de datos", "15"],
        ["Alimentos en base de datos", "88"],
        ["Ejercicios en biblioteca", "70+"],
        ["GIFs demostrativos", "90+"],
      ]
    ),
    pageBreak(),
  );

  // ── 11. Propiedad Intelectual ──
  sections.push(
    heading1("11. Propiedad Intelectual"),
    body("Todo el codigo fuente, algoritmos de generacion de planes, base de datos de ejercicios y alimentos, diseno de interfaz, flujos de usuario, logica de negocio y documentacion tecnica son propiedad intelectual exclusiva de Pablo Scarlatto."),
    spacer(100),
    body("Esto incluye pero no se limita a:"),
    bullet("Algoritmo de generacion de planes de entrenamiento agonista-antagonista"),
    bullet("Algoritmo de calculo de macronutrientes y generacion de planes nutricionales"),
    bullet("Base de datos curada de 88 alimentos con valores nutricionales"),
    bullet("Biblioteca de 70+ ejercicios con descripciones y clasificaciones"),
    bullet("90+ GIFs animados demostrativos de ejercicios"),
    bullet("Diseno de interfaz, marca GymRat y elementos visuales"),
    bullet("Flujos de onboarding, evaluacion y generacion de planes"),
    bullet("Logica de gamificacion: rachas, badges, XP, niveles y ranking"),
    bullet("Toda la documentacion tecnica y funcional asociada"),
    spacer(100),
    body("Cualquier reproduccion, distribucion o uso no autorizado de estos elementos esta prohibido y sera perseguido legalmente conforme a la legislacion vigente."),
    pageBreak(),
  );

  // ── 12. Fuentes Cientificas ──
  sections.push(
    heading1("12. Fuentes Cientificas"),
    body("Los algoritmos y recomendaciones de la plataforma se basan en las siguientes fuentes cientificas y organizaciones de referencia:"),
    spacer(100),
    heading2("Calculo Metabolico"),
    bullet("Harris-Benedict (ecuacion revisada) - Calculo de Tasa Metabolica Basal"),
    bullet("NIDDK (National Institute of Diabetes and Digestive and Kidney Diseases) - Modelos de gasto energetico"),
    heading2("Entrenamiento"),
    bullet("ACSM (American College of Sports Medicine) - Guias de prescripcion de ejercicio"),
    bullet("NSCA (National Strength and Conditioning Association) - Principios de fuerza y acondicionamiento"),
    bullet("Schoenfeld, B.J. (2016) - Mecanismos de hipertrofia muscular y su aplicacion al entrenamiento de resistencia"),
    heading2("Nutricion"),
    bullet("ISSN (International Society of Sports Nutrition) - Posicionamiento sobre nutricion deportiva"),
    bullet("USDA (United States Department of Agriculture) - Valores nutricionales de referencia"),
    bullet("AND (Academy of Nutrition and Dietetics) - Guias de nutricion para deportistas"),
    bullet("ADA (American Diabetes Association) - Referencias de indice glucemico y carga glucemica"),
  );

  return sections;
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER FINAL
// ══════════════════════════════════════════════════════════════════════════════
function buildFooterFinal() {
  return [
    spacer(600),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "\u2501".repeat(40),
          font: "Arial", size: 20, color: GREEN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 80 },
      children: [
        new TextRun({
          text: "Pablo Scarlatto Entrenamientos",
          bold: true, font: "Arial", size: 24, color: GREEN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: "Todos los derechos reservados \u2014 Abril 2026",
          font: "Arial", size: 20, color: MED_GRAY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
      children: [
        new TextRun({
          text: "pabloscarlattoentrenamientos.com",
          font: "Arial", size: 20, color: GREEN,
        }),
      ],
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // US Letter
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Pablo Scarlatto Entrenamientos", font: "Arial", size: 16, color: MED_GRAY, italics: true }),
                  new TextRun({ text: "  |  ", font: "Arial", size: 16, color: MED_GRAY }),
                  new TextRun({ text: "Documento de Producto v2.0", font: "Arial", size: 16, color: MED_GRAY, italics: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Pablo Scarlatto Entrenamientos \u2014 Todos los derechos reservados \u2014 Abril 2026", font: "Arial", size: 16, color: MED_GRAY }),
                  new TextRun({ text: "    |    Pagina ", font: "Arial", size: 16, color: MED_GRAY }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MED_GRAY }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...buildPortada(),
          ...buildIndice(),
          ...buildParte1(),
          ...buildParte2(),
          ...buildParte3(),
          ...buildFooterFinal(),
        ],
      },
    ],
  });

  const outputPath = path.resolve("C:/Users/acer/Desktop/javi/Pablo_Scarlatto_App_Completo_v2.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento generado: ${outputPath}`);
  console.log(`Tamano: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
