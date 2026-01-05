#!/bin/bash

# Vercel Deployment Fix Script
# Resolves package-lock.json conflicts by regenerating the lockfile

set -e

echo "🔧 Vercel Deployment Fix Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in a git repository
if [[ ! -d .git ]]; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

print_success "Git repository detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm version $NPM_VERSION detected"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo ""
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Ask for confirmation
read -p "This will delete node_modules and package-lock.json, then regenerate them. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Operation cancelled"
    exit 0
fi

# Backup current files
echo ""
echo "📦 Creating backups..."
if [[ -f package-lock.json ]]; then
    cp package-lock.json package-lock.json.backup
    print_success "Backed up package-lock.json to package-lock.json.backup"
fi

# Delete package-lock.json
echo ""
echo "🗑️  Removing old lockfile..."
if [[ -f package-lock.json ]]; then
    rm package-lock.json
    print_success "Deleted package-lock.json"
else
    print_warning "package-lock.json not found"
fi

# Delete node_modules
echo ""
echo "🗑️  Removing node_modules..."
if [[ -d node_modules ]]; then
    rm -rf node_modules
    print_success "Deleted node_modules"
else
    print_warning "node_modules not found"
fi

# Regenerate package-lock.json
echo ""
echo "📥 Installing dependencies..."
echo "This may take a few minutes..."
echo ""

if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "npm install failed"
    
    if [[ -f package-lock.json.backup ]]; then
        echo ""
        read -p "Restore backup? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mv package-lock.json.backup package-lock.json
            print_success "Backup restored"
        fi
    fi
    
    exit 1
fi

# Verify installation
echo ""
echo "🔍 Verifying installation..."

# Check for duplicate dependencies
DUPLICATES=$(npm ls --depth=0 2>&1 | grep -c "WARN" || true)
if [[ "$DUPLICATES" -gt 0 ]]; then
    print_warning "Found some warnings. Running npm dedupe..."
    npm dedupe
fi

# Test build
echo ""
echo "🏗️  Testing build..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed. Please check the errors above."
    exit 1
fi

# Git status
echo ""
echo "📊 Git status:"
git status --short

# Offer to commit
echo ""
read -p "Commit the changes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add package-lock.json
    git commit -m "fix: regenerate package-lock.json to resolve merge conflicts"
    print_success "Changes committed"
    
    echo ""
    read -p "Push to remote? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin "$CURRENT_BRANCH"
        print_success "Changes pushed to $CURRENT_BRANCH"
    fi
fi

# Clean up backup
if [[ -f package-lock.json.backup ]]; then
    rm package-lock.json.backup
    print_success "Backup file removed"
fi

echo ""
echo "✅ All done!"
echo ""
echo "Next steps:"
echo "  1. Verify the changes in your PR"
echo "  2. Check that Vercel deployment succeeds"
echo "  3. Ensure all environment variables are set in Vercel"
echo ""
