"use client";
import { Separator } from "@/components/ui/separator";
import { ChartBarBig } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();

  const handleNavigation = (e: string) => {
    router.push(e);
  };
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-slate-300">
          <Link href="/">
            <ChartBarBig className="size-6 hover:text-secondary-foreground" />
          </Link>
        </div>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex gap-4 justify-center items-center">
          <Button className="" onClick={() => handleNavigation(`/all-logs`)}>
            All Logs
          </Button>
          <Button className="" onClick={() => handleNavigation(`/`)}>
            Upload Log
          </Button>
        </div>
      </div>
    </header>
  );
}
