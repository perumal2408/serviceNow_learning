import { notFound } from "next/navigation";
import { PlaygroundView } from "@/components/playground/playground-view";

interface PageProps {
  params: Promise<{ snippetSlug: string }>;
}

async function getSnippet(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/lessons/${slug}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps) {
  const { snippetSlug } = await params;
  const data = await getSnippet(snippetSlug);
  return { title: data ? `Practice: ${data.snippet.title}` : "Practice" };
}

export default async function PracticePage({ params }: PageProps) {
  const { snippetSlug } = await params;
  const data = await getSnippet(snippetSlug);
  if (!data?.snippet?.practicePrompt) notFound();
  return <PlaygroundView snippet={data.snippet} />;
}
