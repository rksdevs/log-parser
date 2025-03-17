"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Define correct types matching API response
interface Boss {
  bossName: string;
  attempts: number;
  playersInvolved: number;
}

interface EncounterDetails {
  encounterName: string;
  bosses: Boss[];
}

const Encounter = () => {
  const { logId, encounter } = useParams();
  const [encounterDetails, setEncounterDetails] =
    useState<EncounterDetails | null>(null);

  useEffect(() => {
    if (!logId || !encounter) return;

    axios
      .get(`http://localhost:8000/api/logs/${logId}/encounters/${encounter}`)
      .then((response) => {
        console.log("Response from encounter API:", response.data);
        setEncounterDetails(response.data);
      })
      .catch((error) => console.error("Error fetching log data:", error));
  }, [logId, encounter]);

  if (!encounterDetails) {
    return <div>Loading...</div>; // ✅ Prevent rendering until data is loaded
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Encounters Summary</h2>

      <div className="mt-6 p-4 border rounded-lg shadow">
        <h3 className="text-xl font-semibold">
          {encounterDetails.encounterName}
        </h3>

        {encounterDetails.bosses.map((boss) => (
          <div key={boss.bossName} className="mt-4">
            <h3 className="text-lg font-semibold">
              Boss Name - {boss.bossName}
            </h3>
            <p>Total Attempts - {boss.attempts}</p>
            <p>Total Players Involved - {boss.playersInvolved}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Encounter;
