export const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

export const nf1 = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
