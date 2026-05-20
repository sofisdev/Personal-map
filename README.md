# personal-map

A self-hosted interactive 3D identity map. Open the app, connect your own Supabase project, and build a glowing force-directed graph of the nodes that define you — skills, projects, values, relationships. No sign-up. No central server. Your Supabase credentials live only in your browser tab and vanish when you close it.

## How it works

1. Open the app → **Connect your Supabase** screen
2. Paste your Supabase Project URL + anon key → read-only viewer
3. Also paste the service role key → full editor at `/edit`
4. Close the tab → credentials gone, nothing stored anywhere

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/personal-map)

> No environment variables needed. Just deploy and open.

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the three migration files in order:
   - `supabase/migrations/001_create_map_config.sql`
   - `supabase/migrations/002_create_nodes.sql`
   - `supabase/migrations/003_create_edges.sql`
3. Go to **Settings → API** and copy:
   - **Project URL** → paste as "Project URL" in the app
   - **anon / public** key → paste as "Anon Key"
   - **service_role / secret** key → paste as "Service Role Key" (edit mode only)

## Security model

| What | Where it lives | When it's cleared |
|------|---------------|-------------------|
| Supabase URL | `sessionStorage` | Tab close |
| Anon key | `sessionStorage` | Tab close |
| Service role key | `sessionStorage` | Tab close |

Keys are sent **only** to your own Supabase project over HTTPS. They are never sent to any other server. Closing the browser tab is a complete logout.

The service role key bypasses Supabase RLS — it's the same key you see in your Supabase dashboard. Treat it like a password.

## Architecture

```
Browser tab
├── sessionStorage: { url, anonKey, serviceKey? }
│     ↓ cleared on tab close
├── anonClient  →  Supabase (SELECT, open to anon via RLS)
└── serviceClient → Supabase (all ops, bypasses RLS)

app/
├── page.tsx          Public viewer (ConnectScreen → GraphViewer)
├── edit/page.tsx     Owner editor (requires serviceKey)
lib/
├── session.ts        sessionStorage read/write
├── session-context   React context + useSession hook
├── supabase-session  Dynamic client creation
├── write-ops.ts      All Supabase mutations
├── templates.ts      Developer / Creative / Blank starter data
└── types.ts
components/
├── ConnectScreen     Credential entry UI
├── GraphViewer       Three.js canvas + d3-force-3d + OrbitControls
├── NodeMesh          Glowing spheres
├── EdgeLines         Connection lines
├── StarField         Particle background
└── NodeDrawer        Click-to-open info drawer
supabase/migrations/  SQL schema (run once in your Supabase project)
```

## Local development

```bash
git clone https://github.com/YOUR_USERNAME/personal-map
cd personal-map
npm install
npm run dev
# open http://localhost:3000
# enter your Supabase credentials in the UI
```

## AI workflow

_Fill in after build: describe how Claude was used to scaffold, iterate, and extend this project._
