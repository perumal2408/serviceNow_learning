import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading dashboard...</div>}>
      <DashboardView />
    </Suspense>
  );
}
