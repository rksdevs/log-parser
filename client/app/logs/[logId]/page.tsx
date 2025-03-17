"use client";
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams } from "next/navigation";
// import {
//   useReactTable,
//   getCoreRowModel,
//   flexRender,
//   ColumnDef,
// } from "@tanstack/react-table";
// import { AppSidebar } from "@/components/app-sidebar";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { Separator } from "@/components/ui/separator";
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar";
// import { Swords } from "lucide-react";

// interface Player {
//   class: string;
//   playerDamage: number;
// }

// interface Attempt {
//   boss: string;
//   startTime: string;
//   endTime: string;
//   overallDamage: number;
//   players: Record<string, Player>;
// }

// interface Encounter {
//   [bossName: string]: Attempt[];
// }

// interface FightsData {
//   [encounterName: string]: Encounter;
// }

// interface SidebarItem {
//   encounter: string;
//   url: string;
//   icon: React.ElementType;
//   isActive: boolean;
//   bosses: {
//     name: string;
//     attempts: { name: string; start: string; end: string; url: string }[];
//   }[];
// }

// const EncounterTable: React.FC<{
//   encounterName: string;
//   attempts: Attempt[];
// }> = ({ encounterName, attempts }) => {
//   return (
//     <div className="p-4 border rounded-lg shadow-md">
//       <h2 className="text-xl font-bold mb-4">Encounter: {encounterName}</h2>
//       {attempts.map((attempt, index) => (
//         <AttemptTable key={index} attempt={attempt} attemptNumber={index + 1} />
//       ))}
//     </div>
//   );
// };

// const AttemptTable: React.FC<{ attempt: Attempt; attemptNumber: number }> = ({
//   attempt,
//   attemptNumber,
// }) => {
//   const columns: ColumnDef<{
//     player: string;
//     class: string;
//     damage: number;
//   }>[] = [
//     { accessorKey: "player", header: "Player" },
//     { accessorKey: "class", header: "Class" },
//     { accessorKey: "damage", header: "Damage Dealt" },
//   ];

//   const data = Object.entries(attempt.players).map(([playerName, details]) => ({
//     player: playerName,
//     class: details.class,
//     damage: details.playerDamage,
//   }));

//   const table = useReactTable({
//     data,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <div className="mb-6 border p-4 rounded-lg">
//       <h3 className="text-lg font-semibold mb-2">Attempt {attemptNumber}</h3>
//       <p className="text-sm mb-2">
//         Start: {attempt.startTime} | End: {attempt.endTime}
//       </p>
//       <p className="text-sm font-medium">
//         Total Damage: {attempt.overallDamage}
//       </p>
//       <table className="w-full border-collapse border mt-4">
//         <thead>
//           {table.getHeaderGroups().map((headerGroup) => (
//             <tr key={headerGroup.id}>
//               {headerGroup.headers.map((header) => (
//                 <th key={header.id} className="border px-4 py-2 bg-gray-100">
//                   {flexRender(
//                     header.column.columnDef.header,
//                     header.getContext()
//                   )}
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>
//         <tbody>
//           {table.getRowModel().rows.map((row) => (
//             <tr key={row.id} className="border">
//               {row.getVisibleCells().map((cell) => (
//                 <td key={cell.id} className="border px-4 py-2">
//                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// const FightsTable: React.FC = () => {
//   const [logData, setLogData] = useState<FightsData | null>(null);
//   const { logId } = useParams(); // Get dynamic fightId from URL

//   useEffect(() => {
//     if (!logId) return;
//     axios
//       .get(`http://localhost:8000/api/get-logs/${logId}`) // Fetch data based on dynamic param
//       .then((response) => setLogData(response.data))
//       .catch((error) => console.error("Error fetching log data:", error));
//   }, [logId]);

//   if (!logData) return <p>Loading...</p>;

//   return (
//     <div className="space-y-6">
//       {Object.entries(logData).map(([encounterName, bosses]) =>
//         Object.entries(bosses).map(([bossName, attempts]) => (
//           <EncounterTable
//             key={bossName}
//             encounterName={encounterName}
//             attempts={attempts}
//           />
//         ))
//       )}
//     </div>
//   );
// };

// export default FightsTable;

// const generateSidebarData = (logData: FightsData): SidebarItem[] => {
//   return Object.entries(logData).map(([encounterName, bosses]) => ({
//     encounter: encounterName,
//     url: "#",
//     icon: Swords,
//     isActive: true,
//     bosses: Object.entries(bosses).map(([bossName, attempts]) => ({
//       name: `${bossName} - Heroic`,
//       attempts: attempts.map((attempt, index) => ({
//         name: `Attempt ${index + 1}`,
//         start: attempt.startTime,
//         end: attempt.endTime,
//         url: "#", // Replace with actual navigation URL
//       })),
//     })),
//   }));
// };

// export default function Page() {
//   const [logData, setLogData] = useState<FightsData | null>(null);
//   const [sideBarData, setSideBarData] = useState([]);
//   const { logId } = useParams(); // Get dynamic fightId from URL

//   useEffect(() => {
//     if (!logId) return;
//     axios
//       .get(`http://localhost:8000/api/get-logs/${logId}`) // Fetch data based on dynamic param
//       .then((response) => setLogData(response.data))
//       .catch((error) => console.error("Error fetching log data:", error));
//   }, [logId]);

//   //   useEffect(() => {
//   //     if (!logData) return;
//   //     setSideBarData(generateSidebarData(logData));
//   //   }, [logData]);

//   if (!logData) return <div>Loading....</div>;

//   const sidebarData = generateSidebarData(logData);

//   return (
//     <SidebarProvider>
//       <AppSidebar navItems={sidebarData} />
//       <SidebarInset>
//         <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
//           <div className="flex items-center gap-2 px-4">
//             <SidebarTrigger className="-ml-1" />
//             <Separator orientation="vertical" className="mr-2 h-4" />
//             <Breadcrumb>
//               <BreadcrumbList>
//                 <BreadcrumbItem className="hidden md:block">
//                   <BreadcrumbLink href="#">
//                     Building Your Application
//                   </BreadcrumbLink>
//                 </BreadcrumbItem>
//                 <BreadcrumbSeparator className="hidden md:block" />
//                 <BreadcrumbItem>
//                   <BreadcrumbPage>Data Fetching</BreadcrumbPage>
//                 </BreadcrumbItem>
//               </BreadcrumbList>
//             </Breadcrumb>
//           </div>
//         </header>
//         <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
//           <div className="grid auto-rows-min gap-4 md:grid-cols-3">
//             <div className="aspect-video rounded-xl bg-muted/50" />
//             <div className="aspect-video rounded-xl bg-muted/50" />
//             <div className="aspect-video rounded-xl bg-muted/50" />
//           </div>
//           <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
//         </div>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams } from "next/navigation";
// import { AppSidebar } from "@/components/app-sidebar";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { Separator } from "@/components/ui/separator";
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar";
// import { Swords } from "lucide-react";
// import Encounter from "./[encounter]/page";

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

interface EncounterData {
  [bossName: string]: Attempt[];
}

interface FightsData {
  [encounterName: string]: EncounterData;
}

// interface SidebarItem {
//   encounter: string;
//   url: string;
//   icon: React.ElementType;
//   isActive: boolean;
//   bosses: {
//     name: string;
//     attempts: { name: string; start: string; end: string; url: string }[];
//   }[];
// }

// export default function Page() {
//   const [logData, setLogData] = useState<FightsData | null>(null);
//   const [navigationData, setNavigationData] = useState<SidebarItem[] | null>(
//     []
//   );
//   const { logId } = useParams();

//   useEffect(() => {
//     if (!logId) return;
//     axios
//       .get(`http://localhost:8000/api/logs/${logId}`)
//       .then((response) => {
//         console.log("response from logs/logid api:", response.data);
//         setLogData(response.data.logData);
//         setNavigationData(response.data.navigationData);
//       })
//       .catch((error) => console.error("Error fetching log data:", error));
//   }, [logId]);

//   if (!logData) return <div>Loading...</div>;

//   // const sidebarData = generateSidebarData(logData);

//   return (
//     <SidebarProvider>
//       <AppSidebar navItems={navigationData} />
//       <SidebarInset>
//         <header className="flex h-16 items-center gap-2 px-4">
//           <SidebarTrigger className="-ml-1" />
//           <Separator orientation="vertical" className="mr-2 h-4" />
//           <Breadcrumb>
//             <BreadcrumbList>
//               <BreadcrumbItem>
//                 <BreadcrumbPage>Encounter Overview</BreadcrumbPage>
//               </BreadcrumbItem>
//             </BreadcrumbList>
//           </Breadcrumb>
//         </header>
//         <div className="p-4">
//           <h2 className="text-2xl font-bold">Encounters Summary</h2>
//           {Object.entries(logData).map(([encounterName, bosses]) => (
//             <div
//               key={encounterName}
//               className="mt-6 p-4 border rounded-lg shadow"
//             >
//               <h3 className="text-xl font-semibold">{encounterName}</h3>
//               {Object.entries(bosses).map(([bossName, attempts]) => (
//                 <div key={bossName} className="ml-4 mt-3">
//                   <p className="text-lg font-medium">Boss: {bossName}</p>
//                   <p>Attempts: {attempts.length}</p>
//                   <p>
//                     Players Involved:{" "}
//                     {
//                       new Set(attempts.flatMap((a) => Object.keys(a.players)))
//                         .size
//                     }
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ))}
//         </div>
//         {/* {navigationData && <Encounter data={navigationData} />} */}
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }

import { useParams } from "next/navigation";
import axios from "axios";
import { useEffect, useState } from "react";

const LogPage = () => {
  const { logId } = useParams();
  const [logData, setLogData] = useState<FightsData | null>(null);

  useEffect(() => {
    if (!logId) return;

    axios
      .get(`http://localhost:8000/api/logs/${logId}`)
      .then((response) => setLogData(response.data.logData))
      .catch((error) => console.error("Error fetching log data:", error));
  }, [logId]);

  if (!logData) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold">Encounters Summary</h2>
      {Object.entries(logData).map(([encounterName, bosses]) => (
        <div key={encounterName} className="mt-6 p-4 border rounded-lg shadow">
          <h3 className="text-xl font-semibold">{encounterName}</h3>
          {Object.entries(bosses).map(([bossName, attempts]) => (
            <div key={bossName} className="ml-4 mt-3">
              <p className="text-lg font-medium">Boss: {bossName}</p>
              <p>Attempts: {attempts.length}</p>
              <p>
                Players Involved:{" "}
                {new Set(attempts.flatMap((a) => Object.keys(a.players))).size}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default LogPage;
