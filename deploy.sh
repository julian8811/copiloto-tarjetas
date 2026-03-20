#!/bin/bash
# ============================================================
#  SCRIPT DE DESPLIEGUE — Copiloto Tarjetas
#  Ejecuta este script en tu computador
# ============================================================

set -e

echo ""
echo "🚀 Iniciando despliegue de Copiloto Tarjetas..."
echo ""

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Build de producción
echo "🔨 Construyendo app..."
npm run build

# 3. Inicializar git si no existe
if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

# 4. Configurar git
git config user.email "julian@copilototarjetas.app"
git config user.name "julian8811"

# 5. Commit
git add -A
git commit -m "🚀 Copiloto Tarjetas v6 - Deploy inicial" 2>/dev/null || echo "Sin cambios nuevos"

# 6. Conectar con GitHub (crea el repo si no existe)
echo ""
echo "📡 Conectando con GitHub..."
GITHUB_USER="julian8811"
REPO_NAME="copiloto-tarjetas"

# Crear repo en GitHub via API
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Copiloto Inteligente de Tarjetas de Crédito\"}" \
  > /dev/null 2>&1 || true

# Push a GitHub
git remote remove origin 2>/dev/null || true
git remote add origin https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git
git push -u origin main --force

echo "✅ Código en GitHub: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

# 7. Deploy en Vercel
echo "▲ Desplegando en Vercel..."
npx vercel --prod --yes \
  --token $VERCEL_TOKEN \
  --scope montoya8811-1146

echo ""
echo "✅ ¡DESPLIEGUE COMPLETADO!"
echo ""
