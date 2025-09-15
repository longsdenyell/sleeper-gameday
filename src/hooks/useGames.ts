import { useEffect, useMemo, useState } from "react";
import { getEspnScoreboard } from "@/data/espn";
import { getOdds } from "@/data/odds";
import { getWeather } from "@/data/weather";
import type { GameContext } from "@/data/types";

export function useGames() {
  const [games, setGames] = useState<Record<string, GameContext>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [espn, odds] = await Promise.all([getEspnScoreboard(), getOdds().catch(() => null)]);
      // Minimal merge: leave odds/weather optional
      const next: Record<string, GameContext> = {};
      for (const g of espn) {
        let weather: GameContext["weather"] | undefined;
        const lat = g.venue?.latitude, lon = g.venue?.longitude;
        if (lat && lon) {
          try {
            const w = await getWeather(lat, lon);
            weather = {
              tempC: typeof w?.tempC === "number" ? w.tempC : undefined,
              windKph: typeof w?.windKph === "number" ? w.windKph : undefined,
              desc: w?.desc
            };
          } catch {}
        }
        next[g.id] = {
          id: g.id,
          status: g.status,
          kickoff: g.date,
          venue: g.venue ? {
            name: g.venue.fullName,
            lat: g.venue.latitude,
            lon: g.venue.longitude,
            indoor: g.venue.indoor
          } : undefined,
          odds: odds ? odds[g.id] : undefined,
          weather
        };
      }
      setGames(next);
    } catch (e: any) {
      setError(e?.message || "failed to load games");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { gamesById: games, isLoading: loading, error, refresh: load };
}
