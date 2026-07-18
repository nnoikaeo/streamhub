#!/usr/bin/env bash
# deploy-hosting.sh — build and deploy Firebase Hosting from local machine
# Requires .env.local with NUXT_PUBLIC_* vars
# Usage: bash scripts/deploy-hosting.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV_FILE="$ROOT/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.local not found. Create it with NUXT_PUBLIC_* vars."
  exit 1
fi

# Load only NUXT_PUBLIC_* vars (safe for files with JSON values like GOOGLE_SERVICE_ACCOUNT_KEY)
while IFS='=' read -r key value; do
  [[ "$key" =~ ^NUXT_PUBLIC_ ]] && export "$key=$value"
done < <(grep "^NUXT_PUBLIC_" "$ENV_FILE")

export NUXT_PUBLIC_USE_FIRESTORE=true
export NUXT_PUBLIC_USE_JSON_MOCK=false

cd "$ROOT"

echo "🔨 Building Nuxt..."
npm run build

echo "📄 Generating SPA index.html..."
node scripts/generate-spa-index.mjs

echo "🚀 Deploying hosting only..."
npx firebase-tools deploy --only hosting --project "$NUXT_PUBLIC_FIREBASE_PROJECT_ID"

echo ""
echo "✅ Done. Verify at https://${NUXT_PUBLIC_FIREBASE_PROJECT_ID}.web.app"
