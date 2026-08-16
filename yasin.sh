#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Compatibility wrapper → same entry as bin/yasin.js
exec node "$DIR/src/index.js" "$@"
