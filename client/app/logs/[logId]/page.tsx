"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface Player {
  class: string;
  playerDamage: number;
}

interface Attempt {
  boss: string;
  startTime: string;
  endTime: string;
  overallDamage: number;
  players: Record<string, Player>;
}

interface Encounter {
  [bossName: string]: Attempt[];
}

interface FightsData {
  [encounterName: string]: Encounter;
}

const EncounterTable: React.FC<{
  encounterName: string;
  attempts: Attempt[];
}> = ({ encounterName, attempts }) => {
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Encounter: {encounterName}</h2>
      {attempts.map((attempt, index) => (
        <AttemptTable key={index} attempt={attempt} attemptNumber={index + 1} />
      ))}
    </div>
  );
};

const AttemptTable: React.FC<{ attempt: Attempt; attemptNumber: number }> = ({
  attempt,
  attemptNumber,
}) => {
  const columns: ColumnDef<{
    player: string;
    class: string;
    damage: number;
  }>[] = [
    { accessorKey: "player", header: "Player" },
    { accessorKey: "class", header: "Class" },
    { accessorKey: "damage", header: "Damage Dealt" },
  ];

  const data = Object.entries(attempt.players).map(([playerName, details]) => ({
    player: playerName,
    class: details.class,
    damage: details.playerDamage,
  }));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mb-6 border p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Attempt {attemptNumber}</h3>
      <p className="text-sm mb-2">
        Start: {attempt.startTime} | End: {attempt.endTime}
      </p>
      <p className="text-sm font-medium">
        Total Damage: {attempt.overallDamage}
      </p>
      <table className="w-full border-collapse border mt-4">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border px-4 py-2 bg-gray-100">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FightsTable: React.FC = () => {
  const [logData, setLogData] = useState<FightsData | null>(null);
  const { logId } = useParams(); // Get dynamic fightId from URL

  useEffect(() => {
    if (!logId) return;
    axios
      .get(`http://localhost:8000/api/get-logs/${logId}`) // Fetch data based on dynamic param
      .then((response) => setLogData(response.data))
      .catch((error) => console.error("Error fetching log data:", error));
  }, [logId]);

  if (!logData) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      {Object.entries(logData).map(([encounterName, bosses]) =>
        Object.entries(bosses).map(([bossName, attempts]) => (
          <EncounterTable
            key={bossName}
            encounterName={encounterName}
            attempts={attempts}
          />
        ))
      )}
    </div>
  );
};

export default FightsTable;
