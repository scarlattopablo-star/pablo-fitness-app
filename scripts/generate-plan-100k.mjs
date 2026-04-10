import { createRequire } from "module";
const require = createRequire(import.meta.url);

const docx = require("docx");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} = docx;
const fs = require("fs");
const path = require("path");

// ── Colors ──
const GREEN = "22C55E";
const DARK_GREEN = "16A34A";
const LIGHT_GREEN = "F0FDF4";
const WHITE = "FFFFFF";
const BLACK = "000000";
const DARK_GRAY = "333333";
const MED_GRAY = "6B7280";
const LIGHT_GRAY = "F3F4F6";
const BORDER_GRAY = "D1D5DB";

// ── Read markdown ──
const mdPath = path.resolve("C:/Users/acer/Desktop/javi/PLAN_EJECUCION_100K.md");
const outPath = path.resolve("C:/Users/acer/Desktop/javi/Plan_Ejecucion_100K_USD.docx");
const md = fs.readFileSync(mdPath, "utf-8");

// ── Helpers ──
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
};

function tHeaderCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: GREEN, fill: GREEN },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 20 })],
      }),
    ],
  });
}

function tDataCell(text, widthPct, opts = {}) {
  const { bold, color, shading, alignment } = opts;
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: shading ? { type: ShadingType.SOLID, color: shading, fill: shading } : undefined,
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: alignment || AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: text || "",
            bold: bold || false,
            color: color || DARK_GRAY,
            font: "Arial",
            size: 19,
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows) {
  const colW = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => tHeaderCell(h, colW)) }),
      ...rows.map((row, i) =>
        new TableRow({
          children: row.map(cell =>
            tDataCell(
              cell.replace(/\*\*/g, ""),
              colW,
              {
                bold: cell.includes("**"),
                shading: i % 2 === 1 ? LIGHT_GRAY : undefined,
              }
            )
          ),
        })
      ),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, color: GREEN, font: "Arial", size: 32 })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: DARK_GREEN, font: "Arial", size: 26 })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, color: DARK_GRAY, font: "Arial", size: 23 })],
  });
}

function bodyText(text) {
  // Parse bold segments
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(new TextRun({ text: text.slice(lastIndex, match.index), font: "Arial", size: 21, color: DARK_GRAY }));
    }
    parts.push(new TextRun({ text: match[1], bold: true, font: "Arial", size: 21, color: DARK_GRAY }));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(new TextRun({ text: text.slice(lastIndex), font: "Arial", size: 21, color: DARK_GRAY }));
  }
  if (parts.length === 0) {
    parts.push(new TextRun({ text, font: "Arial", size: 21, color: DARK_GRAY }));
  }
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: parts });
}

function bulletItem(text, level = 0) {
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  const cleanText = text.replace(/^[-*]\s*/, "").replace(/^\[[ x]\]\s*/, "");
  while ((match = regex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(new TextRun({ text: cleanText.slice(lastIndex, match.index), font: "Arial", size: 21, color: DARK_GRAY }));
    }
    parts.push(new TextRun({ text: match[1], bold: true, font: "Arial", size: 21, color: DARK_GRAY }));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < cleanText.length) {
    parts.push(new TextRun({ text: cleanText.slice(lastIndex), font: "Arial", size: 21, color: DARK_GRAY }));
  }
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: parts,
  });
}

function checkboxItem(text) {
  const cleanText = text.replace(/^[-*]\s*\[[ x]\]\s*/, "");
  const checked = text.includes("[x]");
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: checked ? "\u2611 " : "\u2610 ", font: "Segoe UI Symbol", size: 22, color: GREEN }),
      new TextRun({ text: cleanText, font: "Arial", size: 21, color: DARK_GRAY }),
    ],
  });
}

function pageBreakPara() {
  return new Paragraph({ children: [new PageBreak()] });
}

function emptyLine() {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [] });
}

// ── Parse markdown into sections ──
const lines = md.split("\n");
const children = [];

// ── COVER PAGE ──
children.push(emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine());

// Green accent bar
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: GREEN, font: "Arial", size: 28 })],
}));

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 300, after: 100 },
  children: [new TextRun({ text: "PLAN DE EJECUCION", bold: true, color: GREEN, font: "Arial", size: 52 })],
}));

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 100, after: 200 },
  children: [new TextRun({ text: "$100,000 USD", bold: true, color: DARK_GRAY, font: "Arial", size: 48 })],
}));

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: GREEN, font: "Arial", size: 28 })],
}));

children.push(emptyLine(), emptyLine());

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 100, after: 80 },
  children: [new TextRun({ text: "Pablo Scarlatto Entrenamientos", bold: true, color: DARK_GRAY, font: "Arial", size: 32 })],
}));

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 80 },
  children: [new TextRun({ text: "Abril 2026 \u2192 Enero 2027", color: MED_GRAY, font: "Arial", size: 26 })],
}));

children.push(emptyLine(), emptyLine(), emptyLine());

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200 },
  children: [new TextRun({ text: "Documento Confidencial", italics: true, color: MED_GRAY, font: "Arial", size: 20 })],
}));

children.push(pageBreakPara());

// ── Parse body content ──
let i = 0;
// Skip the first 3 lines (title, subtitle, date) and the first ---
while (i < lines.length && !lines[i].startsWith("---")) i++;
i++; // skip the ---

// Track which main sections we've seen for page breaks
const mainSections = ["LA MATEMATICA", "FASE 1", "FASE 2", "FASE 3", "FASE 4", "PRESUPUESTO", "METRICAS", "LAS 10 REGLAS", "CHECKLIST"];
let isFirstSection = true;

function isMainSection(line) {
  const clean = line.replace(/^#+\s*/, "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return mainSections.some(s => clean.includes(s));
}

// Collect table lines helper
function parseTable(startIdx) {
  const tableLines = [];
  let idx = startIdx;
  while (idx < lines.length && lines[idx].trim().startsWith("|")) {
    tableLines.push(lines[idx].trim());
    idx++;
  }
  if (tableLines.length < 2) return { table: null, endIdx: startIdx };

  // Parse header
  const headerLine = tableLines[0];
  const headers = headerLine.split("|").filter(c => c.trim()).map(c => c.trim());

  // Skip separator line
  const dataLines = tableLines.slice(2);
  const rows = dataLines.map(line =>
    line.split("|").filter(c => c.trim()).map(c => c.trim())
  );

  return { table: makeTable(headers, rows), endIdx: idx };
}

let inCodeBlock = false;
let codeLines = [];

while (i < lines.length) {
  const line = lines[i];

  // Code blocks
  if (line.trim().startsWith("```")) {
    if (inCodeBlock) {
      // End of code block - render as shaded paragraph
      const codeText = codeLines.join("\n");
      children.push(new Paragraph({
        spacing: { before: 100, after: 100 },
        shading: { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY },
        indent: { left: 360, right: 360 },
        children: codeText.split("\n").flatMap((cl, ci, arr) => {
          const runs = [new TextRun({ text: cl, font: "Consolas", size: 19, color: DARK_GRAY })];
          if (ci < arr.length - 1) runs.push(new TextRun({ break: 1 }));
          return runs;
        }),
      }));
      codeLines = [];
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
      codeLines = [];
    }
    i++;
    continue;
  }

  if (inCodeBlock) {
    codeLines.push(line);
    i++;
    continue;
  }

  const trimmed = line.trim();

  // Skip empty lines
  if (!trimmed) { i++; continue; }

  // Horizontal rules
  if (trimmed === "---") { i++; continue; }

  // H1
  if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
    const text = trimmed.replace(/^#\s+/, "");
    if (!isFirstSection) {
      children.push(pageBreakPara());
    }
    isFirstSection = false;
    children.push(heading1(text));
    i++;
    continue;
  }

  // H2
  if (trimmed.startsWith("## ")) {
    const text = trimmed.replace(/^##\s+/, "").replace(/"/g, '"');
    children.push(heading2(text));
    i++;
    continue;
  }

  // H3
  if (trimmed.startsWith("### ")) {
    const text = trimmed.replace(/^###\s+/, "").replace(/"/g, '"');
    children.push(heading3(text));
    i++;
    continue;
  }

  // Tables
  if (trimmed.startsWith("|")) {
    const { table, endIdx } = parseTable(i);
    if (table) {
      children.push(emptyLine());
      children.push(table);
      children.push(emptyLine());
      i = endIdx;
      continue;
    }
  }

  // Checklist items
  if (trimmed.match(/^[-*]\s*\[[ x]\]/)) {
    children.push(checkboxItem(trimmed));
    i++;
    continue;
  }

  // Numbered list items (for the 10 rules, etc.)
  if (trimmed.match(/^\d+\.\s+/)) {
    const text = trimmed.replace(/^\d+\.\s+/, "");
    // Parse bold and rest
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIdx = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIdx) {
        parts.push(new TextRun({ text: text.slice(lastIdx, m.index), font: "Arial", size: 21, color: DARK_GRAY }));
      }
      parts.push(new TextRun({ text: m[1], bold: true, font: "Arial", size: 21, color: GREEN }));
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push(new TextRun({ text: text.slice(lastIdx), font: "Arial", size: 21, color: DARK_GRAY }));
    }
    children.push(new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 60, after: 60 },
      children: parts,
    }));
    i++;
    continue;
  }

  // Bullet items (sub-items with deeper indentation)
  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    const indent = line.search(/\S/);
    const level = indent >= 4 ? 1 : 0;
    children.push(bulletItem(trimmed, level));
    i++;
    continue;
  }

  // Italic line (quote at the end)
  if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.startsWith("**")) {
    const text = trimmed.replace(/^\*+/, "").replace(/\*+$/, "");
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new TextRun({ text, italics: true, color: MED_GRAY, font: "Arial", size: 22 })],
    }));
    i++;
    continue;
  }

  // Bold-only lines (like **Meta Abril:** etc)
  if (trimmed.startsWith("**") && !trimmed.startsWith("***")) {
    children.push(bodyText(trimmed));
    i++;
    continue;
  }

  // Regular paragraph
  children.push(bodyText(trimmed));
  i++;
}

// ── Build document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 21, color: DARK_GRAY },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "bullets",
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
                new TextRun({ text: "  |  ", font: "Arial", size: 16, color: BORDER_GRAY }),
                new TextRun({ text: "Plan $100K USD", font: "Arial", size: 16, color: GREEN, bold: true }),
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
                new TextRun({ text: "Confidencial  \u2014  ", font: "Arial", size: 16, color: MED_GRAY }),
                new TextRun({ text: "Pagina ", font: "Arial", size: 16, color: MED_GRAY }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MED_GRAY }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

// ── Write file ──
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log(`Done! Written to ${outPath}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error("Error generating document:", err);
  process.exit(1);
});
