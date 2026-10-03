import { FC, FormEvent, useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import type { DictionaryResourceInput, IDictionaryResource } from "@/services/dictionary.service";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_INPUT,
  V2_MUTED,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resource?: IDictionaryResource | null;
  onSubmit: (payload: DictionaryResourceInput) => Promise<void>;
}

const EMPTY = { name: "", url: "", searchUrl: "", description: "", language: "", category: "" };

const inputClass = `w-full px-3 py-2 text-sm ${V2_INPUT}`;
const labelClass = "block text-xs font-semibold text-[#5B6575] dark:text-slate-400 mb-1";

const ResourceFormModal: FC<Props> = ({ isOpen, onClose, resource, onSubmit }) => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setForm(
      resource
        ? {
            name: resource.name,
            url: resource.url,
            searchUrl: resource.searchUrl ?? "",
            description: resource.description ?? "",
            language: resource.language ?? "",
            category: resource.category ?? "",
          }
        : EMPTY,
    );
  }, [isOpen, resource]);

  const set = (name: keyof typeof EMPTY, value: string) => setForm((prev) => ({ ...prev, [name]: value }));
  const searchUrlInvalid = !!form.searchUrl.trim() && !form.searchUrl.includes("{q}");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (searchUrlInvalid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        url: form.url.trim(),
        searchUrl: form.searchUrl.trim() || null,
        description: form.description.trim() || null,
        language: form.language || null,
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
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title={resource ? "Edit external resource" : "Add external resource"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Name *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="e.g. WHO Health Topics"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Website link *</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              required
              placeholder="https://"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Search link</label>
            <input
              value={form.searchUrl}
              onChange={(e) => set("searchUrl", e.target.value)}
              placeholder="https://example.org/search?q={q}"
              className={`${inputClass} ${searchUrlInvalid ? "!border-red-400" : ""}`}
            />
            <p className={`text-xs mt-1 ${searchUrlInvalid ? "text-red-500" : V2_MUTED}`}>
              Optional. Put <code>{"{q}"}</code> where the searched word goes, so staff can look a term up here
              in one click.
            </p>
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              <option value="EN">English</option>
              <option value="RW">Kinyarwanda</option>
              <option value="EN/RW">English / Kinyarwanda</option>
              <option value="FR">French</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Medical, Translation"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
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
          <button type="submit" className={V2_BTN_PRIMARY} disabled={saving || searchUrlInvalid}>
            {saving ? "Saving..." : resource ? "Save changes" : "Add resource"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ResourceFormModal;
