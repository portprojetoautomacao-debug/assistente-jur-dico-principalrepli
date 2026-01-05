#!/bin/bash
# Quick fix script for Vercel ES module deployment error

echo "🔧 Fixing Vercel Deployment - ES Module Error"
echo "=============================================="
echo ""

# Remove compiled JS files from api directory
echo "📝 Step 1: Removing old .js files from api directory..."
rm -f api/*.js api/*.js.map
echo "✅ Removed api/*.js files"
echo ""

# Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Verify files
echo "📋 Step 3: Verifying API directory..."
ls -la api/
echo ""

echo "✨ Fix complete!"
echo ""
echo "📤 Next steps:"
echo "  1. git add ."
echo "  2. git commit -m 'Fix Vercel ES module deployment error'"
echo "  3. git push"
echo ""
echo "📝 See VERCEL_ES_MODULE_FIX.md for detailed documentation"
