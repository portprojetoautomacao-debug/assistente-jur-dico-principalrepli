#!/bin/bash

# Fix Merge Conflicts in package-lock.json
# This script resolves the 74 conflicts by regenerating the lock file



YELLOW='\033[1;33m'

print_s

print_error() {
}
print_info() {
YELLOW='\033[1;33m'
# Check if package.json

fi
print_info "This 

i

print_error() {
fi
}

print_info() {

}

    rm -rf node_modules
else
fi

fi

print_success "package-lock.json regenerated successfully!"


print_success "Dependencies deduplicated"

print_info "Step 6: Verifying installation..."
    print_success "All dependencies installed cor
    print_error "Warning: Some peer dependency warnings exis
else
# Step 7: Test build
fi
    ech

    print_error "Build failed. Check the erro
fi

echo "===================================
echo "=

echo "Next steps:"
echo "  2. Commit the fix: git add package-lock.json"
echo " 
echo "Backup file saved as: package-lock.json.back
echo ""
    rm -rf node_modules

else

fi







print_success "package-lock.json regenerated successfully!"





print_success "Dependencies deduplicated"



print_info "Step 6: Verifying installation..."







# Step 7: Test build









fi









echo "Next steps:"

echo "  2. Commit the fix: git add package-lock.json"


echo ""


echo ""


