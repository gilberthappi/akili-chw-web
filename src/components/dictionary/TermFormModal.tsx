import { FC, FormEvent, useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import type { DictionaryTermInput, IDictionaryTerm } from "@/services/dictionary.service";
import { V2_BTN_PRIMARY, V2_BTN_SECONDARY, V2_INPUT } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  term?: IDictionaryTerm | null;
  categories: string[];
  onSubmit: (payload: DictionaryTermInput) => Promise<void>;
}

const EMPTY = { term: "", termRw: "", abbreviation: "", definition: "", definitionRw: "", category: "" };

const inputClass = `w-full px-3 py-2 text-sm ${V2_INPUT}`;
const labelClass = "block text-xs font-semibold text-[#5B6575] dark:text-slate-400 mb-1";

const TermFormModal: FC<Props> = ({ isOpen, onClose, term, categories, onSubmit }) => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setForm(
      term
        ? {
            term: term.term,
            termRw: term.termRw ?? "",
            abbreviation: term.abbreviation ?? "",
            definition: term.definition,
            definitionRw: term.definitionRw ?? "",
            category: term.category ?? "",
          }
        : EMPTY,
    );
  }, [isOpen, term]);

  const set = (name: keyof typeof EMPTY, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        term: form.term.trim(),
        termRw: form.termRw.trim() || null,
        abbreviation: form.abbreviation.trim() || null,
        definition: form.definition.trim(),
        definitionRw: form.definitionRw.trim() || null,
        category: form.category.trim() || null,
      });
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !saving && onClose()} title={term ? "Edit term" : "Add term"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Term (English) *</label>
            <input
              value={form.term}
              onChange={(e) => set("term", e.target.value)}
              required
              placeholder="e.g. Antenatal care"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Term (Kinyarwanda)</label>
            <input
              value={form.termRw}
              onChange={(e) => set("termRw", e.target.value)}
              placeholder="e.g. Kwipimisha inda"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Abbreviation</label>
            <input
              value={form.abbreviation}
              onChange={(e) => set("abbreviation", e.target.value)}
              placeholder="e.g. ANC"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              list="dictionary-categories"
              placeholder="e.g. Maternal health"
              className={inputClass}
            />
            <datalist id="dictionary-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Definition (English) *</label>
            <textarea
              value={form.definition}
              onChange={(e) => set("definition", e.target.value)}
              required
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Definition (Kinyarwanda)</label>
            <textarea
              value={form.definitionRw}
              onChange={(e) => set("definitionRw", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700">
          <button type="button" onClick={onClose} className={V2_BTN_SECONDARY} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={V2_BTN_PRIMARY} disabled={saving}>
            {saving ? "Saving..." : term ? "Save changes" : "Add term"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TermFormModal;
