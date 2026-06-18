# Copiloto Inteligente de Tarjetas

App móvil de gestión de tarjetas de crédito con IA, analítica y copiloto financiero.

**Producción:** https://copiloto-tarjetas.vercel.app

## Requisitos

- Node.js 18+
- npm

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Edita .env.local y agrega GROQ_API_KEY para el copiloto IA
npm run dev
```

Abre http://localhost:5173

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GROQ_API_KEY` | Para copiloto IA | API key de Groq (solo server-side) |
| `VITE_BASE_PATH` | No | `/` para Vercel, `/copiloto-tarjetas/` para GitHub Pages |
| `VITE_SUPABASE_URL` | Para sync multi-dispositivo | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Para sync multi-dispositivo | Anon key de Supabase |

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm test         # Tests unitarios
```

## Despliegue en Vercel

Proyecto: `montoya8811-1146s-projects/copiloto-tarjetas`

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new) o usa el workflow de GitHub Actions
2. Framework: Vite
3. Agrega `GROQ_API_KEY` en Environment Variables (Production + Preview)
4. En GitHub → Settings → Secrets → Actions, configura:
   - `VERCEL_TOKEN` — token de Vercel
   - `GROQ_API_KEY` — API key de Groq para el copiloto
5. Asegúrate de que la protección SSO del proyecto solo aplique a **Preview** (no a Production), para que el sitio sea público

Deploy manual:

```bash
export VERCEL_TOKEN=tu_token
npx vercel --prod --scope montoya8811-1146s-projects
```

## Supabase (opcional)

Para autenticación y sincronización multi-dispositivo:

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta la migración en `supabase/migrations/001_initial_schema.sql`
3. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

## GitHub Pages (subpath)

```bash
VITE_BASE_PATH=/copiloto-tarjetas/ npm run build
```

Despliega el contenido de `dist/` en la rama `gh-pages`.
