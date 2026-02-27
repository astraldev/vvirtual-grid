#!/bin/bash
set -e

# 1. Bundle the pipeline with tsdown
echo "📦 Bundling standalone pipeline..."
pnpm exec tsdown --config scripts/tsdown.profile.ts

# 2. Clean up profiles dir
rm -rf ./profiles/*

if [ -f "scripts/pipeline.mjs" ]; then
  mv scripts/pipeline.mjs scripts/pipeline.js
fi
if [ -f "scripts/pipeline.mjs.map" ]; then
  mv scripts/pipeline.mjs.map scripts/pipeline.js.map
fi

# 3. Ensure profiles directory exists
mkdir -p profiles

# 4. Run profiling
echo "Starting profiler..."
ELECTRON_RUN_AS_NODE='' pnpm exec flame run --delay=none --sourcemap-dirs=scripts scripts/profile-pipeline.js

# 5. Move results to profiles directory
echo "📂 Organizing results..."
# Use a subshell or find to avoid shell expansion errors if no files exist
mv cpu-* heap-* profiles/ 2>/dev/null || true

echo "Profiling complete. Results available in core/profiles/"
