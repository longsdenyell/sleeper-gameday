// ESPN NFL Scoreboard normalization
export interface EspnGame {
  id: string;
  date: string; // ISO
  status: "pre" | "in" | "post";
  venue?: { fullName?: string; latitude?: number; longitude?: number; indoor?: boolean };
  competitors: Array<{ id: string; name: string; abbreviation: string }>;
}

export async function getEspnScoreboard() {
  const url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
  const r = await fetch(url);
  if (!r.ok) throw new Error("ESPN scoreboard failed");
  const json = await r.json();
  // very light transform
  const events = json?.events ?? [];
  const games: EspnGame[] = events.map((ev: any) => {
    const comp = ev?.competitions?.[0];
    const statusRaw = comp?.status?.type?.state;
    const status = statusRaw === "pre" ? "pre" : statusRaw === "post" ? "post" : "in";
    const venue = comp?.venue;
    return {
      id: ev?.id,
      date: ev?.date,
      status,
      venue: venue
        ? {
            fullName: venue?.fullName,
            latitude: Number(venue?.address?.latitude) || undefined,
            longitude: Number(venue?.address?.longitude) || undefined,
            indoor: undefined
          }
        : undefined,
      competitors: (comp?.competitors ?? []).map((c: any) => ({
        id: c?.id,
        name: c?.team?.displayName ?? c?.team?.name,
        abbreviation: c?.team?.abbreviation
      }))
    };
  });
  return games;
}
