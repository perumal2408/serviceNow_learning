import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface SourceFile {
  filename: string;
  content: string;
  language: string;
}

export interface ParsedSnippet {
  title: string;
  slug: string;
  sourcePath: string;
  sourceHash: string;
  sourceReadme: string | null;
  sourceCode: SourceFile[];
}

export interface ParsedTopic {
  name: string;
  slug: string;
  snippets: ParsedSnippet[];
}

export interface ParsedCategory {
  name: string;
  slug: string;
  topics: ParsedTopic[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function getLanguage(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".js": "javascript",
    ".ts": "typescript",
    ".html": "html",
    ".css": "css",
    ".json": "json",
    ".xml": "xml",
    ".py": "python",
    ".md": "markdown",
  };
  return map[ext] ?? "text";
}

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function readSnippetFolder(snippetPath: string, snippetName: string): ParsedSnippet {
  const files = fs.readdirSync(snippetPath);
  let readme: string | null = null;
  const codeFiles: SourceFile[] = [];

  for (const file of files) {
    const filePath = path.join(snippetPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) continue;

    if (file.toLowerCase() === "readme.md") {
      readme = fs.readFileSync(filePath, "utf-8");
    } else {
      const ext = path.extname(file).toLowerCase();
      if ([".js", ".ts", ".html", ".css", ".json", ".xml"].includes(ext)) {
        codeFiles.push({
          filename: file,
          content: fs.readFileSync(filePath, "utf-8"),
          language: getLanguage(file),
        });
      }
    }
  }

  const combinedContent = (readme ?? "") + codeFiles.map((f) => f.content).join("");
  const slug = slugify(snippetName);

  return {
    title: snippetName,
    slug,
    sourcePath: snippetPath,
    sourceHash: hashContent(combinedContent),
    sourceReadme: readme,
    sourceCode: codeFiles,
  };
}

export function parseRepository(repoPath: string): ParsedCategory[] {
  const categories: ParsedCategory[] = [];
  const categoryDirs = fs
    .readdirSync(repoPath)
    .filter((d) => {
      const p = path.join(repoPath, d);
      return fs.statSync(p).isDirectory() && !d.startsWith(".") && !["node_modules", "assets", "pages", ".github"].includes(d);
    })
    .sort();

  for (const categoryName of categoryDirs) {
    const categoryPath = path.join(repoPath, categoryName);
    const topics: ParsedTopic[] = [];

    const topicDirs = fs
      .readdirSync(categoryPath)
      .filter((d) => fs.statSync(path.join(categoryPath, d)).isDirectory())
      .sort();

    for (const topicName of topicDirs) {
      const topicPath = path.join(categoryPath, topicName);
      const snippets: ParsedSnippet[] = [];

      const snippetEntries = fs.readdirSync(topicPath);
      // Check if this is a leaf snippet folder (contains README.md or .js files directly)
      const isLeaf = snippetEntries.some(
        (f) => f.toLowerCase() === "readme.md" || path.extname(f) === ".js"
      );

      if (isLeaf) {
        // The topic IS the snippet folder
        snippets.push(readSnippetFolder(topicPath, topicName));
      } else {
        // sub-directories are individual snippets
        for (const snippetName of snippetEntries.filter((d) =>
          fs.statSync(path.join(topicPath, d)).isDirectory()
        )) {
          const snippetPath = path.join(topicPath, snippetName);
          snippets.push(readSnippetFolder(snippetPath, snippetName));
        }
      }

      if (snippets.length > 0) {
        topics.push({ name: topicName, slug: slugify(topicName), snippets });
      }
    }

    if (topics.length > 0) {
      categories.push({
        name: categoryName,
        slug: slugify(categoryName),
        topics,
      });
    }
  }

  return categories;
}
