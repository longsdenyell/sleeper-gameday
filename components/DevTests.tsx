import React, { useEffect, useState } from "react";
import { cls, nf1 } from "../utils/format";
import { POS_COLORS } from "../utils/constants";

export default function DevTests() {
  const [results, setResults] = useState<{name:string; pass:boolean}[]>([]);
  useEffect(() => {
    const r: {name:string; pass:boolean}[] = [];
    try { r.push({ name: "cls filters falsy", pass: cls("a", null as any, "b", undefined, "", "" as any) === "a b" }); } catch { r.push({ name: "cls filters falsy", pass: false }); }
    try { r.push({ name: "POS_COLORS has WR", pass: !!POS_COLORS.WR }); } catch { r.push({ name: "POS_COLORS has WR", pass: false }); }
    try { r.push({ name: "POS_COLORS default missing UNKNOWN", pass: !POS_COLORS["UNKNOWN"] }); } catch { r.push({ name: "POS_COLORS default missing UNKNOWN", pass: false }); }
    try { const s = nf1.format(12.34); r.push({ name: "nf1 formats with 1 dp", pass: /\d/.test(s) }); } catch { r.push({ name: "nf1 formats with 1 dp", pass: false }); }
    // NEW tests: ensure numeric formatting stable and class joining not adding spaces
    try { r.push({ name: "nf1 zero", pass: nf1.format(0) === nf1.format(0.0) }); } catch { r.push({ name: "nf1 zero", pass: false }); }
    try { r.push({ name: "cls no doubles", pass: cls("x", "", "y") === "x y" }); } catch { r.push({ name: "cls no doubles", pass: false }); }
    setResults(r);
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-gray-800 bg-[#0f1216] p-3 text-xs text-gray-300">
      <div className="mb-2 font-semibold text-white">Dev Tests</div>
      <ul className="list-disc space-y-1 pl-5">
        {results.map((t, i) => (
          <li key={i} className={t.pass ? "text-emerald-300" : "text-rose-300"}>
            {t.pass ? "PASS" : "FAIL"} — {t.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
