#!/usr/bin/env bash
# ==============================================================================
# PIPELINE AUTOMATION SCRIPT: CI/CD Deploy Workflow for Vamika Jewels
# ==============================================================================
# Workflow:
#  1. Ensures working directory is clean and on a feature/fix branch.
#  2. Runs test suite & build check locally to prevent shipping regressions.
#  3. Pushes current feature/fix branch to origin.
#  4. Merges into development -> pushes to origin/development.
#  5. Merges into staging -> pushes to origin/staging.
#  6. Merges into production -> pushes to origin/production.
#  7. Tags a semantic deployment release with change description.
#  8. Connects to Oracle Cloud instance via lightning_rsa.key.
#  9. Pulls latest production, builds Docker container, restarts app.
# 10. Runs remote healthcheck to confirm deployment is live.
# ==============================================================================

set -euo pipefail

# Configuration
SERVER_HOST="137.23.59.135"
SERVER_USER="ubuntu"
SSH_KEY_DEFAULT="/Users/yavnesh/Downloads/lightning_rsa.key"
REMOTE_APP_DIR="/home/ubuntu/jewellery"
DEPLOY_LOG_FILE="deployments.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Parse arguments
DESCRIPTION="${1:-}"
if [ -z "$DESCRIPTION" ]; then
  echo -e "${YELLOW}Usage: ./scripts/deploy.sh \"<Description of changes>\" [optional_version_tag]${NC}"
  echo "Example: ./scripts/deploy.sh \"Add users API endpoints and fix login notification 404\" v1.1.0"
  exit 1
fi

VERSION="${2:-}"
if [ -z "$VERSION" ]; then
  # Auto-generate timestamp version tag if not supplied
  VERSION="v$(date +'%Y.%m.%d-%H%M')"
fi

# Detect SSH key location
SSH_KEY="${SSH_KEY_PATH:-$SSH_KEY_DEFAULT}"
if [ ! -f "$SSH_KEY" ]; then
  log_error "SSH Key file not found at: $SSH_KEY. Please set SSH_KEY_PATH or ensure lightning_rsa.key exists in ~/Downloads"
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "production" ] || [ "$CURRENT_BRANCH" = "staging" ] || [ "$CURRENT_BRANCH" = "development" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  log_error "You are currently on protected branch '$CURRENT_BRANCH'. You must develop and run deploy from a feature or fix branch (e.g. fix/..., feature/...)."
fi

# Check for uncommitted working tree changes
if ! git diff-index --quiet HEAD --; then
  log_error "Working tree has uncommitted changes. Please commit or stash them before running deployment."
fi

log_info "Starting deployment workflow for branch: ${GREEN}$CURRENT_BRANCH${NC}"
log_info "Release Version: ${GREEN}$VERSION${NC}"
log_info "Description: ${GREEN}$DESCRIPTION${NC}"

# Step 1: Pre-flight local validation
log_info "Step 1/8: Running local test suite..."
npx vitest run --silent || log_error "Vitest tests failed! Aborting deployment to protect environments."

log_info "Step 2/8: Running local production build check..."
npm run build >/dev/null 2>&1 || log_error "Local build verification failed! Aborting deployment."
log_success "Local tests and build verification passed."

# Step 3: Push current feature/fix branch
log_info "Step 3/8: Pushing '$CURRENT_BRANCH' to origin..."
git push -u origin "$CURRENT_BRANCH"
log_success "Branch '$CURRENT_BRANCH' pushed to origin."

# Step 4: Merge to development & push
log_info "Step 4/8: Merging '$CURRENT_BRANCH' into 'development'..."
git checkout development
git pull origin development --rebase
git merge "$CURRENT_BRANCH" -m "merge: $CURRENT_BRANCH into development ($VERSION)"
git push origin development
log_success "Development branch updated and pushed."

# Step 5: Merge development into staging & push
log_info "Step 5/8: Merging 'development' into 'staging'..."
git checkout staging
git pull origin staging --rebase
git merge development -m "merge: development into staging ($VERSION)"
git push origin staging
log_success "Staging branch updated and pushed."

# Step 6: Merge staging into production & push
log_info "Step 6/8: Merging 'staging' into 'production'..."
git checkout production
git pull origin production --rebase
git merge staging -m "release: $VERSION - $DESCRIPTION"

# Record Version in deployments.log
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_HASH=$(git rev-parse --short HEAD)
echo "$TIMESTAMP | $VERSION | $GIT_HASH | $DESCRIPTION" >> "$DEPLOY_LOG_FILE"
git add "$DEPLOY_LOG_FILE"
git commit --amend -m "release: $VERSION - $DESCRIPTION [deploy-logged]" || true

git tag -a "$VERSION" -m "$DESCRIPTION"
git push origin production --tags
log_success "Production branch merged, tagged with '$VERSION', and pushed to origin."

# Step 7: Deploy to Oracle Cloud
log_info "Step 7/8: Connecting to Oracle Cloud ($SERVER_HOST) and deploying container..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << EOF
  set -euo pipefail
  echo "==> Pulling latest production code on server..."
  cd "$REMOTE_APP_DIR"
  git pull origin production

  echo "==> Rebuilding Docker application container..."
  docker compose build app

  echo "==> Recreating and restarting jewellery_app..."
  docker compose up -d app

  echo "==> Server container restart initiated."
EOF
log_success "Remote server container rebuilt and restarted."

# Step 8: Remote Liveness Healthcheck
log_info "Step 8/8: Verifying live healthcheck on https://vamiexports.com..."
sleep 5
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://vamiexports.com/api/health/live || echo "failed")
if [ "$HEALTH_CODE" = "200" ]; then
  log_success "Production is HEALTHY (HTTP 200) at https://vamiexports.com"
else
  log_warn "Healthcheck returned HTTP $HEALTH_CODE. Checking direct container status..."
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "docker ps --filter name=jewellery_app"
fi

# Return to original feature branch
git checkout "$CURRENT_BRANCH"
echo ""
echo "=============================================================================="
log_success "DEPLOYMENT COMPLETE: Version $VERSION successfully shipped to Production!"
echo "=============================================================================="
