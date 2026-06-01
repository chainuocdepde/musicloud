# Mini SoundCloud App - Issues Found & Fixed

## 🔴 Issue #1: HomeScreen Padding Bug
**Severity**: Low
**Status**: ✅ FIXED

**Problem**: 
- Player component showing at bottom had inconsistent padding
- Using conditional: `paddingBottom: currentSong ? 70 : 15`

**Root Cause**: 
- Padding was jumping between 70 and 15 based on player state
- Causing visual glitch

**Solution**:
- Changed to fixed `paddingBottom: 70`

**Files Modified**: 
- `mini-soundcloud-app/src/screens/HomeScreen.js`

---

## 🔴 Issue #2: AuthContext Not Handling Loading State
**Severity**: Medium
**Status**: ✅ FIXED

**Problem**:
- Auth state was checking on every app startup but not showing loading UI
- Could cause flash of unauthenticated content

**Root Cause**:
- Missing check for `isLoading` state before rendering children
- No splash screen shown during bootstrap

**Solution**:
```javascript
if (isLoading) {
    return <SplashScreen />;
}
console.log('isAuthenticated:', isAuthenticated);
```

**Files Modified**:
- `mini-soundcloud-app/src/context/AuthContext.js`

---

## 🔴 Issue #3: DocumentPicker API Incompatibility
**Severity**: High  
**Status**: ✅ FIXED

**Problem**:
- 🎵 File selection NOT working
- Error: `result.type === 'success'` is undefined
- expo-document-picker updated to new API but code not updated

**Root Cause**:
- Old API: `result.type`, `result`
- New API: `result.canceled`, `result.assets[]`
- Code was using old API pattern

**Solution**:
```javascript
// Before
if (result.type === 'success') {
    setAudioFile(result);
}

// After
if (!result.canceled && result.assets && result.assets[0]) {
    setAudioFile(result.assets[0]);
}
```

**Additional Fixes**:
- Safe file size display: `{audioFile.size ? (audioFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}`
- Added logging for debug: `console.log('audioFile:', audioFile)`

**Files Modified**:
- `mini-soundcloud-app/src/screens/UploadScreen.js`

---

## 🔴 Issue #4: Missing Assets
**Severity**: Medium
**Status**: ✅ FIXED

**Problem**:
- App won't start/build
- Error: `assets/icon.png not found`, `assets/splash.png not found`, `assets/adaptive-icon.png not found`

**Root Cause**:
- app.json referenced assets that didn't exist
- No assets folder created during setup

**Solution**:
1. Created `assets/` folder in project root
2. Generated placeholder PNG files:
   - `icon.png` (1024x1024)
   - `splash.png` (1284x2778)
   - `adaptive-icon.png` (1024x1024)

**Files Created**:
- `mini-soundcloud-app/assets/icon.png`
- `mini-soundcloud-app/assets/splash.png`
- `mini-soundcloud-app/assets/adaptive-icon.png`

---

## 🔴 Issue #5: Backend File Upload - 400 Bad Request (Multer fileFilter Rejection)
**Severity**: Critical
**Status**: ✅ FIXED (fileFilter), 🔄 PENDING (full integration test)

**Problem**:
- 📤 Upload fails with 400 error
- No log from backend route handler (rejected by fileFilter)
- File accepted on desktop but rejected from web browser

**Root Cause**:
- Web browser sends files as blobs with generic/missing mimetype
- Backend fileFilter too strict: only accepting exact mimetype strings
- Example: browser might send `application/octet-stream` instead of `audio/mpeg`

**Solution**:
Multi-layer validation in fileFilter:
```javascript
// Layer 1: Exact mimetype match
allowedAudioTypes.includes(file.mimetype)

// Layer 2: Generic audio/image prefix
|| file.mimetype.startsWith('audio/')
|| file.mimetype.startsWith('image/')

// Layer 3: Extension-based validation  
|| file.originalname.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i)
|| file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i)
```

**Additional Changes**:
- Added detailed logging: `fileFilter: field=${file.fieldname}, mimetype=${file.mimetype}`
- Better error messages with actual mimetype received

**Files Modified**:
- `mini-soundcloud-backend/src/routes/upload.js`

---

## 🟡 Issue #6: Upload Fails with Unclear Error Message
**Severity**: High
**Status**: 🔄 IN PROGRESS

**Problem**:
- Upload shows "Không kết nối được server" or generic error
- Need full logs to diagnose

**Root Cause**: Unknown - investigating

**Added for Debugging**:
- Enhanced logging in `api.js`:
  - Token presence check
  - Upload progress tracking
  - Detailed error response capture
- Enhanced logging in `UploadScreen.js`:
  - AudioFile object inspection
  - MimeType verification before sending

**Files Modified**:
- `mini-soundcloud-app/src/services/api.js`
- `mini-soundcloud-app/src/screens/UploadScreen.js`

**Next Step**: Run app with both frontend + backend logging to capture full error trace

---

## Summary by Severity

### Critical Issues
- ❌ Upload fails (400 error) - investigating

### High Issues  
- ✅ DocumentPicker API incompatibility - FIXED
- 🔄 Upload unclear error - DEBUGGING

### Medium Issues
- ✅ Missing assets - FIXED
- ✅ AuthContext loading state - FIXED

### Low Issues
- ✅ HomeScreen padding inconsistency - FIXED

---

## Testing Checklist

- [ ] Run frontend: `npm start` in `mini-soundcloud-app`
- [ ] Run backend: `npm start` in `mini-soundcloud-backend`  
- [ ] Test login flow
- [ ] Test file selection (audio file)
- [ ] Test file upload with logging
- [ ] Verify file appears in database
- [ ] Verify file appears on home screen
- [ ] Test cover image upload (optional)
