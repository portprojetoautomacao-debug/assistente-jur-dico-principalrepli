#!/bin/bash

echo "🔧 Fixing missing Radix UI dependencies..."

# Remove node_modules and package-lock
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install dependencies
echo "Installing fresh dependencies..."
npm install

echo "✅ Dependencies fixed!"
