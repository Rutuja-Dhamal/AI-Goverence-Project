# Aegis AI Governance

Aegis is an end-to-end AI governance platform for registering AI systems, assessing risk, tracking policy controls, managing review actions and incidents, and storing audit evidence. The dashboard is configured for **Rutuja Dhamal** as the **Main admin**.

![Aegis AI Governance dashboard](public/og.png)

## What is included

- Executive governance dashboard with risk, compliance, control, review, and incident metrics
- AI system inventory with ownership, model, purpose, framework, lifecycle, and risk classification
- On-demand governance assessments and score history
- Policy and control-coverage tracking across NIST AI RMF, ISO/IEC 42001, and EU AI Act mappings
- Review queue with open, in-progress, and completed workflow states
- Incident reporting and resolution workflow
- Evidence vault backed by Cloudflare R2 with file type, size, and signature validation
- Cloudflare Worker API, D1 relational database, R2 object storage, responsive React frontend, tests, and CI

## Technology stack

- **Frontend:** React 19, TypeScript, Vite, Lucide icons, responsive CSS
- **Backend:** Cloudflare Workers with typed REST-style endpoints
- **Data:** Cloudflare D1 (SQLite) and R2 object storage
- **Quality:** ESLint, TypeScript strict mode, Node test runner, GitHub Actions

## Architecture

```text
React dashboard
     │
     ├── /api/governance ── Cloudflare Worker ── D1 database
     │
     └── /api/evidence   ── Cloudflare Worker ── R2 evidence bucket
```

The Worker serves both the compiled SPA and API. On a fresh local database it creates the schema and loads safe demonstration data automatically. SQL migrations are also kept in `drizzle/` for controlled deployments.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local Cloudflare emulation stores development data under `.wrangler/`, which is ignored by Git.

Verification commands:

```bash
npm run lint
npm test
npm run build
```

## Deploy to Cloudflare

1. Sign in to Cloudflare with `npx wrangler login`.
2. Create D1 and R2 resources:

   ```bash
   npx wrangler d1 create aegis-governance-db
   npx wrangler r2 bucket create aegis-governance-evidence
   ```

3. Replace the placeholder D1 `database_id` in `wrangler.jsonc` with the ID returned by Cloudflare.
4. Apply the migration and deploy:

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

5. Configure an identity-aware proxy or authenticated platform headers before enabling production write access. Local development permits writes only from localhost; production changes require trusted authenticated-user headers.

## Put the project on GitHub

Create an empty repository on your personal GitHub account, then run from this folder:

```bash
git init
git add .
git commit -m "Build end-to-end Aegis AI governance platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/aegis-ai-governance.git
git push -u origin main
```

Do not commit `.dev.vars`, `.env`, `.wrangler/`, Cloudflare credentials, or exported production evidence.

## Security choices

- Parameterized SQL is used for all user-controlled database values.
- State-changing requests enforce same-origin checks, JSON payload limits, validation, and allowlisted enums.
- Evidence is limited to approved formats and 10 MB, checked against file signatures, renamed with opaque object keys, and served with `nosniff` and private caching.
- Production writes and evidence downloads require authenticated platform headers; localhost receives a demo identity for development.
- Responses include CSP, frame protection, referrer, permissions, content-type, and HTTPS transport headers.
- The repository contains no secrets, private keys, passwords, or production data.

<img width="2850" height="1618" alt="image" src="https://github.com/user-attachments/assets/ad77f5f0-2f67-4167-a791-fd9726a20157" />

<img width="2831" height="1537" alt="image" src="https://github.com/user-attachments/assets/676788ba-876f-4049-9bb7-8809947c3a62" />

<img width="2352" height="1528" alt="image" src="https://github.com/user-attachments/assets/6d4fe390-be78-41f1-ad7d-5f2d7f16d5d3" />

