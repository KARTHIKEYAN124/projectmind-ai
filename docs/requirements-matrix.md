# ProjectMind Requirements Matrix

This repo now contains the application surfaces for the requested SaaS architecture. Several requirements still need real third-party credentials or hosted infrastructure to become live in production.

| Requirement | Repo status | Files |
| --- | --- | --- |
| Real GitHub App install flow | API route and env contract added; requires a real GitHub App slug/private key. | `server/src/routes/github.js`, `.env.example` |
| Real GitHub OAuth callback and sessions | Callback route and session issuing added; token exchange must be connected to real secrets. | `server/src/routes/auth.js`, `server/src/security/sessions.js` |
| Google OAuth callback and sessions | Callback route and session issuing added; token exchange must be connected to real secrets. | `server/src/routes/auth.js` |
| Private repo access | Repository connection API accepts installation IDs/private repos; real installation token exchange required. | `server/src/routes/repositories.js`, `server/src/services/github.js` |
| Repository cloning | Index job plan and worker contract added; production clone implementation needs GitHub installation token. | `server/src/services/indexer.js`, `server/worker.js` |
| PostgreSQL database | pgvector schema and Docker Postgres added. | `db/schema.sql`, `docker-compose.yml` |
| pgvector embeddings | `embeddings` table and vector index added; embedding generation worker is the next implementation step. | `db/schema.sql` |
| Redis queue | Docker Redis and queue contract added; current local queue is in-memory until Redis client is wired. | `docker-compose.yml`, `server/src/services/queue.js` |
| Background workers | Worker entry point added. | `server/worker.js` |
| Tree-sitter AST parsing | Parser contract and symbol extraction API added; actual grammar adapters still need installation. | `server/src/services/indexer.js`, `server/src/routes/code.js` |
| Symbol graph extraction | Graph tables and API route added. | `db/schema.sql`, `server/src/routes/code.js` |
| PR/issue ingestion | Tables and webhook job path added; GitHub API fetchers need real installation auth. | `db/schema.sql`, `server/src/routes/webhooks.js` |
| Webhook sync | Signed GitHub webhook route and sync jobs added. | `server/src/routes/webhooks.js` |
| Real memory extraction pipeline | Memory table, candidate creation, status transitions, and contradiction check added. | `server/src/services/memory.js`, `server/src/routes/memory.js` |
| Memory lifecycle | Active/questionable/superseded/deprecated/invalid supported. | `db/schema.sql`, `server/src/routes/memory.js` |
| Contradiction detection | Initial rule-based detection added. | `server/src/services/memory.js` |
| Hybrid retrieval | Keyword + graph hints + confidence scoring implemented in API layer. | `server/src/services/rag.js` |
| Production-grade RAG | Server-side LLM RAG endpoint added; requires provider key and persistent retrieval stores. | `server/src/services/rag.js`, `server/src/routes/chat.js` |
| Organization/workspace/team model | Tables and API routes added. | `db/schema.sql`, `server/src/routes/organizations.js` |
| RBAC, audit logs, encryption, token rotation | RBAC/audit/encryption helpers added; token rotation needs production secret store. | `server/src/security`, `server/src/routes/audit.js` |
| Settings, Changes, Code, Dashboard pages | Frontend has workspace/dashboard shell; backend settings/code routes added. Full route split remains a frontend expansion task. | `src/App.tsx`, `server/src/routes/settings.js`, `server/src/routes/code.js` |
| VS Code extension | Scaffold added. | `apps/vscode-extension` |
| MCP server | Tool contract server added. | `mcp/server.js` |
| Production backend hosting | Railway API and Vercel frontend config added. | `railway.json`, `vercel.json` |
