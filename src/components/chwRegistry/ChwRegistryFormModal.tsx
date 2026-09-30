import { FC, FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/common/Modal";
import { getPublicHospitals } from "@/services/healthCenters.service";
import { getAllDistricts, getSectorsByDistrict } from "@/hooks/locations";
import type { ChwRegistryInput, IChwRegistryEntry } from "@/services/chwRegistry.service";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_INPUT,
  V2_MUTED,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry?: IChwRegistryEntry | null;
  onSubmit: (payload: ChwRegistryInput) => Promise<void>;
}

type FormState = {
  fullNames: string;
  NID: string;
  phoneNumber: string;
  gender: string;
  birthdate: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  healthCenterId: string;
};

const EMPTY: FormState = {
  fullNames: "",
  NID: "",
  phoneNumber: "",
  gender: "",
  birthdate: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
  healthCenterId: "",
};

const LOCATION_CHILDREN: Partial<Record<keyof FormState, (keyof FormState)[]>> = {
  district: ["sector", "cell", "village", "healthCenterId"],
  sector: ["cell", "village"],
  cell: ["village"],
};

/** Keeps a stored value selectable when it isn't in the official location list. */
const withCurrent = (names: string[], current: string) =>
  current && !names.includes(current) ? [current, ...names] : names;

const inputClass = `w-full px-3 py-2 text-sm ${V2_INPUT}`;
const labelClass = "block text-xs font-semibold text-[#5B6575] dark:text-slate-400 mb-1";

const ChwRegistryFormModal: FC<Props> = ({ isOpen, onClose, entry, onSubmit }) => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setForm(
      entry
        ? {
            fullNames: entry.fullNames,
            NID: entry.NID,
            phoneNumber: entry.phoneNumber ?? "",
            gender: entry.gender ?? "",
            birthdate: entry.birthdate ? entry.birthdate.slice(0, 10) : "",
            district: entry.district,
            sector: entry.sector ?? "",
            cell: entry.cell ?? "",
            village: entry.village ?? "",
            healthCenterId: entry.healthCenterId ?? "",
          }
        : EMPTY,
    );
  }, [isOpen, entry]);

  const { data: healthCenters = [], isFetching: hcLoading } = useQuery({
    queryKey: ["publicHospitals", form.district],
    queryFn: () => getPublicHospitals({ district: form.district }),
    enabled: isOpen && !!form.district,
    staleTime: 5 * 60 * 1000,
  });

  const districtNames = useMemo(() => getAllDistricts().map((d) => d.name.trim()).sort(), []);
  const sectors = useMemo(
    () => (form.district ? getSectorsByDistrict(form.district) : []),
    [form.district],
  );
  const cells = useMemo(
    () => sectors.find((s) => s.name.trim() === form.sector)?.cells ?? [],
    [sectors, form.sector],
  );
  const villages = useMemo(
    () => cells.find((c) => c.name.trim() === form.cell)?.villages ?? [],
    [cells, form.cell],
  );

  const set = (name: keyof FormState, value: string) =>
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (prev[name] !== value) LOCATION_CHILDREN[name]?.forEach((child) => (next[child] = ""));
      return next;
    });

  const nidDigits = form.NID.replace(/\s/g, "");
  const nidInvalid = nidDigits.length > 0 && !/^1\d{15}$/.test(nidDigits);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (nidInvalid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        NID: nidDigits,
        fullNames: form.fullNames.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        gender: form.gender || null,
        birthdate: form.birthdate || null,
        district: form.district,
        sector: form.sector || null,
        cell: form.cell || null,
        village: form.village || null,
        healthCenterId: form.healthCenterId || null,
      });
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const locationFields: {
    name: "sector" | "cell" | "village";
    label: string;
    options: string[];
    parent: string;
    parentLabel: string;
  }[] = [
    { name: "sector", label: "Sector", options: sectors.map((s) => s.name.trim()), parent: form.district, parentLabel: "district" },
    { name: "cell", label: "Cell", options: cells.map((c) => c.name.trim()), parent: form.sector, parentLabel: "sector" },
    { name: "village", label: "Village", options: villages.map((v) => v.name.trim()), parent: form.cell, parentLabel: "cell" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={() => !saving && onClose()} title={entry ? "Edit CHW" : "Add CHW to registry"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className={`text-xs ${V2_MUTED}`}>
          When this CHW signs up on the mobile app and types their NID, these details are filled in automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full names *</label>
            <input
              value={form.fullNames}
              onChange={(e) => set("fullNames", e.target.value)}
              required
              placeholder="e.g. MUKAMANA Rosette"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>National ID (NID) *</label>
            <input
              value={form.NID}
              onChange={(e) => set("NID", e.target.value.replace(/[^\d\s]/g, ""))}
              required
              inputMode="numeric"
              maxLength={20}
              placeholder="16 digits, starts with 1"
              className={`${inputClass} ${nidInvalid ? "!border-red-400" : ""}`}
            />
            {nidInvalid && <p className="text-xs text-red-500 mt-1">NID must be 16 digits starting with 1</p>}
          </div>
          <div>
            <label className={labelClass}>Phone number</label>
            <input
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              inputMode="tel"
              placeholder="07XXXXXXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Sex</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputClass}>
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date of birth</label>
            <input
              type="date"
              value={form.birthdate}
              onChange={(e) => set("birthdate", e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>District *</label>
            <select value={form.district} onChange={(e) => set("district", e.target.value)} required className={inputClass}>
              <option value="">Select district</option>
              {withCurrent(districtNames, form.district).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {locationFields.map(({ name, label, options, parent, parentLabel }) => (
            <div key={name}>
              <label className={labelClass}>{label}</label>
              <select
                value={form[name]}
                onChange={(e) => set(name, e.target.value)}
                disabled={!parent}
                className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">{parent ? `Select ${label.toLowerCase()}` : `Select ${parentLabel} first`}</option>
                {withCurrent(options, form[name]).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className={labelClass}>Health center</label>
            <select
              value={form.healthCenterId}
              onChange={(e) => set("healthCenterId", e.target.value)}
              disabled={!form.district}
              className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {!form.district ? "Select district first" : hcLoading ? "Loading..." : "Select health center"}
              </option>
              {entry?.healthCenter && !healthCenters.some((h) => h.id === entry.healthCenter!.id) && (
                <option value={entry.healthCenter.id}>{entry.healthCenter.name}</option>
              )}
              {healthCenters.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700">
          <button type="button" onClick={onClose} className={V2_BTN_SECONDARY} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={V2_BTN_PRIMARY} disabled={saving || nidInvalid}>
            {saving ? "Saving..." : entry ? "Save changes" : "Add CHW"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChwRegistryFormModal;
