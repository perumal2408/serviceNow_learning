import type { Difficulty } from "@prisma/client";
import type { SourceFile } from "./parser";

interface ClassificationInput {
  category: string;
  topic: string;
  codeFiles: SourceFile[];
  readme: string | null;
}

// Heuristic difficulty classification based on code and category signals
export function classifyDifficulty(input: ClassificationInput): Difficulty {
  const { category, topic, codeFiles, readme } = input;

  let score = 0;

  // Category-level signals
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("integration")) score += 2;
  if (categoryLower.includes("modern")) score += 1;
  if (categoryLower.includes("specialized")) score += 1;
  if (categoryLower.includes("client")) score += 0;
  if (categoryLower.includes("server")) score += 1;

  // Topic-level signals
  const topicLower = topic.toLowerCase();
  if (topicLower.includes("glideaggregate")) score += 2;
  if (topicLower.includes("restmessage") || topicLower.includes("rest")) score += 2;
  if (topicLower.includes("graphql")) score += 3;
  if (topicLower.includes("scripted rest")) score += 3;
  if (topicLower.includes("transform")) score += 2;
  if (topicLower.includes("mid server")) score += 3;
  if (topicLower.includes("atf")) score += 2;
  if (topicLower.includes("performance analytics")) score += 2;
  if (topicLower.includes("gliderecord")) score += 0;
  if (topicLower.includes("script include")) score += 1;

  // Code complexity signals
  const allCode = codeFiles.map((f) => f.content).join("\n");
  const loc = allCode.split("\n").length;
  if (loc > 100) score += 2;
  else if (loc > 50) score += 1;

  // Nesting depth (count max indentation level)
  const lines = allCode.split("\n");
  const maxIndent = Math.max(...lines.map((l) => (l.match(/^\s+/)?.[0].length ?? 0) / 2));
  if (maxIndent > 5) score += 2;
  else if (maxIndent > 3) score += 1;

  // Advanced API usage signals
  const advancedApis = [
    "GlideQuery", "GlideHTTPRequest", "RESTMessageV2", "SOAPMessageV2",
    "AbstractAjaxProcessor", "GlideFilter", "GlideJsonPath", "XMLDocument2",
  ];
  for (const api of advancedApis) {
    if (allCode.includes(api)) score += 1;
  }

  // readme mentions "prerequisite" or "advanced" or "enterprise"
  if (readme?.toLowerCase().includes("prerequisite")) score += 1;
  if (readme?.toLowerCase().includes("advanced")) score += 1;
  if (readme?.toLowerCase().includes("enterprise")) score += 1;

  if (score >= 8) return "EXPERT";
  if (score >= 5) return "ADVANCED";
  if (score >= 2) return "INTERMEDIATE";
  return "BEGINNER";
}

export function estimateMinutes(codeFiles: SourceFile[], readme: string | null): number {
  const allContent = (readme ?? "") + codeFiles.map((f) => f.content).join("");
  const wordCount = allContent.split(/\s+/).length;
  // ~200 words/min reading, plus 5 min baseline for code study
  const readingMinutes = Math.ceil(wordCount / 200);
  return Math.max(5, Math.min(60, readingMinutes + 5));
}
