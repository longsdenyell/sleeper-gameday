import { useEffect, useRef, useState } from "react";
import { BASE, LS_COLLAPSED, LS_FEATURED, LS_LAYOUT, LS_ORDER, LS_USERNAME } from "../utils/constants";

type PlayerMap = Record<string, any>;
type ProjectionsMap = Record<string, number>;

export function useSleeperData() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<any>(null);
  const [stateNFL, setStateNFL] = useState<any>(null);
  const [week, setWeek] = useState<string>("");

  const [leagues, setLeagues] = useState<any[]>([]);
  const [matchupsByLeague, setMatchupsByLeague] = useState<Record<string, any>>(
    {}
  );

  const [players, setPlayers] = useState<PlayerMap | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [projections, setProjections] = useState<ProjectionsMap | null>(null);
  const [projLoading, setProjLoading] = useState(false);

  const [layout, setLayout] = useState<"scroll" | "grid" | "board">("scroll");
  const [order, setOrder] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [featured, setFeatured] = useState<(string | null)[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [live, setLive] = useState(true);
  const [intervalSec, setIntervalSec] = useState(30);
  const timerRef = useRef<any>(null);

  const [scoreFlash, setScoreFlash] = useState<Record<string, boolean>>({});
  const [tileFlash, setTileFlash] = useState<Record<string, boolean>>({});
  const [playerFlash, setPlayerFlash] = useState<Record<string, Record<string, boolean>>>({});

  // bootstrap persisted UI
  useEffect(() => {
    try { const v = localStorage.getItem(LS_USERNAME); if (v) setUsername(v); } catch {}
    try { const v = localStorage.getItem(LS_LAYOUT); if (v === "grid" || v === "scroll" || v === "board") setLayout(v); } catch {}
    try { const v = JSON.parse(localStorage.getItem(LS_ORDER) || "null"); if (Array.isArray(v)) setOrder(v); } catch {}
    try { const v = JSON.parse(localStorage.getItem(LS_COLLAPSED) || "null"); if (v && typeof v === "object") setCollapsed(v); } catch {}
    try { const v = JSON.parse(localStorage.getItem(LS_FEATURED) || "null"); if (Array.isArray(v)) setFeatured(v.slice(0,2)); } catch {}
  }, []);

  // persist
  useEffect(()=>{ try { localStorage.setItem(LS_USERNAME, username); } catch {} }, [username]);
  useEffect(()=>{ try { localStorage.setItem(LS_LAYOUT, layout); } catch {} }, [layout]);
  useEffect(()=>{ try { localStorage.setItem(LS_ORDER, JSON.stringify(order)); } catch {} }, [order]);
  useEffect(()=>{ try { localStorage.setItem(LS_COLLAPSED, JSON.stringify(collapsed)); } catch {} }, [collapsed]);
  useEffect(()=>{ try { localStorage.setItem(LS_FEATURED, JSON.stringify(featured.slice(0,2))); } catch {} }, [featured]);

  // load NFL state
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/state/nfl`);
        const data = await res.json();
        setStateNFL(data);
        if (data?.week && !week) setWeek(String(data.week));
      } catch (e) { console.error(e); }
    })();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep order in sync with leagues
  useEffect(() => {
    if (!leagues?.length) return;
    setOrder(prev => {
      const liveIds = new Set(leagues.map(l => l.league_id));
      const kept = prev.filter(id => liveIds.has(id));
      const added = leagues.map(l => l.league_id).filter(id => !kept.includes(id));
      return kept.concat(added);
    });
  }, [leagues]);

  // polling
  useEffect(() => {
    if (!live || !leagues.length || !user || !week) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    refreshWeekData();
    timerRef.current = setInterval(() => refreshWeekData(), Math.max(10, Number(intervalSec)||30)*1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, leagues, user, week, intervalSec]);

  async function ensurePlayersLoaded() {
    if (players || loadingPlayers) return;
    setLoadingPlayers(true);
    try {
      const res = await fetch(`${BASE}/players/nfl`);
      const data = await res.json();
      setPlayers(data);
    } catch (e) { console.error(e); }
    finally { setLoadingPlayers(false); }
  }

  const playerName = (pid: string) => {
    const p = players?.[pid];
    if (!p) return pid;
    const name = p.full_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || pid;
    const suffix = [p.position, p.team].filter(Boolean).join(" · ");
    return suffix ? `${name} (${suffix})` : name;
  };

  const playerPos = (pid: string) => players?.[pid]?.position || "";

  async function loadProjections(season: string, wk: number) {
    try {
      setProjLoading(true);
      const res = await fetch(`${BASE}/projections/nfl?season=${season}&week=${wk}`);
      if (!res.ok) { setProjections(null); return; }
      const arr = await res.json();
      const map: ProjectionsMap = {};
      if (Array.isArray(arr)) {
        for (const row of arr) {
          const pid = row.player_id || row.player?.player_id || row.player;
          const proj = Number(row.fantasy_points || row.fp_total || row.pts || 0);
          if (pid) map[pid] = proj;
        }
      }
      setProjections(map);
    } catch (e) { console.error(e); setProjections(null); }
    finally { setProjLoading(false); }
  }

  function teamProjection(starters?: string[]) {
    if (!projections || !Array.isArray(starters)) return { total: 0, byId: {} as Record<string, number> };
    const byId: Record<string, number> = {};
    let total = 0;
    for (const pid of starters) { const p = Number(projections[pid] ?? 0); byId[pid] = p; total += p; }
    return { total, byId };
  }

  async function loadLeagues() {
    if (!username) { setError("Please enter a Sleeper username."); return; }
    if (!week) { setError("Enter a week number."); return; }
    setError(""); setLoading(true); setLeagues([]); setMatchupsByLeague({});
    try {
      const ures = await fetch(`${BASE}/user/${encodeURIComponent(username)}`);
      if (!ures.ok) throw new Error("User not found.");
      const udata = await ures.json(); setUser(udata);
      const season = stateNFL?.season; if (!season) throw new Error("Couldn't determine current NFL season.");
      const lres = await fetch(`${BASE}/user/${udata.user_id}/leagues/nfl/${season}`);
      const leaguesData = await lres.json(); setLeagues(leaguesData);
      ensurePlayersLoaded();
      loadProjections(season, Number(week));
      await refreshWeekData(udata, leaguesData, Number(week));
    } catch (e: any) { console.error(e); setError(e.message || "Failed to load leagues."); }
    finally { setLoading(false); }
  }

  async function refreshWeekData(u = user, leaguesList = leagues, wk = Number(week)) {
    if (!u || !leaguesList.length || !wk) return;
    try {
      const results = await Promise.all(leaguesList.map(async (lg) => {
        try {
          const [usersRes, rostersRes, matchupsRes] = await Promise.all([
            fetch(`${BASE}/league/${lg.league_id}/users`),
            fetch(`${BASE}/league/${lg.league_id}/rosters`),
            fetch(`${BASE}/league/${lg.league_id}/matchups/${wk}`),
          ]);
          const [users, rosters, matchups] = await Promise.all([usersRes.json(), rostersRes.json(), matchupsRes.json()]);
          const usersById = new Map(users.map((uu: any) => [uu.user_id, uu]));

          const myRoster = rosters.find((r: any) => r.owner_id === u.user_id || (Array.isArray(r.co_owners) && r.co_owners.includes(u.user_id)));
          if (!myRoster) return [lg.league_id, null];

          const myMatch = matchups.find((m: any) => m.roster_id === myRoster.roster_id);
          const opp = myMatch && matchups.find((m: any) => m.matchup_id === myMatch.matchup_id && m.roster_id !== myRoster.roster_id);

          const oppRoster = opp ? rosters.find((r: any) => r.roster_id === opp.roster_id) : null;
          const oppUser = oppRoster ? usersById.get(oppRoster.owner_id) : null;
          const meUser = usersById.get(myRoster.owner_id);

          const mePointsMap = myMatch?.players_points || {};
          const oppPointsMap = opp?.players_points || {};
          const startersMe = myMatch?.starters || [];
          const startersOpp = opp?.starters || [];

          const projMe = teamProjection(startersMe);
          const projOpp = teamProjection(startersOpp);

          const meTeamName = meUser?.metadata?.team_name || meUser?.display_name || meUser?.username || "You";
          const oppTeamName = oppUser?.metadata?.team_name || oppUser?.display_name || oppUser?.username || "Opponent";

          return [lg.league_id, {
            league: lg,
            week: wk,
            me: meUser,
            opp: oppUser,
            me_team_name: meTeamName,
            opp_team_name: oppTeamName,
            points_me: Number(myMatch?.points ?? 0),
            points_opp: Number(opp?.points ?? 0),
            starters_me: startersMe,
            starters_opp: startersOpp,
            players_points_me: mePointsMap,
            players_points_opp: oppPointsMap,
            proj_me: projMe,
            proj_opp: projOpp,
          }];
        } catch (e) { console.error("matchup load failed for", lg.league_id, e); return [lg.league_id, null]; }
      }));

      setMatchupsByLeague((prev) => {
        const newScoreFlash = { ...scoreFlash };
        const newTileFlash  = { ...tileFlash };
        const newPlayerFlash= { ...playerFlash };
        const next: Record<string, any> = { ...prev };

        for (const [id, val] of results as any[]) {
          next[id] = val;
          if (!val) continue;
          const before = prev[id];
          if (before) {
            const deltaMe  = (val.points_me  || 0) - (before.points_me  || 0);
            const deltaOpp = (val.points_opp || 0) - (before.points_opp || 0);
            const changed = deltaMe > 0 || deltaOpp > 0;
            if (changed) {
              newScoreFlash[id] = true;
              if (deltaMe >= 6 || deltaOpp >= 6) {
                newTileFlash[id] = true;
                setTimeout(() => setTileFlash(t => ({ ...t, [id]: false })), 1200);
              }
              setTimeout(() => setScoreFlash(s => ({ ...s, [id]: false })), 900);

              const prevMapMe = before.players_points_me || {};
              const prevMapOpp= before.players_points_opp || {};
              const nowMe = val.players_points_me || {};
              const nowOpp= val.players_points_opp || {};
              const highlights: Record<string, boolean> = {};
              for (const pid of Object.keys(nowMe)) if ((nowMe[pid]||0) > (prevMapMe[pid]||0)) highlights[pid] = true;
              for (const pid of Object.keys(nowOpp)) if ((nowOpp[pid]||0) > (prevMapOpp[pid]||0)) highlights[pid] = true;
              newPlayerFlash[id] = highlights;
              setTimeout(() => setPlayerFlash(p => ({ ...p, [id]: {} })), 2000);
            }
          }
        }

        if (Object.keys(newScoreFlash).length) setScoreFlash(newScoreFlash);
        if (Object.keys(newTileFlash).length)  setTileFlash(newTileFlash);
        if (Object.keys(newPlayerFlash).length)setPlayerFlash(newPlayerFlash);
        return next;
      });

    } catch (e) { console.error(e); }
  }

  return {
    // state
    username, setUsername,
    user, stateNFL, week, setWeek,
    leagues, setLeagues,
    matchupsByLeague, setMatchupsByLeague,
    players, loadingPlayers, projections, projLoading,
    layout, setLayout, order, setOrder, collapsed, setCollapsed, featured, setFeatured,
    error, setError, loading, setLoading,
    live, setLive, intervalSec, setIntervalSec,
    scoreFlash, tileFlash, playerFlash,

    // methods
    ensurePlayersLoaded,
    playerName, playerPos,
    loadProjections,
    teamProjection,
    loadLeagues,
    refreshWeekData,
  };
}
