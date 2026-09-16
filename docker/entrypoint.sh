#!/bin/sh
set -e

echo "==> Starting container entrypoint script..."

# If DATABASE_URL is defined and AUTO_MIGRATE is true
if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "==> Running Prisma database schema synchronization (prisma db push)..."
  ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || npx prisma db push --skip-generate --accept-data-loss
fi

# If AUTO_SEED is set to true, execute database seed
if [ "$AUTO_SEED" = "true" ]; then
  echo "==> Running comprehensive database seed..."
  ./node_modules/.bin/tsx scripts/seed-database.ts || echo "Seed executed or partially applied."
fi

echo "==> Handing over process execution to application server..."
exec "$@"
