/**
 * Shared V2 page design — Admin Beta board language for all roles.
 * Primary: #3363AD · Soft 3D cards · light + dark.
 */

/** Soft primary offset shadow (light). */
export const V2_CARD_SHADOW =
  "[box-shadow:3px_4px_0_0_rgba(51,99,173,0.16),6px_9px_18px_rgba(51,99,173,0.12)]";

/** Softer elevation in dark mode. */
export const V2_CARD_SHADOW_DARK =
  "dark:[box-shadow:3px_4px_0_0_rgba(51,99,173,0.35),0_8px_24px_rgba(0,0,0,0.45)]";

export const V2_CARD_SHELL = `bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 ${V2_CARD_SHADOW} ${V2_CARD_SHADOW_DARK}`;

export const V2_CARD_SHELL_PADDED = `${V2_CARD_SHELL} p-4`;

export const V2_CARD_SHELL_PADDED_LG = `${V2_CARD_SHELL} p-5`;

/** Icon chip behind glyphs — design #C5D3E0 */
export const V2_KPI_ICON_CHIP =
  "bg-[#C5D3E0] dark:bg-slate-700 text-[#3D6BA8] dark:text-blue-300";

/** Full board canvas (matches AdminDashboardV2). */
export const V2_PAGE_CANVAS =
  "relative bg-white dark:bg-page-bg -mx-4 -mt-4 -mb-12 px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-5 pb-8 min-h-[calc(100vh-4rem)] space-y-4 text-gray-800 dark:text-slate-100 font-sans";

/** Compact section stack when not bleeding into layout. */
export const V2_PAGE_STACK = "space-y-4 text-gray-800 dark:text-slate-100";

export const V2_PAGE_TITLE =
  "text-xl font-bold text-[#1A2332] dark:text-slate-100 tracking-tight";

export const V2_PAGE_SUBTITLE = "text-xs text-[#5B6575] dark:text-slate-400 mt-0.5";

export const V2_SECTION_TITLE =
  "text-[14px] font-bold text-[#1A2332] dark:text-slate-100 tracking-tight";

export const V2_MUTED = "text-[#5B6575] dark:text-slate-400";

export const V2_INPUT =
  "bg-white dark:bg-slate-800 border border-[#B8CDE0] dark:border-slate-600 text-[#5B6575] dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3363AD]/25 focus:border-[#3363AD]";

export const V2_BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3363AD] hover:bg-[#2a52a0] text-white text-xs font-extrabold transition-colors disabled:opacity-60";

export const V2_BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(51,99,173,0.25)] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#3363AD] dark:text-blue-300 text-xs font-bold hover:bg-[#F1F5F9] dark:hover:bg-slate-700 transition-colors";

export const V2_EMPTY =
  "text-center py-12 border border-dashed border-[#B8CDE0] dark:border-slate-600 rounded-xl";

export const V2_BTN_DANGER =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold transition-colors disabled:opacity-60";

/** Segmented pill tab bar container + items (CEHO group header tabs). */
export const V2_TAB_BAR =
  "bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 p-1 inline-flex items-center gap-0.5 flex-wrap";

export const V2_TAB_ITEM =
  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all";

export const V2_TAB_ACTIVE = "bg-[#3363AD] text-white";

export const V2_TAB_IDLE =
  "text-[#5B6575] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-700";

/** Data table parts (CEHO group members table). */
export const V2_TABLE_HEAD =
  "bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 text-[11px] font-bold text-[#5B6575] dark:text-slate-400 uppercase tracking-wider";

export const V2_TABLE_BODY =
  "divide-y divide-[rgba(51,99,173,0.08)] dark:divide-slate-700";

export const V2_TABLE_ROW =
  "hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors";

export const V2_STRONG = "text-[#1A2332] dark:text-slate-100";

/** Status pills. */
export const V2_PILL = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold";
export const V2_PILL_BLUE = "bg-[#EBF0F9] text-[#3363AD] dark:bg-slate-700 dark:text-blue-300";
export const V2_PILL_GREEN = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
export const V2_PILL_AMBER = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
export const V2_PILL_RED = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
export const V2_PILL_GRAY = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

/** Skeleton bone. */
export const V2_BONE = "rounded bg-[#D7E3F0] dark:bg-slate-700";
