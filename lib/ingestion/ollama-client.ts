const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const PROSE_MODEL = process.env.OLLAMA_MODEL_PROSE ?? "llama3:8b";
const CODE_MODEL = process.env.OLLAMA_MODEL_CODE ?? "deepseek-coder:6.7b";

export interface LessonContent {
  overview: string;
  theory: string;
  walkthrough: string;
  useCases: string;
  commonMistakes: string;
  bestPractices: string;
  practicePrompt: string;
  practiceSolution: string;
}

export interface EvaluationResult {
  totalScore: number;
  scores: {
    logic: number;
    apiUsage: number;
    concept: number;
    quality: number;
  };
  feedback: string;
  improvements: string[];
  mistakes: string[];
  alternativeSolution?: string;
}

async function ollamaGenerate(model: string, prompt: string, timeoutMs = 120_000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.response as string;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJSON<T>(raw: string): T {
  // Try to extract JSON from the response (model may include extra text)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]) as T;
}

export async function generateLessonContent(
  category: string,
  topic: string,
  title: string,
  readme: string | null,
  codeFiles: { filename: string; content: string }[]
): Promise<LessonContent> {
  const codeSection = codeFiles
    .map((f) => `// ${f.filename}\n${f.content}`)
    .join("\n\n");

  const prompt = `You are an expert ServiceNow development instructor creating structured lesson content.

Category: ${category}
Topic: ${topic}
Snippet Title: ${title}

README:
${readme ?? "(no README provided)"}

Code:
\`\`\`javascript
${codeSection || "(no code file provided)"}
\`\`\`

Generate a JSON object with these EXACT fields (all strings):
{
  "overview": "2-3 sentence plain English summary for a learner",
  "theory": "Conceptual explanation: what is this, why does it matter, when should you use it (2-3 paragraphs)",
  "walkthrough": "Line-by-line explanation of the CODE above, referencing specific lines/functions",
  "useCases": "2-3 concrete real-world ServiceNow use cases where this pattern applies",
  "commonMistakes": "2-3 common mistakes developers make with this concept and how to avoid them",
  "bestPractices": "2-3 best practices and recommendations when using this pattern",
  "practicePrompt": "An exercise that asks the learner to write code using this concept (be specific)",
  "practiceSolution": "A reference solution for the exercise above (valid ServiceNow JavaScript)"
}

Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`;

  const raw = await ollamaGenerate(PROSE_MODEL, prompt, 180_000);
  return extractJSON<LessonContent>(raw);
}

export async function evaluateCode(
  practicePrompt: string,
  practiceSolution: string,
  userCode: string
): Promise<EvaluationResult> {
  const prompt = `You are a ServiceNow code evaluator. Score and provide feedback.

Exercise:
${practicePrompt}

Reference Solution:
\`\`\`javascript
${practiceSolution}
\`\`\`

Student Code:
\`\`\`javascript
${userCode}
\`\`\`

Evaluate the student's code and return ONLY this JSON (no extra text):
{
  "totalScore": <number 0-100>,
  "scores": {
    "logic": <0-25, correctness of logic>,
    "apiUsage": <0-25, correct ServiceNow API usage>,
    "concept": <0-25, demonstrates understanding of the concept>,
    "quality": <0-25, code quality, readability, error handling>
  },
  "feedback": "<2-3 sentence overall feedback>",
  "improvements": ["<specific suggestion 1>", "<specific suggestion 2>"],
  "mistakes": ["<mistake 1 if any>"],
  "alternativeSolution": "<optional: a cleaner approach if applicable>"
}`;

  const raw = await ollamaGenerate(CODE_MODEL, prompt, 60_000);
  return extractJSON<EvaluationResult>(raw);
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
