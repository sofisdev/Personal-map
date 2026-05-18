# personal-map

A self-hosted interactive 3D identity map that you deploy to your own Vercel instance. Visitors see a dark, glowing force-directed graph of nodes (skills, projects, values, core identity) rendered in WebGL. The owner logs in at `/edit` to add and connect nodes through a live split-panel editor. All data lives in your own Supabase project — no central server, no multi-tenancy.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/personal-map&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_PASSWORD)

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the three migration files in order:
   - `supabase/migrations/001_create_map_config.sql`
   - `supabase/migrations/002_create_nodes.sql`
   - `supabase/migrations/003_create_edges.sql`
3. Copy your **Project URL** and **anon key** from Settings → API.
4. Copy the **service_role key** (keep this secret — server only).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (SELECT only via RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service key — never in client bundle |
| `ADMIN_PASSWORD` | bcrypt hash of your chosen password |

Generate the bcrypt hash:
```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword',12).then(console.log)"
```

## Architecture

```
Browser                    Vercel Edge / Node
─────────                  ──────────────────
/ (viewer)  ──anon key──▶  Supabase (SELECT only, RLS)
/edit       ──cookie──▶    middleware (bcrypt verify)
            ──service──▶   /api/* routes ──▶ Supabase (all ops)
```

```
app/
├── page.tsx              Public 3D viewer
├── edit/page.tsx         Owner editor (cookie-protected)
├── api/
│   ├── nodes/            CRUD nodes
│   ├── edges/            CRUD edges
│   ├── config/           Map config
│   ├── templates/[name]/ Bulk template insert
│   └── og/               Open Graph image
├── middleware.ts         Admin auth
lib/
├── supabase-browser.ts   Anon client (viewer)
├── supabase-server.ts    Service client (API routes only)
└── types.ts
components/
├── GraphViewer.tsx       Three.js canvas + force simulation
├── NodeMesh.tsx          Glowing node spheres
├── EdgeLines.tsx         Connection lines
├── StarField.tsx         Particle background
└── NodeDrawer.tsx        Framer Motion info drawer
supabase/migrations/      SQL schema files
```

## AI workflow

_Fill in after build: describe how Claude was used to scaffold, iterate, and extend this project._

## Local development

```bash
cp .env.example .env.local
# fill in your Supabase credentials and admin password hash
npm install
npm run dev
```
