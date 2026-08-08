# ProjectMind

ProjectMind is a frontend prototype for repository memory: connect a public GitHub repo, index files and recent commits, ask evidence-backed questions, review memories, and run basic impact analysis.

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## OAuth Configuration

Create `.env.local` from `.env.example`:

```env
VITE_GITHUB_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
```

The frontend can launch GitHub/Google OAuth. A production app still needs backend callback routes to securely exchange OAuth codes and access private repositories.

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
