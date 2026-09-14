/**
 * 3D Soft UI card: primary border + bottom-right primary shadow.
 * Primary: #3363AD
 */
export const V2_CARD_SHADOW =
  "[box-shadow:3px_4px_0_0_rgba(51,99,173,0.16),6px_9px_18px_rgba(51,99,173,0.20)]";

export const V2_CARD_SHELL = `bg-white rounded-[20px] border border-[rgba(51,99,173,0.20)] ${V2_CARD_SHADOW}`;

export const V2_CARD_SHELL_PADDED = `${V2_CARD_SHELL} p-4`;

/** Icon chip behind KPI glyphs — sampled from design #C5D3E0 */
export const V2_KPI_ICON_CHIP = "bg-[#C5D3E0]";
