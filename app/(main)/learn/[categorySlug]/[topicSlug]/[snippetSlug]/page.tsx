import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonView } from "@/components/lesson/lesson-view";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    categorySlug: string;
    topicSlug: string;
    snippetSlug: string;
  }>;
}

async function getLessonData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/lessons/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps) {
  const { snippetSlug } = await params;
  const data = await getLessonData(snippetSlug);
  if (!data) return { title: "Lesson Not Found" };
  return {
    title: data.snippet.title,
    description: data.snippet.overview ?? undefined,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { snippetSlug } = await params;
  const data = await getLessonData(snippetSlug);
  if (!data) notFound();

  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading lesson...</div>}>
      <LessonView data={data} />
    </Suspense>
  );
}
