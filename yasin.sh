#!/usr/bin/env bash

# Determine the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Execute node src/index.js with arguments
node "$DIR/src/index.js" "$@"
