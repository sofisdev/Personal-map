# CLAUDE.md — personal-map

## Critical constraints

- **Never import `SUPABASE_SERVICE_ROLE_KEY` in any client component or page.**
  It must only appear in `lib/supabase-server.ts` and server-side API routes.
- **Never expose the service role key via `NEXT_PUBLIC_*` variables.**
- **The viewer (`/`) is a pure read path** — no auth, no cookies, only Supabase anon SELECT via RLS.
- **API routes must verify the admin cookie** before performing any write operation.
- **Do not add Zustand, Redux, or any framework-level state manager.** Local React state only (V1).
- **Do not split into a monorepo.** One Next.js app, one repo.
- Three.js canvas touch events are handled via `OrbitControls` — do not disable touch defaults.

## Architecture

```
app/
  page.tsx          ← public viewer (SSR-safe, dynamic import for Three.js)
  edit/page.tsx     ← password-protected editor
  api/
    nodes/route.ts          POST create, PATCH/DELETE by id
    nodes/positions/route.ts  PATCH bulk, DELETE reset
    edges/route.ts          POST create, DELETE by id
    config/route.ts         PATCH map_config
    templates/[name]/route.ts POST bulk insert
    og/route.ts             GET open graph image
  middleware.ts     ← bcrypt cookie check for /edit and /api/*
lib/
  supabase-browser.ts  ← anon client (client components only)
  supabase-server.ts   ← service role client (API routes only)
  types.ts
components/
  GraphViewer.tsx   ← Canvas + force sim + OrbitControls
  NodeMesh.tsx      ← glowing sphere + label
  EdgeLines.tsx     ← semi-transparent lines
  StarField.tsx     ← instanced stars background
  NodeDrawer.tsx    ← Framer Motion side drawer on node click
supabase/
  migrations/
    001_create_map_config.sql
    002_create_nodes.sql
    003_create_edges.sql
```

## Supabase clients

| File | Key used | Used in |
|------|----------|---------|
| `lib/supabase-browser.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client components, viewer |
| `lib/supabase-server.ts` | `SUPABASE_SERVICE_ROLE_KEY` | API routes only |

## Dev

```bash
cp .env.example .env.local  # fill in your Supabase + admin password
npm run dev
```
