# Android APK Build Troubleshooting Guide

This guide provides solutions for common errors encountered when building the Android APK for the app-vendor project.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Common Build Errors](#common-build-errors)
3. [Memory Issues](#memory-issues)
4. [Dependency Issues](#dependency-issues)
5. [Cache Issues](#cache-issues)
6. [Build Script Issues](#build-script-issues)
7. [Complete Clean Build](#complete-clean-build)

---

## Prerequisites

Before attempting to build, ensure you have:
- Node.js v16+ installed
- Java JDK 17 installed
- Android SDK installed
- yarn or npm package manager
- Sufficient disk space (at least 10GB free)
- Sufficient RAM (at least 8GB, 16GB recommended)

Check your setup:
```bash
node --version
java -version
echo $ANDROID_HOME  # Should point to Android SDK
```

---

## Common Build Errors

### Error 1: "expo-cli not supported" or "Module expo is not installed"

**Problem:** Using deprecated global expo-cli or expo package not installed properly.

**Solution:**
```bash
# 1. Ensure dependencies are installed
cd /path/to/app-vendor
yarn install

# 2. Use the updated build script
yarn build-local:android
```

If that fails, run directly:
```bash
./node_modules/.bin/expo prebuild --platform android
cd android
./gradlew assembleRelease
```

**Why it happens:** The global expo-cli is deprecated. The project should use the local expo package installed in node_modules.

---

### Error 2: JVM Metaspace / OutOfMemoryError

**Problem:** Build fails with errors like:
- "Metaspace"
- "GC overhead limit exceeded"
- "Java heap space"

**Symptoms:**
```
Execution failed for task ':expo-modules-core:lintVitalAnalyzeRelease'
> A failure occurred while executing com.android.build.gradle.internal.lint.AndroidLintWorkAction
   > Metaspace
```

**Solution 1: Increase JVM Memory**

Edit `android/gradle.properties`:
```properties
# Increase these values
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

**Solution 2: Disable Linting (if Solution 1 fails)**

Add to `android/gradle.properties`:
```properties
android.lintOptions.abortOnError=false
```

Or disable linting in `android/app/build.gradle`:
```gradle
android {
    lintOptions {
        abortOnError false
        checkReleaseBuilds false
    }
}
```

**Solution 3: Enable Gradle Daemon**

Add to `android/gradle.properties`:
```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

---

### Error 3: Dex Merge Failed

**Problem:**
```
Execution failed for task ':app:mergeDexRelease'
> Directory does not exist: .../transformed/...dex
```

**Solution:**
```bash
# 1. Clean everything
cd android
./gradlew clean

# 2. Remove corrupted build cache
rm -rf ~/.gradle/caches/
rm -rf node_modules/*/android/build

# 3. Rebuild
./gradlew assembleRelease --no-daemon
```

---

### Error 4: SDK/Build Tools Not Found

**Problem:**
```
SDK location not found
Failed to install the following Android SDK packages
```

**Solution:**

1. **Set Android SDK path** - Create/edit `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
# On Windows: sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
# On Linux: sdk.dir=/home/YOUR_USERNAME/Android/Sdk
```

2. **Install required SDK components:**
```bash
# Using Android Studio SDK Manager, install:
# - Android SDK Platform 33 (or the version specified in build.gradle)
# - Android SDK Build-Tools 33.0.0
# - Android SDK Platform-Tools
# - Android Emulator (optional)
```

---

### Error 5: "Cannot resolve dependency"

**Problem:**
```
Could not resolve all files for configuration ':app:releaseRuntimeClasspath'
```

**Solution:**
```bash
# 1. Clear npm/yarn cache
yarn cache clean
# or
npm cache clean --force

# 2. Remove node_modules and reinstall
rm -rf node_modules
yarn install

# 3. Clear Gradle cache
cd android
./gradlew clean --refresh-dependencies

# 4. Rebuild
./gradlew assembleRelease
```

---

## Memory Issues

### Increase System Memory for Build

**For macOS/Linux:**
```bash
# Before building, increase available memory
export GRADLE_OPTS="-Xmx4096m -XX:MaxMetaspaceSize=1024m"
cd android
./gradlew assembleRelease
```

**For Windows:**
```powershell
$env:GRADLE_OPTS="-Xmx4096m -XX:MaxMetaspaceSize=1024m"
cd android
.\gradlew.bat assembleRelease
```

### Close Unnecessary Applications

Before building:
1. Close IDEs (VS Code, Android Studio)
2. Close browsers with many tabs
3. Stop other development servers
4. Restart your computer if memory is very low

---

## Dependency Issues

### Reset Everything

If you encounter persistent dependency issues:

```bash
# 1. Go to project root
cd /path/to/app-vendor

# 2. Remove all generated files
rm -rf node_modules
rm -rf android
rm -rf ios
rm -rf .expo

# 3. Clear caches
yarn cache clean
rm -rf ~/.gradle/caches/
rm -rf ~/Library/Caches/CocoaPods  # macOS only

# 4. Reinstall dependencies
yarn install

# 5. Regenerate native projects
./node_modules/.bin/expo prebuild --clean

# 6. Build
cd android
./gradlew clean assembleRelease
```

---

## Cache Issues

### Clear All Caches

```bash
# Clear Metro bundler cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# Clear React Native cache
rm -rf $TMPDIR/react-*

# Clear Gradle cache
rm -rf ~/.gradle/caches/

# Clear build folders
cd android
./gradlew clean
rm -rf app/build
rm -rf build
```

---

## Build Script Issues

### Update package.json Build Script

Ensure your `package.json` has the correct build script:

```json
{
  "scripts": {
    "build-local:android": "npx expo prebuild --platform android && cd android && ./gradlew assembleRelease && cd app/build/outputs/apk/release && open ."
  }
}
```

**For Windows**, use:
```json
{
  "scripts": {
    "build-local:android": "npx expo prebuild --platform android && cd android && .\\gradlew.bat assembleRelease && cd app\\build\\outputs\\apk\\release && explorer ."
  }
}
```

---

## Complete Clean Build

### Nuclear Option: Complete Reset

When nothing else works:

```bash
#!/bin/bash

echo "🧹 Complete clean build process..."

# 1. Clean Node modules
echo "Removing node_modules..."
rm -rf node_modules
rm -f yarn.lock package-lock.json

# 2. Clean native folders
echo "Removing native folders..."
rm -rf android ios .expo

# 3. Clean global caches
echo "Cleaning caches..."
yarn cache clean
rm -rf ~/.gradle/caches/
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/haste-map-*

# 4. Reinstall
echo "Reinstalling dependencies..."
yarn install

# 5. Prebuild
echo "Running prebuild..."
./node_modules/.bin/expo prebuild --clean --platform android

# 6. Build APK
echo "Building APK..."
cd android
./gradlew clean
./gradlew assembleRelease

# 7. Locate APK
echo "✅ Build complete!"
echo "APK location: android/app/build/outputs/apk/release/app-release.apk"
ls -lh app/build/outputs/apk/release/app-release.apk
```

Save this as `scripts/clean-build-android.sh` and run:
```bash
chmod +x scripts/clean-build-android.sh
./scripts/clean-build-android.sh
```

---

## Environment Variables

### Required Environment Variables

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk  # Linux
# export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java (if needed)
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home  # macOS
```

Reload your shell:
```bash
source ~/.zshrc
# or
source ~/.bashrc
```

---

## Build Output Locations

After a successful build, find your APK at:

- **APK (installable)**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB (Play Store)**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Gradle Build Options

### Useful Gradle Commands

```bash
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build release AAB for Play Store
./gradlew bundleRelease

# Build with stack trace
./gradlew assembleRelease --stacktrace

# Build with debug info
./gradlew assembleRelease --info

# Build without daemon (uses less memory)
./gradlew assembleRelease --no-daemon

# Refresh dependencies
./gradlew assembleRelease --refresh-dependencies
```

---

## Checking Build Success

Verify your APK was created:

```bash
# Check if APK exists
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Check APK size
du -h android/app/build/outputs/apk/release/app-release.apk

# Get APK info (requires aapt)
aapt dump badging android/app/build/outputs/apk/release/app-release.apk
```

---

## Still Having Issues?

### Debug Mode Build

If release build fails, try debug build first:

```bash
cd android
./gradlew assembleDebug
```

If debug works but release fails, the issue might be:
- ProGuard/R8 minification
- Signing configuration
- Build variant specific settings

### Get Help

1. **Check logs**: Look for the first error in the build output
2. **Search error message**: Copy the exact error and search online
3. **Check Expo forums**: https://forums.expo.dev/
4. **Check React Native issues**: https://github.com/facebook/react-native/issues
5. **Stack Overflow**: Tag with `react-native`, `expo`, `android-gradle`

### Provide Debug Information

When asking for help, include:

```bash
# System info
node --version
npm --version
yarn --version
java -version

# Gradle info
cd android
./gradlew --version

# Build with full logs
./gradlew assembleRelease --stacktrace --info > build.log 2>&1
```

---

## Prevention Tips

1. **Keep dependencies updated** (but test before updating)
2. **Don't mix package managers** (use either yarn OR npm, not both)
3. **Commit working builds** before making changes
4. **Test builds regularly**, not just before release
5. **Document custom changes** to build configuration
6. **Use version control** for `android/` folder changes

---

## Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Out of memory | Increase `org.gradle.jvmargs` in `gradle.properties` |
| Dependency error | `rm -rf node_modules && yarn install` |
| Gradle cache | `./gradlew clean --refresh-dependencies` |
| Expo CLI error | Use `./node_modules/.bin/expo` instead of global |
| Build stuck | Try `--no-daemon` flag |
| Can't find APK | Look in `android/app/build/outputs/apk/release/` |

---

**Last Updated**: January 30, 2026
**Project**: app-vendor
**Platform**: Android
