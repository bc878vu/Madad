# MADAD

A global, safety-first community platform where people can share a need and others can offer practical help.

## Current foundation
- Responsive global community feed
- Create-post flow with category and optional location
- Community actions and local demo state
- Safety-oriented posting notice and review status
- Category exploration
- Responsive mobile layout

## Planned production architecture
- Next.js + TypeScript
- PostgreSQL + Prisma
- Auth and verified-account flows
- Rate limiting, abuse prevention and moderation queues
- Reports, blocks, audit logging and admin controls
- Redis caching and background jobs

## Run locally
```bash
npm install
npm run dev
```

Production secrets must never be committed. Use environment variables and a managed secret store.
