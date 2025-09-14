import React from "react";
import { cls, nf1 } from "../utils/format";

export default function MiniCard({
  league, data, scoreFlash, tileFlash, onPromoteA, onPromoteB,
}: {
  league: any;
  data: any;
  scoreFlash?: boolean;
  tileFlash?: boolean;
  onPromoteA: () => void;
  onPromoteB: () => void;
}) {
  return (
    <div className={cls("rounded-2xl border bg-[#0f1216] p-3 text-gray-100", tileFlash && "tile-flash", "border-gray-800 hover:shadow-md")}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-white" title={league.name}>{league.name}</div>
        <div className="flex gap-2 text-xs">
          <button onClick={onPromoteA} className="rounded-md border border-gray-700 px-2 py-1 hover:bg-[#13171c]">To A</button>
          <button onClick={onPromoteB} className="rounded-md border border-gray-700 px-2 py-1 hover:bg-[#13171c]">To B</button>
        </div>
      </div>
      {data ? (
        <div className={cls("rounded-lg p-2", scoreFlash && "score-flash", "bg-[#0e1116]")}>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Score</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <div className="text-[11px] text-gray-300">
                <span className="rounded-sm bg-emerald-500/20 px-1 py-0.5 font-medium text-emerald-300">You</span>{" "}
                <span className="align-middle">{data.me_team_name || "You"}</span>
              </div>
              <div className="text-xl font-extrabold leading-tight tabular-nums text-white">{nf1.format(data.points_me)}</div>
              <div className="text-xs text-gray-400">Proj {nf1.format(data.proj_me?.total || 0)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-gray-300">
                <span className="rounded-sm bg-rose-500/20 px-1 py-0.5 font-medium text-rose-300">Opp</span>{" "}
                <span className="align-middle">{data.opp_team_name || "Opponent"}</span>
              </div>
              <div className="text-xl font-extrabold leading-tight tabular-nums text-white">{nf1.format(data.points_opp)}</div>
              <div className="text-xs text-gray-400">Proj {nf1.format(data.proj_opp?.total || 0)}</div>
            </div>
          </div>
        </div>
      ) : <div className="text-sm text-gray-400">—</div>}
    </div>
  );
}
