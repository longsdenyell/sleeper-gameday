import React from "react";
import { AppStateProvider, useAppState } from "./providers/AppStateProvider";
import { useGames } from "@/hooks/useGames";
import { Header } from "@/components/layout/Header";

function AppInner() {
  const { state, dispatch } = useAppState();
  const { username, layout } = state;
  const { gamesById, isLoading, refresh } = useGames();

  return (
    <div className="p-4">
      <Header
        username={username}
        onUsername={(u)=>dispatch({ type: "SET_USERNAME", username: u })}
        layout={layout}
        onLayout={(l)=>dispatch({ type: "SET_LAYOUT", layout: l })}
        onRefresh={refresh}
        loading={isLoading}
      />
      {/* TODO: Wire BoardView and LineupView here in PR 3. For now we just show game ids. */}
      <div className="grid gap-2">
        {Object.keys(gamesById).length === 0 ? (
          <div className="text-sm opacity-70">No games loaded yet.</div>
        ) : (
          Object.values(gamesById).map(g => (
            <div key={g.id} className="rounded-xl border p-3">
              <div className="text-sm">{g.id} — {g.status} — {new Date(g.kickoff).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppInner />
    </AppStateProvider>
  );
}
