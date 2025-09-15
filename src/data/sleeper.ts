// Thin wrappers around Sleeper API fetches.
// You can expand with zod schemas later.

const BASE = "https://api.sleeper.app/v1";

export async function getNflState() {
  const r = await fetch(`${BASE}/state/nfl`);
  if (!r.ok) throw new Error("state/nfl failed");
  return r.json();
}

export async function getUser(username: string) {
  const r = await fetch(`${BASE}/user/${encodeURIComponent(username)}`);
  if (!r.ok) throw new Error("user lookup failed");
  return r.json();
}

export async function getLeagues(userId: string, season: string) {
  const r = await fetch(`${BASE}/user/${userId}/leagues/nfl/${season}`);
  if (!r.ok) throw new Error("leagues failed");
  return r.json();
}

export async function getLeagueUsers(leagueId: string) {
  const r = await fetch(`${BASE}/league/${leagueId}/users`);
  if (!r.ok) throw new Error("league users failed");
  return r.json();
}

export async function getLeagueRosters(leagueId: string) {
  const r = await fetch(`${BASE}/league/${leagueId}/rosters`);
  if (!r.ok) throw new Error("rosters failed");
  return r.json();
}

export async function getMatchups(leagueId: string, week: number) {
  const r = await fetch(`${BASE}/league/${leagueId}/matchups/${week}`);
  if (!r.ok) throw new Error("matchups failed");
  return r.json();
}

export async function getPlayersMap() {
  // large payload; cache outside as needed
  const r = await fetch(`${BASE}/players/nfl`);
  if (!r.ok) throw new Error("players map failed");
  return r.json();
}
