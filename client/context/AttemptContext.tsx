"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export interface StatSummary {
  playerName: string;
  guid: string;
  class: string;
  totalDamage: number;
  totalHealing: number;
  dps: string;
  hps: string;
}

interface AttemptContextType {
  playerStats: StatSummary[];
  bossStats: StatSummary[];
  loading: boolean;
}

const AttemptContext = createContext<AttemptContextType | undefined>(undefined);

export const AttemptProvider = ({ children }: { children: ReactNode }) => {
  const { logId, startTime } = useParams();
  const [playerStats, setPlayerStats] = useState<StatSummary[]>([]);
  const [bossStats, setBossStats] = useState<StatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // if (typeof rawLogId !== "string") return;

    setLoading(true);

    axios
      .get(
        `http://localhost:8000/api/logs/attempt-summary/${logId}/${startTime}`
      )
      .then((response) => {
        // setEncounterNav(rawLogId, response.data.navigationData);
        // setLogSummary(response.data.logSummary);
        // console.log(response);
        setBossStats(response.data.bossStats || []);
        setPlayerStats(response.data.playerStats || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching navigation data:", error);
        setLoading(false);
      });
  }, [logId, startTime]);

  return (
    <AttemptContext.Provider value={{ playerStats, bossStats, loading }}>
      {children}
    </AttemptContext.Provider>
  );
};

export const useAttemptStats = (): AttemptContextType => {
  const context = useContext(AttemptContext);
  if (!context) {
    throw new Error("useAttemptStats must be used within AttemptProvider");
  }
  return context;
};
