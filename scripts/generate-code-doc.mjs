#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Footer, PageNumber, Header } = docx;
const { readdirSync, statSync, readFileSync, writeFileSync, existsSync } = require('fs');
const { join, relative, extname, dirname } = require('path');
const { fileURLToPath } = require('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Config ───────────────────────────────────────────────────────────────
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_PATH = join('C:', 'Users', 'acer', 'Desktop', 'javi', 'Pablo_Scarlatto_Codigo_Fuente.docx');

const EXTENSIONS = ['.ts', '.tsx', '.mjs'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'android', 'ios', 'out', '.git', '.claude', '.agents', 'dist', '.vercel'];
const EXCLUDE_PATTERNS = ['scripts/generate-'];

// ─── Colors ───────────────────────────────────────────────────────────────
const DARK_GREEN = '1B5E20';
const DARK_GRAY = '333333';

// ─── Walk directory ───────────────────────────────────────────────────────
function walkDir(dir, extensions = EXTENSIONS) {
  let results = [];
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(item)) {
          results = results.concat(walkDir(fullPath, extensions));
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // skip inaccessible dirs
  }
  return results;
}

// ─── Collect files ────────────────────────────────────────────────────────
function collectFiles() {
  let files = [];

  // src/ and supabase/
  for (const subdir of ['src', 'supabase']) {
    const dirPath = join(PROJECT_ROOT, subdir);
    if (existsSync(dirPath)) {
      files = files.concat(walkDir(dirPath));
    }
  }

  // Root config files
  for (const rootFile of ['next.config.ts', 'capacitor.config.ts', 'tailwind.config.ts']) {
    const filePath = join(PROJECT_ROOT, rootFile);
    if (existsSync(filePath)) {
      files.push(filePath);
    }
  }

  // Convert to relative paths and filter exclusions
  let relativeFiles = files.map(f => ({
    absolute: f,
    relative: relative(PROJECT_ROOT, f).replace(/\\/g, '/')
  }));

  // Exclude patterns
  relativeFiles = relativeFiles.filter(f => {
    return !EXCLUDE_PATTERNS.some(p => f.relative.includes(p));
  });

  // Sort alphabetically
  relativeFiles.sort((a, b) => a.relative.localeCompare(b.relative));

  return relativeFiles;
}

// ─── Build code paragraphs for a file ─────────────────────────────────────
function buildCodeParagraphs(content) {
  const lines = content.split('\n');
  return lines.map(line => {
    return new Paragraph({
      spacing: { after: 0, before: 0, line: 220 },
      children: [
        new TextRun({
          text: line || ' ', // empty lines get a space to preserve spacing
          font: 'Courier New',
          size: 14, // 7pt = 14 half-points
          color: DARK_GRAY,
        }),
      ],
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('Collecting files...');
  const files = collectFiles();
  console.log(`Found ${files.length} files.`);

  // Count total lines
  let totalLines = 0;
  const fileContents = [];
  for (const f of files) {
    const content = readFileSync(f.absolute, 'utf-8');
    const lineCount = content.split('\n').length;
    totalLines += lineCount;
    fileContents.push({ ...f, content, lineCount });
  }
  console.log(`Total lines: ~${totalLines.toLocaleString()}`);

  // ─── Cover page ───────────────────────────────────────────────────────
  const coverSection = {
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter in twips
        margin: { top: 1008, bottom: 1008, left: 1008, right: 1008 }, // 0.7 inches = 1008 twips
      },
    },
    children: [
      new Paragraph({ spacing: { before: 4000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'PABLO SCARLATTO ENTRENAMIENTOS',
            bold: true,
            font: 'Arial',
            size: 52, // 26pt
            color: DARK_GREEN,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: 'Codigo Fuente Completo',
            bold: true,
            font: 'Arial',
            size: 36, // 18pt
            color: DARK_GRAY,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'Version 2.0 -- Abril 2026',
            font: 'Arial',
            size: 24, // 12pt
            color: '666666',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `${files.length} archivos | ~${totalLines.toLocaleString()} lineas de codigo`,
            font: 'Arial',
            size: 22, // 11pt
            color: '888888',
          }),
        ],
      }),
      new Paragraph({
        children: [new PageBreak()],
      }),
      // ─── Table of contents ──────────────────────────────────────────────
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: 'INDICE DE ARCHIVOS',
            bold: true,
            font: 'Arial',
            size: 28, // 14pt
            color: DARK_GREEN,
          }),
        ],
      }),
      ...fileContents.map((f, idx) =>
        new Paragraph({
          spacing: { after: 40, before: 0 },
          children: [
            new TextRun({
              text: `${(idx + 1).toString().padStart(3, ' ')}. `,
              font: 'Courier New',
              size: 16, // 8pt
              color: '999999',
            }),
            new TextRun({
              text: f.relative,
              font: 'Courier New',
              size: 16, // 8pt
              color: DARK_GRAY,
            }),
            new TextRun({
              text: `  (${f.lineCount} lines)`,
              font: 'Courier New',
              size: 14, // 7pt
              color: 'AAAAAA',
            }),
          ],
        })
      ),
      new Paragraph({
        children: [new PageBreak()],
      }),
    ],
  };

  // ─── Code sections ────────────────────────────────────────────────────
  const codeSectionChildren = [];

  for (let i = 0; i < fileContents.length; i++) {
    const f = fileContents[i];

    // File path heading
    codeSectionChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: f.relative,
            bold: true,
            font: 'Arial',
            size: 22, // 11pt
            color: DARK_GREEN,
          }),
        ],
      })
    );

    // Separator line
    codeSectionChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '─'.repeat(90),
            font: 'Courier New',
            size: 12,
            color: 'CCCCCC',
          }),
        ],
      })
    );

    // Code content - one paragraph per line
    const codeParagraphs = buildCodeParagraphs(f.content);
    codeSectionChildren.push(...codeParagraphs);

    // Page break after each file (except last)
    if (i < fileContents.length - 1) {
      codeSectionChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  const codeSection = {
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1008, bottom: 1008, left: 1008, right: 1008 },
      },
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Pablo Scarlatto -- Codigo Fuente  |  Pagina ',
                font: 'Arial',
                size: 16,
                color: '999999',
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: 'Arial',
                size: 16,
                color: '999999',
              }),
            ],
          }),
        ],
      }),
    },
    children: codeSectionChildren,
  };

  // ─── Create document ──────────────────────────────────────────────────
  console.log('Generating document...');
  const doc = new Document({
    creator: 'Pablo Scarlatto',
    title: 'Pablo Scarlatto Entrenamientos - Codigo Fuente',
    description: 'Codigo fuente completo de la aplicacion Pablo Scarlatto Entrenamientos',
    sections: [coverSection, codeSection],
  });

  // ─── Write to file ────────────────────────────────────────────────────
  console.log('Packing document...');
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(OUTPUT_PATH, buffer);

  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`\nDone! Document saved to: ${OUTPUT_PATH}`);
  console.log(`  Files: ${files.length}`);
  console.log(`  Lines: ~${totalLines.toLocaleString()}`);
  console.log(`  Size: ${sizeMB} MB`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
