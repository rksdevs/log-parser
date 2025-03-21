"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// import data from "./data.json";
import { useEffect, useState } from "react";
import axios from "axios";
interface Log {
  logId: number; // Make sure this matches your Prisma schema
  date: string; // Assuming it's an ISO date string
  players: string[]; // JSON parsed array of players
  uploadStatus: string;
}

export default function Page() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/logs/all-logs")
      .then((res) => {
        // console.log(res.data, "from all logs");
        const formattedLogs: Log[] = res.data.map((log: any) => ({
          logId: log.logId,
          date: log.date, // Assuming this is already an ISO string
          players: log.players, // Convert JSON string to array
          uploadStatus: log.uploadStatus,
        }));
        setLogs(formattedLogs);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
  return (
    <div>
      <div className="flex justify-center">
        <div className="w-full max-w-[75vw] px-4 lg:px-6">
          {logs.length > 0 && <DataTable data={logs} />}
        </div>
      </div>
    </div>
  );
}
