import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RoadmapAdapter } from "@/components/roadmap/roadmap-adapter";

export const metadata = { title: "Learning Roadmap" };
export const revalidate = 3600;

async function getRoadmapData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/roadmap`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export default async function RoadmapPage() {
  const data = await getRoadmapData();
  if (!data) notFound();

  return (
    <div className="h-full">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl font-bold">Learning Roadmap</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Navigate your ServiceNow learning journey — {data.length} categories,{" "}
          {data.reduce((acc: number, c: { topics: { snippets: unknown[] }[] }) =>
            acc + c.topics.reduce((a: number, t) => a + t.snippets.length, 0), 0
          )}{" "}
          lessons
        </p>
      </div>
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading roadmap...</div>}>
        <RoadmapAdapter categories={data} />
      </Suspense>
    </div>
  );
}
