#!/usr/bin/env bash

# Legacy POSIX-shell entrypoint. Keep this wrapper for existing Unix users;
# the canonical cross-platform launcher is bin/yasin.js.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec node "$DIR/bin/yasin.js" "$@"
