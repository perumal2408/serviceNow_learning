# ServiceNow Learning Platform

Interactive learning platform for 1000+ ServiceNow snippets, built with Next.js 15.

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (`brew install postgresql@15 && brew services start postgresql@15`)
- Ollama (`brew install ollama && ollama serve`)
- Models: `ollama pull llama3:8b && ollama pull deepseek-coder:6.7b`

### Setup

```bash
# 1. Create database
createdb servicenow_learning

# 2. Push schema
npm run db:push

# 3. Ingest content (parse only, fast - no AI)
npm run ingest:skip-ai

# 4. Or full AI-powered ingestion (8-16hrs for 1000+ snippets)
npm run ingest

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

## Features
- **Roadmap**: React Flow graph (desktop) / accordion tree (tablet) / vertical step list (mobile)
- **Lessons**: AI-generated overview, theory, walkthrough, use cases, mistakes, best practices
- **Practice**: Monaco editor (desktop) + CodeMirror 6 (mobile) + Ollama AI evaluation
- **Dashboard**: Progress rings, category bars, streak tracker, activity feed
- **Auth**: Anonymous-first (no sign-up friction) with optional email/password account
- **PWA**: Installable, offline reading, background sync

## Key Commands
```bash
npm run dev           # Start dev server
npm run db:push       # Push schema to database
npm run db:studio     # Open Prisma Studio
npm run ingest        # Full ingestion with AI content
npm run ingest:skip-ai # Parse only (no Ollama required)
npm run ingest:resume  # Resume interrupted ingestion
```

## Responsive Breakpoints
- Mobile < 768px: Bottom nav + vertical roadmap + collapsible lesson sections
- Tablet 768-1023px: Overlay sidebar + tree roadmap
- Desktop >= 1024px: Fixed sidebar + React Flow graph + 2-column lesson
