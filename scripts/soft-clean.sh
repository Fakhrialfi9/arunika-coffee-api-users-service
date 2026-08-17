#!/usr/bin/env bash

set -euo pipefail

echo "==> Removing build and test artifacts..."

rm -rf \
  dist \
  coverage \
  .cache \
  node_modules/.cache \
  tsconfig.build.tsbuildinfo

echo "==> Soft clean completed."