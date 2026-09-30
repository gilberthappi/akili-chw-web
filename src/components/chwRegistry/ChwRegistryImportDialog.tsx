import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import Modal from "@/components/common/Modal";
import { getAllDistricts } from "@/hooks/locations";
import { getPublicHospitals } from "@/services/healthCenters.service";
import {
  importChwRegistry,
  type IChwRegistryImportResult,
} from "@/services/chwRegistry.service";
import {
  TEMPLATE_COLUMNS,
  downloadProblemRows,
  downloadTemplate,
  hcKey,
  matchHealthCenter,
  parseChwWorkbook,
  validateRows,
  type ParsedSheet,
} from "@/utils/chwRegistryImport";
import { V2Tabs, type V2TabItem } from "@/components/v2/V2Page";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_INPUT,
  V2_MUTED,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_GREEN,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = "setup" | "preview" | "done";
type IssueFilter = "all" | "skipped" | "warnings";

const ISSUE_TABS: V2TabItem<IssueFilter>[] = [
  { key: "all", label: "All problems" },
  { key: "skipped", label: "Will be skipped" },
  { key: "warnings", label: "Warnings" },
];

const MAX_ISSUES_SHOWN = 200;
const groupKey = (raw: string) => hcKey(raw) || raw.toLowerCase();

const ChwRegistryImportDialog: FC<Props> = ({ isOpen, onClose, onImported }) => {
  const [step, setStep] = useState<Step>("setup");
  const [district, setDistrict] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hcMapping, setHcMapping] = useState<Record<string, string>>({});
  const [updateExisting, setUpdateExisting] = useState(true);
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("all");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<IChwRegistryImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("setup");
    setFile(null);
    setSheet(null);
    setParseError(null);
    setHcMapping({});
    setResult(null);
    setImportError(null);
    setIssueFilter("all");
    setUpdateExisting(true);
  }, [isOpen]);

  const districtNames = useMemo(() => getAllDistricts().map((d) => d.name.trim()).sort(), []);

  const { data: healthCenters = [], isFetching: hcLoading } = useQuery({
    queryKey: ["publicHospitals", district],
    queryFn: () => getPublicHospitals({ district }),
    enabled: isOpen && !!district,
    staleTime: 5 * 60 * 1000,
  });

  const hcGroups = useMemo(() => {
    const groups = new Map<string, { label: string; raws: Set<string>; count: number }>();
    sheet?.rows.forEach((r) => {
      if (!r.healthCenterRaw) return;
      const key = groupKey(r.healthCenterRaw);
      const g = groups.get(key) ?? { label: r.healthCenterRaw, raws: new Set<string>(), count: 0 };
      g.raws.add(r.healthCenterRaw);
      g.count++;
      groups.set(key, g);
    });
    return [...groups.entries()]
      .map(([key, g]) => ({ key, ...g }))
      .sort((a, b) => b.count - a.count);
  }, [sheet]);

  useEffect(() => {
    if (!sheet || healthCenters.length === 0) return;
    const auto: Record<string, string> = {};
    hcGroups.forEach((g) => {
      const match = matchHealthCenter(g.label, healthCenters);
      if (match) auto[g.key] = match.id;
    });
    setHcMapping(auto);
  }, [sheet, healthCenters, hcGroups]);

  const rawMapping = useMemo(() => {
    const m: Record<string, string> = {};
    hcGroups.forEach((g) => g.raws.forEach((raw) => hcMapping[g.key] && (m[raw] = hcMapping[g.key])));
    return m;
  }, [hcGroups, hcMapping]);

  const validated = useMemo(
    () => (sheet && district ? validateRows(sheet.rows, district, rawMapping) : null),
    [sheet, district, rawMapping],
  );

  const issues = useMemo(() => {
    const rows = validated?.rows ?? [];
    return rows.filter((r) =>
      issueFilter === "skipped"
        ? r.errors.length > 0
        : issueFilter === "warnings"
          ? r.errors.length === 0 && r.warnings.length > 0
          : r.errors.length > 0 || r.warnings.length > 0,
    );
  }, [validated, issueFilter]);

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setSheet(null);
    setParseError(null);
    setParsing(true);
    try {
      const parsed = await parseChwWorkbook(f);
      if (parsed.rows.length === 0) throw new Error("No CHW rows found below the header row.");
      setSheet(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Could not read this file");
    } finally {
      setParsing(false);
    }
  };

  const runImport = async () => {
    if (!validated || validated.payload.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await importChwRegistry(validated.payload, updateExisting);
      setResult(res.data);
      setStep("done");
      onImported();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setImportError(e.response?.data?.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const unmatchedGroups = hcGroups.filter((g) => !hcMapping[g.key]).length;

  return (
    <Modal isOpen={isOpen} onClose={() => !importing && onClose()} title="Import CHWs from Excel" big>
      {step === "setup" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[rgba(51,99,173,0.20)] bg-[#F4F7FC] dark:bg-slate-800/60 dark:border-slate-600 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#3363AD] dark:text-blue-300 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className={`font-bold ${V2_STRONG}`}>How the import works</p>
                <ul className={`list-disc pl-4 space-y-1 text-xs ${V2_MUTED}`}>
                  <li>
                    Columns: <span className="font-semibold">{TEMPLATE_COLUMNS.join(", ")}</span>. Only{" "}
                    <span className="font-semibold">NAMES</span> and <span className="font-semibold">ID No</span> are
                    required; headers can be on any of the first rows (titles above them are ignored).
                  </li>
                  <li>
                    Pick the <span className="font-semibold">district</span> the list belongs to — sectors, cells and
                    villages are checked against it. A sector, cell or village that doesn't exist is left empty
                    (together with the levels below it); the CHW is still imported. Health center names (e.g.
                    "KABUYE", "GATSATA HC") are matched to the district's health centers, and you can fix any unmatched
                    one before importing.
                  </li>
                  <li>
                    Rows with a missing or invalid NID (16 digits starting with 1) are skipped. If Date of Birth is
                    empty, the birth year is taken from the NID.
                  </li>
                  <li>Nothing is saved until you review the preview and click Import.</li>
                </ul>
                <button type="button" onClick={downloadTemplate} className={`${V2_BTN_SECONDARY} mt-1`}>
                  <Download className="w-4 h-4" />
                  Download template
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B6575] dark:text-slate-400 mb-1">District *</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={`w-full sm:w-80 px-3 py-2 text-sm ${V2_INPUT}`}
            >
              <option value="">Select district</option>
              {districtNames.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-[#3363AD] bg-[#EBF0F9] dark:bg-slate-700"
                : "border-[rgba(51,99,173,0.30)] hover:border-[#3363AD] dark:border-slate-600"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {parsing ? (
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#3363AD]" />
            ) : file && sheet ? (
              <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-600" />
            ) : (
              <UploadCloud className="w-8 h-8 mx-auto text-[#3363AD]" />
            )}
            <p className={`mt-2 text-sm font-bold ${V2_STRONG}`}>
              {file ? file.name : "Drop the Excel file here or click to choose"}
            </p>
            <p className={`text-xs mt-1 ${V2_MUTED}`}>
              {sheet
                ? `${sheet.rows.length.toLocaleString()} CHW rows found in sheet "${sheet.sheetName}"`
                : ".xlsx, .xls or .csv"}
            </p>
          </div>

          {sheet && sheet.missingColumns.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg px-3 py-2">
              Optional columns not found: {sheet.missingColumns.join(", ")}. Those fields will be left empty.
            </p>
          )}
          {parseError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">
              {parseError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700">
            <button type="button" onClick={onClose} className={V2_BTN_SECONDARY}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("preview")}
              disabled={!district || !sheet}
              className={V2_BTN_PRIMARY}
            >
              Review import
            </button>
          </div>
        </div>
      )}

      {step === "preview" && validated && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rows in file", value: validated.rows.length, cls: V2_STRONG },
              { label: "Ready to import", value: validated.validCount, cls: "text-emerald-600 dark:text-emerald-400" },
              { label: "With warnings", value: validated.warningCount, cls: "text-amber-500" },
              { label: "Will be skipped", value: validated.errorCount, cls: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className={`${V2_CARD_SHELL} p-3`}>
                <p className={`text-xs ${V2_MUTED}`}>{s.label}</p>
                <p className={`text-2xl font-bold ${s.cls}`}>{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {hcGroups.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-bold ${V2_STRONG}`}>
                  Health centers in {district}
                  {hcLoading && <Loader2 className="inline w-3.5 h-3.5 ml-2 animate-spin" />}
                </p>
                <span className={`${V2_PILL} ${unmatchedGroups ? V2_PILL_AMBER : V2_PILL_GREEN}`}>
                  {unmatchedGroups ? `${unmatchedGroups} not matched` : "All matched"}
                </span>
              </div>
              <div className={`${V2_CARD_SHELL} overflow-hidden max-h-64 overflow-y-auto`}>
                <table className="w-full text-sm">
                  <thead className={`${V2_TABLE_HEAD} sticky top-0`}>
                    <tr>
                      <th className="px-3 py-2 text-left">In file</th>
                      <th className="px-3 py-2 text-left">CHWs</th>
                      <th className="px-3 py-2 text-left">Matched health center</th>
                    </tr>
                  </thead>
                  <tbody className={V2_TABLE_BODY}>
                    {hcGroups.map((g) => (
                      <tr key={g.key}>
                        <td className={`px-3 py-2 font-semibold ${V2_STRONG}`}>
                          <span className="inline-flex items-center gap-1.5">
                            {hcMapping[g.key] ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                            {[...g.raws].join(" / ")}
                          </span>
                        </td>
                        <td className={`px-3 py-2 ${V2_MUTED}`}>{g.count}</td>
                        <td className="px-3 py-2">
                          <select
                            value={hcMapping[g.key] ?? ""}
                            onChange={(e) => setHcMapping((m) => ({ ...m, [g.key]: e.target.value }))}
                            className={`w-full px-2 py-1.5 text-sm ${V2_INPUT}`}
                          >
                            <option value="">— Leave empty —</option>
                            {healthCenters.map((h) => (
                              <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <V2Tabs items={ISSUE_TABS} active={issueFilter} onChange={setIssueFilter} />
              {validated.errorCount + validated.warningCount > 0 && (
                <button
                  type="button"
                  onClick={() => downloadProblemRows(validated.rows, district)}
                  className={V2_BTN_SECONDARY}
                >
                  <Download className="w-4 h-4" />
                  Download problem rows
                </button>
              )}
            </div>
            <div className={`${V2_CARD_SHELL} overflow-hidden max-h-72 overflow-y-auto`}>
              {issues.length === 0 ? (
                <p className={`p-6 text-center text-sm ${V2_MUTED}`}>No problems found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className={`${V2_TABLE_HEAD} sticky top-0`}>
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">CHW</th>
                      <th className="px-3 py-2 text-left">Problems</th>
                    </tr>
                  </thead>
                  <tbody className={V2_TABLE_BODY}>
                    {issues.slice(0, MAX_ISSUES_SHOWN).map((r) => (
                      <tr key={r.rowNumber}>
                        <td className={`px-3 py-2 ${V2_MUTED}`}>{r.rowNumber}</td>
                        <td className="px-3 py-2">
                          <p className={`font-semibold ${V2_STRONG}`}>{r.fullNames || "—"}</p>
                          <p className={`text-xs ${V2_MUTED}`}>{r.NID || "No NID"}</p>
                        </td>
                        <td className="px-3 py-2 space-y-1">
                          {r.errors.map((e) => (
                            <p key={e} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                              <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                              {e}
                            </p>
                          ))}
                          {r.warnings.map((w) => (
                            <p key={w} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                              {w}
                            </p>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {issues.length > MAX_ISSUES_SHOWN && (
              <p className={`text-xs mt-1 ${V2_MUTED}`}>
                Showing the first {MAX_ISSUES_SHOWN} of {issues.length.toLocaleString()} — download the problem rows to
                see all.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-gray-300 text-[#3363AD] focus:ring-[#3363AD]"
            />
            <span className={V2_STRONG}>Update CHWs already in the registry (matched by NID)</span>
          </label>

          {importError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">
              {importError}
            </p>
          )}

          <div className="flex justify-between gap-2 pt-2 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700">
            <button type="button" onClick={() => setStep("setup")} className={V2_BTN_SECONDARY} disabled={importing}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={runImport}
              disabled={importing || validated.validCount === 0}
              className={V2_BTN_PRIMARY}
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              {importing ? "Importing..." : `Import ${validated.validCount.toLocaleString()} CHWs`}
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="space-y-5 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
          <div>
            <p className={`text-lg font-bold ${V2_STRONG}`}>Import finished</p>
            <p className={`text-sm ${V2_MUTED}`}>
              {result.created.toLocaleString()} added · {result.updated.toLocaleString()} updated
              {result.skipped > 0 && ` · ${result.skipped.toLocaleString()} skipped by the server`}
            </p>
            {validated && validated.errorCount > 0 && (
              <p className={`text-xs mt-1 ${V2_MUTED}`}>
                {validated.errorCount.toLocaleString()} rows with invalid data were not sent.
              </p>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className={`${V2_CARD_SHELL} text-left p-3 max-h-48 overflow-y-auto`}>
              {result.errors.map((e) => (
                <p key={`${e.index}-${e.NID}`} className="text-xs text-red-600 dark:text-red-400">
                  {e.NID || `Row ${e.index + 1}`}: {e.message}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-center gap-2">
            {validated && validated.errorCount + validated.warningCount > 0 && (
              <button
                type="button"
                onClick={() => downloadProblemRows(validated.rows, district)}
                className={V2_BTN_SECONDARY}
              >
                <Download className="w-4 h-4" />
                Download problem rows
              </button>
            )}
            <button type="button" onClick={onClose} className={V2_BTN_PRIMARY}>
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ChwRegistryImportDialog;
