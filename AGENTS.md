# Agents

## Cursor Cloud specific instructions

This is a Node.js todolist application (Express backend + vanilla JS frontend).

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Dev server | `npm run dev` | 3000 | Uses `node --watch` for auto-restart on file changes |

### Key commands

- **Dev server:** `npm run dev` (runs on port 3000, auto-restarts on changes)
- **Lint:** `npm run lint` (ESLint on `src/`)
- **Tests:** `npm test` (Jest with supertest for API testing)
- **Production start:** `npm start`

### Architecture

- `src/app.js` — Express app with REST API (`/api/todos` CRUD endpoints)
- `src/server.js` — Server entry point (listens on PORT env var or 3000)
- `public/index.html` — Single-page frontend (vanilla JS)
- `__tests__/todos.test.js` — API integration tests using supertest
- `eslint.config.js` — ESLint flat config (v9+)

### Notes

- In-memory data store; todos reset on server restart.
- The `node --watch` flag (Node 22+) is used instead of nodemon for dev mode.
- Tests use `--forceExit` because supertest leaves Express connections open.
