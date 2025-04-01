"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigation } from "@/context/NavigationContext";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();
  const { logSummary } = useNavigation();
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          Parsed{" "}
          <span className="underline decoration-2">
            Log Id - {logSummary?.logId}
          </span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>
    </header>
  );
}
