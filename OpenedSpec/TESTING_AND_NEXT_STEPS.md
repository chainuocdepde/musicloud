# Mini SoundCloud App - Next Steps & Testing Guide

## 🚀 Immediate Next Steps

### 1. Start Both Servers
```powershell
# Terminal 1: Frontend
cd "d:\M'SB\mini-soundcloud-app"
npm start

# Terminal 2: Backend
cd "d:\M'SB\mini-soundcloud-backend"
npm start
```

### 2. Test Upload Flow
1. Login with your account
2. Navigate to Upload screen
3. Enter song details:
   - Title: "Test Song"
   - Artist: "Test Artist"
   - Description: (optional)
4. Select an MP3 file
   - **Watch console for**: `🎵 AudioFile Object: {...}`
   - Should show: uri, name, size, mimeType, type
5. Click Upload
   - **Watch console for**: `📤 Uploading song...`, progress updates
6. Check backend logs for:
   - `📎 fileFilter: field=audio_file, mimetype=...`
   - Should NOT see: `❌ fileFilter REJECT`
   - Should see: Upload progress to Supabase
   - Should see: Database insert success

### 3. Debug If Still Failing
**Capture Complete Log Output**:
- Copy frontend console (Expo/browser)
- Copy backend console
- Send both to diagnose

---

## 📋 Testing Checklist

### Basic Functionality
- [ ] App starts without crashes
- [ ] Login page works
- [ ] Can login with email/password
- [ ] Can login with Google
- [ ] Can login with Discord
- [ ] Redirects to home after login

### Home Screen
- [ ] Songs list displays
- [ ] Can search for songs
- [ ] Can click song to play
- [ ] Player shows at bottom (fixed padding)
- [ ] Navigation works

### Upload Screen
- [ ] File picker opens
- [ ] Can select MP3 file
- [ ] File name displays
- [ ] File size displays
- [ ] Upload button works
- [ ] Progress bar shows
- [ ] Success message appears
- [ ] New song appears on home screen
- [ ] Console shows detailed logs

### Auth Flow
- [ ] Loading screen shows on startup
- [ ] Stays logged in after restart
- [ ] Logout works
- [ ] Token refresh works

### Error Handling
- [ ] Error messages are clear
- [ ] File validation works
- [ ] Large file rejected (>50MB)
- [ ] Invalid file types rejected

---

## 🔍 What Each Log Means

### Frontend (Expo/Browser Console)

```
📤 Uploading song...        → Upload started
🔐 Token: present           → Auth token found
🎵 AudioFile Object: {...}  → File details logged
📤 Sending audio with mimeType: audio/mpeg  → Mimetype being sent
📊 Upload progress: 25%     → Progress update
✅ Upload response: {...}   → Success!
❌ Upload error details:    → Error occurred
```

### Backend (Node Console)

```
POST /api/upload/song - Bắt đầu upload  → Request received
📎 fileFilter: field=audio_file, mimetype=... → File validation
Nhận request từ user: ... → User details extracted
Đang upload audio lên Supabase Storage...  → Uploading to cloud
Upload audio thành công    → Storage success
Đang insert vào database...  → DB operation
POST /api/upload/song - 201 Created → Success response
```

### Error Scenarios

#### 🔴 400 Bad Request from fileFilter
```
❌ fileFilter REJECT audio: application/octet-stream
```
**Cause**: Mimetype not recognized
**Solution**: Already fixed - should now accept by extension

#### 🔴 401 Unauthorized  
```
No auth log from backend
```
**Cause**: Token not being sent
**Check**: `🔐 Token: present` in frontend logs

#### 🔴 500 Internal Server Error
```
Lỗi upload audio: 
```
**Cause**: Supabase connection issue
**Check**: Backend `.env` has correct Supabase keys

---

## 📊 Expected Response Flow

### Success (201 Created)
```
Frontend:
📤 Uploading song...
🔐 Token: present
📊 Upload progress: 100%
✅ Upload response: {success: true, message: "Đăng bài hát thành công!"}

Backend:
POST /api/upload/song - Bắt đầu upload
Nhận request từ user: username (userid)
Đang upload audio lên Supabase Storage...
Upload audio thành công
Đang insert vào database...
POST /api/upload/song - 201 Created - Thành công
```

### Failure (400 Bad Request)
```
Frontend:
📤 Uploading song...
🔐 Token: present
❌ Upload error details:
  Status: 400
  Message: "File audio không hợp lệ: ..."

Backend:
POST /api/upload/song - Bắt đầu upload
📎 fileFilter: field=audio_file, mimetype=application/octet-stream
❌ fileFilter REJECT audio: application/octet-stream - song.mp3
🔴 Custom Error: File audio không hợp lệ: ...
```

---

## 🛠️ Troubleshooting Guide

### Problem: "Không kết nối được server"
**Possible Causes**:
1. Backend not running - check `npm start` output
2. API_URL wrong - check `.env` in frontend
3. Firewall blocking - try localhost:3000
4. Port already in use - stop other services

**Check**:
- Backend: `http://localhost:3000/api/upload/song` responds
- Frontend: Can check `/api/songs` endpoint
- Console: `🔐 Token: present` means auth works

### Problem: File selected but shows "Thiếu file audio"
**Possible Causes**:
1. File not actually selected (UI bug)
2. audioFile state not updated (React state issue)

**Check**:
- Console: `🎵 AudioFile Object:` logged?
- If no: pickAudioFile didn't execute properly

### Problem: "File audio không hợp lệ"
**Possible Causes**:
1. File has wrong extension
2. Supabase mimetype detection failed

**Check**:
- Console backend: `📎 fileFilter: field=audio_file, mimetype=?`
- Try different file (mp3 vs wav)
- Check file extension is correct

### Problem: File uploads but doesn't appear on home
**Possible Causes**:
1. Database insert failed (cleaned up files)
2. File uploaded but database insert took too long

**Check**:
- Backend console: Do you see "201 Created"?
- Database: Check supabase songs table directly
- Frontend: Refresh home screen

---

## 📝 Notes for Development

### Current State
- ✅ 90% of fixes completed
- ✅ All known bugs fixed
- 🔄 Awaiting full log output to diagnose remaining upload issue

### Files to Monitor
1. `mini-soundcloud-app/src/screens/UploadScreen.js` - Upload logic
2. `mini-soundcloud-app/src/services/api.js` - API calls
3. `mini-soundcloud-backend/src/routes/upload.js` - Backend handler
4. `.env` files - Configuration

### Environment Variables Check
Frontend `.env`:
- `EXPO_PUBLIC_API_URL` - Should be `http://localhost:3000` (local dev)

Backend `.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key
- `ALLOWED_AUDIO_TYPES` - Comma-separated mimetypes
- `ALLOWED_IMAGE_TYPES` - Comma-separated mimetypes
- `MAX_FILE_SIZE` - Max upload size in bytes (50MB = 52428800)

---

## 🎯 Success Criteria

- [ ] User can login
- [ ] User can navigate to upload screen
- [ ] User can select audio file
- [ ] Selected file name displays with size
- [ ] User can click upload
- [ ] Upload shows progress
- [ ] Backend accepts file (no 400 error)
- [ ] File uploads to Supabase
- [ ] Song saved to database
- [ ] Song appears on home screen immediately
- [ ] Console shows no errors

Once all criteria met → Upload feature is complete! ✅
