#!/usr/bin/env bash

set -euo pipefail

echo "==> Cleaning generated artifacts..."
npm run clean

echo "==> Installing dependencies..."
npm ci

echo "==> Generating Prisma client..."
npm run prisma:generate

echo "==> Running health checks..."
npm run check:health

echo "==> Fresh installation completed successfully."