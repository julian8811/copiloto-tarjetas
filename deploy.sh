#!/bin/bash
# Script de despliegue — Copiloto Tarjetas

set -e

echo ""
echo "Iniciando despliegue de Copiloto Tarjetas..."
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: define GITHUB_TOKEN como variable de entorno"
  exit 1
fi

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: define VERCEL_TOKEN como variable de entorno"
  exit 1
fi

echo "Instalando dependencias..."
npm ci

echo "Ejecutando tests..."
npm test

echo "Construyendo app..."
npm run build

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ ! -d ".git" ]; then
  git init
fi

git config user.email "${GIT_USER_EMAIL:-deploy@copilototarjetas.app}"
git config user.name "${GIT_USER_NAME:-copiloto-deploy}"

git add -A
git commit -m "Deploy Copiloto Tarjetas" 2>/dev/null || echo "Sin cambios nuevos"

GITHUB_USER="${GITHUB_USER:-julian8811}"
REPO_NAME="${REPO_NAME:-copiloto-tarjetas}"

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/user/repos" \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Copiloto Inteligente de Tarjetas de Crédito\"}" \
  > /dev/null 2>&1 || true

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo "Subiendo a GitHub (rama $BRANCH)..."
git push -u origin "$BRANCH"

echo "Código en GitHub: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

echo "Desplegando en Vercel..."
npx vercel --prod --yes \
  --token "$VERCEL_TOKEN" \
  --scope "${VERCEL_SCOPE:-montoya8811-1146s-projects}"

echo ""
echo "Despliegue completado."
