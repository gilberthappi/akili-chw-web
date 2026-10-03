import * as XLSX from "xlsx";
import type { DictionaryTermInput } from "@/services/dictionary.service";

type Field = keyof DictionaryTermInput;

const HEADER_ALIASES: Record<Field, string[]> = {
  term: ["term", "termenglish", "english", "en", "word", "termen"],
  termRw: ["termkinyarwanda", "kinyarwanda", "rw", "termrw", "ijambo"],
  abbreviation: ["abbreviation", "abbr", "acronym", "short"],
  definition: ["definition", "definitionenglish", "meaning", "description", "definitionen"],
  definitionRw: ["definitionkinyarwanda", "definitionrw", "ibisobanuro", "meaningrw"],
  category: ["category", "topic", "domain", "module", "course"],
};

const headerKey = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const text = (v: unknown) => String(v ?? "").trim();

export interface ParsedTermRow extends DictionaryTermInput {
  rowNumber: number;
  error: string | null;
}

export async function parseGlossaryWorkbook(file: File): Promise<ParsedTermRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: null });
    for (let h = 0; h < Math.min(rows.length, 20); h++) {
      const columns: Partial<Record<Field, number>> = {};
      rows[h].forEach((cell, col) => {
        const key = headerKey(cell);
        (Object.keys(HEADER_ALIASES) as Field[]).forEach((field) => {
          if (columns[field] === undefined && HEADER_ALIASES[field].includes(key)) columns[field] = col;
        });
      });
      if (columns.term === undefined || columns.definition === undefined) continue;

      const get = (row: unknown[], field: Field) =>
        columns[field] === undefined ? "" : text(row[columns[field]!]);
      const seen = new Set<string>();
      const parsed: ParsedTermRow[] = [];
      rows.slice(h + 1).forEach((row, offset) => {
        const term = get(row, "term").replace(/\s+/g, " ");
        const definition = get(row, "definition");
        if (!term && !definition) return;
        let error: string | null = null;
        if (!term) error = "Missing term";
        else if (!definition) error = "Missing definition";
        else if (seen.has(term.toLowerCase())) error = "Duplicate term in this file";
        if (term) seen.add(term.toLowerCase());
        parsed.push({
          rowNumber: h + offset + 2,
          term,
          definition,
          termRw: get(row, "termRw") || null,
          abbreviation: get(row, "abbreviation") || null,
          definitionRw: get(row, "definitionRw") || null,
          category: get(row, "category") || null,
          error,
        });
      });
      return parsed;
    }
  }
  throw new Error('Could not find the header row. The sheet needs at least "Term" and "Definition" columns.');
}

export function downloadGlossaryTemplate() {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Term", "Kinyarwanda", "Abbreviation", "Definition", "Definition (Kinyarwanda)", "Category"],
    [
      "Antenatal care",
      "Kwipimisha inda",
      "ANC",
      "Care given to a pregnant woman to keep her and her baby healthy.",
      "Serivisi zihabwa umugore utwite kugira ngo we n'umwana bagire ubuzima bwiza.",
      "Maternal health",
    ],
    [
      "Oral rehydration solution",
      "Ifu ivura umwuma",
      "ORS",
      "A mix of water, salt and sugar used to treat dehydration from diarrhoea.",
      "",
      "Child health",
    ],
  ]);
  sheet["!cols"] = [28, 24, 14, 60, 60, 18].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, sheet, "Glossary");
  XLSX.writeFile(wb, "system-glossary-template.xlsx");
}
