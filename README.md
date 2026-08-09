# ProjectMind

ProjectMind is a frontend prototype for repository memory: connect a public GitHub repo, index files and recent commits, ask evidence-backed questions, review memories, and run basic impact analysis.

## Local Development

```bash
npm install
npm run api
npm run dev
```

Run the API and Vite app in two terminals. Open the local URL printed by Vite, usually `http://localhost:5173`.

## Free LLM Provider

ProjectMind can use any OpenAI-compatible free LLM provider. The default configuration targets Groq because the free LLM directory recommends it as a no-credit-card option and Groq exposes an OpenAI-compatible chat API.

Create `.env.local` from `.env.example`, then add your own provider key:

```env
FREE_LLM_API_KEY=
FREE_LLM_BASE_URL=https://api.groq.com/openai/v1
FREE_LLM_MODEL=llama-3.3-70b-versatile
```

Get a Groq key from:

```text
https://console.groq.com/keys
```

The browser never receives this key. The React app calls the local API route `POST /api/chat`, and the server sends the request to the configured provider. If no key is configured, the workspace chatbot falls back to local repository evidence ranking and public web summaries.

## OAuth Configuration

The frontend can launch GitHub/Google OAuth. Add these values to `.env.local`:

```env
VITE_GITHUB_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
```

A production app still needs backend callback routes to securely exchange OAuth codes and access private repositories.

## GitHub Pages Hosting

This repo includes `.github/workflows/deploy-pages.yml`.

On every push to `main`, GitHub Actions builds the app and deploys `dist` to GitHub Pages. The default project URL will be:

```text
https://karthikeyan124.github.io/projectmind-ai/
```

If the workflow asks for Pages setup, open the GitHub repo settings:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

## DigitalPlat FreeDomain

DigitalPlat FreeDomain provides free domains/DNS, not application hosting. Use GitHub Pages for hosting, then point your DigitalPlat domain/subdomain to the GitHub Pages site from the DigitalPlat dashboard.

For a custom domain, configure DNS in DigitalPlat and add the same domain in:

```text
GitHub repo -> Settings -> Pages -> Custom domain
```
