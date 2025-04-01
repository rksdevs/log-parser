"use client";

// import data from "./data.json";
import { useEffect, useState } from "react";
import axios from "axios";
import { AllLogsTable } from "@/components/all-logs-table";
interface Log {
  logId: number;
  date: string;
  players: string[];
  uploadStatus: string;
}

export default function Page() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/logs/all-logs")
      .then((res) => {
        // console.log(res.data, "from all logs");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedLogs: Log[] = res.data.map((log: any) => ({
          logId: log.logId,
          date: log.date,
          players: log.players,
          uploadStatus: log.uploadStatus,
        }));
        setLogs(formattedLogs);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
  return (
    <div className="flex w-full h-full">
      {logs.length ? <AllLogsTable data={logs} /> : null}
    </div>
  );
}
