"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  RawEncounterNav,
  EncounterNavItem,
  LogSummary,
} from "@/types/navigation";

interface NavigationContextType {
  encounters: EncounterNavItem[];
  currentLogId: string | null;
  setEncounterNav: (logId: string, raw: RawEncounterNav[]) => void;
  logSummary: LogSummary | null; // ✅ add this
  setLogSummary: (summary: LogSummary) => void; // ✅ setter
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [encounters, setEncounters] = useState<EncounterNavItem[]>([]);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [logSummary, setLogSummary] = useState<LogSummary | null>(null);

  // ✅ Memoize the setter to avoid triggering useEffect re-runs
  const setEncounterNav = useCallback(
    (logId: string, raw: RawEncounterNav[]) => {
      const transformed: EncounterNavItem[] = raw.map((encounter) => ({
        name: encounter.encounter,
        children: encounter.bosses.flatMap((boss) =>
          boss.attempts.map((attempt) => ({
            name: attempt.name,
            url: attempt.url,
          }))
        ),
      }));

      setEncounters(transformed);
      setCurrentLogId(logId);

      localStorage.setItem(`encounters-${logId}`, JSON.stringify(transformed));
      localStorage.setItem("currentLogId", logId);
    },
    []
  );

  // ✅ Hydrate on first load
  useEffect(() => {
    const savedLogId = localStorage.getItem("currentLogId");
    const savedNav = savedLogId
      ? localStorage.getItem(`encounters-${savedLogId}`)
      : null;

    if (savedLogId && savedNav) {
      setCurrentLogId(savedLogId);
      setEncounters(JSON.parse(savedNav));
    }
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        encounters,
        currentLogId,
        setEncounterNav,
        setLogSummary,
        logSummary,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
