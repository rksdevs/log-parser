// "use client";

// import {
//   ChevronRight,
//   ListFilter,
//   Swords,
//   type LucideIcon,
// } from "lucide-react";

// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import {
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
// } from "@/components/ui/sidebar";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// interface SidebarItem {
//   encounter: string;
//   url: string;
//   icon?: LucideIcon;
//   isActive?: boolean;
//   bosses: {
//     name: string;
//     attempts: { name: string; start: string; end: string; url: string }[];
//   }[];
// }

// export function NavMain({ items }: { items?: SidebarItem[] }) {
//   const navItems = Array.isArray(items) ? items : []; // Ensure items is always an array
//   const pathname = usePathname();
//   const logId = pathname.split("/")[2]; // Extract logId dynamically

//   return (
//     <SidebarGroup>
//       <SidebarGroupLabel>Encounters</SidebarGroupLabel>
//       <SidebarMenu>
//         {navItems.map((encounter) => {
//           const encounterSlug = encounter.encounter
//             .toLowerCase()
//             .replace(/\s+/g, "-");
//           return (
//             <Collapsible key={encounter.encounter} className="group">
//               <CollapsibleTrigger asChild>
//                 <SidebarMenuButton
//                   tooltip={encounter.encounter}
//                   className="flex items-center w-full"
//                 >
//                   {/* {encounter.icon && <encounter.icon />}
//                    */}
//                   <Swords />
//                   <span>{encounter.encounter}</span>
//                   <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90" />
//                 </SidebarMenuButton>
//               </CollapsibleTrigger>
//               <CollapsibleContent>
//                 <SidebarMenuSub>
//                   {encounter.bosses.map((boss) => {
//                     const bossSlug = boss.name
//                       .toLowerCase()
//                       .replace(/\s+/g, "-");
//                     return (
//                       <Collapsible key={boss.name} className="group">
//                         <CollapsibleTrigger asChild>
//                           <SidebarMenuSubButton className="flex items-center w-full">
//                             <Link href={`/logs/${logId}/${encounterSlug}`}>
//                               <span>{boss.name}</span>
//                               <ListFilter className="ml-auto" />
//                             </Link>
//                           </SidebarMenuSubButton>
//                         </CollapsibleTrigger>
//                         <CollapsibleContent>
//                           <SidebarMenuSub>
//                             {boss.attempts.map((attempt) => {
//                               const attemptSlug = attempt.name
//                                 .toLowerCase()
//                                 .replace(/\s+/g, "-");
//                               return (
//                                 <SidebarMenuSubItem key={attempt.name}>
//                                   <SidebarMenuSubButton asChild>
//                                     <Link
//                                       href={`/logs/${logId}/${encounterSlug}/${attemptSlug}`}
//                                     >
//                                       <span>
//                                         {attempt.name} ({attempt.start} -{" "}
//                                         {attempt.end})
//                                       </span>
//                                     </Link>
//                                   </SidebarMenuSubButton>
//                                 </SidebarMenuSubItem>
//                               );
//                             })}
//                           </SidebarMenuSub>
//                         </CollapsibleContent>
//                       </Collapsible>
//                     );
//                   })}
//                 </SidebarMenuSub>
//               </CollapsibleContent>
//             </Collapsible>
//           );
//         })}
//       </SidebarMenu>
//     </SidebarGroup>
//   );
// }

// "use client";

// import {
//   ChevronRight,
//   ListFilter,
//   Swords,
//   type LucideIcon,
// } from "lucide-react";

// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import {
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
// } from "@/components/ui/sidebar";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// interface SidebarItem {
//   encounter: string;
//   url: string;
//   icon?: LucideIcon;
//   isActive?: boolean;
//   bosses: {
//     name: string;
//     attempts: { name: string; start: string; end: string; url: string }[];
//   }[];
// }

// export function NavMain({ items }: { items?: SidebarItem[] }) {
//   const navItems = Array.isArray(items) ? items : []; // Ensure items is always an array
//   const pathname = usePathname();
//   const logId = pathname.split("/")[2]; // Extract logId dynamically

//   return (
//     <SidebarGroup>
//       <SidebarGroupLabel>Encounters</SidebarGroupLabel>
//       <SidebarMenu>
//         {navItems.map((encounter) => {
//           // const encounterSlug = encounter.encounter
//           //   .toLowerCase()
//           //   .replace(/\s+/g, "-");
//           const encounterSlug = encounter.encounter;

//           return (
//             <Collapsible key={encounter.encounter} className="group">
//               <CollapsibleTrigger asChild>
//                 <Link href={`/logs/${logId}/encounters/${encounterSlug}`}>
//                   <SidebarMenuButton
//                     tooltip={encounter.encounter}
//                     className="flex items-center w-full"
//                   >
//                     <Swords />
//                     <span>{encounter.encounter}</span>
//                     <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90" />
//                   </SidebarMenuButton>
//                 </Link>
//               </CollapsibleTrigger>

//               <CollapsibleContent>
//                 <SidebarMenuSub>
//                   {encounter.bosses.map((boss) => {
//                     const bossSlug = boss.name
//                       .toLowerCase()
//                       .replace(/\s+/g, "-");
//                     return (
//                       <Collapsible key={boss.name} className="group">
//                         <CollapsibleTrigger asChild>
//                           <SidebarMenuSubButton className="flex items-center w-full">
//                             <span>{boss.name}</span>
//                             <ListFilter className="ml-auto" />
//                           </SidebarMenuSubButton>
//                         </CollapsibleTrigger>
//                         <CollapsibleContent>
//                           {/* <SidebarMenuSub>
//                             {boss.attempts.map((attempt) => {
//                               const attemptSlug = attempt.name
//                                 .toLowerCase()
//                                 .replace(/\s+/g, "-");
//                               return (
//                                 <SidebarMenuSubItem key={attempt.name}>
//                                   <SidebarMenuSubButton asChild>
//                                     <Link
//                                       href={`/logs/${logId}/encounters/${encounterSlug}/attempts/${attemptSlug}`}
//                                     >
//                                       <span>
//                                         {attempt.name} ({attempt.start} -{" "}
//                                         {attempt.end})
//                                       </span>
//                                     </Link>
//                                   </SidebarMenuSubButton>
//                                 </SidebarMenuSubItem>
//                               );
//                             })}
//                           </SidebarMenuSub> */}
//                         </CollapsibleContent>
//                       </Collapsible>
//                     );
//                   })}
//                 </SidebarMenuSub>
//               </CollapsibleContent>
//             </Collapsible>
//           );
//         })}
//       </SidebarMenu>
//     </SidebarGroup>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  encounter: string;
  url: string;
  bosses: {
    name: string;
    attempts: { name: string; start: string; end: string; url: string }[];
  }[];
}

export function NavMain({ items }: { items?: SidebarItem[] }) {
  const navItems = Array.isArray(items) ? items : []; // Ensure items is always an array
  const pathname = usePathname();
  const logId = pathname.split("/")[2]; // Extract logId dynamically

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Encounters</h2>
      <ul className="list-none">
        {navItems.map((encounter) => {
          const encounterSlug = encodeURIComponent(encounter.encounter);

          return (
            <li key={encounter.encounter} className="mt-4">
              {/* Encounter Link */}
              <Link
                href={encounter.url}
                className="text-lg font-semibold text-blue-500 hover:underline"
              >
                {encounter.encounter}
              </Link>

              {/* Attempt List */}
              <ul className="ml-4 mt-2 list-disc">
                {encounter.bosses.flatMap((boss) =>
                  boss.attempts.map((attempt) => {
                    const attemptSlug = encodeURIComponent(attempt.start);

                    return (
                      <li key={attempt.name} className="mt-1">
                        <Link
                          href={attempt.url}
                          className="text-blue-400 hover:underline"
                        >
                          {attempt.name}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
