# Production Credentials

Real provider credentials must stay outside git. This repo includes `.env.production.example` for hosted environments and `npm run setup:secrets` for safe local secret generation.

## Local Secret Bootstrap

Run:

```bash
npm run setup:secrets
```

This creates or updates `.env.local`, which is ignored by git. It generates:

- `SECRET_ENCRYPTION_KEY`
- `GITHUB_WEBHOOK_SECRET`

It intentionally leaves GitHub, Google, and LLM provider credentials blank because those must come from your provider accounts.

## GitHub App Credentials

Create a GitHub App for ProjectMind and configure:

```env
GITHUB_APP_ID=
GITHUB_APP_SLUG=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
VITE_GITHUB_CLIENT_ID=
```

Set these callback URLs in GitHub:

```text
https://api.your-projectmind-domain.com/api/auth/github/callback
https://api.your-projectmind-domain.com/api/github/app/callback
```

Set the webhook URL:

```text
https://api.your-projectmind-domain.com/api/webhooks/github
```

Required permissions:

- Repository metadata: read
- Contents: read
- Pull requests: read
- Issues: read
- Commit statuses: read
- Actions: optional
- Discussions: optional

Webhook events:

- `push`
- `pull_request`
- `issues`
- `issue_comment`
- `pull_request_review`
- `repository`

## Google OAuth Credentials

Create a Google OAuth client and configure:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_GOOGLE_CLIENT_ID=
```

Set the callback URL:

```text
https://api.your-projectmind-domain.com/api/auth/google/callback
```

## Provider LLM Key

The default provider is Groq because it exposes an OpenAI-compatible API:

```env
FREE_LLM_API_KEY=
FREE_LLM_BASE_URL=https://api.groq.com/openai/v1
FREE_LLM_MODEL=llama-3.3-70b-versatile
EMBEDDING_API_KEY=
EMBEDDING_BASE_URL=
EMBEDDING_MODEL=
```

Get your own key from:

```text
https://console.groq.com/keys
```

## Postgres And Redis

For local development:

```bash
docker compose up postgres redis
```

For production, set:

```env
DATABASE_URL=
REDIS_URL=
```

Use a Postgres deployment with `pgvector` enabled. Railway, Supabase, Neon, or another managed Postgres provider can work if `vector` is available.

## Production Host URLs

Set:

```env
PUBLIC_WEB_URL=https://your-projectmind-domain.com
PUBLIC_API_URL=https://api.your-projectmind-domain.com
VITE_API_BASE_URL=https://api.your-projectmind-domain.com
WEB_ORIGIN=https://your-projectmind-domain.com
```

Recommended deployment split:

- Frontend: Vercel or GitHub Pages
- Backend API: Railway
- Postgres: Railway/Supabase/Neon with pgvector
- Redis: Railway/Upstash

## Validation

After filling `.env.local` locally or hosted environment variables in production, run:

```bash
npm run validate:config
```

The validator reports missing variable names without printing secret values.
