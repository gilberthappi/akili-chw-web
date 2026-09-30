import * as XLSX from "xlsx";
import { getSectorsByDistrict } from "@/hooks/locations";
import type { ChwRegistryInput } from "@/services/chwRegistry.service";

export const TEMPLATE_COLUMNS = [
  "NAMES",
  "ID No",
  "Date of Birth",
  "Age",
  "Sex",
  "Phone Number",
  "Health Center",
  "SECTOR",
  "CELL",
  "VILLAGE",
] as const;

type Field =
  | "fullNames"
  | "NID"
  | "birthdate"
  | "age"
  | "gender"
  | "phoneNumber"
  | "healthCenter"
  | "sector"
  | "cell"
  | "village";

const HEADER_ALIASES: Record<Field, string[]> = {
  fullNames: ["names", "name", "fullnames", "fullname", "amazina"],
  NID: ["idno", "id", "nid", "nationalid", "idnumber", "indangamuntu", "irangamuntu"],
  birthdate: ["dateofbirth", "dob", "birthdate", "birthday"],
  age: ["age", "imyaka"],
  gender: ["sex", "gender", "igitsina"],
  phoneNumber: ["phonenumber", "phone", "telephone", "tel", "phoneno", "telefone"],
  healthCenter: ["healthcenter", "healthcentre", "hc", "healthfacility", "ikigonderabuzima"],
  sector: ["sector", "umurenge"],
  cell: ["cell", "akagari"],
  village: ["village", "umudugudu"],
};

const headerKey = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const locKey = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const text = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");

export interface ParsedRow {
  /** 1-based row number in the Excel sheet */
  rowNumber: number;
  fullNames: string;
  NID: string;
  phoneNumber: string | null;
  gender: string | null;
  birthdate: string | null;
  sector: string;
  cell: string;
  village: string;
  healthCenterRaw: string;
  rawPhone: string;
  rawGender: string;
  errors: string[];
  warnings: string[];
}

export interface ParsedSheet {
  sheetName: string;
  rows: ParsedRow[];
  missingColumns: Field[];
}

export function normalizeGender(value: unknown): string | null {
  const v = text(value).toLowerCase();
  if (v === "m" || v === "male" || v === "gabo") return "Male";
  if (v === "f" || v === "female" || v === "gore") return "Female";
  return null;
}

export function normalizeLocalPhone(value: unknown): string | null {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("250")) digits = digits.slice(3);
  if (digits.length === 9) digits = `0${digits}`;
  return /^07[2389]\d{7}$/.test(digits) ? digits : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parseDob(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : null;
  }
  const s = text(value);
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${pad(+dmy[2])}-${pad(+dmy[1])}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Rwandan NIDs encode the birth year in digits 2–5. */
function birthYearFromNid(nid: string): number | null {
  const year = Number(nid.slice(1, 5));
  const now = new Date().getFullYear();
  return year >= 1900 && year <= now - 10 ? year : null;
}

function findHeader(rows: unknown[][]): { index: number; columns: Partial<Record<Field, number>> } | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const columns: Partial<Record<Field, number>> = {};
    rows[i].forEach((cell, col) => {
      const key = headerKey(cell);
      if (!key) return;
      (Object.keys(HEADER_ALIASES) as Field[]).forEach((field) => {
        if (columns[field] === undefined && HEADER_ALIASES[field].includes(key)) {
          columns[field] = col;
        }
      });
    });
    if (columns.fullNames !== undefined && columns.NID !== undefined) {
      return { index: i, columns };
    }
  }
  return null;
}

export async function parseChwWorkbook(file: File): Promise<ParsedSheet> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      defval: null,
      raw: true,
    });
    const header = findHeader(rows);
    if (!header) continue;
    const { columns } = header;
    const cell = (row: unknown[], field: Field) =>
      columns[field] === undefined ? null : row[columns[field]!];

    const parsed: ParsedRow[] = [];
    rows.slice(header.index + 1).forEach((row, offset) => {
      const fullNames = text(cell(row, "fullNames"));
      const NID = String(cell(row, "NID") ?? "").replace(/\s/g, "");
      if (!fullNames && !NID) return;

      const rawPhone = text(cell(row, "phoneNumber"));
      const rawGender = text(cell(row, "gender"));
      let birthdate = parseDob(cell(row, "birthdate"));
      if (!birthdate) {
        const year = birthYearFromNid(NID) ?? (() => {
          const age = Number(cell(row, "age"));
          return age > 0 && age < 120 ? new Date().getFullYear() - age : null;
        })();
        if (year) birthdate = `${year}-01-01`;
      }

      parsed.push({
        rowNumber: header.index + offset + 2,
        fullNames,
        NID,
        phoneNumber: normalizeLocalPhone(rawPhone),
        gender: normalizeGender(rawGender),
        birthdate,
        sector: text(cell(row, "sector")),
        cell: text(cell(row, "cell")),
        village: text(cell(row, "village")),
        healthCenterRaw: text(cell(row, "healthCenter")),
        rawPhone,
        rawGender,
        errors: [],
        warnings: [],
      });
    });

    const missingColumns = (["phoneNumber", "gender", "healthCenter", "sector", "cell", "village"] as Field[]).filter(
      (f) => columns[f] === undefined,
    );
    return { sheetName, rows: parsed, missingColumns };
  }
  throw new Error(
    'Could not find the header row. Make sure the sheet has at least the "NAMES" and "ID No" columns.',
  );
}

// ─── Health center matching ────────────────────────────────────────────────

export interface HealthCenterOption {
  id: string;
  name: string;
}

const HC_TYPE =
  /\b(centre de sante|poste de sante|health cent(er|re)|health post|cs|hc|h c|mhc|mu|hp|dh|ps|disp|clin|clinic)\b/g;

export const hcKey = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/[.\-_/,]/g, " ")
    .replace(/\s+/g, " ")
    .replace(HC_TYPE, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Lower is a better "health center" match: CS > MHC > DH > others > HP > MU. */
function hcRank(name: string) {
  const n = ` ${name.toLowerCase().replace(/[.()[\]]/g, " ")} `;
  if (/ (cs|hc|h c|health cent(er|re)|centre de sante) /.test(n)) return 0;
  if (/ mhc /.test(n)) return 1;
  if (/ dh /.test(n)) return 2;
  if (/ hp /.test(n)) return 4;
  if (/ mu /.test(n)) return 5;
  return 3;
}

const tokensPrefix = (short: string[], long: string[]) =>
  short.length <= long.length && short.every((t, i) => long[i].startsWith(t));

function pickBest(candidates: HealthCenterOption[]) {
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort((a, b) => hcRank(a.name) - hcRank(b.name));
  const best = hcRank(ranked[0].name);
  const top = ranked.filter((c) => hcRank(c.name) === best);
  return top.length === 1 ? top[0] : null;
}

export function matchHealthCenter(raw: string, options: HealthCenterOption[]): HealthCenterOption | null {
  const key = hcKey(raw);
  if (!key) return null;
  const keyed = options.map((o) => ({ o, k: hcKey(o.name) }));
  const exact = pickBest(keyed.filter((x) => x.k === key).map((x) => x.o));
  if (exact) return exact;
  const tokens = key.split(" ");
  return pickBest(keyed.filter((x) => tokensPrefix(tokens, x.k.split(" "))).map((x) => x.o));
}

// ─── Validation ────────────────────────────────────────────────────────────

export interface ValidatedImport {
  rows: ParsedRow[];
  payload: ChwRegistryInput[];
  validCount: number;
  errorCount: number;
  warningCount: number;
}

export function validateRows(
  rows: ParsedRow[],
  district: string,
  hcMapping: Record<string, string>,
): ValidatedImport {
  const sectors = getSectorsByDistrict(district);
  const seen = new Set<string>();
  const payload: ChwRegistryInput[] = [];
  let errorCount = 0;
  let warningCount = 0;

  const validated = rows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.fullNames) errors.push("Missing name");
    if (!/^1\d{15}$/.test(row.NID)) {
      errors.push(row.NID ? `Invalid NID "${row.NID}" (must be 16 digits starting with 1)` : "Missing NID");
    } else if (seen.has(row.NID)) {
      errors.push("Duplicate NID in this file");
    }
    if (/^1\d{15}$/.test(row.NID)) seen.add(row.NID);

    if (row.rawPhone && !row.phoneNumber) warnings.push(`Invalid phone "${row.rawPhone}" — left empty`);
    if (row.rawGender && !row.gender) warnings.push(`Unknown sex "${row.rawGender}"`);

    // Only official names are kept; an unknown level is left empty along with every level below it.
    let sector = "";
    let cell = "";
    let village = "";
    const s = row.sector ? sectors.find((x) => locKey(x.name) === locKey(row.sector)) : undefined;
    if (row.sector && !s) {
      warnings.push(`Sector "${row.sector}" not found in ${district} — sector, cell and village left empty`);
    } else if (s) {
      sector = s.name.trim();
      const c = row.cell ? s.cells.find((x) => locKey(x.name) === locKey(row.cell)) : undefined;
      if (row.cell && !c) {
        warnings.push(`Cell "${row.cell}" not found in ${sector} — cell and village left empty`);
      } else if (c) {
        cell = c.name.trim();
        const v = row.village ? c.villages.find((x) => locKey(x.name) === locKey(row.village)) : undefined;
        if (row.village && !v) warnings.push(`Village "${row.village}" not found in ${cell} — village left empty`);
        else if (v) village = v.name.trim();
      } else if (row.village) {
        warnings.push(`Village "${row.village}" has no cell — village left empty`);
      }
    } else if (row.cell || row.village) {
      warnings.push("No sector given — cell and village left empty");
    }

    const healthCenterId = row.healthCenterRaw ? hcMapping[row.healthCenterRaw] || null : null;
    if (row.healthCenterRaw && !healthCenterId) {
      warnings.push(`Health center "${row.healthCenterRaw}" not matched`);
    }

    if (errors.length) errorCount++;
    else {
      if (warnings.length) warningCount++;
      payload.push({
        NID: row.NID,
        fullNames: row.fullNames,
        phoneNumber: row.phoneNumber,
        gender: row.gender,
        birthdate: row.birthdate,
        district,
        sector: sector || null,
        cell: cell || null,
        village: village || null,
        healthCenterId,
      });
    }
    return { ...row, errors, warnings };
  });

  return { rows: validated, payload, validCount: payload.length, errorCount, warningCount };
}

// ─── Template / reports ────────────────────────────────────────────────────

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    [...TEMPLATE_COLUMNS],
    ["MUHONGAYIRE Francine", "1197770005682827", "1977-03-14", 48, "F", "0782940135", "KABUYE", "Jabana", "Kabuye", "Nyagasozi"],
    ["NTAKIRUTIMANA Jean", "1198980022832063", "", 36, "M", "0788123456", "GATSATA", "Gatsata", "Nyamugari", "Kanyonyomba"],
  ]);
  sheet["!cols"] = [28, 20, 14, 6, 6, 14, 20, 14, 14, 16].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, sheet, "CHWs");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Column", "Required", "Notes"],
    ["NAMES", "Yes", "Full names of the CHW"],
    ["ID No", "Yes", "16-digit national ID starting with 1. Format the column as Text so Excel keeps every digit."],
    ["Date of Birth", "No", "YYYY-MM-DD or DD/MM/YYYY. If empty, the birth year is taken from the NID (or Age)."],
    ["Age", "No", "Used only when neither Date of Birth nor a valid NID gives the birth year"],
    ["Sex", "No", "M / F (or Male / Female)"],
    ["Phone Number", "No", "07XXXXXXXX or +2507XXXXXXXX"],
    ["Health Center", "No", "Name as commonly written (e.g. KABUYE, GATSATA HC). Matched to health centers in the chosen district."],
    [
      "SECTOR / CELL / VILLAGE",
      "No",
      "Checked against the official Rwanda locations of the chosen district. A name that doesn't exist is left empty, together with the levels below it (unknown sector → sector, cell and village empty; unknown cell → cell and village empty).",
    ],
    [],
    ["The district is chosen in the import dialog and applies to every row."],
    ["Rows whose NID already exists in the registry are updated (unless you turn that off)."],
  ]);
  notes["!cols"] = [{ wch: 24 }, { wch: 10 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, notes, "Instructions");

  XLSX.writeFile(wb, "chw-registry-template.xlsx");
}

export function downloadProblemRows(rows: ParsedRow[], district: string) {
  const problems = rows.filter((r) => r.errors.length || r.warnings.length);
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Excel row", "Status", "Problems", ...TEMPLATE_COLUMNS.filter((c) => c !== "Age" && c !== "Date of Birth")],
    ...problems.map((r) => [
      r.rowNumber,
      r.errors.length ? "Skipped" : "Imported with warnings",
      [...r.errors, ...r.warnings].join("; "),
      r.fullNames,
      r.NID,
      r.rawGender,
      r.rawPhone,
      r.healthCenterRaw,
      r.sector,
      r.cell,
      r.village,
    ]),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Problems");
  XLSX.writeFile(wb, `chw-import-problems-${district.toLowerCase()}.xlsx`);
}
