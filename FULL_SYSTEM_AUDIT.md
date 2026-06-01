# 🔍 FULL SYSTEM AUDIT - Mini SoundCloud
## Comprehensive Analysis of All Bugs, Security Issues, and Missing Features

---

## 🔴 CRITICAL BUGS (System Breaking)

### BUG #1: play_count NEVER INCREMENTS
**File:** `mini-soundcloud-backend/src/routes/songs.js`  
**Lines:** 232-241  
**Severity:** 🔴 CRITICAL

**Problem:**
```javascript
// Line 232-234: Calls non-existent RPC function
const { error: updateError } = await supabase.rpc('increment_song_play_count', {
    p_song_id: song_id
});
```

**Root Cause:**
- The RPC function `increment_song_play_count` is NEVER created in the database
- Even if database trigger exists, this RPC call fails silently
- Result: play_count stays at 0 forever

**Fix:**
Replace RPC call with direct UPDATE:
```javascript
// Use direct UPDATE instead of non-existent RPC
const { error: updateError } = await supabase
    .from('songs')
    .update({ 
        play_count: supabase.raw('play_count + 1'),
        last_played: new Date().toISOString()
    })
    .eq('song_id', song_id);
```

---

### BUG #2: ProfileScreen Shows 0 (Already Fixed)
**File:** `mini-soundcloud-app/src/screens/ProfileScreen.js`  
**Lines:** 29-30  
**Severity:** 🔴 CRITICAL

**Status:** ✅ ALREADY FIXED
The code correctly reads `response.user.stats?.uploads_count`

---

### BUG #3: HistoryScreen - Wrong Property Name
**File:** `mini-soundcloud-app/src/screens/HistoryScreen.js`  
**Lines:** 41, 51-63  
**Severity:** 🔴 CRITICAL

**Problem:**
Backend returns `songs` (plural) but frontend uses `song` (singular):
```javascript
// Line 41 - WRONG
const handlePlaySong = (item) => {
    play(item.song);  // ❌ undefined
    navigation.navigate('Player');
};

// Lines 51-63 - WRONG
<Text style={styles.songTitle}>{item.song?.title || 'Unknown'}</Text>
<Text style={styles.artist}>{item.song?.artist || 'Unknown'}</Text>
```

**Backend Query (users.js line 190-200):**
```javascript
.select(`
    *,
    songs:song_id (  // Returns as "songs" (plural)
        song_id,
        title,
        artist,
        ...
    )
`)
```

**Fix:**
Change all `item.song` to `item.songs`:
```javascript
const handlePlaySong = (item) => {
    play(item.songs);  // ✅ CORRECT
    navigation.navigate('Player');
};

<Text style={styles.songTitle}>{item.songs?.title || 'Unknown'}</Text>
<Text style={styles.artist}>{item.songs?.artist || 'Unknown'}</Text>
```

---

## 🟡 IMPORTANT BUGS (Feature Breaking)

### BUG #4: ProgressBar - Seek Not Implemented
**File:** `mini-soundcloud-app/src/components/ProgressBar.js`  
**Lines:** 6-26  
**Severity:** 🟡 IMPORTANT

**Problem:**
1. `handlePress` function defined but never called
2. `TouchableWithoutFeedback` imported but not used in JSX
3. No way for users to seek in songs

**Current Code:**
```javascript
const handlePress = (event) => {
    if (!duration || !onSeek) return;
    const { locationX } = event.nativeEvent;
    // ❌ Does nothing - onSeek never called
};

return (
    <View style={styles.container}>
        <View style={styles.progressBarBg}>  {/* ❌ No touch handler */}
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        ...
    </View>
);
```

**Fix:**
Implement full seek functionality with proper width measurement.

---

### BUG #5: AdminPanel - Wrong Stats Path
**File:** `mini-soundcloud-app/src/screens/AdminPanel.js`  
**Line:** 111  
**Severity:** 🟡 IMPORTANT

**Problem:**
```javascript
<Text style={styles.itemMeta}>
    {item.uploads_count || 0} bài đã đăng • Role: {item.role}  // ❌ WRONG
</Text>
```

**Fix:**
```javascript
<Text style={styles.itemMeta}>
    {item.stats?.uploads_count || 0} bài đã đăng • Role: {item.role}  // ✅ CORRECT
</Text>
```

---

## 🟢 MINOR ISSUES (Code Quality)

### BUG #6: PlayerContext - Unused Code
**File:** `mini-soundcloud-app/src/context/PlayerContext.js`  
**Lines:** 3, 40-53  
**Severity:** 🟢 MINOR

**Problem:**
- `playbackAPI` imported but never used
- `recordHistory` function defined but never called
- Code uses `songsAPI.recordPlay` directly instead

**Fix:**
Remove unused imports and functions for cleaner code.

---

## 🔒 SECURITY ISSUES

### SECURITY #1: SQL Injection in Search
**File:** `mini-soundcloud-backend/src/routes/songs.js`  
**Line:** 82  
**Severity:** 🔴 CRITICAL

**Problem:**
```javascript
.or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
```
User input `query` is directly interpolated into SQL without sanitization.

**Fix:**
Use parameterized queries or proper escaping.

---

### SECURITY #2: No Rate Limiting
**Files:** All backend routes  
**Severity:** 🔴 CRITICAL

**Problem:**
- No rate limiting on any endpoint
- Vulnerable to brute force attacks on `/auth/login`
- Vulnerable to spam on `/songs/:song_id/play`
- Can be DDoS'd easily

**Fix:**
Implement `express-rate-limit` middleware:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts'
});

router.post('/login', authLimiter, async (req, res) => { ... });
```

---

### SECURITY #3: Weak Password Requirements
**File:** `mini-soundcloud-backend/src/routes/auth.js`  
**Line:** 62-67  
**Severity:** 🟡 IMPORTANT

**Problem:**
```javascript
if (password.length < 8) {
    return res.status(400).json({
        success: false,
        message: 'Password phải có ít nhất 8 ký tự'
    });
}
```
Only checks length, no complexity requirements.

**Fix:**
Add password strength validation:
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
    return res.status(400).json({
        success: false,
        message: 'Password phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    });
}
```

---

### SECURITY #4: JWT Secret in Environment
**File:** `mini-soundcloud-backend/.env`  
**Severity:** 🟡 IMPORTANT

**Problem:**
- JWT_SECRET might be weak or default
- No rotation mechanism
- Refresh tokens never expire from database

**Fix:**
1. Use strong random JWT_SECRET (at least 256 bits)
2. Implement token blacklist for logout
3. Store refresh tokens in database with expiry

---

### SECURITY #5: No CORS Configuration
**File:** `mini-soundcloud-backend/src/app.js`  
**Severity:** 🟡 IMPORTANT

**Problem:**
CORS is enabled for all origins:
```javascript
app.use(cors());
```

**Fix:**
Restrict to specific origins:
```javascript
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:19006'],
    credentials: true
}));
```

---

### SECURITY #6: File Upload Validation Missing
**File:** `mini-soundcloud-backend/src/routes/upload.js`  
**Severity:** 🔴 CRITICAL

**Problem:**
- No file size limits enforced in backend
- No MIME type validation
- Could upload malicious files
- Could fill up storage

**Fix:**
Add validation:
```javascript
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Validate before upload
if (audioFile.size > MAX_AUDIO_SIZE) {
    return res.status(400).json({ message: 'File quá lớn' });
}
```

---

## 🚨 DATABASE ISSUES

### DB #1: Missing Indexes
**File:** `OpenedSpec/databasesupabase.md`  
**Severity:** 🟡 IMPORTANT

**Problem:**
No indexes on frequently queried columns:
- `songs.uploaded_by_id` (used in user profile queries)
- `play_history.user_id` (used in history queries)
- `songs.is_public` (used in all song listings)

**Fix:**
Add indexes:
```sql
CREATE INDEX idx_songs_uploaded_by ON songs(uploaded_by_id);
CREATE INDEX idx_songs_is_public ON songs(is_public);
CREATE INDEX idx_play_history_user ON play_history(user_id);
CREATE INDEX idx_play_history_song ON play_history(song_id);
CREATE INDEX idx_play_history_played_at ON play_history(played_at DESC);
```

---

### DB #2: Trigger Missing SECURITY DEFINER
**File:** `OpenedSpec/databasesupabase.md`  
**Lines:** 193-202  
**Severity:** 🟡 IMPORTANT

**Problem:**
```sql
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE songs
  SET play_count  = play_count + 1,
      last_played = NOW()
  WHERE song_id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;  -- ❌ Missing SECURITY DEFINER
```

**Fix:**
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ✅ Add SECURITY DEFINER
```

---

### DB #3: No Cascade Delete Protection
**Severity:** 🟡 IMPORTANT

**Problem:**
When deleting a user, must manually delete:
- Songs
- Play history
- Offline downloads
- Storage files

**Fix:**
Already handled in admin.js, but should be in database triggers for safety.

---

## 📋 MISSING FEATURES

### MISSING #1: Password Reset
**Severity:** 🔴 CRITICAL

**What's Missing:**
- No "Forgot Password" functionality
- Users locked out if they forget password
- No email verification

**Should Implement:**
1. `/auth/forgot-password` endpoint
2. Email with reset token
3. `/auth/reset-password` endpoint
4. Token expiry (15 minutes)

---

### MISSING #2: Email Verification
**Severity:** 🟡 IMPORTANT

**What's Missing:**
- Users can register with fake emails
- No email confirmation required

**Should Implement:**
1. Send verification email on registration
2. `email_verified` field in users table
3. Block certain actions until verified

---

### MISSING #3: Song Likes/Favorites
**Severity:** 🟡 IMPORTANT

**What's Missing:**
- No way to like/favorite songs
- No favorites list
- No "liked songs" section

**Should Implement:**
1. `favorites` table (user_id, song_id, created_at)
2. `/songs/:song_id/like` endpoint
3. `/users/:user_id/favorites` endpoint
4. Heart icon in UI

---

### MISSING #4: Playlists
**Severity:** 🟡 IMPORTANT

**What's Missing:**
- No playlist creation
- No playlist management
- Can't organize songs

**Should Implement:**
1. `playlists` table
2. `playlist_songs` junction table
3. CRUD endpoints for playlists
4. Playlist screen in app

---

### MISSING #5: Comments/Reviews
**Severity:** 🟢 NICE TO HAVE

**What's Missing:**
- No way to comment on songs
- No user interaction
- No feedback mechanism

---

### MISSING #6: Search History
**Severity:** 🟢 NICE TO HAVE

**What's Missing:**
- Search doesn't save history
- No recent searches
- No search suggestions

---

### MISSING #7: Notifications
**Severity:** 🟢 NICE TO HAVE

**What's Missing:**
- No push notifications
- No in-app notifications
- Users don't know about new uploads from followed artists

---

### MISSING #8: Follow System
**Severity:** 🟡 IMPORTANT

**What's Missing:**
- Can't follow other users
- Can't see followed users' uploads
- No social features

---

### MISSING #9: Song Analytics
**Severity:** 🟢 NICE TO HAVE

**What's Missing:**
- Uploaders can't see detailed stats
- No play count over time
- No geographic data
- No listener demographics

---

### MISSING #10: Offline Mode
**Severity:** 🟡 IMPORTANT

**What's Missing:**
- `offline_downloads` table exists but not implemented
- No download functionality
- No offline playback

---

## 🔧 CODE QUALITY ISSUES

### QUALITY #1: No Error Logging Service
**Severity:** 🟡 IMPORTANT

**Problem:**
Only `console.error()` - errors disappear in production

**Fix:**
Integrate Sentry or similar:
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

### QUALITY #2: No Input Sanitization
**Severity:** 🔴 CRITICAL

**Problem:**
User inputs not sanitized (XSS risk)

**Fix:**
```javascript
const validator = require('validator');
const sanitizedTitle = validator.escape(title);
```

---

### QUALITY #3: No API Documentation
**Severity:** 🟡 IMPORTANT

**Problem:**
- No Swagger/OpenAPI docs
- Hard for frontend to know API contract

**Fix:**
Add swagger-jsdoc and swagger-ui-express

---

### QUALITY #4: No Tests
**Severity:** 🔴 CRITICAL

**Problem:**
- Zero unit tests
- Zero integration tests
- No CI/CD

**Fix:**
Add Jest/Mocha tests for all endpoints

---

### QUALITY #5: Hardcoded Strings
**Severity:** 🟢 MINOR

**Problem:**
Error messages hardcoded in Vietnamese

**Fix:**
Use i18n library for internationalization

---

## 📊 PERFORMANCE ISSUES

### PERF #1: N+1 Query Problem
**File:** `mini-soundcloud-backend/src/routes/admin.js`  
**Lines:** 19-49  
**Severity:** 🔴 CRITICAL

**Problem:**
```javascript
const usersWithStats = await Promise.all(
    users.map(async (user) => {
        // ❌ Separate query for EACH user
        const { data: uploadsData } = await supabase
            .from('songs')
            .select('song_id')
            .eq('uploaded_by_id', user.user_id);
        // ...
    })
);
```

With 100 users = 200+ database queries!

**Fix:**
Use aggregation or JOIN:
```javascript
const { data: stats } = await supabase
    .from('songs')
    .select('uploaded_by_id, count(*), sum(play_count)')
    .group('uploaded_by_id');
```

---

### PERF #2: No Caching
**Severity:** 🟡 IMPORTANT

**Problem:**
- Every request hits database
- Trending songs recalculated every time
- User profiles refetched constantly

**Fix:**
Implement Redis caching:
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache trending songs for 5 minutes
const cached = await client.get('trending_songs');
if (cached) return JSON.parse(cached);
```

---

### PERF #3: Large Payload Sizes
**Severity:** 🟡 IMPORTANT

**Problem:**
- Returns full user objects with password_hash
- No pagination on some endpoints
- No field selection

**Fix:**
1. Always exclude sensitive fields
2. Add pagination everywhere
3. Allow field selection: `?fields=title,artist`

---

## 🎯 PRIORITY FIXES (In Order)

### IMMEDIATE (Do First):
1. ✅ Fix play_count increment (BUG #1)
2. ✅ Fix HistoryScreen property name (BUG #3)
3. ✅ Fix AdminPanel stats path (BUG #5)
4. ✅ Add rate limiting (SECURITY #2)
5. ✅ Fix SQL injection (SECURITY #1)
6. ✅ Add file upload validation (SECURITY #6)

### HIGH PRIORITY (Do Soon):
7. ✅ Implement ProgressBar seek (BUG #4)
8. ✅ Add database indexes (DB #1)
9. ✅ Fix N+1 queries (PERF #1)
10. ✅ Add password reset (MISSING #1)
11. ✅ Strengthen password requirements (SECURITY #3)

### MEDIUM PRIORITY:
12. Add email verification (MISSING #2)
13. Implement favorites (MISSING #3)
14. Add playlists (MISSING #4)
15. Implement caching (PERF #2)
16. Add error logging (QUALITY #1)
17. Write tests (QUALITY #4)

### LOW PRIORITY:
18. Add comments (MISSING #5)
19. Add follow system (MISSING #8)
20. Add notifications (MISSING #7)
21. Add API docs (QUALITY #3)

---

## 📝 SUMMARY

**Total Issues Found:** 35+

**Breakdown:**
- 🔴 Critical: 10
- 🟡 Important: 15
- 🟢 Minor/Nice-to-have: 10+

**Main Problems:**
1. play_count never increments (RPC doesn't exist)
2. Multiple property name mismatches
3. No security measures (rate limiting, input validation)
4. Performance issues (N+1 queries, no caching)
5. Missing essential features (password reset, favorites, playlists)

**Next Steps:**
Fix critical bugs first, then security, then features.