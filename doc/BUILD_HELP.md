# Android Build Quick Fix Guide

## 🚨 If You Can't Build the APK

### Quick Fix (Automated)

Run this script to automatically fix most common issues:

```bash
./scripts/fix-android-build.sh
```

This script will:
1. ✓ Check prerequisites (Node, Java, etc.)
2. ✓ Update gradle.properties with proper memory settings
3. ✓ Clean all caches
4. ✓ Reinstall dependencies if needed
5. ✓ Run Expo prebuild
6. ✓ Build the APK with multiple retry strategies

---

## 🔧 Manual Fix (Step by Step)

### 1. Memory Issues (Most Common)

Edit `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
android.lintOptions.abortOnError=false
```

### 2. Clean Everything

```bash
# Clean caches
rm -rf node_modules
rm -rf ~/.gradle/caches/
rm -rf $TMPDIR/metro-*

# Reinstall
yarn install

# Clean build
cd android
./gradlew clean
```

### 3. Rebuild from Scratch

```bash
# From project root
./node_modules/.bin/expo prebuild --clean --platform android
cd android
./gradlew assembleRelease
```

---

## 📍 Where is My APK?

After successful build:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📖 Detailed Documentation

For comprehensive troubleshooting, see:
**[ANDROID_BUILD_TROUBLESHOOTING.md](ANDROID_BUILD_TROUBLESHOOTING.md)**

Covers:
- All common errors with solutions
- Memory configuration
- Dependency issues
- Cache problems
- Environment setup
- Debug commands

---

## 🆘 Still Stuck?

1. **Check the build log**:
   ```bash
   tail -100 build.log
   ```

2. **Search for the specific error** in ANDROID_BUILD_TROUBLESHOOTING.md

3. **Try the nuclear option** (complete reset):
   ```bash
   rm -rf node_modules android ios .expo
   rm -rf ~/.gradle/caches/
   yarn install
   ./node_modules/.bin/expo prebuild --clean
   cd android && ./gradlew clean assembleRelease
   ```

---

## ✅ Verify Build Success

```bash
# Check if APK exists
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Check APK size
du -h android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Build APK | `yarn build-local:android` |
| Clean build | `cd android && ./gradlew clean` |
| Build debug | `cd android && ./gradlew assembleDebug` |
| Build release | `cd android && ./gradlew assembleRelease` |
| Full clean | `./scripts/fix-android-build.sh` |

---

**Need Help?** Check [ANDROID_BUILD_TROUBLESHOOTING.md](ANDROID_BUILD_TROUBLESHOOTING.md) for detailed solutions.
