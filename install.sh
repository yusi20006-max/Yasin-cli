#!/usr/bin/env bash

# Yasin CLI installer script
# Supports Linux, Termux, and macOS

set -e

echo "=== Installing Yasin CLI ==="

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Found Node.js version: $(node -v)"

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Run npm install
echo "Installing dependencies..."
npm install

# Make yasin.sh executable
echo "Making yasin.sh executable..."
chmod +x yasin.sh

echo "=== Installation Successful! ==="
echo "You can run Yasin CLI by executing: ./yasin.sh"
