"use client";

import axios from "axios";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface SpellData {
  spellId: string | number;
  spellName: string;
  totalCasts: number;
  totalHits: number;
  amount: number;
  damageForTable?: number;
  healingForTable?: number;
  damage?: Record<string, number>;
  healing?: Record<string, number>;
  damageTaken?: Record<string, number>;
  icon?: string;
  petName?: string;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // to allow additional fields like crits, uptime %, etc.
}

interface PlayerSpellContextType {
  playerSpells: SpellData[];
  petSpells: SpellData[];
  loading: boolean;
  playerClass: string | null;
}

const PlayerSpellContext = createContext<PlayerSpellContextType | undefined>(
  undefined
);

interface PlayerSpellProviderProps {
  logId: string;
  playerName: string;
  children: ReactNode;
}

export const PlayerSpellProvider: React.FC<PlayerSpellProviderProps> = ({
  logId,
  playerName,
  children,
}) => {
  const [playerSpells, setPlayerSpells] = useState<SpellData[]>([]);
  const [petSpells, setPetSpells] = useState<SpellData[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerClass, setPlayerClass] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(
        `http://localhost:8000/api/logs/${logId}/player/${playerName}/spells`
      )
      .then((response) => {
        console.log("API response:", response.data);
        setPlayerSpells(response.data.playerSpells || []);
        setPetSpells(response.data.petSpells || []);
        setPlayerClass(response.data.playerClass);
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error fetching spell data:", error);
      });
    setLoading(false);
  }, [logId, playerName]);

  return (
    <PlayerSpellContext.Provider
      value={{ playerSpells, petSpells, loading, playerClass }}
    >
      {children}
    </PlayerSpellContext.Provider>
  );
};

export const usePlayerSpells = (): PlayerSpellContextType => {
  const context = useContext(PlayerSpellContext);
  if (!context) {
    throw new Error(
      "usePlayerSpells must be used within a PlayerSpellProvider"
    );
  }
  return context;
};
