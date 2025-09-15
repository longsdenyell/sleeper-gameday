import React, { useRef } from "react";
import { cls } from "./utils/format";
import { useSleeperData } from "./hooks/useSleeperData";
import LeagueCard from "./components/LeagueCard";
import BoardSlot from "./components/BoardSlot";
import MiniCard from "./components/MiniCard";
import DevTests from "./components/DevTests";

export default function App() {
  const {
    // state
    username, setUsername, user, stateNFL, week, setWeek,
    leagues, matchupsByLeague, players, loadingPlayers,
    layout, setLayout, order, setOrder, collapsed, setCollapsed, featured, setFeatured,
    error, loading, live, setLive, intervalSec, setIntervalSec,
    scoreFlash, tileFlash, playerFlash,

    // methods
    ensurePlayersLoaded, playerName, playerPos, loadLeagues, refreshWeekData,
    projLoading, projections,
  } = useSleeperData();

  const [showModal, setShowModal] = React.useState(false);
  const dragIdRef = useRef<string | null>(null);

  function onDragStart(id: string) { dragIdRef.current = id; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(targetId: string) {
    const src = dragIdRef.current; if (!src || src === targetId) return;
    setOrder(prev => {
      const arr = prev.filter(x => x !== src);
      const idx = arr.indexOf(targetId);
      if (idx === -1) return prev;
      arr.splice(idx, 0, src);
      return [...arr];
    });
  }
  function onDropSlot(slot: 0|1) {
    const src = dragIdRef.current; if (!src) return;
    promoteToSlot(src, slot);
  }
  function promoteToSlot(id: string, slot: 0|1) {
    setFeatured((prev = []) => {
      const next = [...prev];
      if (!next[0]) next[0] = null;
      if (!next[1]) next[1] = null;
      if (next[0] === id) next[0] = null;
      if (next[1] === id) next[1] = null;
      next[slot] = id;
      return next;
    });
  }
  function demoteFromSlots(id: string) {
    setFeatured((prev = []) => prev.map(x => x === id ? null : x));
  }

  const header = (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Sleeper — My Leagues</h1>
        {stateNFL && (
          <p className="text-sm text-gray-300">
            NFL {stateNFL.season} • week {week || stateNFL.week} • {stateNFL.season_type}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
        <button onClick={() => setShowModal(true)} className="rounded-xl border border-gray-700 px-3 py-2 hover:bg-[#13171c]">Settings</button>
        <label className="ml-2 inline-flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={live} onChange={e => setLive(e.target.checked)} />
          Live
        </label>
        <div className="flex items-center gap-2">
          <span>every</span>
          <input type="number" min={10} step={5} value={intervalSec} onChange={e => setIntervalSec(Number(e.target.value))} className="w-16 rounded-md border border-gray-600 bg-gray-800 p-1 text-gray-100" />
          <span>sec</span>
        </div>
        <div className="ml-2 inline-flex overflow-hidden rounded-xl border border-gray-700">
          <button className={cls("px-3 py-2 text-sm", layout === "scroll" ? "bg-[#1da1f2] text-black" : "text-gray-300 hover:bg-[#13171c]")} onClick={() => setLayout("scroll")}>Scroll</button>
          <button className={cls("px-3 py-2 text-sm", layout === "grid"   ? "bg-[#1da1f2] text-black" : "text-gray-300 hover:bg-[#13171c]")} onClick={() => setLayout("grid")}>Grid</button>
          <button className={cls("px-3 py-2 text-sm", layout === "board"  ? "bg-[#1da1f2] text-black" : "text-gray-300 hover:bg-[#13171c]")} onClick={() => setLayout("board")}>Board</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1216] p-4 md:p-8 text-gray-100">
      <style>{`
        @keyframes scoreFlash { 0%{background-color:rgba(29,161,242,0.0)} 50%{background-color:rgba(29,161,242,0.25)} 100%{background-color:rgba(29,161,242,0.0)} }
        .score-flash { animation: scoreFlash 0.9s ease-out; }
        @keyframes tileFlash { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.0)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0.35)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0.0)} }
        .tile-flash { animation: tileFlash 1.2s ease-out; }
        @keyframes playerFlash { 0%{background-color:rgba(250,204,21,0.0)} 50%{background-color:rgba(250,204,21,0.35)} 100%{background-color:rgba(250,204,21,0.0)} }
        .player-flash { animation: playerFlash 2s ease-out; }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-[#151a21] p-5 shadow-sm ring-1 ring-black/10">{header}</div>

        <section className="rounded-2xl bg-[#151a21] p-5 shadow-sm ring-1 ring-black/10">
          <h2 className="mb-3 text-xl font-semibold text-white">Your leagues {week ? `(week ${week})` : ""}</h2>

          {layout === "scroll" && (
            <div className="overflow-x-auto">
              <div className="flex gap-4">
                {order.map((id) => {
                  const lg = leagues.find(l => l.league_id === id);
                  if (!lg) return null;
                  const data = matchupsByLeague[id];
                  const isCollapsed = !!collapsed[id];
                  return (
                    <div key={id} className="w-[520px] shrink-0" draggable onDragStart={() => onDragStart(id)} onDragOver={onDragOver} onDrop={() => onDrop(id)}>
                      <LeagueCard
                        league={lg}
                        data={data}
                        collapsed={isCollapsed}
                        onToggleCollapse={() => setCollapsed(c => ({ ...c, [id]: !c[id] }))}
                        scoreFlash={!!scoreFlash[id]}
                        tileFlash={!!tileFlash[id]}
                        playerName={players ? (p=>playerName(p)) : (p=>p)}
                        playerPos={playerPos}
                        highlightPids={playerFlash[id] || {}}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {layout === "grid" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {order.map((id) => {
                const lg = leagues.find(l => l.league_id === id);
                if (!lg) return null;
                const data = matchupsByLeague[id];
                const isCollapsed = !!collapsed[id];
                return (
                  <div key={id} className="min-w-0" draggable onDragStart={() => onDragStart(id)} onDragOver={onDragOver} onDrop={() => onDrop(id)}>
                    <LeagueCard
                      league={lg}
                      data={data}
                      collapsed={isCollapsed}
                      onToggleCollapse={() => setCollapsed(c => ({ ...c, [id]: !c[id] }))}
                      scoreFlash={!!scoreFlash[id]}
                      tileFlash={!!tileFlash[id]}
                      playerName={players ? (p=>playerName(p)) : (p=>p)}
                      playerPos={playerPos}
                      highlightPids={playerFlash[id] || {}}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {layout === "board" && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="min-w-0" onDragOver={onDragOver} onDrop={() => onDropSlot(0)}>
                <BoardSlot
                  title="Focus A"
                  id={(featured[0] as string) ?? null}
                  leagues={leagues}
                  matchupsByLeague={matchupsByLeague}
                  playersLoaded={!!players}
                  playerName={players ? (p=>playerName(p)) : (p=>p)}
                  playerPos={playerPos}
                  collapsed={false}
                  onDemote={demoteFromSlots}
                  scoreFlash={featured[0] ? !!scoreFlash[featured[0] as string] : false}
                  tileFlash={featured[0] ? !!tileFlash[featured[0] as string] : false}
                  highlightPids={featured[0] ? (playerFlash[featured[0] as string] || {}) : {}}
                />
              </div>
              <div className="min-w-0" onDragOver={onDragOver} onDrop={() => onDropSlot(1)}>
                <BoardSlot
                  title="Focus B"
                  id={(featured[1] as string) ?? null}
                  leagues={leagues}
                  matchupsByLeague={matchupsByLeague}
                  playersLoaded={!!players}
                  playerName={players ? (p=>playerName(p)) : (p=>p)}
                  playerPos={playerPos}
                  collapsed={false}
                  onDemote={demoteFromSlots}
                  scoreFlash={featured[1] ? !!scoreFlash[featured[1] as string] : false}
                  tileFlash={featured[1] ? !!tileFlash[featured[1] as string] : false}
                  highlightPids={featured[1] ? (playerFlash[featured[1] as string] || {}) : {}}
                />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Other matchups</h3>
                  <div className="text-xs text-gray-400">Drag here to demote</div>
                </div>
                <div className="space-y-3" onDragOver={onDragOver} onDrop={() => { const src = dragIdRef.current; if (src) demoteFromSlots(src); }}>
                  {order.filter(id => !featured.includes(id)).map((id) => {
                    const lg = leagues.find(l => l.league_id === id);
                    if (!lg) return null;
                    const data = matchupsByLeague[id];
                    return (
                      <div key={id} draggable onDragStart={() => onDragStart(id)} onDragOver={onDragOver} onDrop={() => onDrop(id)}>
                        <MiniCard
                          league={lg}
                          data={data}
                          scoreFlash={!!scoreFlash[id]}
                          tileFlash={!!tileFlash[id]}
                          onPromoteA={() => promoteToSlot(id, 0)}
                          onPromoteB={() => promoteToSlot(id, 1)}
                        />
                      </div>
                    );
                  })}
                  {order.filter(id => !featured.includes(id)).length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-700 p-4 text-center text-sm text-gray-400">No other matchups</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && leagues.length === 0 && (
            <div className="py-6 text-center text-gray-400">No leagues loaded.</div>
          )}
        </section>

        <footer className="pb-8 text-center text-xs text-gray-500">
          Built with the public Sleeper API. Live updates every {intervalSec}s when enabled. Drag tiles to reorder; click the caret to collapse. Layout and featured slots are persisted.
        </footer>

        <DevTests />
      </div>

      {/* Settings modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-[#151a21] p-5 shadow-xl ring-1 ring-black/20" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Settings</h3>
              <button className="rounded-md px-2 py-1 text-gray-300 hover:bg-gray-800" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-200">Sleeper username</div>
                <input className="w-full rounded-xl border border-gray-700 bg-[#0f1216] p-2 text-gray-100 focus:border-gray-500 focus:outline-none" placeholder="e.g. your_username" value={username} onChange={(e) => setUsername(e.target.value.trim())} />
              </label>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-200">Week</div>
                <input className="w-full rounded-xl border border-gray-700 bg-[#0f1216] p-2 text-gray-100 focus:border-gray-500 focus:outline-none" type="number" min={1} max={18} value={week} onChange={(e) => setWeek(e.target.value)} />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={loadLeagues} className={cls("rounded-xl px-4 py-2 font-medium", loading ? "bg-gray-700 text-gray-300" : "bg-[#1da1f2] text-black hover:brightness-110")} disabled={loading} aria-busy={loading}>
                {loading ? "Loading…" : "Load leagues"}
              </button>
              <button onClick={ensurePlayersLoaded} className={cls("rounded-xl px-4 py-2 font-medium border", loadingPlayers ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-[#0f1216] text-gray-100 border-gray-700 hover:bg-[#13171c]")} disabled={loadingPlayers}>
                {loadingPlayers ? "Loading names…" : "Improve names"}
              </button>
              <button onClick={() => refreshWeekData()} className="rounded-xl border border-gray-700 px-4 py-2 font-medium text-gray-100 hover:bg-[#13171c]" title="Refresh now">Refresh</button>
            </div>
            {error && <div className="mt-3 rounded-2xl bg-red-500/15 p-3 text-sm text-red-300">{error}</div>}
            <div className="mt-2 text-xs text-gray-400">
              Projections {projLoading ? "loading…" : projections ? "loaded" : "not available"} • Names {players ? "loaded" : loadingPlayers ? "loading…" : "off"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
