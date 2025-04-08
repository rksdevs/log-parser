// Each clickable attempt under a boss
export interface AttemptNavItem {
    name: string;     // e.g., "Attempt 1 - 2025-01-25 03:32:27.000Z"
    start: string;    // ISO timestamp
    end: string;      // ISO timestamp
    url: string;      // Full URL to route user
  }
  
  // Each boss under an encounter (optional if you're not exposing bosses in nav)
  export interface BossNavItem {
    name: string;             // e.g., "High Priestess Jeklik - Heroic"
    attempts: AttemptNavItem[];
  }
  
  // Raw API response shape
  export interface RawEncounterNav {
    encounter: string;         // Encounter name (used as section header)
    url: string;               // Encounter page URL
    isActive: boolean;         // Whether the encounter is enabled (optional)
    bosses: BossNavItem[];
  }
  
  // Transformed format for Sidebar consumption
  export interface EncounterNavItem {
    name: string;               // Encounter name
    children: {
      name: string;             // Attempt name
      url: string;              // Attempt URL
    }[];
  }

  
  export interface LogSummary {
    logId: string;
    totalEncounters: number;
    totalAttempts: number;
    totalPlayers: number;
    totalDuration: number;
    encounterWiseAttempts: Record<string, number>;
    totalPlayerDamage: number;
    totalPlayerHealing: number;
    playerBreakdown: Record<
      string,
      {
        totalDamage: number;
        totalHealing: number;
      }
    >;
    dpsChartData: {
      player: string;
      value: number;
      class: string;
    }[];
    healingChartData: {
      player: string;
      value: number;
      class: string;
    }[];
    playerStats: {
      playerName: string;
      guid: string;
      class: string;
      totalDamage: number;
      totalHealing: number;
      dps: string;
      hps: string;
    }[];
    bossStats: {
      playerName: string;
      guid: string;
      class: string;
      totalDamage: number;
      totalHealing: number;
      dps: string;
      hps: string;
    }[];
    otherStats: {
      playerName: string;
      guid: string;
      class: string;
      totalDamage: number;
      totalHealing: number;
      dps: string;
      hps: string;
    }[];
    highestDps: {
      player: string;
      dps: string;
      boss: string;
    };
    highestHps: {
      player: string;
      hps: string;
      boss: string;
    };
  }
  
  
  