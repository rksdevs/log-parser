"use client";
import LogDashboardTableSection from "@/components/log-dashboard-table-section";
// import { DamageTimelineChart } from "@/components/full-timeline-chart";

const Log = () => {
  return (
    <div className="flex w-full h-full flex-col gap-4 mt-4">
      {/* <LogSummaryCards /> */}
      {/* <DamageTimelineChart /> */}
      <LogDashboardTableSection />
    </div>
  );
};

export default Log;
