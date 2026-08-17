#!/usr/bin/env bash

set -euo pipefail

echo "==> Removing dependencies and generated artifacts..."

rm -rf \
  node_modules \
  dist \
  coverage \
  .cache \
  node_modules/.cache \
  prisma/generated \
  generated \
  tsconfig.build.tsbuildinfo

echo "==> Hard clean completed."