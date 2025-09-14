import React from "react";
import Row from "./Row";
import { cls, nf1 } from "../utils/format";

export default function LeagueCard({
  league,
  data,
  collapsed,
  onToggleCollapse,
  scoreFlash,
  tileFlash,
  playerName,
  playerPos,
  highlightPids,
}: {
  league: any;
  data: any;
  collapsed: boolean;
  onToggleCollapse: () => void;
  scoreFlash?: boolean;
  tileFlash?: boolean;
  playerName: (pid: string) => string;
  playerPos: (pid: string) => string;
  highlightPids?: Record<string, boolean>;
}) {
  return (
    <div className={cls(
      "rounded-2xl border border-gray-800 bg-[#0f1216] p-4 text-gray-100 shadow-sm transition-shadow",
      "hover:shadow-md",
      tileFlash && "tile-flash"
    )}>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <div>{league.season} • {league.total_rosters} teams</div>
        <button onClick={onToggleCollapse} className="rounded-md px-2 py-1 text-gray-300 hover:bg-gray-800" title={collapsed ? "Expand" : "Collapse"}>
          <span className={cls("inline-block transition-transform", collapsed && "rotate-180")}>▾</span>
        </button>
      </div>
      <div className="text-base font-semibold text-white">{league.name}</div>

      {data ? (
        <div className="mt-3 space-y-3">
          {/* Score header */}
          <div className={cls("grid grid-cols-2 gap-4 rounded-lg p-3", scoreFlash && "score-flash", "bg-[#0e1116]")}>
            <div className="flex flex-col items-start gap-1">
              <div className="text-[11px] text-gray-300">
                <span className="rounded-sm bg-emerald-500/20 px-1 py-0.5 font-medium text-emerald-300">You</span>
                <span className="ml-1 align-middle">{data?.me_team_name || "You"}</span>
              </div>
              <div className="text-2xl font-extrabold leading-tight tabular-nums text-white">{nf1.format(data.points_me)}</div>
              <div className="text-xs text-gray-400">Proj {nf1.format(data.proj_me?.total || 0)}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[11px] text-gray-300">
                <span className="rounded-sm bg-rose-500/20 px-1 py-0.5 font-medium text-rose-300">Opp</span>
                <span className="ml-1 align-middle">{data?.opp_team_name || "Opponent"}</span>
              </div>
              <div className="text-2xl font-extrabold leading-tight tabular-nums text-white">{nf1.format(data.points_opp)}</div>
              <div className="text-xs text-gray-400">Proj {nf1.format(data.proj_opp?.total || 0)}</div>
            </div>
          </div>

          {!collapsed && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Your starters</div>
                <div className="divide-y divide-gray-800 rounded-xl border border-gray-800">
                  {(data.starters_me || []).length ? (
                    data.starters_me.map((pid: string) => (
                      <Row
                        key={pid}
                        pid={pid}
                        name={playerName(pid)}
                        pos={playerPos(pid)}
                        actual={Number(data.players_points_me?.[pid] ?? 0)}
                        proj={Number(data.proj_me?.byId?.[pid] ?? 0)}
                        highlight={!!highlightPids?.[pid]}
                      />
                    ))
                  ) : (<div className="p-2 text-sm text-gray-400">No starters listed.</div>)}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Opponent starters</div>
                <div className="divide-y divide-gray-800 rounded-xl border border-gray-800">
                  {(data.starters_opp || []).length ? (
                    data.starters_opp.map((pid: string) => (
                      <Row
                        key={pid}
                        pid={pid}
                        name={playerName(pid)}
                        pos={playerPos(pid)}
                        actual={Number(data.players_points_opp?.[pid] ?? 0)}
                        proj={Number(data.proj_opp?.byId?.[pid] ?? 0)}
                        highlight={!!highlightPids?.[pid]}
                      />
                    ))
                  ) : (<div className="p-2 text-sm text-gray-400">No opponent data.</div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 text-sm text-gray-400">Click “Settings” and load leagues.</div>
      )}
    </div>
  );
}
