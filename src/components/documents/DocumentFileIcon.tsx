const EXT_STYLES: Record<string, string> = {
  PDF: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  DOC: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  DOCX: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  PPT: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
  PPTX: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
  XLS: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  XLSX: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  CSV: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export const fileExtension = (name: string) => {
  const clean = name.split(/[?#]/)[0];
  const ext = clean.includes(".") ? clean.split(".").pop() : "";
  return (ext || "file").toUpperCase().slice(0, 4);
};

export default function DocumentFileIcon({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const ext = fileExtension(name);
  const style = EXT_STYLES[ext] ?? "bg-[#EBF0F9] text-[#3363AD] dark:bg-slate-700 dark:text-blue-300";
  return (
    <div
      className={`${size === "lg" ? "w-11 h-11 text-[11px]" : "w-9 h-9 text-[10px]"} rounded-xl ${style} flex items-center justify-center font-extrabold tracking-wide shrink-0`}
    >
      {ext}
    </div>
  );
}
