/**
 * PDF auto-fill helpers — mirror the web's `utils/uploadThesisAutofill.ts`.
 *
 * The Django backend (`POST /theses/extract-fields`) reads a manuscript or
 * executive-summary PDF and returns best-effort thesis metadata. On upload the
 * mobile form pre-fills:
 *   - from the **manuscript**: title, authors, adviser, department, year
 *   - from the **executive summary**: abstract
 * Fields only fill when the user hasn't already typed a value.
 */

export const ABSTRACT_MAX_WORDS = 300;

export interface ThesisAutofillFields {
  authors: string;
  authors_list?: string[];
  title: string;
  abstract: string;
  adviser: string;
  department_code: string;
  /** Confidently-extracted publication year, else null. */
  year?: number | null;
  /** 'high' | 'medium' | 'low' | 'none'. */
  year_confidence?: string;
  /** Best-guess year regardless of confidence (low-confidence hint). */
  year_suggestion?: number | null;
}

/** Cleans common PDF-extraction artifacts out of a free-text abstract. */
export function normalizeExtractedAbstract(text: string): string {
  if (typeof text !== 'string') return '';
  const t = text.replace(/ /g, ' ').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim());

  const paragraphs: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (!current.length) return;
    paragraphs.push(current.join(' ').trim());
    current = [];
  };

  for (const line of lines) {
    if (!line) {
      flush();
      continue;
    }
    if (!current.length) {
      current.push(line);
      continue;
    }
    const prev = current[current.length - 1] || '';
    if (prev.endsWith('-') && /^[a-z]/.test(line)) {
      current[current.length - 1] = prev.slice(0, -1) + line;
    } else {
      current.push(line);
    }
  }
  flush();

  let normalized = paragraphs
    .map((p) =>
      p
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([(\[{])\s+/g, '$1')
        .replace(/([.!?])([A-Za-z])/g, '$1 $2')
        .replace(/([,;:])([A-Za-z])/g, '$1 $2')
        .replace(/[ \t]+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n');

  const lineSamples = normalized
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const shortLines = lineSamples.filter((l) => l.length > 0 && l.length < 25);
  if (lineSamples.length >= 4 && shortLines.length / lineSamples.length >= 0.6) {
    normalized = lineSamples.join(' ');
  }

  return normalized.trim();
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function limitWords(text: string, maxWords: number): string {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

/** Splits a raw author string into individual names, conservatively. */
export function splitAuthorsIfCommaSeparated(rawAuthors: string): string[] {
  const cleaned = rawAuthors.trim();
  if (!cleaned) return [];

  const byNewline = cleaned.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const bySemicolon = cleaned.split(/\s*;\s*/).map((p) => p.trim()).filter(Boolean);
  if (bySemicolon.length > 1) return bySemicolon;

  const byAnd = cleaned.split(/\s*,?\s+AND\s+/i).map((p) => p.trim()).filter(Boolean);
  if (byAnd.length > 1) return byAnd;

  if (!cleaned.includes(',')) return [cleaned];
  const commaParts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  if (!commaParts.length) return [cleaned];

  const suffixOnly = /^(JR|SR|II|III|IV|V)\.?$/i;
  const merged: string[] = [];
  for (const part of commaParts) {
    if (suffixOnly.test(part) && merged.length) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}, ${part}`;
    } else {
      merged.push(part);
    }
  }

  const honorific = /\b(MR|MS|MRS|DR|ENGR)\.?\b/i;
  if (merged.length > 1 && merged.every((p) => honorific.test(p))) {
    return merged;
  }
  return [cleaned];
}

/** Picks the year to pre-fill: confident year, else low-confidence suggestion. */
export function pickAutofillYear(fields: ThesisAutofillFields): number | null {
  const confident = typeof fields.year === 'number' ? fields.year : null;
  const suggestion = typeof fields.year_suggestion === 'number' ? fields.year_suggestion : null;
  return confident ?? suggestion;
}
