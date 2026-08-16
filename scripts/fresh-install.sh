#!/usr/bin/env bash

set -euo pipefail

echo "Starting clean Users Service install..."
rm -rf dist coverage .nestjs node_modules/.cache
find . -name '*.tsbuildinfo' -delete
npm ci

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Fresh install completed."
