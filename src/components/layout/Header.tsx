import React from "react";

export function Header({
  username, onUsername, layout, onLayout, onRefresh, loading
}: {
  username: string;
  onUsername: (u: string) => void;
  layout: "board" | "lineup";
  onLayout: (l: "board" | "lineup") => void;
  onRefresh: () => void;
  loading?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Sleeper username"
          value={username}
          onChange={e => onUsername(e.target.value)}
        />
        <button className="rounded-lg border px-3 py-2" onClick={onRefresh}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="flex gap-2">
        <button
          className={`rounded-lg border px-3 py-2 ${layout === "board" ? "font-semibold" : ""}`}
          onClick={() => onLayout("board")}
        >
          Board
        </button>
        <button
          className={`rounded-lg border px-3 py-2 ${layout === "lineup" ? "font-semibold" : ""}`}
          onClick={() => onLayout("lineup")}
        >
          Lineup
        </button>
      </div>
    </div>
  );
}
