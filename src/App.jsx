import React, { useEffect, useRef, useState } from "react";

/**
 * Sleeper League Viewer — Single-file app
 * Stack: React + Tailwind (Vite)
 * Features: Board + Lineup, DnD minicards, live flashes, Odds + Weather, settings, polling, localStorage
 */

/* =========================
   Constants / helpers
   ========================= */
const BASE = "https://api.sleeper.app/v1";
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const LS = {
  USR: "slv_usr_v1",
  ORD: "slv_ord_v1",
  COL: "slv_col_v1",
  FEA: "slv_fea_v1",
  LFEA: "slv_lfea_v1",
  TAB: "slv_tab_v1",
};
const nf1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const cls = (...x) => x.filter(Boolean).join(" ");
const POS_COLORS = {
  QB: "bg-orange-500 text-black",
  RB: "bg-emerald-500 text-black",
  WR: "bg-sky-500 text-black",
  TE: "bg-violet-500 text-black",
  K: "bg-yellow-400 text-black",
  DEF: "bg-gray-400 text-black",
  DST: "bg-gray-400 text-black",
};
const SLOT_ACCEPTS = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  K: ["K"],
  DEF: ["DEF", "DST"],
  DST: ["DEF", "DST"],
  FLEX: ["RB", "WR", "TE"],
  REC_FLEX: ["WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
  IDP_FLEX: ["DL", "LB", "DB"],
  DL: ["DL"],
  LB: ["LB"],
  DB: ["DB"],
};
const NON_START = new Set(["BN", "BENCH", "TAXI", "IR", "RESERVE"]);
const buildSlots = (league) => (league?.roster_positions || []).filter((x) => !NON_START.has(String(x).toUpperCase()));
const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* =========================
   App (default export)
   ========================= */
export default function SleeperAllLeagues() {
  // UI + persisted state
  const [show, setShow] = useState(false);
  const [usr, setUsr] = useState("");
  const [user, setUser] = useState(null);
  const [stateNFL, setStateNFL] = useState(null);
  const [week, setWeek] = useState("");

  // data
  const [leagues, setLeagues] = useState([]);
  const [mx, setMx] = useState({}); // matchups by league_id
  const [players, setPlayers] = useState(null);
  const [loadingP, setLoadingP] = useState(false);

  // UI: ordering, collapse, focus
  const [order, setOrder] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [featured, setFeatured] = useState([null, null]); // Board A,B
  const [lFeatured, setLFeatured] = useState([null]); // Lineup A

  // status
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(true);
  const [sec, setSec] = useState(30);

  // flashes + active teams
  const [scoreFx, setScoreFx] = useState({});
  const [tileFx, setTileFx] = useState({});
  const [plyFx, setPlyFx] = useState({});
  const [active, setActive] = useState(new Set());

  // tab
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem(LS.TAB) || "board";
    } catch {
      return "board";
    }
  });

  // refs
  const tRef = useRef(null);
  const dragRef = useRef(null);

  /* ---------- localStorage hydrate/persist ---------- */
  useEffect(() => {
    try {
      const v = localStorage.getItem(LS.USR);
      if (v) setUsr(v);
      else setShow(true);
    } catch {}
    try {
      const v = JSON.parse(localStorage.getItem(LS.ORD) || "null");
      if (Array.isArray(v)) setOrder(v);
    } catch {}
    try {
      const v = JSON.parse(localStorage.getItem(LS.COL) || "null");
      if (v) setCollapsed(v);
    } catch {}
    try {
      const v = JSON.parse(localStorage.getItem(LS.FEA) || "null");
      if (Array.isArray(v)) setFeatured([v[0] ?? null, v[1] ?? null]);
    } catch {}
    try {
      const v = JSON.parse(localStorage.getItem(LS.LFEA) || "null");
      if (Array.isArray(v)) setLFeatured([v[0] ?? null]);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS.USR, usr);
    } catch {}
  }, [usr]);
  useEffect(() => {
    try {
      localStorage.setItem(LS.ORD, JSON.stringify(order));
    } catch {}
  }, [order]);
  useEffect(() => {
    try {
      localStorage.setItem(LS.COL, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);
  useEffect(() => {
    try {
      localStorage.setItem(LS.FEA, JSON.stringify(featured));
    } catch {}
  }, [featured]);
  useEffect(() => {
    try {
      localStorage.setItem(LS.LFEA, JSON.stringify(lFeatured));
    } catch {}
  }, [lFeatured]);
  useEffect(() => {
    try {
      localStorage.setItem(LS.TAB, tab);
    } catch {}
  }, [tab]);

  /* ---------- initial state + polling ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE}/state/nfl`);
        const d = await r.json();
        setStateNFL(d);
        if (d?.week && !week) setWeek(String(d.week));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      if (tRef.current) clearInterval(tRef.current);
    };
  }, []);
  useEffect(() => {
    if (!usr || (!user && !loading && !leagues.length)) setShow(true);
  }, [usr, user, loading, leagues.length]);
  useEffect(() => {
    if (!leagues.length) return;
    setOrder((p) => {
      const ids = new Set(leagues.map((l) => l.league_id));
      const kept = p.filter((id) => ids.has(id));
      const add = leagues.map((l) => l.league_id).filter((id) => !kept.includes(id));
      return kept.concat(add);
    });
  }, [leagues]);
  useEffect(() => {
    if (!live || !leagues.length || !user || !week) {
      if (tRef.current) {
        clearInterval(tRef.current);
        tRef.current = null;
      }
      return;
    }
    refresh();
    teamsLive();
    tRef.current = setInterval(() => {
      refresh();
      teamsLive();
    }, Math.max(10, Number(sec) || 30) * 1000);
    return () => {
      if (tRef.current) clearInterval(tRef.current);
      tRef.current = null;
    };
  }, [live, leagues, user, week, sec]);

  /* ---------- helpers / data fetching ---------- */
  async function teamsLive() {
    try {
      const d = await fetch(ESPN).then((r) => r.json());
      const s = new Set();
      for (const ev of d.events || []) {
        const c = ev.competitions?.[0];
        if (c?.status?.type?.state === "in")
          (c.competitors || []).forEach((t) => {
            const ab = t.team?.abbreviation;
            if (ab) s.add(ab.toUpperCase());
          });
      }
      setActive(s);
    } catch (e) {
      console.error("active fetch failed", e);
    }
  }
  async function ensurePlayers() {
    if (players || loadingP) return;
    setLoadingP(true);
    try {
      setPlayers(await fetch(`${BASE}/players/nfl`).then((r) => r.json()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingP(false);
    }
  }
  const pName = (id) => {
    const p = players?.[id];
    if (!p) return id;
    const nm = p.full_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || id;
    const s = [p.position, p.team].filter(Boolean).join(" · ");
    return s ? `${nm} (${s})` : nm;
  };
  const pPos = (id) => players?.[id]?.position || "";
  const pTeam = (id) => players?.[id]?.team?.toUpperCase() || "";
  const isActive = (id) => {
    const t = pTeam(id);
    return !!t && active.has(t);
  };

  async function load() {
    if (!usr) {
      setErr("Enter a Sleeper username");
      return;
    }
    if (!week) {
      setErr("Enter a week number");
      return;
    }
    setErr("");
    setLoading(true);
    setLeagues([]);
    setMx({});
    try {
      const u = await fetch(`${BASE}/user/${encodeURIComponent(usr)}`).then((r) => r.json());
      if (!u?.user_id) throw new Error("User not found");
      setUser(u);
      const season = stateNFL?.season;
      if (!season) throw new Error("No NFL season");
      const lgs = await fetch(`${BASE}/user/${u.user_id}/leagues/nfl/${season}`).then((r) => r.json());
      setLeagues(lgs);
      ensurePlayers();
      await refresh(u, lgs, Number(week));
      setShow(false);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function refresh(u = user, lgs = leagues, w = Number(week)) {
    if (!u || !lgs.length || !w) return;
    try {
      const res = await Promise.all(
        lgs.map(async (lg) => {
          try {
            const [usersRes, rostersRes, matchupsRes] = await Promise.all([
              fetch(`${BASE}/league/${lg.league_id}/users`),
              fetch(`${BASE}/league/${lg.league_id}/rosters`),
              fetch(`${BASE}/league/${lg.league_id}/matchups/${w}`),
            ]);
            const [users, rosters, matchups] = await Promise.all([usersRes.json(), rostersRes.json(), matchupsRes.json()]);
            const byId = new Map(users.map((uu) => [uu.user_id, uu]));
            const myRoster = rosters.find(
              (r) => r.owner_id === u.user_id || (Array.isArray(r.co_owners) && r.co_owners.includes(u.user_id))
            );
            if (!myRoster) return [lg.league_id, null];
            const my = matchups.find((m) => m.roster_id === myRoster.roster_id);
            const opp = my && matchups.find((m) => m.matchup_id === my.matchup_id && m.roster_id !== myRoster.roster_id);
            const oppRoster = opp ? rosters.find((r) => r.roster_id === opp.roster_id) : null;
            const oppUser = oppRoster ? byId.get(oppRoster.owner_id) : null;
            const meUser = byId.get(myRoster.owner_id);

            const mePts = my?.players_points || {};
            const oppPts = opp?.players_points || {};
            const starMe = my?.starters || [];
            const starOp = opp?.starters || [];
            const myPlayers = myRoster.players || [];
            const bench = myPlayers.filter((pid) => !starMe.includes(pid));

            const meTeam = meUser?.metadata?.team_name || meUser?.display_name || meUser?.username || "You";
            const oppTeam = oppUser?.metadata?.team_name || oppUser?.display_name || oppUser?.username || "Opponent";

            return [
              lg.league_id,
              {
                league: lg,
                week: w,
                me: meUser,
                opp: oppUser,
                me_team_name: meTeam,
                opp_team_name: oppTeam,
                points_me: Number(my?.points ?? 0),
                points_opp: Number(opp?.points ?? 0),
                starters_me: starMe,
                starters_opp: starOp,
                players_points_me: mePts,
                players_points_opp: oppPts,
                my_players: myPlayers,
                bench_me: bench,
              },
            ];
          } catch (e) {
            console.error("load lg", lg.league_id, e);
            return [lg.league_id, null];
          }
        })
      );

      setMx((prev) => {
        const next = { ...prev },
          ns = { ...scoreFx },
          nt = { ...tileFx },
          np = { ...plyFx };
        for (const [id, val] of res) {
          next[id] = val;
          if (!val) continue;
          const before = prev[id];
          if (before) {
            const dMe = (val.points_me || 0) - (before.points_me || 0),
              dOp = (val.points_opp || 0) - (before.points_opp || 0);
            if (dMe > 0 || dOp > 0) {
              ns[id] = true;
              if (dMe >= 6 || dOp >= 6) {
                nt[id] = true;
                setTimeout(() => setTileFx((t) => ({ ...t, [id]: false })), 1200);
              }
              setTimeout(() => setScoreFx((s) => ({ ...s, [id]: false })), 900);
              const pMe = before.players_points_me || {},
                pOp = before.players_points_opp || {},
                nMe = val.players_points_me || {},
                nOp = val.players_points_opp || {};
              const hl = {};
              for (const k of Object.keys(nMe)) if ((nMe[k] || 0) > (pMe[k] || 0)) hl[k] = true;
              for (const k of Object.keys(nOp)) if ((nOp[k] || 0) > (pOp[k] || 0)) hl[k] = true;
              np[id] = hl;
              setTimeout(() => setPlyFx((p) => ({ ...p, [id]: {} })), 2000);
            }
          }
        }
        if (Object.keys(ns).length) setScoreFx(ns);
        if (Object.keys(nt).length) setTileFx(nt);
        if (Object.keys(np).length) setPlyFx(np);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  }

  /* ---------- DnD ---------- */
  function onDragStart(id) {
    dragRef.current = id;
  }
  function onDragOver(e) {
    e.preventDefault();
  }
  function onDrop(target) {
    const src = dragRef.current;
    if (!src || src === target) return;
    setOrder((p) => {
      const a = p.filter((x) => x !== src);
      const i = a.indexOf(target);
      if (i === -1) return p;
      a.splice(i, 0, src);
      return [...a];
    });
  }
  function onDropSlot(slot) {
    const src = dragRef.current;
    if (!src) return;
    setFeatured((pr) => {
      const n = [...(pr || [])];
      if (n[0] === src) n[0] = null;
      if (n[1] === src) n[1] = null;
      n[slot] = src;
      return n;
    });
  }
  function demote(id) {
    setFeatured((p) => p.map((x) => (x === id ? null : x)));
  }
  function onDropLineup() {
    const src = dragRef.current;
    if (!src) return;
    setLFeatured([src]);
  }

  /* ---------- Header ---------- */
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
        <nav className="inline-flex rounded-xl border border-gray-700 p-1">
          {["board", "lineup"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cls(
                "px-3 py-1 rounded-lg",
                tab === t ? "bg-[#1da1f2] text-black" : "text-gray-300 hover:bg-[#13171c]"
              )}
            >
              {t === "board" ? "Board" : "Lineup"}
            </button>
          ))}
        </nav>
        <button onClick={() => setShow(true)} className="rounded-xl border border-gray-700 px-3 py-2 hover:bg-[#13171c]">
          Settings
        </button>
        <label className="ml-2 inline-flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Live
        </label>
        <div className="flex items-center gap-2">
          <span>every</span>
          <input
            type="number"
            min={10}
            step={5}
            value={sec}
            onChange={(e) => setSec(Number(e.target.value))}
            className="w-16 rounded-md border border-gray-600 bg-gray-800 p-1 text-gray-100"
          />
          <span>sec</span>
        </div>
      </div>
    </div>
  );

  /* ---------- smoke tests ---------- */
  useEffect(() => {
    try {
      const results = [];
      const log = (ok, name, extra) => results.push(`${ok ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
      const v = cls("a", "", null, undefined, "b");
      log(v === "a b", "cls joins truthy", `got '${v}'`);
      const pc = (p) => POS_COLORS[p] || "bg-gray-600 text-white";
      log(pc("QB").includes("orange"), "pos color for QB", pc("QB"));
      log(pc("X") === "bg-gray-600 text-white", "pos default fallback", pc("X"));
      const s = buildSlots({ roster_positions: ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "BN", "IDP_FLEX"] });
      log(Array.isArray(s) && s.includes("FLEX") && !s.includes("BN"), "buildSlots filters", JSON.stringify(s));
      const accepts = (slot, pos) => (SLOT_ACCEPTS[slot] || [slot]).includes(pos);
      log(accepts("FLEX", "WR") && !accepts("REC_FLEX", "RB") && accepts("SUPER_FLEX", "QB"), "eligibility mapping");
      log(norm("New York Jets") === "NEWYORKJETS", "norm strips", norm("New York Jets"));
      console.log("Smoke tests:\n" + results.join("\n"));
    } catch (e) {
      console.error("Smoke tests failed", e);
    }
  }, []);

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-[#0f1216] p-4 md:p-8 text-gray-100">
      <style>{`@keyframes scoreFlash{0%{background:rgba(29,161,242,0)}50%{background:rgba(29,161,242,.25)}100%{background:rgba(29,161,242,0)}}.score-flash{animation:scoreFlash .9s ease-out}@keyframes tileFlash{0%{box-shadow:0 0 0 0 rgba(34,197,94,0)}50%{box-shadow:0 0 0 6px rgba(34,197,94,.35)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}.tile-flash{animation:tileFlash 1.2s ease-out}@keyframes playerFlash{0%{background:rgba(250,204,21,0)}50%{background:rgba(250,204,21,.35)}100%{background:rgba(250,204,21,0)}}.player-flash{animation:playerFlash 2s ease-out}`}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-[#151a21] p-5 shadow-sm ring-1 ring-black/10">{header}</div>

        {tab === "board" ? (
          <BoardView
            leagues={leagues}
            order={order}
            onDragOver={onDragOver}
            onDropSlot={onDropSlot}
            onDragStart={onDragStart}
            onDrop={onDrop}
            mx={mx}
            players={players}
            pName={pName}
            pPos={pPos}
            demote={demote}
            featured={featured}
            scoreFx={scoreFx}
            tileFx={tileFx}
            plyFx={plyFx}
            isActive={isActive}
            loading={loading}
            sec={sec}
          />
        ) : (
          <LineupView
            leagues={leagues}
            order={order}
            onDragOver={onDragOver}
            onDropSlot={onDropLineup}
            onDragStart={onDragStart}
            mx={mx}
            players={players}
            pName={pName}
            pPos={pPos}
            featured={lFeatured}
            scoreFx={scoreFx}
            tileFx={tileFx}
          />
        )}

        <footer className="pb-8 text-center text-xs text-gray-500">Live every {sec}s • Drag to reorder • Tab persists</footer>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShow(false)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-[#151a21] p-5 shadow-xl ring-1 ring-black/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Settings</h3>
              <button className="rounded-md px-2 py-1 text-gray-300 hover:bg-gray-800" onClick={() => setShow(false)}>
                ✕
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-200">Sleeper username</div>
                <input
                  className="w-full rounded-xl border border-gray-700 bg-[#0f1216] p-2 text-gray-100"
                  placeholder="e.g. your_username"
                  value={usr}
                  onChange={(e) => setUsr(e.target.value.trim())}
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-200">Week</div>
                <input
                  className="w-full rounded-xl border border-gray-700 bg-[#0f1216] p-2 text-gray-100"
                  type="number"
                  min={1}
                  max={18}
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={load}
                className={cls(
                  "rounded-xl px-4 py-2 font-medium",
                  loading ? "bg-gray-700 text-gray-300" : "bg-[#1da1f2] text-black hover:brightness-110"
                )}
                disabled={loading}
              >
                {loading ? "Loading…" : "Load leagues"}
              </button>
              <button
                onClick={ensurePlayers}
                className={cls(
                  "rounded-xl px-4 py-2 font-medium border",
                  loadingP
                    ? "bg-gray-800 text-gray-400 border-gray-700"
                    : "bg-[#0f1216] text-gray-100 border-gray-700 hover:bg-[#13171c]"
                )}
                disabled={loadingP}
              >
                {loadingP ? "Loading names…" : "Improve names"}
              </button>
              <button
                onClick={() => {
                  refresh();
                  teamsLive();
                }}
                className="rounded-xl border border-gray-700 px-4 py-2 font-medium text-gray-100 hover:bg-[#13171c]"
              >
                Refresh
              </button>
            </div>
            {err && <div className="mt-3 rounded-2xl bg-red-500/15 p-3 text-sm text-red-300">{err}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Board view
   ========================= */
function BoardView({
  leagues,
  order,
  onDragOver,
  onDropSlot,
  onDragStart,
  onDrop,
  mx,
  players,
  pName,
  pPos,
  demote,
  featured,
  scoreFx,
  tileFx,
  plyFx,
  isActive,
  loading,
  sec,
}) {
  const f0 = featured?.[0] ?? null,
    f1 = featured?.[1] ?? null;
  const f0Score = f0 ? !!scoreFx?.[f0] : false,
    f1Score = f1 ? !!scoreFx?.[f1] : false,
    f0Tile = f0 ? !!tileFx?.[f0] : false,
    f1Tile = f1 ? !!tileFx?.[f1] : false;

  return (
    <section className="rounded-2xl bg-[#151a21] p-5 shadow-sm ring-1 ring-black/10">
      <h2 className="mb-3 text-xl font-semibold text-white">Your leagues</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0" onDragOver={onDragOver} onDrop={() => onDropSlot(0)}>
          <BoardSlot
            title="Focus A"
            id={f0}
            leagues={leagues}
            mx={mx}
            players={players}
            pName={pName}
            pPos={pPos}
            collapsed={false}
            onDemote={demote}
            scoreFlash={f0Score}
            tileFlash={f0Tile}
            highlightPids={f0 ? plyFx[f0] || {} : {}}
            isActive={isActive}
          />
        </div>
        <div className="min-w-0" onDragOver={onDragOver} onDrop={() => onDropSlot(1)}>
          <BoardSlot
            title="Focus B"
            id={f1}
            leagues={leagues}
            mx={mx}
            players={players}
            pName={pName}
            pPos={pPos}
            collapsed={false}
            onDemote={demote}
            scoreFlash={f1Score}
            tileFlash={f1Tile}
            highlightPids={f1 ? plyFx[f1] || {} : {}}
            isActive={isActive}
          />
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Other matchups</h3>
            <div className="text-xs text-gray-400">Drag here to demote</div>
          </div>
          <div
            className="space-y-3"
            onDragOver={onDragOver}
            onDrop={() => {
              const src = window.__dragLeagueId; // fallback (not used)
              const ref = src || null;
              const dr = ref || null;
              // Demote via sidebar drop target (noop here; demotion happens via top slots).
            }}
          >
            {order
              .filter((id) => !featured.includes(id))
              .map((id) => {
                const lg = leagues.find((l) => l.league_id === id);
                if (!lg) return null;
                const data = mx[id];
                return (
                  <div key={id} draggable onDragStart={() => onDragStart(id)} onDragOver={onDragOver} onDrop={() => onDrop(id)}>
                    <MiniCard id={id} league={lg} data={data} scoreFlash={!!(scoreFx && scoreFx[id])} tileFlash={!!(tileFx && tileFx[id])} />
                  </div>
                );
              })}
            {order.filter((id) => !featured.includes(id)).length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-700 p-4 text-center text-sm text-gray-400">No other matchups</div>
            )}
          </div>
        </div>
      </div>

      {!loading && leagues.length === 0 && <div className="py-6 text-center text-gray-400">No leagues loaded.</div>}
      <div className="mt-4 text-xs text-gray-500">Live updates every {sec}s.</div>
    </section>
  );
}

/* =========================
   Lineup view
   ========================= */
function LineupView({ leagues, order, onDragOver, onDropSlot, onDragStart, mx, players, pName, pPos, featured, scoreFx, tileFx }) {
  const f = featured?.[0] ?? null,
    fScore = f ? !!scoreFx?.[f] : false,
    fTile = f ? !!tileFx?.[f] : false;

  return (
    <section className="rounded-2xl bg-[#151a21] p-5 shadow-sm ring-1 ring-black/10">
      <h2 className="mb-3 text-xl font-semibold text-white">Lineup helper</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2" onDragOver={onDragOver} onDrop={() => onDropSlot(0)}>
          <LineupFocusSlot
            title="Lineup A"
            id={f}
            leagues={leagues}
            mx={mx}
            players={players}
            pName={pName}
            pPos={pPos}
            onDemote={() => {}}
            scoreFlash={fScore}
            tileFlash={fTile}
            highlightPids={{}}
          />
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Your leagues</h3>
            <div className="text-xs text-gray-400">Drag to Lineup A</div>
          </div>
          <div className="space-y-3" onDragOver={onDragOver}>
            {order.map((id) => {
              const lg = leagues.find((l) => l.league_id === id);
              if (!lg) return null;
              const data = mx[id];
              return (
                <div key={id} draggable onDragStart={() => onDragStart(id)}>
                  <MiniCard
                    id={id}
                    league={lg}
                    data={data}
                    scoreFlash={!!(scoreFx && scoreFx[id])}
                    tileFlash={!!(tileFx && tileFx[id])}
                    onPromote={() => onDropSlot(0)}
                  />
                </div>
              );
            })}
            {order.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-700 p-4 text-center text-sm text-gray-400">No leagues yet</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Shared pieces
   ========================= */
function MiniCard({ id, league, data, scoreFlash, tileFlash, onPromote }) {
  return (
    <div
      className={cls("rounded-2xl border bg-[#0f1216] p-3 text-gray-100", tileFlash && "tile-flash", "border-gray-800 hover:shadow-md")}
      onClick={() => onPromote && onPromote(id)}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-white" title={league.name}>
          {league.name}
        </div>
        <div className={cls("text-sm tabular-nums", scoreFlash && "score-flash")}>
          {nf1.format(data?.points_me || 0)}-{nf1.format(data?.points_opp || 0)}
        </div>
      </div>
    </div>
  );
}

function BoardSlot({ title, id, leagues, mx, players, pName, pPos, collapsed, onDemote, scoreFlash, tileFlash, highlightPids, isActive }) {
  const lg = leagues.find((l) => l.league_id === id);
  if (!id || !lg)
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-gray-400">
        <div className="text-sm">{title}</div>
        <div className="text-xs">Drop a matchup here</div>
      </div>
    );
  const data = mx[id];
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button className="text-xs text-gray-300 hover:underline" onClick={() => onDemote(id)}>
          Send to sidebar
        </button>
      </div>
      <LeagueCard
        league={lg}
        data={data}
        players={players}
        pName={pName}
        pPos={pPos}
        collapsed={false}
        onToggleCollapse={() => {}}
        scoreFlash={scoreFlash}
        tileFlash={tileFlash}
        highlightPids={highlightPids}
        isActive={isActive}
      />
    </div>
  );
}

function LeagueCard({
  league,
  data,
  players,
  pName,
  pPos,
  collapsed,
  onToggleCollapse,
  scoreFlash,
  tileFlash,
  highlightPids,
  isActive,
}) {
  const posCls = (pos) => POS_COLORS[pos] || "bg-gray-600 text-white";
  return (
    <div
      className={cls(
        "rounded-2xl border border-gray-800 bg-[#0f1216] p-4 text-gray-100 shadow-sm transition-shadow",
        "hover:shadow-md",
        tileFlash && "tile-flash"
      )}
    >
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <div>
          {league.season} • {league.total_rosters} teams
        </div>
        <button onClick={onToggleCollapse} className="rounded-md px-2 py-1 text-gray-300 hover:bg-gray-800" title={collapsed ? "Expand" : "Collapse"}>
          <span className={cls("inline-block transition-transform", collapsed && "rotate-180")}>▾</span>
        </button>
      </div>
      <div className="text-base font-semibold text-white">{league.name}</div>

      {data ? (
        <div className="mt-3 space-y-3">
          <div className={cls("grid grid-cols-2 gap-4 rounded-lg p-3", scoreFlash && "score-flash", "bg-[#0e1116]")}>
            <div className="flex flex-col items-start gap-1">
              <div className="text-[11px] text-gray-300">
                <span className="rounded-sm bg-emerald-500/20 px-1 py-0.5 font-medium text-emerald-300">You</span>
                <span className="ml-1 align-middle">{data?.me_team_name || "You"}</span>
              </div>
              <div className="text-2xl font-extrabold leading-tight tabular-nums text-white">{nf1.format(data.points_me)}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[11px] text-gray-300">
                <span className="rounded-sm bg-rose-500/20 px-1 py-0.5 font-medium text-rose-300">Opp</span>
                <span className="ml-1 align-middle">{data?.opp_team_name || "Opponent"}</span>
              </div>
              <div className="text-2xl font-extrabold leading-tight tabular-nums text-white">{nf1.format(data.points_opp)}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Your starters</div>
              <div className="divide-y divide-gray-800 rounded-xl border border-gray-800">
                {(data.starters_me || []).length ? (
                  data.starters_me.map((pid) => {
                    const actual = Number(data.players_points_me?.[pid] ?? 0),
                      active = isActive(pid);
                    return (
                      <Row
                        key={pid}
                        pid={pid}
                        name={players ? pName(pid) : pid}
                        pos={pPos(pid)}
                        actual={actual}
                        highlight={!!highlightPids?.[pid]}
                        posClass={posCls}
                        active={active}
                      />
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-gray-400">No starters listed.</div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Opponent starters</div>
              <div className="divide-y divide-gray-800 rounded-xl border border-gray-800">
                {(data.starters_opp || []).length ? (
                  data.starters_opp.map((pid) => {
                    const actual = Number(data.players_points_opp?.[pid] ?? 0),
                      active = isActive(pid);
                    return (
                      <Row
                        key={pid}
                        pid={pid}
                        name={players ? pName(pid) : pid}
                        pos={pPos(pid)}
                        actual={actual}
                        highlight={!!highlightPids?.[pid]}
                        posClass={posCls}
                        active={active}
                      />
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-gray-400">No opponent data.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-gray-400">Click Settings and load leagues.</div>
      )}
    </div>
  );
}

function Row({ pid, name, pos, actual, highlight, posClass, active }) {
  return (
    <div className={cls("flex items-center justify-between gap-3 p-2 rounded-lg", highlight && "player-flash", active && "ring-1 ring-emerald-500/50 bg-emerald-500/10")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cls("inline-flex h-5 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-[11px] font-bold", posClass(pos))} title={pos}>
            {pos || "--"}
          </span>
          <div className="text-sm whitespace-normal break-words" title={name}>
            {name}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="tabular-nums text-sm font-semibold text-white">{nf1.format(actual)}</div>
      </div>
    </div>
  );
}

/* =========================
   Lineup focus + card
   ========================= */
function LineupFocusSlot({ title, id, leagues, mx, players, pName, pPos, onDemote, scoreFlash, tileFlash, highlightPids }) {
  const lg = leagues.find((l) => l.league_id === id);
  if (!id || !lg)
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-gray-400">
        <div className="text-sm">{title}</div>
        <div className="text-xs">Drag a league here</div>
      </div>
    );
  const data = mx[id];
  return (
    <div className={cls("rounded-2xl border border-gray-800 bg-[#0f1216] p-4 text-gray-100 shadow-sm transition-shadow", "hover:shadow-md", tileFlash && "tile-flash")}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{lg.name}</div>
        {onDemote && (
          <button className="text-xs text-gray-300 hover:underline" onClick={onDemote}>
            Remove
          </button>
        )}
      </div>
      <LineupCard league={lg} data={data} players={players} pName={pName} pPos={pPos} />
    </div>
  );
}

function LineupCard({ league, data, players, pName, pPos }) {
  const slots = buildSlots(league),
    starters = data?.starters_me || [],
    bench = data?.bench_me || [],
    pts = data?.players_points_me || {};

  // serverless odds / weather (no client keys)
  const [posOdds, setOdds] = useState({});
  const [posWx, setWx] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const sb = await fetch(ESPN).then((r) => r.json());
        const evs = sb.events || [];

        // Odds via serverless
        try {
          const arr = await fetch("/api/odds").then((r) => r.json());
          const map = {};
          for (const g of arr || []) {
            const h = norm(g.home_team),
              a = norm(g.away_team);
            let tot = null,
              sp = null;
            const firstBook = g.bookmakers?.[0];
            for (const m of firstBook?.markets || []) {
              if (m.key === "totals") tot = m.outcomes?.[0]?.point;
              if (m.key === "spreads") {
                const o = m.outcomes?.find((o) => norm(o.name) === h);
                if (o) sp = o.point;
              }
            }
            if (typeof tot === "number") {
              if (typeof sp === "number") {
                map[h] = { it: tot / 2 - sp / 2 };
                map[a] = { it: tot / 2 + sp / 2 };
              } else {
                map[h] = { it: tot / 2 };
                map[a] = { it: tot / 2 };
              }
            }
          }
          setOdds(map);
        } catch (e) {
          console.error("odds", e);
        }

        // Weather via serverless by venue → assign to teams in event
        const wmap = {};
        for (const ev of evs) {
          const c = ev.competitions?.[0],
            v = c?.venue,
            lat = v?.address?.latitude || v?.latitude,
            lon = v?.address?.longitude || v?.longitude;
          if (!lat || !lon) continue;
          try {
            const cur = (await fetch(`/api/weather?lat=${lat}&lon=${lon}`).then((r) => r.json()))?.current || {};
            const sum = { t: cur.temp, w: cur.wind_speed, d: cur.weather?.[0]?.description };
            for (const tm of c.competitors) {
              wmap[norm(tm.team?.displayName || tm.team?.abbreviation)] = sum;
            }
          } catch (e) {
            console.error("wx", e);
          }
        }
        setWx(wmap);
      } catch (e) {
        console.error("ext", e);
      }
    })();
  }, []);

  const posCls = (p) => POS_COLORS[p] || "bg-gray-600 text-white";
  const team = (pid) => norm(players?.[pid]?.team || "");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#0e1116] p-3">
        <div className="text-[11px] uppercase tracking-wide text-gray-400">Quick score</div>
        <div className="text-right font-semibold text-white">
          {nf1.format(data?.points_me || 0)} <span className="text-gray-500">vs</span> {nf1.format(data?.points_opp || 0)}
        </div>
      </div>

      {slots.map((slot, i) => {
        const accepts = SLOT_ACCEPTS[slot] || [slot];
        const sid = starters[i];
        const spos = sid ? pPos(sid) : "";
        const sname = sid ? (players ? pName(sid) : sid) : null;
        const spts = sid ? Number(pts[sid] || 0) : 0;
        const benchE = bench.filter((pid) => accepts.includes(pPos(pid)));

        const t = team(sid);
        const v = posOdds[t];
        const w = posWx[t];

        return (
          <div key={i} className="rounded-xl border border-gray-800 bg-[#0e1116] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-gray-400">{slot}</div>
              <div className="text-[10px] text-gray-500">{accepts.join(" / ")}</div>
            </div>

            <div className="mb-2 rounded-lg border border-gray-800 bg-[#0d1014] p-2">
              {sid ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cls("inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-[11px] font-bold", posCls(spos))}>
                        {spos || "--"}
                      </span>
                      <div className="truncate text-sm" title={sname}>
                        {sname}
                      </div>
                    </div>
                    <div className="tabular-nums text-sm font-semibold">{nf1.format(spts)}</div>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                    <div>Vegas: {v ? nf1.format(v.it) : "—"}</div>
                    <div>Wx: {w ? `${Math.round(w.t)}°C ${Math.round(w.w)}m/s` : "—"}</div>
                    <div className="truncate">{w?.d || "—"}</div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">— No starter</div>
              )}
            </div>

            <div className="mb-1 text-[12px] text-gray-300">Bench options</div>
            <ul className="space-y-1">
              {benchE.length ? (
                benchE.slice(0, 5).map((pid) => (
                  <li key={pid} className="flex items-center justify-between gap-2 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-200">{pPos(pid) || "--"}</span>
                      <span className="truncate" title={players ? pName(pid) : pid}>
                        {players ? pName(pid) : pid}
                      </span>
                    </div>
                    <span className="tabular-nums text-xs text-gray-300">{nf1.format(Number(pts[pid] || 0))}</span>
                  </li>
                ))
              ) : (
                <li className="text-[13px] text-gray-500">—</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
