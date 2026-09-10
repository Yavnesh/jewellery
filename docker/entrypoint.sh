#!/bin/sh
set -e

echo "==> Starting container entrypoint script..."

# If DATABASE_URL is defined and AUTO_MIGRATE is true (useful for dev/staging containers)
if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "==> Running Prisma database schema synchronization (prisma db push)..."
  ./node_modules/.bin/prisma db push --skip-generate || npx prisma db push --skip-generate
fi

echo "==> Handing over process execution to application server..."
exec "$@"
