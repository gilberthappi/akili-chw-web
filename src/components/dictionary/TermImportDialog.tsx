import { ChangeEvent, FC, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/common/Modal";
import { importDictionaryTerms, type IDictionaryImportResult } from "@/services/dictionary.service";
import { downloadGlossaryTemplate, parseGlossaryWorkbook, type ParsedTermRow } from "@/utils/dictionaryImport";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_MUTED,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

const TermImportDialog: FC<Props> = ({ isOpen, onClose, onImported }) => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedTermRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<IDictionaryImportResult | null>(null);

  const reset = () => {
    setFileName("");
    setRows([]);
    setParseError(null);
    setResult(null);
  };

  const close = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    reset();
    setFileName(file.name);
    try {
      setRows(await parseGlossaryWorkbook(file));
    } catch (err) {
      setParseError((err as Error).message);
    }
  };

  const valid = rows.filter((r) => !r.error);
  const invalid = rows.filter((r) => r.error);

  const handleImport = async () => {
    setImporting(true);
    try {
      const payload = valid.map(({ rowNumber: _rowNumber, error: _error, ...term }) => term);
      const res = await importDictionaryTerms(payload, updateExisting);
      setResult(res.data);
      onImported();
      toast.success(`Glossary import finished: ${res.data.created} added, ${res.data.updated} updated`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Import glossary terms">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${V2_BTN_PRIMARY} cursor-pointer`}>
            <FileSpreadsheet className="w-4 h-4" />
            Choose Excel file
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </label>
          <button type="button" onClick={downloadGlossaryTemplate} className={V2_BTN_SECONDARY}>
            <Download className="w-4 h-4" />
            Download template
          </button>
        </div>
        <p className={`text-xs ${V2_MUTED}`}>
          Needs at least a <b>Term</b> and a <b>Definition</b> column. Optional columns: Kinyarwanda, Abbreviation,
          Definition (Kinyarwanda), Category.
        </p>

        {parseError && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">
            {parseError}
          </p>
        )}

        {rows.length > 0 && !result && (
          <div className="space-y-3">
            <p className={`text-sm ${V2_STRONG}`}>
              <b>{fileName}</b>: {valid.length} term{valid.length === 1 ? "" : "s"} ready
              {invalid.length > 0 && `, ${invalid.length} will be skipped`}
            </p>
            {invalid.length > 0 && (
              <ul className="max-h-40 overflow-y-auto text-xs space-y-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                {invalid.map((r) => (
                  <li key={r.rowNumber} className="text-amber-800 dark:text-amber-200">
                    Row {r.rowNumber}
                    {r.term ? ` (${r.term})` : ""}: {r.error}
                  </li>
                ))}
              </ul>
            )}
            <label className={`flex items-center gap-2 text-sm ${V2_STRONG}`}>
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
              />
              Update terms that already exist in the glossary
            </label>
          </div>
        )}

        {result && (
          <div className={`text-sm space-y-1 ${V2_STRONG}`}>
            <p>
              {result.created} added, {result.updated} updated, {result.skipped} skipped (already existed).
            </p>
            {result.errors.length > 0 && (
              <p className="text-amber-700">{result.errors.length} rows were rejected by the server.</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700">
          <button type="button" onClick={close} className={V2_BTN_SECONDARY} disabled={importing}>
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              className={V2_BTN_PRIMARY}
              disabled={importing || valid.length === 0}
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              {importing ? "Importing..." : `Import ${valid.length} term${valid.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TermImportDialog;
