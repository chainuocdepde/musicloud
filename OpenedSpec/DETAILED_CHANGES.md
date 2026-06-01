# Mini SoundCloud App - Detailed Code Changes

## File-by-File Changes

---

## 📄 `mini-soundcloud-app/src/screens/HomeScreen.js`

### Change 1: Fixed Padding
**Location**: Line ~163 (in StyleSheet.create)

```javascript
// ❌ BEFORE
listContent: {
    padding: 15,
    paddingBottom: currentSong ? 70 : 15,
},

// ✅ AFTER
listContent: {
    padding: 15,
    paddingBottom: 70,
},
```

**Why**: Conditional padding was causing visual glitch when player appeared/disappeared

---

## 📄 `mini-soundcloud-app/src/context/AuthContext.js`

### Change 1: Added SplashScreen Import
**Location**: Line 5 (after imports)

```javascript
// ✅ ADDED
import SplashScreen from '../screens/SplashScreen';
```

### Change 2: Added Loading Check Before Provider Return
**Location**: Line ~228 (before `const value = {...}`)

```javascript
// ✅ ADDED
if (isLoading) {
    return <SplashScreen />;
}

console.log('isAuthenticated:', isAuthenticated);

// Original code continues...
const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    register,
    login,
    loginWithGoogle,
    loginWithDiscord,
    logout,
};

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

**Why**: 
- Shows loading screen while checking stored credentials
- Prevents flash of unauthenticated content
- Added debug log for auth state

---

## 📄 `mini-soundcloud-app/src/screens/UploadScreen.js`

### Change 1: Updated pickAudioFile Function
**Location**: Line ~28-37

```javascript
// ❌ BEFORE
const pickAudioFile = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
            setAudioFile(result);
        }

// ✅ AFTER
const pickAudioFile = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            setAudioFile(result.assets[0]);
        }
```

**Why**: expo-document-picker API changed - now returns `canceled` flag and `assets` array

### Change 2: Enhanced handleUpload with Logging
**Location**: Line ~61-95

```javascript
// ✅ ADDED - Before formData creation
console.log('🎵 AudioFile Object:', JSON.stringify({
    uri: audioFile.uri,
    name: audioFile.name,
    size: audioFile.size,
    mimeType: audioFile.mimeType,
    type: audioFile.type,
}, null, 2));

// ✅ CHANGED - MimeType handling
const audioMimeType = audioFile.mimeType || audioFile.type || 'audio/mpeg';
console.log('📤 Sending audio with mimeType:', audioMimeType);

formData.append('audio_file', {
    uri: audioFile.uri,
    type: audioMimeType,
    name: audioFile.name,
});
```

**Why**: 
- Debug log shows actual file properties
- Fallback for missing mimeType
- Better error diagnosis

### Change 3: Safe File Size Display
**Location**: Line ~217-221

```javascript
// ❌ BEFORE
{audioFile && (
    <Text style={styles.fileName}>
        {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
    </Text>
)}

// ✅ AFTER
{audioFile && (
    <Text style={styles.fileName}>
        {audioFile.name} ({audioFile.size ? (audioFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''})
    </Text>
)}
```

**Why**: Handles case where `audioFile.size` might be undefined

---

## 📄 `mini-soundcloud-app/src/services/api.js`

### Change 1: Enhanced uploadAPI with Logging
**Location**: Line ~110-150

```javascript
// ❌ BEFORE
export const uploadAPI = {
    uploadSong: async (formData, onProgress) => {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/upload/song`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    }
};

// ✅ AFTER
export const uploadAPI = {
    uploadSong: async (formData, onProgress) => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            console.log('📤 Uploading song...');
            console.log('🔐 Token:', token ? 'present' : 'missing');
            
            const response = await axios.post(`${API_URL}/api/upload/song`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`📊 Upload progress: ${percentCompleted}%`);
                        onProgress(percentCompleted);
                    }
                }
            });
            
            console.log('✅ Upload response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Upload error details:');
            console.error('  Status:', error.response?.status);
            console.error('  Message:', error.response?.data?.message);
            console.error('  Error:', error.message);
            throw error;
        }
    }
};
```

**Why**: 
- Detailed logging for each upload step
- Token verification
- Progress tracking
- Detailed error reporting

---

## 📄 `mini-soundcloud-backend/src/routes/upload.js`

### Change 1: Enhanced fileFilter Function
**Location**: Line ~10-40

```javascript
// ❌ BEFORE
const fileFilter = (req, file, cb) => {
    const allowedAudioTypes = process.env.ALLOWED_AUDIO_TYPES.split(',');
    const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES.split(',');

    if (file.fieldname === 'audio_file') {
        if (allowedAudioTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file audio mp3 hoặc wav'), false);
        }
    } else if (file.fieldname === 'cover_image') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh jpg, png hoặc webp'), false);
        }
    } else {
        cb(new Error('Field không hợp lệ'), false);
    }
};

// ✅ AFTER
const fileFilter = (req, file, cb) => {
    const allowedAudioTypes = process.env.ALLOWED_AUDIO_TYPES.split(',');
    const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES.split(',');

    console.log(`[${new Date().toISOString()}] 📎 fileFilter: field=${file.fieldname}, mimetype=${file.mimetype}, originalname=${file.originalname}`);

    if (file.fieldname === 'audio_file') {
        const isAudio = allowedAudioTypes.includes(file.mimetype) 
            || file.mimetype.startsWith('audio/')
            || file.originalname.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i);
        if (isAudio) {
            cb(null, true);
        } else {
            console.log(`[${new Date().toISOString()}] ❌ fileFilter REJECT audio: ${file.mimetype} - ${file.originalname}`);
            cb(new Error(`File audio không hợp lệ: ${file.mimetype} - chỉ chấp nhận mp3, wav, m4a, ogg`), false);
        }
    } else if (file.fieldname === 'cover_image') {
        const isImage = allowedImageTypes.includes(file.mimetype)
            || file.mimetype.startsWith('image/')
            || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        if (isImage) {
            cb(null, true);
        } else {
            console.log(`[${new Date().toISOString()}] ❌ fileFilter REJECT image: ${file.mimetype} - ${file.originalname}`);
            cb(new Error(`File ảnh không hợp lệ: ${file.mimetype} - chỉ chấp nhận jpg, png, webp`), false);
        }
    } else {
        console.log(`[${new Date().toISOString()}] ❌ fileFilter REJECT unknown field: ${file.fieldname}`);
        cb(new Error('Field không hợp lệ'), false);
    }
};
```

**Why**:
- 3-layer validation: mimetype exact, generic prefix, extension match
- Web browsers send files with wrong mimetype - extension match is fallback
- Detailed logging for debugging
- Better error messages including actual mimetype

---

## 📁 Assets Created

### Folder: `mini-soundcloud-app/assets/`

**Files**:
1. `icon.png` (70 bytes - minimal PNG placeholder)
2. `splash.png` (70 bytes - minimal PNG placeholder)
3. `adaptive-icon.png` (70 bytes - minimal PNG placeholder)

**Why**: app.json references these files but they didn't exist - causes build errors

**Generation Method**: 
```powershell
$png = [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
[System.IO.File]::WriteAllBytes("assets/icon.png", $png)
[System.IO.File]::WriteAllBytes("assets/splash.png", $png)
[System.IO.File]::WriteAllBytes("assets/adaptive-icon.png", $png)
```

---

## Summary of Changes by Type

### Frontend Changes: 5 files modified
1. HomeScreen.js - 1 line changed
2. AuthContext.js - 2 lines added
3. UploadScreen.js - ~20 lines changed/added
4. api.js - ~40 lines changed/added
5. assets/ - 3 new files created

### Backend Changes: 1 file modified
1. upload.js - fileFilter function completely rewritten (~30 lines)

### Total: 6 files modified, 3 files created
