// Sleeper endpoints and localStorage keys
export const BASE = "https://api.sleeper.app/v1";

export const LS_ORDER = "sleeper_order_v1";
export const LS_COLLAPSED = "sleeper_collapsed_v1";
export const LS_LAYOUT = "sleeper_layout_v1";
export const LS_USERNAME = "sleeper_username_v1";
export const LS_FEATURED = "sleeper_featured_v1";

// Sleeper-like position pill colors (Tailwind utility classes)
export const POS_COLORS: Record<string, string> = {
  QB: "bg-orange-500 text-black",
  RB: "bg-emerald-500 text-black",
  WR: "bg-sky-500 text-black",
  TE: "bg-violet-500 text-black",
  K:  "bg-yellow-400 text-black",
  DEF:"bg-gray-400 text-black",
  DST:"bg-gray-400 text-black",
};
