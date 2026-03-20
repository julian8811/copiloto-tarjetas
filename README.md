# 🚀 Copiloto Inteligente de Tarjetas

App móvil de gestión de tarjetas de crédito con IA.

## Despliegue en 4 pasos

### Requisitos
- Node.js 18+
- Git instalado

---

### Paso 1 — Instalar y construir
```bash
npm install
npm run build
```

### Paso 2 — Subir a GitHub
```bash
git init
git add -A
git commit -m "Deploy inicial"
git branch -M main
git remote add origin https://github.com/julian8811/copiloto-tarjetas.git
git push -u origin main
```
> Si pide contraseña: usuario `julian8811`, contraseña `Julian881100`

### Paso 3 — Crear repo en GitHub
Ve a https://github.com/new y crea el repo `copiloto-tarjetas` (público)

### Paso 4 — Desplegar en Vercel
```bash
npx vercel --prod
```
- Cuando pregunte: selecciona "Link to existing project" si ya existe, o crea nuevo
- Scope: `montoya8811-1146`
- Framework: Vite

**O más fácil:** Ve a https://vercel.com/new, importa el repo de GitHub y clic en Deploy.

---

## Desarrollo local
```bash
npm run dev
# Abre http://localhost:5173
```
