# ProjectMind Requirements Matrix

This repo now contains the application surfaces for the requested SaaS architecture. Several requirements still need real third-party credentials or hosted infrastructure to become live in production.

| Requirement | Repo status | Files |
| --- | --- | --- |
| Real GitHub App install flow | Install route, callback route, App JWT signing, installation token creation, and installation repository listing implemented. Requires real GitHub App credentials. | `server/src/routes/github.js`, `server/src/services/github.js`, `.env.example` |
| Real GitHub OAuth callback and sessions | Real GitHub code-to-token exchange, user lookup, email lookup, DB upsert, and session issuing implemented. Requires real OAuth credentials. | `server/src/routes/auth.js`, `server/src/services/github.js`, `server/src/security/sessions.js` |
| Google OAuth callback and sessions | Real Google token exchange, userinfo lookup, DB upsert, and session issuing implemented. Requires real OAuth credentials. | `server/src/routes/auth.js`, `server/src/services/github.js` |
| Private repo access | Repository connection API creates GitHub installation tokens for private repos and passes tokens to clone/index jobs. Requires installed GitHub App. | `server/src/routes/repositories.js`, `server/src/services/github.js` |
| Repository cloning | Worker can clone repositories with installation tokens, scan files, extract symbols, persist files/symbols, optionally create embeddings, and ingest history. | `server/src/services/indexer.js`, `server/worker.js` |
| PostgreSQL database | pgvector schema and Docker Postgres added. | `db/schema.sql`, `docker-compose.yml` |
| pgvector embeddings | `embeddings` table/vector index added and indexing worker can call a configured embedding API and persist vectors. Requires embedding provider credentials. | `db/schema.sql`, `server/src/services/indexer.js`, `server/src/services/db.js` |
| Redis queue | BullMQ/Redis queue implemented with in-memory fallback for local no-Redis mode. | `docker-compose.yml`, `server/src/services/queue.js` |
| Background workers | Worker processes Redis jobs when `REDIS_URL` exists and local jobs otherwise. | `server/worker.js` |
| Tree-sitter AST parsing | Parser contract and symbol extraction API added; actual grammar adapters still need installation. | `server/src/services/indexer.js`, `server/src/routes/code.js` |
| Symbol graph extraction | Graph tables and API route added. | `db/schema.sql`, `server/src/routes/code.js` |
| PR/issue ingestion | GitHub commit, PR, and issue fetchers and Postgres persistence implemented. Requires installation token. | `db/schema.sql`, `server/src/services/github.js`, `server/src/services/db.js` |
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
