# EventHub

A TypeScript-based backend API powering Gatherly (events/attendance/aggregation). Includes endpoints for events, attendees, and analytics plus database routines (PL/pgSQL) for efficient aggregations.

## Features
- RESTful API for events and attendees
- Aggregation endpoints (trends, counts)
- Pagination and filtering
- Input validation and basic auth-ready structure
- Database functions in PL/pgSQL for performant queries

## Tech stack
- TypeScript (Node.js / Express / Fastify or similar)
- PostgreSQL (with PL/pgSQL functions)
- ORM/Query Builder (Prisma / TypeORM / Knex) — adjust to your choice
- Jest / Vitest for tests

## Getting started

Prerequisites
- Node.js >= 18
- PostgreSQL >= 13
- pnpm / npm / yarn

Install
```bash
npm install
# or
yarn install
```

Environment
Create a .env file with (example):
- DATABASE_URL=postgresql://user:password@localhost:5432/gatherly
- PORT=4000
- JWT_SECRET=your_jwt_secret

Run locally
```bash
# run migrations (if using)
npm run migrate

# start dev server
npm run dev
```

Build & Start
```bash
npm run build
npm start
```

Database
- Run SQL migrations or seed scripts provided in /prisma or /migrations
- If PL/pgSQL functions are included, run them via psql or migration tooling

Example API
- GET /api/events — list events
- GET /api/events/:id — event details
- POST /api/events — create event
- GET /api/analytics/trends?start=YYYY-MM-DD&end=YYYY-MM-DD — aggregated analytics

(Replace endpoints above to match your actual routes.)

## Testing
```bash
npm test
# or
yarn test
```

## Linting & Formatting
```bash
npm run lint
npm run format
```

## Deployment
- Recommended: host on Render, Heroku, Fly, or a Docker container
- Ensure DATABASE_URL and other env vars are set in the deployment environment
- Use connection pooling (pgbouncer) for production PostgreSQL

## Security
- Keep JWT_SECRET and DB credentials out of source control
- Use HTTPS in production
- Harden CORS and rate limiting as needed

## Contributing
- Open issues for bugs or feature requests
- Follow branch naming and commit conventions in CONTRIBUTING.md (optional)

  
## Maintainers / Contact
- GitHub: AKSHATDIGRASKAR
- Email: akshatdigraskar58@gmail.com
