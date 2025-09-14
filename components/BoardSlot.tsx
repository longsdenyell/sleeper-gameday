import React from "react";
import LeagueCard from "./LeagueCard";

export default function BoardSlot({
  title, id, leagues, matchupsByLeague, playersLoaded, playerName, playerPos,
  collapsed, onDemote, scoreFlash, tileFlash, highlightPids,
}: {
  title: string;
  id: string | null;
  leagues: any[];
  matchupsByLeague: Record<string, any>;
  playersLoaded: boolean;
  playerName: (pid: string) => string;
  playerPos: (pid: string) => string;
  collapsed: boolean;
  onDemote: (id: string) => void;
  scoreFlash?: boolean;
  tileFlash?: boolean;
  highlightPids?: Record<string, boolean>;
}) {
  const lg = id ? leagues.find(l => l.league_id === id) : null;
  if (!id || !lg) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-gray-400">
        <div className="text-sm">{title}</div>
        <div className="text-xs">Drop a matchup here</div>
      </div>
    );
  }
  const data = matchupsByLeague[id];
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button className="text-xs text-gray-300 hover:underline" onClick={() => onDemote(id)}>Send to sidebar</button>
      </div>
      <LeagueCard
        league={lg}
        data={data}
        collapsed={collapsed}
        onToggleCollapse={() => {}}
        scoreFlash={scoreFlash}
        tileFlash={tileFlash}
        playerName={playerName}
        playerPos={playerPos}
        highlightPids={highlightPids}
      />
    </div>
  );
}
