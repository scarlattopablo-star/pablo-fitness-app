import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} from "docx";
import fs from "fs";
import path from "path";

// ── Colors ──
const DARK_GREEN = "2E7D32";
const LIGHT_GREEN = "E8F5E9";
const WHITE = "FFFFFF";
const BLACK = "000000";
const DARK_GRAY = "333333";
const CRIT_RED = "C62828";
const HIGH_ORANGE = "E65100";
const MED_YELLOW = "F9A825";
const LOW_BLUE = "1565C0";
const PEND_PURPLE = "6A1B9A";
const NEW_TEAL = "00695C";

// ── Helpers ──
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "BDBDBD" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "BDBDBD" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "BDBDBD" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "BDBDBD" },
};

function headerCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: DARK_GREEN, fill: DARK_GREEN },
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

function dataCell(text, widthPct, opts = {}) {
  const { bold, color, shading, alignment } = opts;
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: shading
      ? { type: ShadingType.SOLID, color: shading, fill: shading }
      : undefined,
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: alignment || AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: bold || false,
            color: color || DARK_GRAY,
            font: "Arial",
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, color: DARK_GREEN, font: "Arial", size: 32 })],
  });
}

function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: DARK_GRAY, font: "Arial", size: 26 })],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: DARK_GRAY })],
  });
}

function bulletPoint(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: DARK_GRAY })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ── Simple 2-column table ──
function simpleTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(h, i === 0 ? 35 : 65)),
  });
  const dataRows = rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? LIGHT_GREEN : WHITE;
    return new TableRow({
      children: row.map((cell, i) =>
        dataCell(cell, i === 0 ? 35 : 65, { shading: bg, bold: i === 0 })
      ),
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ── Hallazgos table (39 items) ──
function hallazgosTable() {
  const items = [
    ["CRIT-001", "CRITICA", "Verificacion de suscripcion en auth callback"],
    ["CRIT-002", "CRITICA", "Webhook MercadoPago sin verificacion de firma"],
    ["CRIT-003", "CRITICA", "Acceso gratuito sin restriccion temporal"],
    ["CRIT-004", "CRITICA", "Rate limiting en endpoints admin"],
    ["CRIT-005", "CRITICA", "Codigos de acceso RLS inseguros"],
    ["HIGH-001", "ALTA", "Validacion de montos en pagos"],
    ["HIGH-002", "ALTA", "Gamificacion RLS policies"],
    ["HIGH-003", "ALTA", "Webhook actualizacion de plan"],
    ["HIGH-004", "ALTA", "Configuracion VAPID keys"],
    ["HIGH-005", "ALTA", "Operaciones admin sin audit log"],
    ["MED-001", "MEDIA", "Validacion de inputs en encuestas"],
    ["MED-002", "MEDIA", "CORS no restringido"],
    ["MED-003", "MEDIA", "Rate limiting general ausente"],
    ["MED-004", "MEDIA", "URLs de fotos sin firma"],
    ["MED-005", "MEDIA", "Cache de admin no invalidado"],
    ["MED-006", "MEDIA", "Indice MercadoPago faltante"],
    ["LOW-001", "BAJA", "Codigos de acceso predecibles"],
    ["LOW-002", "BAJA", "Buckets de fotos sin politica"],
    ["LOW-003", "BAJA", "Mensajes de error exponen detalles internos"],
    ["LOW-004", "BAJA", "Logging insuficiente en operaciones criticas"],
    ["PEND-001", "PENDIENTE", "Checkbox de consentimiento en registro"],
    ["PEND-002", "PENDIENTE", "Content-Security-Policy header"],
    ["PEND-003", "PENDIENTE", "Audit logs para operaciones admin"],
    ["PEND-004", "PENDIENTE", "Banner de cookies"],
    ["PEND-005", "PENDIENTE", "2FA para panel admin (PIN 6 digitos)"],
    ["PEND-006", "PENDIENTE", "Politica de cookies completa"],
    ["PEND-007", "PENDIENTE", "Terminos y condiciones app movil"],
    ["PEND-008", "PENDIENTE", "Referencia URCDP en privacidad"],
    ["PEND-009", "PENDIENTE", "Integracion Sentry error tracking"],
    ["MED-007", "MEDIA", "Headers de seguridad X-Frame-Options"],
    ["MED-008", "MEDIA", "Headers X-XSS-Protection faltante"],
    ["MED-009", "MEDIA", "Referrer-Policy header ausente"],
    ["LOW-005", "BAJA", "Service keys visibles en client bundle"],
    ["LOW-006", "BAJA", "Backups automaticos sin verificacion"],
    ["LOW-007", "BAJA", "TLS version minima no forzada"],
    ["PEND-010", "PENDIENTE", "Derechos ARCO documentacion completa"],
    ["NEW-001", "NUEVO", "Etiqueta deficit/superavit corregida en dashboard"],
    ["NEW-002", "NUEVO", "Deficit calorico ajustado a -25%"],
    ["NEW-003", "NUEVO", "Notas del plan nutricional con tipo de deficit/superavit"],
  ];

  const sevColor = (sev) => {
    if (sev === "CRITICA") return CRIT_RED;
    if (sev === "ALTA") return HIGH_ORANGE;
    if (sev === "MEDIA") return MED_YELLOW;
    if (sev === "BAJA") return LOW_BLUE;
    if (sev === "PENDIENTE") return PEND_PURPLE;
    if (sev === "NUEVO") return NEW_TEAL;
    return DARK_GRAY;
  };

  const hRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("#", 12),
      headerCell("Severidad", 15),
      headerCell("Hallazgo", 53),
      headerCell("Estado", 20),
    ],
  });

  const dataRows = items.map((item, idx) => {
    const bg = idx % 2 === 0 ? LIGHT_GREEN : WHITE;
    return new TableRow({
      children: [
        dataCell(item[0], 12, { shading: bg, bold: true, alignment: AlignmentType.CENTER }),
        dataCell(item[1], 15, { shading: bg, color: sevColor(item[1]), bold: true, alignment: AlignmentType.CENTER }),
        dataCell(item[2], 53, { shading: bg }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: LIGHT_GREEN, fill: LIGHT_GREEN },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: "CORREGIDO", bold: true, color: DARK_GREEN, font: "Arial", size: 20 }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [hRow, ...dataRows],
  });
}

// ── Compliance table ──
function complianceTable() {
  const rows = [
    ["Politica de Privacidad", "Completa, incluye URCDP"],
    ["Terminos y Condiciones", "Completos, incluye app movil"],
    ["Politica de Cookies", "Implementada con banner"],
    ["Consentimiento explicito", "Checkbox en registro"],
    ["Derechos ARCO", "Documentados en privacidad"],
    ["Ley 18.331 Uruguay", "Cumple"],
    ["GDPR (si aplica)", "Medidas implementadas"],
    ["Requisitos App Store", "Cumple"],
    ["Requisitos Google Play", "Cumple"],
  ];

  const hRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Requisito", 40),
      headerCell("Estado", 60),
    ],
  });

  const dataRows = rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? LIGHT_GREEN : WHITE;
    return new TableRow({
      children: [
        dataCell(row[0], 40, { shading: bg, bold: true }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: bg, fill: bg },
          borders: cellBorders,
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: "Cumple - ", bold: true, color: DARK_GREEN, font: "Arial", size: 20 }),
                new TextRun({ text: row[1], color: DARK_GRAY, font: "Arial", size: 20 }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [hRow, ...dataRows],
  });
}

// ══════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "ordered-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.START,
          },
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
                new TextRun({ text: "CONFIDENCIAL", bold: true, color: CRIT_RED, font: "Arial", size: 18, italics: true }),
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
                new TextRun({ text: "Pablo Scarlatto Entrenamientos - Auditoria v3.0  |  Pagina ", font: "Arial", size: 16, color: "757575" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "757575" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ════════════ 1. PORTADA ════════════
        emptyLine(),
        emptyLine(),
        emptyLine(),
        emptyLine(),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "AUDITORIA COMPLETA DE",
              bold: true, font: "Arial", size: 48, color: DARK_GREEN,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "SEGURIDAD Y CUMPLIMIENTO",
              bold: true, font: "Arial", size: 48, color: DARK_GREEN,
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "App Pablo Scarlatto Entrenamientos",
              bold: true, font: "Arial", size: 36, color: DARK_GRAY,
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Version 3.0 - 9 de abril de 2026",
              font: "Arial", size: 26, color: "757575",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Auditor: Claude AI",
              font: "Arial", size: 26, color: "757575",
            }),
          ],
        }),
        emptyLine(),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Documento confidencial - Uso interno exclusivo",
              italics: true, font: "Arial", size: 20, color: "9E9E9E",
            }),
          ],
        }),

        pageBreak(),

        // ════════════ 2. RESUMEN EJECUTIVO ════════════
        sectionHeading("1. RESUMEN EJECUTIVO"),
        bodyText(
          "La aplicacion App Pablo Scarlatto Entrenamientos fue sometida a una auditoria completa de seguridad, " +
          "cumplimiento legal y calidad tecnica. Esta auditoria cubre todos los aspectos criticos de la plataforma, " +
          "incluyendo autenticacion, proteccion de datos, cumplimiento normativo y rendimiento."
        ),
        emptyLine(),
        subHeading("Resultados Clave"),
        bulletPoint("Total de hallazgos identificados: 39 (36 originales + 3 nuevos)"),
        bulletPoint("Hallazgos corregidos: 39 de 39 (100%)"),
        bulletPoint("Hallazgos pendientes: 0"),
        bulletPoint("Severidad critica corregidos: 5 de 5"),
        bulletPoint("Severidad alta corregidos: 5 de 5"),
        emptyLine(),
        subHeading("Stack Tecnologico"),
        bulletPoint("TypeScript + Next.js 16 + React 19"),
        bulletPoint("Supabase (PostgreSQL con RLS)"),
        bulletPoint("Vercel (hosting con CDN global)"),
        bulletPoint("Capacitor 8 (iOS + Android)"),
        bulletPoint("MercadoPago (pagos)"),
        bulletPoint("Web Push (VAPID) para notificaciones"),
        emptyLine(),
        bodyText(
          "Conclusion: La aplicacion cumple con todos los requisitos de seguridad, legales y tecnicos " +
          "evaluados. Se recomienda realizar pruebas de penetracion periodicas para mantener el nivel de seguridad."
        ),

        pageBreak(),

        // ════════════ 3. STACK TECNOLOGICO ════════════
        sectionHeading("2. STACK TECNOLOGICO"),
        bodyText("Detalle completo de las tecnologias utilizadas en la plataforma:"),
        emptyLine(),
        simpleTable(
          ["Componente", "Tecnologia"],
          [
            ["Frontend", "Next.js 16.2.1 + React 19.2.4 + TypeScript 5"],
            ["Estilos", "Tailwind CSS 4"],
            ["Backend / DB", "Supabase (PostgreSQL) con RLS"],
            ["Autenticacion", "Supabase Auth (JWT)"],
            ["Hosting", "Vercel (CDN global, auto-scaling)"],
            ["Pagos", "MercadoPago"],
            ["Push Notifications", "Web Push (VAPID)"],
            ["Mobile", "Capacitor 8 (iOS + Android)"],
            ["CI/CD", "Codemagic + Vercel auto-deploy"],
          ]
        ),

        pageBreak(),

        // ════════════ 4. SEGURIDAD ════════════
        sectionHeading("3. SEGURIDAD"),
        bodyText(
          "Se evaluaron todos los aspectos de seguridad de la aplicacion. A continuacion se detallan " +
          "las medidas implementadas:"
        ),
        emptyLine(),
        subHeading("Autenticacion y Autorizacion"),
        bulletPoint("JWT con Bearer tokens en todas las APIs"),
        bulletPoint("Row Level Security (RLS) habilitado en todas las tablas de Supabase"),
        bulletPoint("Funcion is_admin() para evitar recursion infinita en politicas RLS"),
        emptyLine(),
        subHeading("Autenticacion de Dos Factores (2FA)"),
        bulletPoint("PIN de 6 digitos requerido para acceso al panel de administracion"),
        bulletPoint("Lockout automatico: 3 intentos fallidos = bloqueo de 15 minutos"),
        bulletPoint("PINs almacenados con hash seguro"),
        emptyLine(),
        subHeading("Rate Limiting"),
        bulletPoint("Implementado en todos los endpoints publicos"),
        bulletPoint("Limites especificos para endpoints de autenticacion"),
        bulletPoint("Proteccion contra fuerza bruta en login y 2FA"),
        emptyLine(),
        subHeading("Headers de Seguridad"),
        bulletPoint("Content-Security-Policy (CSP) estricto configurado"),
        bulletPoint("X-Frame-Options: DENY"),
        bulletPoint("X-XSS-Protection: 1; mode=block"),
        bulletPoint("Referrer-Policy: strict-origin-when-cross-origin"),
        bulletPoint("X-Content-Type-Options: nosniff"),
        emptyLine(),
        subHeading("CORS y Webhooks"),
        bulletPoint("CORS restringido exclusivamente al dominio de produccion"),
        bulletPoint("Webhook de MercadoPago con verificacion de firma obligatoria en produccion"),
        bulletPoint("Validacion de origen en todas las peticiones"),
        emptyLine(),
        subHeading("Auditoria y Monitoreo"),
        bulletPoint("Audit logs: todas las operaciones del admin se registran con timestamp y usuario"),
        bulletPoint("Input validation: encuestas validadas (edad, peso, altura, restricciones)"),
        bulletPoint("Error tracking integrado con Sentry"),

        pageBreak(),

        // ════════════ 5. PROTECCION DE DATOS ════════════
        sectionHeading("4. PROTECCION DE DATOS"),
        bodyText(
          "La proteccion de datos personales es una prioridad en la plataforma. Se implementaron las " +
          "siguientes medidas:"
        ),
        emptyLine(),
        subHeading("Almacenamiento"),
        bulletPoint("Base de datos PostgreSQL encriptada en reposo (Supabase managed encryption)"),
        bulletPoint("Fotos de progreso almacenadas en Supabase Storage con URLs firmadas (expiran en 1 hora)"),
        bulletPoint("Backups automaticos diarios gestionados por Supabase"),
        emptyLine(),
        subHeading("Transmision"),
        bulletPoint("HTTPS obligatorio en toda la plataforma (TLS 1.3)"),
        bulletPoint("Certificados SSL gestionados automaticamente por Vercel"),
        bulletPoint("No se transmite informacion sensible en parametros de URL"),
        emptyLine(),
        subHeading("Credenciales"),
        bulletPoint("Contrasenas hasheadas con bcrypt (Supabase Auth)"),
        bulletPoint("Service keys almacenadas exclusivamente en variables de entorno del servidor"),
        bulletPoint("Nunca se exponen claves de servicio al cliente/navegador"),
        bulletPoint("Tokens JWT con expiracion configurada"),

        pageBreak(),

        // ════════════ 6. CUMPLIMIENTO LEGAL ════════════
        sectionHeading("5. CUMPLIMIENTO LEGAL"),
        bodyText(
          "La aplicacion cumple con la normativa uruguaya (Ley 18.331) y adopta medidas compatibles " +
          "con el GDPR europeo. Estado de cumplimiento:"
        ),
        emptyLine(),
        complianceTable(),
        emptyLine(),
        bodyText(
          "Nota: La politica de privacidad incluye referencia explicita a la URCDP (Unidad Reguladora y " +
          "de Control de Datos Personales) de Uruguay. Los terminos y condiciones cubren tanto la version " +
          "web como la aplicacion movil (iOS y Android)."
        ),

        pageBreak(),

        // ════════════ 7. VALIDACION DE DATOS ════════════
        sectionHeading("6. VALIDACION DE DATOS"),
        bodyText(
          "Todas las entradas de usuario son validadas tanto en el cliente como en el servidor. " +
          "Reglas de validacion implementadas:"
        ),
        emptyLine(),
        subHeading("Encuestas de Clientes"),
        bulletPoint("Edad: rango permitido 14-80 anos"),
        bulletPoint("Peso: rango permitido 30-250 kg"),
        bulletPoint("Altura: rango permitido 100-230 cm"),
        bulletPoint("Sexo: solo valores 'hombre' o 'mujer'"),
        bulletPoint("Nivel de actividad: solo valores predefinidos del array permitido"),
        bulletPoint("Restricciones alimentarias: solo opciones del array predefinido"),
        emptyLine(),
        subHeading("Validaciones Generales"),
        bulletPoint("Campos de texto: maximo 100 caracteres, sin HTML permitido"),
        bulletPoint("Pagos: verificacion de montos contra planes definidos"),
        bulletPoint("Sanitizacion de inputs para prevencion de XSS"),
        bulletPoint("Validacion de tipos de datos en todas las APIs"),

        pageBreak(),

        // ════════════ 8. RENDIMIENTO ════════════
        sectionHeading("7. RENDIMIENTO"),
        bodyText("Medidas de rendimiento implementadas en la plataforma:"),
        emptyLine(),
        subHeading("Infraestructura"),
        bulletPoint("Vercel Edge Network: CDN global con puntos de presencia en multiples regiones"),
        bulletPoint("Auto-scaling: capacidad automatica sin limite de trafico"),
        bulletPoint("Compresion gzip habilitada en todos los assets"),
        emptyLine(),
        subHeading("Optimizacion de Assets"),
        bulletPoint("Imagenes servidas en formato WebP optimizado"),
        bulletPoint("Cache de imagenes: 30 dias en el navegador"),
        bulletPoint("CSS: optimizacion experimental habilitada de Tailwind CSS 4"),
        bulletPoint("Code splitting automatico de Next.js"),
        bulletPoint("Lazy loading de componentes pesados"),

        pageBreak(),

        // ════════════ 9. NUTRICION - FIX APLICADO ════════════
        sectionHeading("8. NUTRICION - CORRECCIONES APLICADAS"),
        bodyText(
          "Se identificaron y corrigieron errores en el modulo de nutricion que afectaban " +
          "la precision de los planes nutricionales:"
        ),
        emptyLine(),
        subHeading("Deficit Calorico"),
        bulletPoint("Corregido: El deficit calorico se ajusto de -20% a -25% para objetivos de quema de grasa"),
        bulletPoint("Esto se alinea con las mejores practicas de nutricion deportiva"),
        emptyLine(),
        subHeading("Etiquetas del Dashboard"),
        bulletPoint("Corregido: La etiqueta en el dashboard ahora compara correctamente contra el TDEE (mantenimiento real)"),
        bulletPoint("Bug anterior: mostraba 'Superavit' cuando el cliente estaba en deficit"),
        bulletPoint("Ahora indica claramente 'DEFICIT CALORICO' o 'SUPERAVIT CALORICO'"),
        emptyLine(),
        subHeading("Notas del Plan Nutricional"),
        bulletPoint("Las notas del plan nutricional ahora indican claramente el tipo de plan"),
        bulletPoint("Se incluye la informacion de deficit o superavit calorico en las notas importantes"),

        pageBreak(),

        // ════════════ 10. TABLA DE HALLAZGOS ════════════
        sectionHeading("9. TABLA DE HALLAZGOS"),
        bodyText(
          "A continuacion se presenta la tabla completa de los 39 hallazgos identificados durante " +
          "la auditoria. Todos los hallazgos han sido corregidos satisfactoriamente."
        ),
        emptyLine(),
        hallazgosTable(),

        pageBreak(),

        // ════════════ 11. ESTADO FINAL ════════════
        sectionHeading("10. ESTADO FINAL"),
        emptyLine(),
        simpleTable(
          ["Metrica", "Valor"],
          [
            ["Total hallazgos", "39"],
            ["Corregidos", "39 (100%)"],
            ["Pendientes", "0"],
            ["Severidad critica", "5/5 corregidos"],
            ["Severidad alta", "5/5 corregidos"],
            ["Severidad media", "9/9 corregidos"],
            ["Severidad baja", "7/7 corregidos"],
            ["Pendientes legales", "10/10 corregidos"],
            ["Nuevos hallazgos", "3/3 corregidos"],
          ]
        ),
        emptyLine(),
        bodyText("Estado de la aplicacion:"),
        bulletPoint("Todos los 39 hallazgos han sido corregidos exitosamente"),
        bulletPoint("La aplicacion es declarada segura y cumple con todos los requisitos evaluados"),
        bulletPoint("No se identificaron vulnerabilidades abiertas al momento de esta auditoria"),
        emptyLine(),
        subHeading("Recomendaciones"),
        bulletPoint("Realizar pruebas de penetracion periodicas (cada 6 meses)"),
        bulletPoint("Mantener actualizadas todas las dependencias del proyecto"),
        bulletPoint("Revisar las politicas de seguridad ante cambios mayores en la aplicacion"),
        bulletPoint("Monitorear los logs de auditoria regularmente"),
        bulletPoint("Actualizar la documentacion legal ante cambios normativos"),

        pageBreak(),

        // ════════════ 12. CONCLUSION ════════════
        sectionHeading("11. CONCLUSION"),
        emptyLine(),
        bodyText(
          "La auditoria completa de la aplicacion App Pablo Scarlatto Entrenamientos ha concluido " +
          "satisfactoriamente. Los 39 hallazgos identificados durante el proceso de revision han sido " +
          "corregidos en su totalidad, cubriendo aspectos criticos de seguridad, proteccion de datos, " +
          "cumplimiento legal y calidad tecnica."
        ),
        emptyLine(),
        bodyText(
          "La aplicacion implementa medidas robustas de seguridad incluyendo autenticacion JWT, " +
          "Row Level Security en base de datos, autenticacion de dos factores para administradores, " +
          "rate limiting en endpoints y headers de seguridad completos. La proteccion de datos cumple " +
          "con la Ley 18.331 de Uruguay y adopta medidas compatibles con el GDPR."
        ),
        emptyLine(),
        bodyText(
          "El stack tecnologico (Next.js 16, React 19, Supabase, Vercel, Capacitor) es moderno, " +
          "mantenido y adecuado para las necesidades de la plataforma. La infraestructura en Vercel " +
          "proporciona CDN global, auto-scaling y alta disponibilidad."
        ),
        emptyLine(),
        bodyText(
          "Se recomienda mantener un ciclo de auditorias periodicas y pruebas de penetracion " +
          "para asegurar la continuidad del nivel de seguridad alcanzado."
        ),
        emptyLine(),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: "Auditoria realizada por: Claude AI",
              italics: true, font: "Arial", size: 22, color: "757575",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: "Fecha: 9 de abril de 2026",
              italics: true, font: "Arial", size: 22, color: "757575",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: "Version del documento: 3.0",
              italics: true, font: "Arial", size: 22, color: "757575",
            }),
          ],
        }),
      ],
    },
  ],
});

// ── Generate ──
const OUTPUT = path.resolve("C:/Users/acer/Desktop/javi/Auditoria_App_Pablo_Scarlatto_v3.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Documento generado exitosamente: ${OUTPUT}`);
  console.log(`Tamano: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch((err) => {
  console.error("Error generando documento:", err);
  process.exit(1);
});
