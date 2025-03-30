"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { NavMain } from "@/components/nav-main";

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logId } = useParams(); // Extract logId dynamically
  const [navigationData, setNavigationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!logId) return;

    // Fetch navigation data after logId is available
    axios
      .get(`http://localhost:8000/api/logs/${logId}`)
      .then((response) => {
        setNavigationData(response.data.navigationData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching navigation data:", error);
        setLoading(false);
      });
  }, [logId]);

  return (
    <SidebarProvider className="z-0 inset-y-10">
      <div className="flex w-full">
        {loading ? (
          <div className="w-64 h-screen flex items-center justify-center">
            <p>Loading Sidebar...</p>
          </div>
        ) : (
          <NavMain items={navigationData} />
        )}

        <SidebarInset className="w-full">
          <header className="flex h-16 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Encounter Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
