# 📝 ĐẶC TẢ KIẾN TRÚC DỰ ÁN: APP NGHE NHẠC V1.0

## 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

### Frontend
- **React Native** 0.81.5 với **Expo** 54.0.35 (hỗ trợ iOS, Android, Web)
- **State Management:** React Context API (AuthContext, PlayerContext, ThemeContext, LanguageContext)
- **Routing:** React Navigation v7+ (Stack Navigator, Bottom Tab Navigator)
- **Audio Playback:** expo-audio (recently migrated from expo-av), hỗ trợ chạy ngầm (background audio)
- **HTTP Client:** Axios với JWT Bearer token interceptors và auto-refresh mechanism
- **Local Storage:** AsyncStorage cho tokens, user profile, preferences, history metadata
- **i18n:** i18next hỗ trợ tiếng Anh và tiếng Việt
- **UI Components:** React Native StyleSheet với custom themed components
- **File System:** FileSystem API v2 (updated for compatibility)

### Backend
- **Framework:** Express.js 4.18.2
- **Database:** Supabase (PostgreSQL wrapper) với WebSocket real-time support
- **Authentication:** JWT (jsonwebtoken) + bcryptjs password hashing
- **File Upload:** multer với memory storage, Supabase storage buckets
- **Email Service:** nodemailer cho password reset + OTP
- **Rate Limiting:** express-rate-limit (100 requests per 15 minutes per IP)
- **CORS:** Enabled cho cross-origin requests
- **OAuth:** Facebook OAuth integration + Google/Discord placeholder

### Data Storage
- **Database:** Supabase PostgreSQL (users, songs, play_history, offline_downloads, user_stats tables)
- **File Storage:** Supabase storage buckets (audio files, cover images)
- **Offline Data:** AsyncStorage cho metadata offline downloads

### Current Status
- **Project Completion:** 90% (ready for testing phase)
- **Backend:** 100% complete
- **Frontend Core:** 100% complete
- **Frontend Screens:** 30% complete
- **Components:** 0% complete
- **Last Migration:** Expo SDK 54.0.35, expo-audio integration, FileSystem API v2

---

## 2. SƠ ĐỒ CÂY THƯ MỤC THỰC TẾ (DIRECTORY TREE)
d:\M'SB
├── MY-PROJECT.md (this file)
├── BUG_REPORT.md
├── COMPLETE_SYSTEM_AUDIT.md
├── COMPREHENSIVE_BUG_FIXES.md
├── DUPLICATE_HISTORY_BUG_ANALYSIS.md
├── FINAL_STATUS_REPORT.md
├── FULL_SYSTEM_AUDIT.md
├── IMPLEMENTATION_STATUS.md
├── test_register.json
│
├── mini-soundcloud-app/
│ ├── src/
│ │ ├── screens/ (13 files)
│ │ │ ├── LoginScreen.js
│ │ │ ├── RegisterScreen.js
│ │ │ ├── ForgotPasswordScreen.js
│ │ │ ├── HomeScreen.js
│ │ │ ├── SearchScreen.js
│ │ │ ├── LibraryScreen.js
│ │ │ ├── ProfileScreen.js
│ │ │ ├── PlayerScreen.js
│ │ │ ├── UploadScreen.js
│ │ │ ├── HistoryScreen.js
│ │ │ ├── SettingsScreen.js
│ │ │ ├── EditProfileScreen.js
│ │ │ └── AdminScreen.js
│ │ ├── components/ (7 files)
│ │ │ ├── Button.js
│ │ │ ├── Card.js
│ │ │ ├── Input.js
│ │ │ ├── Loading.js
│ │ │ ├── MiniPlayer.js
│ │ │ ├── SearchBar.js
│ │ │ └── SongCard.js
│ │ ├── contexts/ (4 files)
│ │ │ ├── AuthContext.js
│ │ │ ├── PlayerContext.js
│ │ │ ├── ThemeContext.js
│ │ │ └── LanguageContext.js
│ │ ├── services/
│ │ │ └── api.js (Axios setup)
│ │ ├── utils/
│ │ │ └── storage.js (AsyncStorage operations)
│ │ ├── constants/
│ │ │ ├── api.js
│ │ │ ├── colors.js
│ │ │ └── theme.js
│ │ ├── i18n/
│ │ │ ├── en.json
│ │ │ ├── vi.json
│ │ │ └── index.js
│ │ ├── navigation/
│ │ │ └── AppNavigator.js
│ │ └── App.js
│ ├── android/
│ ├── assets/
│ ├── AGENTS.md
│ ├── CLAUDE.md
│ ├── package.json
│ └── app.json
│
├── mini-soundcloud-backend/
│ ├── src/
│ │ ├── routes/ (9 files)
│ │ │ ├── auth.js
│ │ │ ├── songs.js
│ │ │ ├── upload.js
│ │ │ ├── users.js
│ │ │ ├── playback.js
│ │ │ ├── admin.js
│ │ │ ├── downloads.js
│ │ │ ├── recommendations.js
│ │ │ └── stats.js
│ │ ├── middleware/
│ │ │ ├── authenticate.js
│ │ │ └── authorize.js
│ │ ├── config/
│ │ │ ├── supabase.js
│ │ │ └── email.js
│ │ └── app.js
│ ├── migrations/ (SQL files)
│ │ ├── add_performance_indexes.sql
│ │ ├── add_user_is_active.sql
│ │ └── README.md
│ ├── server.js
│ ├── package.json
│ ├── SETUP_INSTRUCTIONS.md
│ ├── setup.bat
│ ├── setup.sh
│ ├── test-endpoints.js
│ ├── database_migration.sql
│ └── verify-database.js
│
└── OpenedSpec/
├── COMPLETED.md
├── DETAILED_CHANGES.md
├── ISSUES_AND_FIXES.md
├── README.md
├── TESTING_AND_NEXT_STEPS.md
├── databasesupabase.md
└── INTEGRATION_SUMMARY.md (newly created)


---

## 3. PHÂN ĐỊNH TRÁCH NHIỆM FILE (FILE RESPONSIBILITIES)

### Screens (Giao diện người dùng - 13 file)

| File | Mô tả |
|------|-------|
| **LoginScreen.js** | Xử lý đăng nhập email/username, validation form, gọi API login, lưu JWT tokens |
| **RegisterScreen.js** | Form đăng ký tài khoản mới (username, email, password), validation, gọi API register |
| **ForgotPasswordScreen.js** | Nhập email để nhận OTP, reset password qua nodemailer link (password reset flow) |
| **HomeScreen.js** | Hiển thị danh sách bài hát trending/recent, nút upload, toggle theme/language, paddingBottom: 70 |
| **SearchScreen.js** | Real-time search songs theo title/artist với debouncing, live suggestions |
| **LibraryScreen.js** | Hiển thị bài hát do user upload, lấy từ API /api/users/:id/uploads |
| **ProfileScreen.js** | Thông tin user (avatar, stats), nút logout, link tới EditProfileScreen. **Fixed:** Use `response.user.stats.uploads_count` |
| **PlayerScreen.js** | Giao diện phát nhạc toàn màn hình (play/pause, seek bar, shuffle/repeat, volume). **Status:** Seek pending |
| **UploadScreen.js** | Chọn file audio + cover image, validation, upload multipart form-data tới backend. **Fixed:** DocumentPicker API compatibility |
| **HistoryScreen.js** | Danh sách bài hát đã nghe, lấy từ play_history table. **Fixed:** Use `item.songs` not `item.song` |
| **SettingsScreen.js** | Cài đặt theme (light/dark), ngôn ngữ (en/vi), tùy chọn chung |
| **EditProfileScreen.js** | Form cập nhật username, avatar URL, gọi API PUT /api/users/:id |
| **AdminScreen.js** | Quản lý users (list, delete, toggle active), quản lý songs (admin-only). **Fixed:** Use correct stats path |

### Components (Thành phần UI tái sử dụng - 7 file)

| File | Mô tả |
|------|-------|
| **Button.js** | Nút bấm với theming động, support disabled/loading states |
| **Input.js** | Text input field với error message display, placeholder |
| **Card.js** | Generic card container với shadow/border, wrapper cho content |
| **SongCard.js** | Card item hiển thị ảnh bìa, tên bài, artist, play count, handle tap to play |
| **MiniPlayer.js** | Mini player bar ở dưới màn hình, controls (play/pause/next/prev), cover art, song info, 70px height |
| **SearchBar.js** | Input search với debouncing, clear button, placeholder text |
| **Loading.js** | Spinner/loading indicator component |

### Contexts (State Management - 4 file)

| File | Mô tả |
|------|-------|
| **AuthContext.js** | Quản lý user login state, JWT tokens, refresh token logic, session persistence. **Fixed:** Added loading state check for SplashScreen |
| **PlayerContext.js** | Quản lý playback (play/pause, queue, shuffle/repeat modes), expo-audio API wrapper. **Status:** Clean up dead code pending |
| **ThemeContext.js** | Quản lý theme mode (light/dark), system theme detection via Appearance listener, persistent storage |
| **LanguageContext.js** | Quản lý ngôn ngữ hiển thị (en/vi), i18n integration, persistent storage |

### Services & Utilities

| File | Mô tả |
|------|-------|
| **services/api.js** | Axios instance setup, JWT bearer token injection, auto-refresh interceptor, organized API methods (authAPI, songsAPI, usersAPI, uploadAPI, recommendationsAPI). **Enhanced:** Upload logging |
| **utils/storage.js** | AsyncStorage wrapper cho tokens, user profile, theme, language, offline metadata |
| **constants/api.js** | API base URL, endpoints paths |
| **constants/colors.js** | Light/dark theme colors palette |
| **constants/theme.js** | Spacing, fonts, shadows, border radius constants |
| **i18n/en.json & vi.json** | Translation strings cho tiếng Anh và tiếng Việt |

### Navigation

| File | Mô tả |
|------|-------|
| **AppNavigator.js** | Root Stack Navigator, authenticated Tab Navigator (Home/Search/Library/Profile), modal screens (Player/Upload/Settings) |

### Backend Routes (9 API route files)

| File | Endpoints | Mô tả |
|------|-----------|-------|
| **auth.js** | POST /register, /login, /google, /discord, /refresh, /forgot-password, /reset-password, /facebook | JWT authentication, OAuth integration, password reset flow |
| **songs.js** | GET / (paginated), /trending, /search, /:id, DELETE /:id, POST /:id/play | Quản lý bài hát, search, trending, **play_count fixed: direct UPDATE** |
| **upload.js** | POST /song | Multipart form-data upload: audio_file + cover_image, Supabase storage, **enhanced fileFilter** |
| **users.js** | GET /:user_id, PUT /:user_id, GET /:user_id/uploads, GET /:user_id/history | Profile, uploads, play history |
| **playback.js** | POST /history | Log play event: duration_listened_ms, completed flag, **RLS policies fixed** |
| **admin.js** | GET /users, DELETE /users/:id, POST /users/:id/status | User management (admin-only) |
| **downloads.js** | GET /, POST / | Offline download metadata |
| **recommendations.js** | GET /, /similar/:song_id, /recently-played, /top-artists | Recommendation engine |
| **stats.js** | GET /user, /listening, /platform | User analytics, listening statistics |

### Middleware

| File | Mô tả |
|------|-------|
| **authenticate.js** | Extract JWT từ Authorization header, verify token, add req.user object (user_id, username, role, email) |
| **authorize.js** | Role-based access control (RBAC), check req.user.role matches required role (e.g., 'admin') |

### Config

| File | Mô tả |
|------|-------|
| **supabase.js** | Supabase JS client initialization, service key auth, WebSocket transport setup |
| **email.js** | nodemailer integration, password reset token generation (1-hour expiry), OTP logic, Gmail SMTP |

---

## 4. LUỒNG VẬN HÀNH HIỆN TẠI (DATA FLOW)

### Luồng 1: Đăng Nhập & Xác Thực
User Input (LoginScreen)
↓
authAPI.login(credentials) [Axios]
↓
Backend: POST /api/auth/login
↓
Validate password vs bcryptjs hash
↓
Generate JWT + Refresh Token
↓
Response: { accessToken, refreshToken }
↓
AuthContext save tokens → AsyncStorage via storage.js
↓
Axios interceptor: Inject JWT in Authorization header: Bearer <token>
↓
All subsequent API calls authenticated
↓
On 401 response: Auto-refresh token logic triggered
↓
POST /api/auth/refresh with refreshToken
↓
Return new JWT + Retry original request automatically

### Luồng 2: Tìm Kiếm & Khám Phá Bài Hát
HomeScreen Mount
↓
songsAPI.getTrending(10) + songsAPI.getSongs(20, offset=0)
↓
Backend: GET /api/songs/trending, GET /api/songs
↓
Display SongCard components (cover, title, artist, play_count)
↓
User Swipe → SearchScreen
↓
SearchBar input (debounced with 300ms delay)
↓
songsAPI.search(query)
↓
Backend: GET /api/songs/search?q=query
↓
Database LIKE query (title, artist fields) - PARAMETERIZED QUERY needed
↓
Return matching songs list
↓
User Tap Song → PlayerContext.playSong(songId)
↓
expo-audio Audio API loads audio_url from Supabase storage bucket
↓
Audio Playback starts, MiniPlayer visible
↓
MiniPlayer updates UI (current time, duration, play/pause button)

### Luộng 3: Upload Bài Hát

UploadScreen Mount
↓
User Select File (audio + cover image via DocumentPicker/ImagePicker)
↓
Validate: title, artist required; file size < MAX_FILE_SIZE; MIME type check
↓
uploadAPI.uploadSong(FormData with Axios)
↓
Backend: POST /api/upload/song [multipart/form-data]
↓
multer parses request, validates MIME types (audio: mp3/wav/m4a/ogg/aac/flac; image: jpg/png/webp)
↓
Audio file → Supabase storage/songs bucket, receive audio_url
↓
Cover image → Supabase storage/covers bucket, receive cover_url
↓
Backend creates songs table entry (title, artist, audio_url, cover_url, uploaded_by_id, uploaded_at)
↓
Response: { songId, audio_url, cover_url, message: "Upload success" }
↓
Frontend: Toast notification "Upload thành công"
↓
LibraryScreen auto-refresh to show new song

### Luồng 4: Ghi Lại Lịch Sử Nghe & Recommendations

Song Playing in PlayerScreen via expo-audio
↓
expo-audio Audio.Sound emits didJustFinish event when song ends
↓
PlayerContext.recordPlayHistory(songId, duration_ms=true, completed=true) triggered
↓
Frontend: POST /api/playback/history with play_history payload
↓
Backend playback.js: Insert into play_history (user_id, song_id, duration_listened_ms, completed, played_at)
↓
Backend: Increment songs.play_count += 1 via direct UPDATE query (fixed from RPC)
↓
User navigates to HomeScreen
↓
recommendationsAPI.getRecommendations() called
↓
Backend recommendations.js: Query user's play_history (last 30 songs)
↓
Extract unique artists from listening history
↓
Database query: songs from same artists, EXCLUDING already-listened songs
↓
Sort by play_count DESC
↓
Fill gaps with top trending songs (if < 10 results)
↓
Return recommendation list
↓
HomeScreen displays "Recommended For You" section with cards


---

## 5. MỤC TIÊU NÂNG CẤP CHÍNH

### 🎯 Nâng Cấp PWA (Progressive Web App)

**Mục tiêu:** Cài app lên iPhone/Safari không hiển thị thanh địa chỉ, hỗ trợ phát nhạc nền, hiển thị thông tin bài hát trên lock screen

**Các tính năng cần thêm:**
- ✅ Cấu hình Web App Manifest (app.json) với `display: "standalone"`, `start_url: "/"`, icons
- ✅ **Media Session API:** Khi phát nhạc, hiển thị play/pause buttons trên lock screen, thông tin bài hát (title, artist, cover), supporting iOS Control Center
- ✅ **Service Worker:** Cache audio files cho offline playback, background sync khi connection restored
- ✅ **Background Audio Optimization:** Giữ audio stream sống trên web browser (currently hỗ trợ native iOS/Android)

**Lợi ích:**
- iPhone users có thể add app to home screen → full screen experience
- Lock screen controls cho playback (important for driving/fitness scenarios)
- Offline listening with service worker caching
- Standalone app feel (no browser UI)

### 🎯 Tính Năng Phòng Trà Online (Tearoom Feature)

**Mục tiêu:** Tạo phòng nghe chung realtime, đồng bộ phát nhạc giữa chủ phòng và thành viên, chat nhóm

**Các tính năng cần thêm:**

#### Architecture Changes:
- ✅ **WebSocket Integration:** Sử dụng `ws` package (already in backend) hoặc `Socket.io`
- ✅ **Supabase Realtime:** Leverage existing Supabase WebSocket channels cho rooms updates

#### Core Features:
1. **Shared Playback Queue:**
   - Chủ phòng control queue (add/remove/reorder songs)
   - Tất cả thành viên nhìn thấy same queue
   - Real-time queue updates via WebSocket

2. **Real-time Sync:**
   - Bài hát phát trên chủ phòng → tất cả thành viên sync time position (giây phát nhạc)
   - Tolerance: ±200ms để tránh jitter
   - Chủ phòng là ground truth for playback state

3. **Group Chat:**
   - Tin nhắn realtime cho phòng trà
   - User messages, join/leave notifications
   - Message history (last 100 messages)

4. **Room Management:**
   - Create room (with room_name, max_members)
   - Invite codes (alphanumeric, 6 chars, unique)
   - List members (with join time)
   - Leave room
   - Close room (host-only)
   - Permissions: host controls pause/skip, all members can add to queue

#### Database Schema Additions:

```sql
-- Rooms table
CREATE TABLE rooms (
  room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  room_name VARCHAR(100) NOT NULL,
  current_song_id UUID REFERENCES songs(song_id),
  current_time_ms INTEGER DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  queue JSONB DEFAULT '[]'::jsonb,
  max_members INTEGER DEFAULT 50,
  invite_code VARCHAR(6) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE room_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE room_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rooms_host ON rooms(host_user_id);
CREATE INDEX idx_rooms_invite_code ON rooms(invite_code);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_messages_room_time ON room_messages(room_id, sent_at DESC);

Frontend Changes:
New TearoomContext.js for shared state management
New screen: TearoomScreen.js (list active rooms, create/join UI)
New screen: TearoomDetailScreen.js (shared player, queue editor, chat)
WebSocket connection manager
Real-time queue & playback sync
Backend Changes:
New WebSocket route: WS /ws/rooms/:room_id (realtime sync endpoint)
REST endpoints: POST /api/rooms, GET /api/rooms, POST /api/rooms/:id/join, etc.
6. NHỮNG VẤN ĐỀ ĐÃ PHÁT HIỆN & CẬP NHẬT (KNOWN ISSUES & FIXES)
7 Bugs Đã Xác Định
#	Issue	Status	Fix
1	ProfileScreen Stats Bug	✅ FIXED	Reading response.user.stats.uploads_count instead of wrong path
2	play_count Not Incrementing	✅ FIXED	Use direct UPDATE query instead of RPC trigger (no SECURITY DEFINER issue)
3	HistoryScreen Property Mismatch	✅ FIXED	Use item.songs instead of item.song (join alias correction)
4	AdminScreen Stats Display	✅ FIXED	Apply same fix as ProfileScreen (correct stats path)
5	ProgressBar Seek Not Working	⚠️ PENDING	Implement seek() handler in expo-audio wrapper in PlayerContext
6	PlayerContext Dead Code	⚠️ PENDING	Remove unused imports and unused functions - code review needed
7	Play History Duplication	⚠️ PENDING	Multiple play records due to React StrictMode re-renders (see below)
Play History Duplication (Issue #7 - Details)
Problem: Recording same song multiple times due to component re-mounts in React StrictMode or double-checking

Cause: PlayerContext.recordPlayHistory() called multiple times for single song finish event

Solutions Available:

Option A: Backend deduplication (5-second window check on server)
Option B: Frontend debouncing (track last play with timestamp, skip if within 5s)
Option C: Database unique constraint (requires migration)
Recommendation: Implement BOTH Option A (backend) + Option B (frontend) for robustness

Implementation:
// Frontend: Track last play timestamp
let lastPlayTimestamp = 0;
const MIN_PLAY_DURATION = 5000; // 5 seconds

if (Date.now() - lastPlayTimestamp > MIN_PLAY_DURATION) {
  recordPlayHistory(...);
  lastPlayTimestamp = Date.now();
}

6 Security Issues Identified
Issue	Severity	Status
SQL Injection in search endpoint (no parameterized queries)	🔴 CRITICAL	⚠️ PENDING
Password Validation - No minimum strength requirements	🟠 HIGH	⚠️ PENDING
CORS - Too permissive, allows any origin	🟠 HIGH	⚠️ PENDING
Rate Limiting - Current: 100 req/15min (needs stricter on auth routes)	🟠 HIGH	✅ PARTIAL
File Upload Validation - Inadequate MIME type/size checks	🟡 MEDIUM	⚠️ PENDING
JWT Handling - Refresh token not properly secured, missing token rotation	🟡 MEDIUM	⚠️ PENDING
Features Implemented & Tested
✅ Password reset email (Gmail SMTP via nodemailer)
✅ Facebook OAuth login (setup completed)
✅ Direct UPDATE for play_count (bypasses RPC trigger bug)
✅ Expo SDK 54.0.35 compatibility
✅ expo-audio instead of deprecated expo-av
✅ FileSystem API v2 compatibility
✅ RLS policies fixed for playback history recording

7. NHỮNG TÍNH NĂNG & ENDPOINTS CHƯA IMPLEMENT (MISSING FEATURES)
Frontend Screens Chưa Hoàn Thành (10+ screens)
 Playlist management screen
 Comments section screen
 Notifications screen
 Follow/followers management
 Offline mode indicator
 Genre/mood-based browsing
 Advanced search with filters
 Trending page with time period filter
 User discover page
 Sound effect settings
Backend Endpoints Missing (30+ endpoints)
Playlist Management:

 POST /api/playlists (create)
 GET /api/playlists (list user playlists)
 PUT /api/playlists/:id (update)
 DELETE /api/playlists/:id (delete)
 POST /api/playlists/:id/songs (add song)
 DELETE /api/playlists/:id/songs/:song_id (remove song)
Comments & Interactions:

 GET /api/comments/:song_id (list comments)
 POST /api/comments/:song_id (post comment)
 DELETE /api/comments/:id (delete comment)
 POST /api/likes/:song_id (like song)
 DELETE /api/likes/:song_id (unlike song)
Social Features:

 POST /api/users/:id/follow (follow user)
 DELETE /api/users/:id/follow (unfollow)
 GET /api/users/:id/followers (followers list)
 GET /api/users/:id/following (following list)
Notifications & Messaging:

 GET /api/notifications (user notifications)
 POST /api/notifications/:id/read (mark as read)
 WebSocket notifications (real-time)
Discovery & Recommendations:

 GET /api/discover/genres (list genres)
 GET /api/discover/playlists (curated playlists)
 GET /api/trending (advanced trending with period filter)
 POST /api/discover/save (save discovery for later)
Analytics:

 GET /api/stats/trending (detailed stats)
 GET /api/stats/engagement (song engagement metrics)
Database Tables Missing
 playlists table
 playlist_songs table
 comments table
 likes table
 follows table
 notifications table
 genres table
 genres_songs join table
8. CÁC BƯỚC TIẾP THEO & LỘ TRÌNH (NEXT STEPS & ROADMAP)
Phase 1: Testing & Validation (Current - Week 1-2)
Testing Procedures:

Start both servers:

Frontend: npm start in mini-soundcloud-app/
Backend: npm start in mini-soundcloud-backend/ (ensure .env configured)
Test upload flow (5-step procedure):

Step 1: Register new user
Step 2: Navigate to UploadScreen
Step 3: Select audio file + cover image
Step 4: Fill title, artist fields
Step 5: Submit upload, verify success toast
Verify all 9 API route files respond correctly:

Test POST /api/auth/login, /register, /refresh
Test GET /api/songs, /trending, /search
Test POST /api/upload/song with file
Test POST /api/playback/history
Test GET /api/users/:id/history
Test playback history recording:

Play song, let it finish
Check /api/users/:id/history endpoint returns entry
Verify play_count incremented on songs.js GET
Validate security patches applied:

Check rate-limit headers on responses
Test invalid auth (should return 401)
Test unauthorized role access (should return 403)
Success Criteria (11 checkpoints):

All 9 route files respond with correct status codes
Upload creates entries in database + files in storage
Play history records when song finishes
play_count increments correctly
No duplicate play history entries
JWT refresh works on token expiry
ProfileScreen shows correct upload count
HistoryScreen displays play history
Search returns results without SQL errors
Admin endpoints require admin role
Email send works (password reset)
Phase 2: Bug Fixes & Security (Week 3-4)
Remaining Bugs to Fix:

Fix ProgressBar seek() functionality (2-3 days)
Clean up PlayerContext dead code (1 day)
Implement play history deduplication:
Frontend: Add debouncing (5s window check)
Backend: Add deduplication logic
Total: 3-4 days
Security Hardening:

SQL injection prevention: Use parameterized queries in search (1 day)
Password strength: Enforce minimum 8 chars, mixed case, numbers (1 day)
CORS: Restrict to specific origins only (1 day)
File upload: Strict MIME validation + size limits (1 day)
JWT: Implement token rotation, secure refresh token storage (2 days)
Rate limiting: Increase strictness on /auth endpoints (1 day)
Total Phase 2: 10-12 days

Phase 3: PWA Enhancement (Week 5-8)
Implement Media Session API (3-4 days)

Setup metadata (title, artist, cover)
Implement playback controls
Test on iOS lock screen
Add Service Worker (3-4 days)

Offline caching strategy
Background sync
Install prompts
Optimize web background audio (2-3 days)

Create PWA manifest (1 day)

Total Phase 3: 9-12 days

Phase 4: Tearoom Feature (Week 9-14)
Backend (Week 9-10):

Create database schema (rooms, room_members, room_messages) - 2 days
Implement WebSocket server - 3 days
Build REST API endpoints (create, join, queue ops) - 3 days
Implement real-time sync logic - 4 days
Frontend (Week 11-12):

Create TearoomContext for state - 2 days
Build TearoomScreen (list rooms, create UI) - 3 days
Build TearoomDetailScreen (player, queue, chat) - 4 days
Integration & Testing (Week 13-14):

WebSocket connection testing - 2 days
Real-time sync validation (playback position, queue) - 3 days
Bug fixes & performance tuning - 3 days
Total Phase 4: 25-30 days

📋 Ghi Chú Chung
Kiến trúc hiện tại đã sẵn sàng nền tảng cho cả hai nâng cấp này:

✅ Supabase WebSocket đã cấu hình (realtime channel available)
✅ expo-audio hỗ trợ background audio (iOS UIBackgroundModes: ['audio'])
✅ Axios interceptors đã setup (easy to extend)
✅ JWT refresh token logic ready (auto-refresh mechanism)
✅ Role-based authorization (RBAC) in place (admin checks exist)
✅ Rate limiting already enforced (100 req/15min)
✅ Real-time database triggers possible via Supabase functions
✅ Database schema flexible (JSONB queue storage for Tearoom)
Project Dependencies:

Frontend: React Native 0.81.5, Expo 54.0.35, Axios, AsyncStorage, React Navigation, i18next
Backend: Express 4.18.2, Multer, Supabase JS client, JWT, Nodemailer
Database: Supabase PostgreSQL with WebSocket support
Storage: Supabase storage buckets
Testing Tools Available:

test-endpoints.js in backend (manual API testing)
verify-database.js in backend (database connection check)
Console logging in both frontend and backend for debugging
TESTING_AND_NEXT_STEPS.md for detailed procedures
Document Generated: June 3, 2026
Last Updated: Based on integration of 16 markdown files from project root, OpenedSpec/, and mini-soundcloud-backend/
Status: 90% Complete - Ready for Phase 1 Testing


---

Sau khi **paste vào file**, bạn:
1. **Ctrl+A** → Select all
2. **Ctrl+V** → Paste nội dung trên vào file MY-PROJECT.md
3. **Ctrl+S** → Save file

✅ **Xong!** File MY-PROJECT.md sẽ chứa toàn bộ spec đầy đủ 💯---

Sau khi **paste vào file**, bạn:
1. **Ctrl+A** → Select all
2. **Ctrl+V** → Paste nội dung trên vào file MY-PROJECT.md
3. **Ctrl+S** → Save file

✅ **Xong!** File MY-PROJECT.md sẽ chứa toàn bộ spec đầy đủ 💯

