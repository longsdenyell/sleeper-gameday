import React from "react";
import { cls, nf1 } from "../utils/format";
import { POS_COLORS } from "../utils/constants";

export default function Row({
  pid, name, pos, actual, proj, highlight,
}: {
  pid: string;
  name: string;
  pos: string;
  actual: number;
  proj: number;
  highlight?: boolean;
}) {
  const pill = POS_COLORS[pos] || "bg-gray-600 text-white";
  return (
    <div className={cls("flex items-center justify-between gap-3 p-2", highlight && "player-flash rounded-lg")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cls("inline-flex h-5 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-[11px] font-bold", pill)} title={pos}>
            {pos || "--"}
          </span>
          <div className="text-sm whitespace-normal break-words" title={name}>{name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="tabular-nums text-sm font-semibold text-white">{nf1.format(actual)}</div>
        <div className="tabular-nums text-[11px] text-gray-400">Proj {nf1.format(proj)}</div>
      </div>
    </div>
  );
}
