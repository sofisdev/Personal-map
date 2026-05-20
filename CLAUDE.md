# CLAUDE.md — personal-map

## Critical constraints

- **No env vars for Supabase credentials.** URL and keys come from `sessionStorage` only, entered by the user at runtime via `ConnectScreen`. Never read `NEXT_PUBLIC_SUPABASE_*` or `SUPABASE_SERVICE_ROLE_KEY` from the environment.
- **No API routes for data.** All Supabase operations run directly from the browser. Do not create `app/api/` routes for node/edge/config mutations.
- **No middleware.** Authentication is the presence of a valid session with a service key. Do not create `middleware.ts`.
- **Service client is browser-side by design.** `createServiceClient` in `lib/supabase-session.ts` runs in the browser. The user supplies their own key; it lives only in their tab's `sessionStorage`. This is intentional.
- **Write helpers take a client argument.** Functions in `lib/write-ops.ts` never import the session context. They receive a `SupabaseClient` from the caller.
- **Do not add Zustand, Redux, or any framework-level state manager.** Local React state + `lib/session-context.tsx` only.
- **Do not split into a monorepo.** One Next.js app, one repo.
- **Three.js canvas touch events** are handled via `OrbitControls` — do not disable touch defaults.
- **The viewer (`/`) is a read path.** It uses the anon client only. It will silently save positions if a service key is present in the session, but it does not require one.

## Architecture

```
app/
  page.tsx          ← viewer (session check → ConnectScreen or GraphViewer)
  edit/page.tsx     ← editor (requires serviceKey in session)
lib/
  session.ts           ← sessionStorage read/write (no React)
  session-context.tsx  ← React context + useSession hook
  supabase-session.ts  ← createAnonClient / createServiceClient
  write-ops.ts         ← all Supabase mutations (take a SupabaseClient arg)
  templates.ts         ← Developer / Creative / Blank template data
  types.ts             ← MapNode, MapEdge, MapConfig, NODE_TYPE_COLORS
components/
  ClientProviders.tsx  ← wraps SessionProvider for layout.tsx
  ConnectScreen.tsx    ← credential entry UI
  GraphViewer.tsx      ← R3F canvas + force sim + OrbitControls + HTML labels
  NodeMesh.tsx         ← glowing sphere
  EdgeLines.tsx        ← semi-transparent lines
  StarField.tsx        ← particle background
  NodeDrawer.tsx       ← Framer Motion side drawer
supabase/
  migrations/
    001_create_map_config.sql
    002_create_nodes.sql
    003_create_edges.sql
```

## Session model

```
sessionStorage['pm_session'] = { url, anonKey, serviceKey? }
  → anonClient  — SELECT only, for viewer and editor data fetch
  → serviceClient — all mutations, editor only (requires serviceKey)
```

Closing the browser tab clears all credentials automatically.

## Dev

```bash
npm install
npm run dev
# Open http://localhost:3000
# Enter your Supabase URL + keys in the ConnectScreen
```
