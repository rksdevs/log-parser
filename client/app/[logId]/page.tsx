"use client";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavigation } from "@/context/NavigationContext";
import LogSummaryCards from "@/components/log-summary-cards";
import LogDashboardTableSection from "@/components/log-dashboard-table-section";

const Log = () => {
  const params = useParams();
  const { setEncounterNav, setLogSummary } = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const rawLogId = params?.logId;

    if (typeof rawLogId !== "string") return;

    setLoading(true);

    axios
      .get(`http://localhost:8000/api/logs/${rawLogId}`)
      .then((response) => {
        setEncounterNav(rawLogId, response.data.navigationData);
        setLogSummary(response.data.logSummary);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching navigation data:", error);
        setLoading(false);
      });
  }, [params.logId, setEncounterNav, setLogSummary]);

  if (loading) return <div>Loading....</div>;

  return (
    <div className="flex w-full h-full flex-col gap-4">
      <LogSummaryCards />
      <div className="px-4 lg:px-6">{/* <ChartAreaInteractive /> */}</div>
      {/* <DataTable data={data} /> */}
      <LogDashboardTableSection />
    </div>
  );
};

export default Log;
