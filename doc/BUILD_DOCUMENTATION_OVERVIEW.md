# Android Build Documentation - Files Overview

## 📚 Documentation Created

This package includes comprehensive documentation for troubleshooting Android APK build issues.

### Files Created

#### 1. **BUILD_HELP.md** (Quick Reference)
- **Location**: `./BUILD_HELP.md`
- **Purpose**: Quick fixes and common commands
- **Use When**: You need a fast solution
- **Content**:
  - Automated fix script usage
  - Manual fix steps (top 3 solutions)
  - APK location reference
  - Quick commands table

#### 2. **ANDROID_BUILD_TROUBLESHOOTING.md** (Detailed Guide)
- **Location**: `./ANDROID_BUILD_TROUBLESHOOTING.md`
- **Purpose**: Comprehensive troubleshooting guide
- **Use When**: Quick fixes don't work or you need to understand the issue
- **Content**:
  - Prerequisites checklist
  - All common errors with solutions
  - Memory configuration guide
  - Dependency troubleshooting
  - Cache management
  - Environment setup
  - Complete clean build instructions
  - Debug commands reference

#### 3. **fix-android-build.sh** (macOS/Linux Script)
- **Location**: `./scripts/fix-android-build.sh`
- **Purpose**: Automated fix script for Unix systems
- **Use When**: You want to try all fixes automatically
- **Features**:
  - Prerequisites checking
  - Automatic gradle.properties updates
  - Cache cleaning
  - Dependency management
  - Automatic prebuild
  - Multiple build retry strategies
  - Colored output for easy reading

**Usage:**
```bash
./scripts/fix-android-build.sh
```

#### 4. **fix-android-build.bat** (Windows Script)
- **Location**: `./scripts/fix-android-build.bat`
- **Purpose**: Automated fix script for Windows
- **Use When**: You're on Windows and want automated fixes
- **Features**: Same as the .sh version but Windows-compatible

**Usage:**
```cmd
.\scripts\fix-android-build.bat
```

#### 5. **README.md** (Updated)
- **Location**: `./README.md`
- **Purpose**: Main project README
- **Change**: Added Android build section with links to troubleshooting docs

---

## 🚀 Quick Start

### If Build Fails - What To Do?

**Step 1**: Try the automated fix (recommended)
```bash
# macOS/Linux
./scripts/fix-android-build.sh

# Windows
.\scripts\fix-android-build.bat
```

**Step 2**: If automated fix doesn't work, check `BUILD_HELP.md`
```bash
open BUILD_HELP.md  # macOS
# or just open the file in your editor
```

**Step 3**: For detailed troubleshooting, check `ANDROID_BUILD_TROUBLESHOOTING.md`
```bash
open ANDROID_BUILD_TROUBLESHOOTING.md  # macOS
# or just open the file in your editor
```

---

## 📖 Documentation Flow

```
Build Error
    ↓
Try: ./scripts/fix-android-build.sh
    ↓
Still failing?
    ↓
Check: BUILD_HELP.md (Quick fixes)
    ↓
Still failing?
    ↓
Check: ANDROID_BUILD_TROUBLESHOOTING.md (Detailed solutions)
    ↓
Find your specific error and follow the solution
```

---

## 🎯 Most Common Issues & Quick Fixes

### 1. Out of Memory Error
**File**: `android/gradle.properties`
**Fix**:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### 2. Dependency Issues
**Commands**:
```bash
rm -rf node_modules
yarn install
```

### 3. Gradle Cache Issues
**Commands**:
```bash
cd android
./gradlew clean --refresh-dependencies
```

### 4. Complete Reset
**Commands**:
```bash
./scripts/fix-android-build.sh
# Or manually:
rm -rf node_modules android ios .expo
yarn install
./node_modules/.bin/expo prebuild --clean
cd android && ./gradlew assembleRelease
```

---

## 📍 APK Location

After successful build:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🛠 Build Commands

All available build commands:

```bash
# Using yarn script (recommended)
yarn build-local:android

# Manual build
cd android
./gradlew assembleRelease

# Debug build
./gradlew assembleDebug

# Build with stack trace (for debugging)
./gradlew assembleRelease --stacktrace

# Build without daemon (less memory)
./gradlew assembleRelease --no-daemon

# Clean and build
./gradlew clean assembleRelease
```

---

## 📝 Documentation Maintenance

### When to Update

Update this documentation when:
- New common errors are discovered
- Build process changes
- New dependencies are added that affect build
- Gradle or Expo versions are updated

### How to Update

1. Edit the relevant markdown file:
   - Quick fixes → `BUILD_HELP.md`
   - Detailed solutions → `ANDROID_BUILD_TROUBLESHOOTING.md`

2. Test the fix script if build process changes:
   - `scripts/fix-android-build.sh` (macOS/Linux)
   - `scripts/fix-android-build.bat` (Windows)

3. Update this overview if new files are added

---

## 🤝 Contributing

If you find a solution to a build issue not covered here:

1. Add the solution to `ANDROID_BUILD_TROUBLESHOOTING.md`
2. If it's a common issue, add it to `BUILD_HELP.md`
3. Update this overview if needed
4. Commit your changes

---

## ✅ Checklist for New Team Members

When setting up Android build for the first time:

- [ ] Read `BUILD_HELP.md`
- [ ] Ensure prerequisites are installed (Node, Java, Android SDK)
- [ ] Set `ANDROID_HOME` environment variable
- [ ] Try running `yarn build-local:android`
- [ ] If it fails, run `./scripts/fix-android-build.sh`
- [ ] Keep `ANDROID_BUILD_TROUBLESHOOTING.md` bookmarked for reference

---

## 📞 Support Resources

- **Internal Docs**: Start with `BUILD_HELP.md`
- **Detailed Guide**: `ANDROID_BUILD_TROUBLESHOOTING.md`
- **Expo Forums**: https://forums.expo.dev/
- **React Native Issues**: https://github.com/facebook/react-native/issues
- **Stack Overflow**: Tag with `react-native`, `expo`, `android-gradle`

---

**Created**: January 30, 2026
**Last Updated**: January 30, 2026
**Project**: app-vendor
**Maintainer**: DevOps Team
