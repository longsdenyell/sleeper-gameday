import React, { createContext, useContext, useEffect, useReducer } from "react";

type Layout = "board" | "lineup";

export interface AppState {
  username: string;
  layout: Layout;
  featuredTeamIds: string[];
  collapsed: Record<string, boolean>;
  leagueOrder: Record<string, string[]>; // leagueId -> teamIds[]
}

type Action =
  | { type: "SET_USERNAME"; username: string }
  | { type: "SET_LAYOUT"; layout: Layout }
  | { type: "TOGGLE_FEATURED"; teamId: string }
  | { type: "SET_LEAGUE_ORDER"; leagueId: string; order: string[] }
  | { type: "TOGGLE_COLLAPSE"; key: string };

const DEFAULT_STATE: AppState = {
  username: "",
  layout: "board",
  featuredTeamIds: [],
  collapsed: {},
  leagueOrder: {}
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_USERNAME":
      return { ...state, username: action.username };
    case "SET_LAYOUT":
      return { ...state, layout: action.layout };
    case "TOGGLE_FEATURED":
      return {
        ...state,
        featuredTeamIds: state.featuredTeamIds.includes(action.teamId)
          ? state.featuredTeamIds.filter(id => id !== action.teamId)
          : [...state.featuredTeamIds, action.teamId]
      };
    case "SET_LEAGUE_ORDER":
      return {
        ...state,
        leagueOrder: { ...state.leagueOrder, [action.leagueId]: action.order }
      };
    case "TOGGLE_COLLAPSE":
      return {
        ...state,
        collapsed: { ...state.collapsed, [action.key]: !state.collapsed[action.key] }
      };
    default:
      return state;
  }
}

const CTX = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem("sg_prefs");
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem("sg_prefs", JSON.stringify(state));
    } catch {}
  }, [state]);
  return <CTX.Provider value={{ state, dispatch }}>{children}</CTX.Provider>;
}

export function useAppState() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
