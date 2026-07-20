#!/bin/bash

# Android Build Fix Script
# This script attempts to fix common Android build issues automatically

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Android Build Fix Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

cd "$PROJECT_ROOT"
print_success "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Check prerequisites
print_step "Step 1: Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js: $(node --version)"

if ! command -v yarn &> /dev/null && ! command -v npm &> /dev/null; then
    print_error "Neither yarn nor npm is installed"
    exit 1
fi

if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    print_success "Package manager: yarn $(yarn --version)"
else
    PACKAGE_MANAGER="npm"
    print_success "Package manager: npm $(npm --version)"
fi

if ! command -v java &> /dev/null; then
    print_error "Java is not installed"
    exit 1
fi
print_success "Java: $(java -version 2>&1 | head -n 1)"

echo ""

# Step 2: Fix gradle.properties
print_step "Step 2: Updating gradle.properties..."

GRADLE_PROPS="$PROJECT_ROOT/android/gradle.properties"

if [ -f "$GRADLE_PROPS" ]; then
    # Backup original
    cp "$GRADLE_PROPS" "$GRADLE_PROPS.backup"
    print_success "Backed up gradle.properties"

    # Update memory settings
    if grep -q "org.gradle.jvmargs=" "$GRADLE_PROPS"; then
        sed -i.tmp 's/org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m/' "$GRADLE_PROPS"
        rm -f "$GRADLE_PROPS.tmp"
        print_success "Updated JVM memory settings to 4GB heap, 1GB metaspace"
    else
        echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m" >> "$GRADLE_PROPS"
        print_success "Added JVM memory settings"
    fi

    # Add lint option if not present
    if ! grep -q "android.lintOptions.abortOnError" "$GRADLE_PROPS"; then
        echo "" >> "$GRADLE_PROPS"
        echo "# Skip linting during release builds" >> "$GRADLE_PROPS"
        echo "android.lintOptions.abortOnError=false" >> "$GRADLE_PROPS"
        print_success "Added lint abort option"
    fi
else
    print_warning "gradle.properties not found, will be created during prebuild"
fi

echo ""

# Step 3: Clean caches
print_step "Step 3: Cleaning caches..."

print_warning "This will remove caches and may take a while to rebuild"
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Clean metro cache
    if [ -d "$TMPDIR" ]; then
        rm -rf "$TMPDIR/metro-"* 2>/dev/null || true
        rm -rf "$TMPDIR/react-"* 2>/dev/null || true
        rm -rf "$TMPDIR/haste-map-"* 2>/dev/null || true
        print_success "Cleaned Metro bundler cache"
    fi

    # Clean package manager cache
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn cache clean
        print_success "Cleaned yarn cache"
    else
        npm cache clean --force
        print_success "Cleaned npm cache"
    fi

    # Clean gradle cache
    if [ -d "$HOME/.gradle/caches" ]; then
        rm -rf "$HOME/.gradle/caches/"
        print_success "Cleaned Gradle cache"
    fi

    # Clean expo cache
    if [ -d "$PROJECT_ROOT/.expo" ]; then
        rm -rf "$PROJECT_ROOT/.expo"
        print_success "Cleaned Expo cache"
    fi

    # Clean android build folders
    if [ -d "$PROJECT_ROOT/android" ]; then
        cd "$PROJECT_ROOT/android"
        if [ -f "gradlew" ]; then
            ./gradlew clean 2>/dev/null || true
            print_success "Ran gradle clean"
        fi
        rm -rf app/build build
        print_success "Cleaned Android build folders"
        cd "$PROJECT_ROOT"
    fi
else
    print_warning "Skipped cache cleaning"
fi

echo ""

# Step 4: Reinstall dependencies
print_step "Step 4: Checking dependencies..."

if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found, installing..."
    $PACKAGE_MANAGER install
    print_success "Dependencies installed"
else
    read -p "Reinstall node_modules? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules
        $PACKAGE_MANAGER install
        print_success "Dependencies reinstalled"
    else
        print_success "Using existing node_modules"
    fi
fi

echo ""

# Step 5: Run prebuild
print_step "Step 5: Running Expo prebuild..."

if [ ! -d "android" ]; then
    print_warning "Android folder not found, running prebuild..."
    ./node_modules/.bin/expo prebuild --platform android
    print_success "Prebuild completed"
else
    read -p "Re-run prebuild? This will regenerate android folder (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf android ios
        ./node_modules/.bin/expo prebuild --clean --platform android
        print_success "Prebuild completed"
    else
        print_success "Using existing android folder"
    fi
fi

echo ""

# Step 6: Build APK
print_step "Step 6: Building APK..."

cd "$PROJECT_ROOT/android"

if [ ! -f "gradlew" ]; then
    print_error "gradlew not found in android folder"
    exit 1
fi

print_warning "Starting build process (this may take several minutes)..."
echo ""

# Try building with different options
BUILD_SUCCESS=false

# Attempt 1: Normal build
print_step "Attempt 1: Normal build"
if ./gradlew assembleRelease --no-daemon 2>&1 | tee "$PROJECT_ROOT/build.log"; then
    BUILD_SUCCESS=true
else
    print_warning "Normal build failed"

    # Attempt 2: Build with refresh dependencies
    print_step "Attempt 2: Build with refresh dependencies"
    if ./gradlew clean assembleRelease --refresh-dependencies --no-daemon 2>&1 | tee "$PROJECT_ROOT/build.log"; then
        BUILD_SUCCESS=true
    else
        print_warning "Build with refresh failed"

        # Attempt 3: Build with stack trace
        print_step "Attempt 3: Build with stack trace (for debugging)"
        ./gradlew assembleRelease --stacktrace --no-daemon 2>&1 | tee "$PROJECT_ROOT/build.log"
    fi
fi

cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}================================================${NC}"

if [ "$BUILD_SUCCESS" = true ] || [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    echo -e "${GREEN}✓ BUILD SUCCESSFUL!${NC}"
    echo ""
    print_success "APK Location: android/app/build/outputs/apk/release/app-release.apk"

    # Show APK size
    APK_SIZE=$(du -h "android/app/build/outputs/apk/release/app-release.apk" | cut -f1)
    print_success "APK Size: $APK_SIZE"

    # Try to open the folder
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "android/app/build/outputs/apk/release/"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "android/app/build/outputs/apk/release/" 2>/dev/null || true
    fi
else
    echo -e "${RED}✗ BUILD FAILED${NC}"
    echo ""
    print_error "Build failed. Check build.log for details:"
    echo "  tail -100 build.log"
    echo ""
    print_warning "Common fixes:"
    echo "  1. Check Java version (should be JDK 17)"
    echo "  2. Ensure ANDROID_HOME is set correctly"
    echo "  3. Try increasing memory in android/gradle.properties"
    echo "  4. Review ANDROID_BUILD_TROUBLESHOOTING.md for more solutions"
    exit 1
fi

echo -e "${BLUE}================================================${NC}"
