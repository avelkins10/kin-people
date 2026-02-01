#!/usr/bin/env bash
# Push this repo to GitHub and optionally deploy to Vercel.
# Usage:
#   1. Create a new repo on GitHub (e.g. github.com/YOUR_USERNAME/kin-people-app).
#   2. Run: GITHUB_REPO_URL=https://github.com/YOUR_USERNAME/kin-people-app.git ./scripts/setup-github-and-vercel.sh
#   Or run: ./scripts/setup-github-and-vercel.sh https://github.com/YOUR_USERNAME/kin-people-app.git

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

GITHUB_REPO_URL="${GITHUB_REPO_URL:-$1}"
if [ -z "$GITHUB_REPO_URL" ]; then
  echo "Usage: GITHUB_REPO_URL=https://github.com/USER/REPO.git $0"
  echo "   Or: $0 https://github.com/USER/REPO.git"
  exit 1
fi

if git remote get-url origin 2>/dev/null; then
  echo "Remote 'origin' already set. To replace: git remote remove origin"
  exit 1
fi

echo "Adding remote origin and pushing main..."
git remote add origin "$GITHUB_REPO_URL"
git push -u origin main
echo "GitHub push done."

if command -v vercel >/dev/null 2>&1; then
  echo "Linking and deploying with Vercel..."
  vercel link --yes --project kin-people-app
  vercel --prod --yes
  echo "Vercel deploy done."
else
  echo "Vercel CLI not found. Install: npm i -g vercel"
  echo "Then run: vercel link && vercel --prod"
fi
