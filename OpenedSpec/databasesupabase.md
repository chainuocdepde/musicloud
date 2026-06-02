-- ============================================================
-- 🎵 MINI SOUNDCLOUD CUTE - COMPLETE DATABASE SCHEMA
-- Paste toàn bộ file này vào Supabase SQL Editor → Run
-- ============================================================

-- ============================================================
-- STEP 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- STEP 2: DROP TABLES CŨ (nếu cần chạy lại)
-- ============================================================
DROP TABLE IF EXISTS offline_downloads CASCADE;
DROP TABLE IF EXISTS play_history CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS trending_songs CASCADE;
DROP VIEW IF EXISTS recent_songs CASCADE;


-- ============================================================
-- STEP 3: CREATE TABLES
-- ============================================================

-- TABLE: users
CREATE TABLE users (
  user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  avatar_url    TEXT,
  auth_method   VARCHAR(50)  NOT NULL DEFAULT 'password', -- 'password' | 'google' | 'discord'
  role          VARCHAR(50)  NOT NULL DEFAULT 'user',     -- 'user' | 'admin'
  preferences   JSONB        DEFAULT '{"theme":"light","notifications_enabled":true}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_username    ON users(username);
CREATE INDEX idx_users_auth_method ON users(auth_method);
CREATE INDEX idx_users_role        ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_select_public"
  ON users FOR SELECT USING (true);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────

-- TABLE: songs
CREATE TABLE songs (
  song_id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(255) NOT NULL,
  artist           VARCHAR(255) NOT NULL,
  description      TEXT,
  audio_url        TEXT         NOT NULL,
  cover_url        TEXT,
  duration_ms      INTEGER      DEFAULT 0,
  file_size_mb     NUMERIC(10,2),
  uploaded_by_id   UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  uploaded_by_name VARCHAR(255) NOT NULL,
  is_public        BOOLEAN      NOT NULL DEFAULT true,
  play_count       INTEGER      DEFAULT 0,
  last_played      TIMESTAMPTZ,
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_songs_uploaded_by ON songs(uploaded_by_id);
CREATE INDEX idx_songs_title       ON songs(title);
CREATE INDEX idx_songs_artist      ON songs(artist);
CREATE INDEX idx_songs_play_count  ON songs(play_count DESC);
CREATE INDEX idx_songs_created_at  ON songs(created_at DESC);
CREATE INDEX idx_songs_is_public   ON songs(is_public);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "songs_select_public"
  ON songs FOR SELECT USING (is_public = true);

CREATE POLICY "songs_select_own"
  ON songs FOR SELECT USING (auth.uid() = uploaded_by_id);

CREATE POLICY "songs_insert_auth"
  ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "songs_update_owner_or_admin"
  ON songs FOR UPDATE
  USING (auth.uid() = uploaded_by_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "songs_delete_owner_or_admin"
  ON songs FOR DELETE
  USING (auth.uid() = uploaded_by_id OR auth.jwt() ->> 'role' = 'admin');


-- ─────────────────────────────────────────────────────────────

-- TABLE: play_history
CREATE TABLE play_history (
  history_id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  song_id              UUID        NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  played_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_listened_ms INTEGER     NOT NULL DEFAULT 0,
  completed            BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ph_user_id   ON play_history(user_id);
CREATE INDEX idx_ph_song_id   ON play_history(song_id);
CREATE INDEX idx_ph_played_at ON play_history(played_at DESC);
CREATE INDEX idx_ph_user_time ON play_history(user_id, played_at DESC);

ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ph_select_own"
  ON play_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ph_select_admin"
  ON play_history FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "ph_insert_own"
  ON play_history FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────

-- TABLE: offline_downloads
CREATE TABLE offline_downloads (
  download_id  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  song_id      UUID         NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  local_path   TEXT         NOT NULL,
  file_size_mb NUMERIC(10,2),
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_song UNIQUE (user_id, song_id)
);

CREATE INDEX idx_od_user_id ON offline_downloads(user_id);
CREATE INDEX idx_od_song_id ON offline_downloads(song_id);

ALTER TABLE offline_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "od_select_own"
  ON offline_downloads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "od_insert_own"
  ON offline_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "od_delete_own"
  ON offline_downloads FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- STEP 4: AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- STEP 5: AUTO-INCREMENT play_count TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE songs
  SET play_count  = play_count + 1,
      last_played = NOW()
  WHERE song_id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_play_count
  AFTER INSERT ON play_history
  FOR EACH ROW EXECUTE FUNCTION increment_play_count();


-- ============================================================
-- STEP 6: VIEWS
-- ============================================================

-- User statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.user_id,
  u.username,
  u.avatar_url,
  COUNT(DISTINCT s.song_id)    AS uploads_count,
  COALESCE(SUM(s.play_count), 0) AS total_plays,
  COUNT(DISTINCT ph.history_id) AS songs_listened
FROM users u
LEFT JOIN songs        s  ON u.user_id = s.uploaded_by_id
LEFT JOIN play_history ph ON u.user_id = ph.user_id
GROUP BY u.user_id, u.username, u.avatar_url;

-- Trending songs (top 10 play count)
CREATE OR REPLACE VIEW trending_songs AS
SELECT
  song_id, title, artist, cover_url,
  uploaded_by_name, play_count, last_played, uploaded_at
FROM songs
WHERE is_public = true
ORDER BY play_count DESC
LIMIT 10;

-- Recent songs (10 mới nhất)
CREATE OR REPLACE VIEW recent_songs AS
SELECT
  song_id, title, artist, cover_url,
  uploaded_by_name, uploaded_at, play_count
FROM songs
WHERE is_public = true
ORDER BY uploaded_at DESC
LIMIT 10;


-- ============================================================
-- STEP 7: SAMPLE DATA (tuỳ chọn, xoá nếu không cần)
-- ============================================================

-- Admin user (password: Admin@123 → cần hash thật khi dùng bcrypt)
INSERT INTO users (username, email, password_hash, auth_method, role, avatar_url)
VALUES (
  'admin',
  'admin@spotyfi.local',
  '$2b$10$PLACEHOLDER_HASH_REPLACE_ME',
  'password',
  'admin',
  'https://api.dicebear.com/7.x/bottts/svg?seed=admin'
);

-- Demo user
INSERT INTO users (username, email, password_hash, auth_method, role, avatar_url)
VALUES (
  'meo_con',
  'meo@spotyfi.local',
  '$2b$10$PLACEHOLDER_HASH_REPLACE_ME',
  'password',
  'user',
  'https://api.dicebear.com/7.x/bottts/svg?seed=meocon'
);

-- Demo song (chỉ chạy SAU KHI có user thật trong bảng)
-- INSERT INTO songs (title, artist, audio_url, cover_url, duration_ms, uploaded_by_id, uploaded_by_name)
-- VALUES (
--   'Lofi Chill Vibes', 'Lofi Artist',
--   'https://example.com/songs/lofi.mp3',
--   'https://example.com/covers/lofi.jpg',
--   180000,
--   (SELECT user_id FROM users WHERE username = 'meo_con'),
--   'meo_con'
-- );


INSERT INTO storage.buckets (id, name, public) 
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

 ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
  CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
  
-- ============================================================
-- DONE ✅  Chạy xong → vào Table Editor để verify
-- ============================================================
-- ============================================================
-- 🎵 BẢN UPDATE: THÊM TÍNH NĂNG SPOTIFY & PHÒNG TRÀ (TEAROOM)
-- Chạy đoạn mã này vào Supabase SQL Editor để nâng cấp
-- ============================================================

-- ==========================================
-- 1. TÍNH NĂNG: LIKED SONGS (THẢ TIM)
-- ==========================================
CREATE TABLE liked_songs (
  like_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  song_id     UUID NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  liked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Mỗi user chỉ được thả tim 1 bài 1 lần
  CONSTRAINT uq_user_song_like UNIQUE (user_id, song_id)
);

CREATE INDEX idx_likes_user ON liked_songs(user_id);
CREATE INDEX idx_likes_song ON liked_songs(song_id);

ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_own" ON liked_songs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "likes_insert_own" ON liked_songs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON liked_songs FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 2. TÍNH NĂNG: PLAYLISTS (DANH SÁCH PHÁT)
-- ==========================================
CREATE TABLE playlists (
  playlist_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  is_public     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng nối: Lưu các bài hát nằm trong playlist nào
CREATE TABLE playlist_songs (
  ps_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id   UUID NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
  song_id       UUID NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_index   INTEGER DEFAULT 0, -- Để user có thể kéo thả sắp xếp bài hát
  
  CONSTRAINT uq_playlist_song UNIQUE (playlist_id, song_id)
);

CREATE INDEX idx_playlists_owner ON playlists(owner_id);
CREATE INDEX idx_ps_playlist ON playlist_songs(playlist_id);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlists_select_public" ON playlists FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "playlists_all_own" ON playlists USING (auth.uid() = owner_id);

ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_select_public" ON playlist_songs FOR SELECT USING (
  EXISTS (SELECT 1 FROM playlists WHERE playlist_id = playlist_songs.playlist_id AND (is_public = true OR owner_id = auth.uid()))
);
CREATE POLICY "ps_all_own" ON playlist_songs USING (
  EXISTS (SELECT 1 FROM playlists WHERE playlist_id = playlist_songs.playlist_id AND owner_id = auth.uid())
);


-- ==========================================
-- 3. TÍNH NĂNG: FOLLOWS (MẠNG XÃ HỘI)
-- ==========================================
CREATE TABLE follows (
  follow_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Không thể follow chính mình, và không follow trùng lặp
  CONSTRAINT uq_follower_following UNIQUE (follower_id, following_id),
  CONSTRAINT chk_not_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (auth.uid() = follower_id);


-- ==========================================
-- 4. TÍNH NĂNG: TEAROOM (PHÒNG TRÀ ONLINE)
-- ==========================================
CREATE TABLE rooms (
  room_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  room_name       VARCHAR(100) NOT NULL,
  current_song_id UUID REFERENCES songs(song_id) ON DELETE SET NULL,
  current_time_ms INTEGER DEFAULT 0,
  is_playing      BOOLEAN DEFAULT false,
  queue           JSONB DEFAULT '[]'::jsonb, -- Lưu dạng JSON cho nhẹ, dễ update realtime
  max_members     INTEGER DEFAULT 50,
  invite_code     VARCHAR(6) UNIQUE,         -- Mã join phòng (VD: A8FX9Q)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_members (
  member_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_room_user UNIQUE(room_id, user_id)
);

CREATE TABLE room_messages (
  message_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_host ON rooms(host_user_id);
CREATE INDEX idx_rooms_invite ON rooms(invite_code);
CREATE INDEX idx_rm_room ON room_members(room_id);
CREATE INDEX idx_rmsg_room ON room_messages(room_id, sent_at DESC);

-- Bật Realtime cho phòng trà
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;


-- ============================================================
-- 🎵 MINI SOUNDCLOUD CUTE - COMPLETE DATABASE SCHEMA
-- Paste toàn bộ file này vào Supabase SQL Editor → Run
-- ============================================================

-- ============================================================
-- STEP 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- STEP 2: DROP TABLES CŨ (nếu cần chạy lại)
-- ============================================================
DROP TABLE IF EXISTS offline_downloads CASCADE;
DROP TABLE IF EXISTS play_history CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS trending_songs CASCADE;
DROP VIEW IF EXISTS recent_songs CASCADE;


-- ============================================================
-- STEP 3: CREATE TABLES
-- ============================================================

-- TABLE: users
CREATE TABLE users (
  user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  avatar_url    TEXT,
  auth_method   VARCHAR(50)  NOT NULL DEFAULT 'password', -- 'password' | 'google' | 'discord'
  role          VARCHAR(50)  NOT NULL DEFAULT 'user',     -- 'user' | 'admin'
  preferences   JSONB        DEFAULT '{"theme":"light","notifications_enabled":true}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_username    ON users(username);
CREATE INDEX idx_users_auth_method ON users(auth_method);
CREATE INDEX idx_users_role        ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_select_public"
  ON users FOR SELECT USING (true);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────

-- TABLE: songs
CREATE TABLE songs (
  song_id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(255) NOT NULL,
  artist           VARCHAR(255) NOT NULL,
  description      TEXT,
  audio_url        TEXT         NOT NULL,
  cover_url        TEXT,
  duration_ms      INTEGER      DEFAULT 0,
  file_size_mb     NUMERIC(10,2),
  uploaded_by_id   UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  uploaded_by_name VARCHAR(255) NOT NULL,
  is_public        BOOLEAN      NOT NULL DEFAULT true,
  play_count       INTEGER      DEFAULT 0,
  last_played      TIMESTAMPTZ,
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_songs_uploaded_by ON songs(uploaded_by_id);
CREATE INDEX idx_songs_title       ON songs(title);
CREATE INDEX idx_songs_artist      ON songs(artist);
CREATE INDEX idx_songs_play_count  ON songs(play_count DESC);
CREATE INDEX idx_songs_created_at  ON songs(created_at DESC);
CREATE INDEX idx_songs_is_public   ON songs(is_public);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "songs_select_public"
  ON songs FOR SELECT USING (is_public = true);

CREATE POLICY "songs_select_own"
  ON songs FOR SELECT USING (auth.uid() = uploaded_by_id);

CREATE POLICY "songs_insert_auth"
  ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "songs_update_owner_or_admin"
  ON songs FOR UPDATE
  USING (auth.uid() = uploaded_by_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "songs_delete_owner_or_admin"
  ON songs FOR DELETE
  USING (auth.uid() = uploaded_by_id OR auth.jwt() ->> 'role' = 'admin');


-- ─────────────────────────────────────────────────────────────

-- TABLE: play_history
CREATE TABLE play_history (
  history_id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  song_id              UUID        NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  played_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_listened_ms INTEGER     NOT NULL DEFAULT 0,
  completed            BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ph_user_id   ON play_history(user_id);
CREATE INDEX idx_ph_song_id   ON play_history(song_id);
CREATE INDEX idx_ph_played_at ON play_history(played_at DESC);
CREATE INDEX idx_ph_user_time ON play_history(user_id, played_at DESC);

ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ph_select_own"
  ON play_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ph_select_admin"
  ON play_history FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "ph_insert_own"
  ON play_history FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────

-- TABLE: offline_downloads
CREATE TABLE offline_downloads (
  download_id  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  song_id      UUID         NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  local_path   TEXT         NOT NULL,
  file_size_mb NUMERIC(10,2),
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_song UNIQUE (user_id, song_id)
);

CREATE INDEX idx_od_user_id ON offline_downloads(user_id);
CREATE INDEX idx_od_song_id ON offline_downloads(song_id);

ALTER TABLE offline_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "od_select_own"
  ON offline_downloads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "od_insert_own"
  ON offline_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "od_delete_own"
  ON offline_downloads FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- STEP 4: AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- STEP 5: AUTO-INCREMENT play_count TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE songs
  SET play_count  = play_count + 1,
      last_played = NOW()
  WHERE song_id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_play_count
  AFTER INSERT ON play_history
  FOR EACH ROW EXECUTE FUNCTION increment_play_count();


-- ============================================================
-- STEP 6: VIEWS
-- ============================================================

-- User statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.user_id,
  u.username,
  u.avatar_url,
  COUNT(DISTINCT s.song_id)    AS uploads_count,
  COALESCE(SUM(s.play_count), 0) AS total_plays,
  COUNT(DISTINCT ph.history_id) AS songs_listened
FROM users u
LEFT JOIN songs        s  ON u.user_id = s.uploaded_by_id
LEFT JOIN play_history ph ON u.user_id = ph.user_id
GROUP BY u.user_id, u.username, u.avatar_url;

-- Trending songs (top 10 play count)
CREATE OR REPLACE VIEW trending_songs AS
SELECT
  song_id, title, artist, cover_url,
  uploaded_by_name, play_count, last_played, uploaded_at
FROM songs
WHERE is_public = true
ORDER BY play_count DESC
LIMIT 10;

-- Recent songs (10 mới nhất)
CREATE OR REPLACE VIEW recent_songs AS
SELECT
  song_id, title, artist, cover_url,
  uploaded_by_name, uploaded_at, play_count
FROM songs
WHERE is_public = true
ORDER BY uploaded_at DESC
LIMIT 10;


-- ============================================================
-- STEP 7: SAMPLE DATA (tuỳ chọn, xoá nếu không cần)
-- ============================================================

-- Admin user (password: Admin@123 → cần hash thật khi dùng bcrypt)
INSERT INTO users (username, email, password_hash, auth_method, role, avatar_url)
VALUES (
  'admin',
  'admin@spotyfi.local',
  '$2b$10$PLACEHOLDER_HASH_REPLACE_ME',
  'password',
  'admin',
  'https://api.dicebear.com/7.x/bottts/svg?seed=admin'
);

-- Demo user
INSERT INTO users (username, email, password_hash, auth_method, role, avatar_url)
VALUES (
  'meo_con',
  'meo@spotyfi.local',
  '$2b$10$PLACEHOLDER_HASH_REPLACE_ME',
  'password',
  'user',
  'https://api.dicebear.com/7.x/bottts/svg?seed=meocon'
);

-- Demo song (chỉ chạy SAU KHI có user thật trong bảng)
-- INSERT INTO songs (title, artist, audio_url, cover_url, duration_ms, uploaded_by_id, uploaded_by_name)
-- VALUES (
--   'Lofi Chill Vibes', 'Lofi Artist',
--   'https://example.com/songs/lofi.mp3',
--   'https://example.com/covers/lofi.jpg',
--   180000,
--   (SELECT user_id FROM users WHERE username = 'meo_con'),
--   'meo_con'
-- );


-- ============================================================
-- DONE ✅  Chạy xong → vào Table Editor để verify
-- ============================================================


INSERT INTO storage.buckets (id, name, public) 
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO users (user_id, username, email, auth_method, role)
VALUES (
  'bb9cc83e-fddb-44a9-8d8c-3a299d896a84',
  'bao',
  'truongconggiabao86@gmail.com',
  'password',
  'admin'
)
ON CONFLICT (user_id) DO NOTHING;

UPDATE users 
SET password_hash = '$2b$10$X9mDWqGvXUBQqMBD7RWnBuCHm4eCNwZJzHTSXQ1OqeGxDrXQxrxsS'
WHERE user_id = 'bb9cc83e-fddb-44a9-8d8c-3a299d896a84';


 ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
  CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;


  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;


  -- ============================================================
-- 🎵 BẢN UPDATE: THÊM TÍNH NĂNG SPOTIFY & PHÒNG TRÀ (TEAROOM)
-- Chạy đoạn mã này vào Supabase SQL Editor để nâng cấp
-- ============================================================

-- ==========================================
-- 1. TÍNH NĂNG: LIKED SONGS (THẢ TIM)
-- ==========================================
CREATE TABLE liked_songs (
  like_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  song_id     UUID NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  liked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Mỗi user chỉ được thả tim 1 bài 1 lần
  CONSTRAINT uq_user_song_like UNIQUE (user_id, song_id)
);

CREATE INDEX idx_likes_user ON liked_songs(user_id);
CREATE INDEX idx_likes_song ON liked_songs(song_id);

ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_own" ON liked_songs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "likes_insert_own" ON liked_songs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON liked_songs FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 2. TÍNH NĂNG: PLAYLISTS (DANH SÁCH PHÁT)
-- ==========================================
CREATE TABLE playlists (
  playlist_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  is_public     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng nối: Lưu các bài hát nằm trong playlist nào
CREATE TABLE playlist_songs (
  ps_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id   UUID NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
  song_id       UUID NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_index   INTEGER DEFAULT 0, -- Để user có thể kéo thả sắp xếp bài hát
  
  CONSTRAINT uq_playlist_song UNIQUE (playlist_id, song_id)
);

CREATE INDEX idx_playlists_owner ON playlists(owner_id);
CREATE INDEX idx_ps_playlist ON playlist_songs(playlist_id);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlists_select_public" ON playlists FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "playlists_all_own" ON playlists USING (auth.uid() = owner_id);

ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_select_public" ON playlist_songs FOR SELECT USING (
  EXISTS (SELECT 1 FROM playlists WHERE playlist_id = playlist_songs.playlist_id AND (is_public = true OR owner_id = auth.uid()))
);
CREATE POLICY "ps_all_own" ON playlist_songs USING (
  EXISTS (SELECT 1 FROM playlists WHERE playlist_id = playlist_songs.playlist_id AND owner_id = auth.uid())
);


-- ==========================================
-- 3. TÍNH NĂNG: FOLLOWS (MẠNG XÃ HỘI)
-- ==========================================
CREATE TABLE follows (
  follow_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Không thể follow chính mình, và không follow trùng lặp
  CONSTRAINT uq_follower_following UNIQUE (follower_id, following_id),
  CONSTRAINT chk_not_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (auth.uid() = follower_id);


-- ==========================================
-- 4. TÍNH NĂNG: TEAROOM (PHÒNG TRÀ ONLINE)
-- ==========================================
CREATE TABLE rooms (
  room_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  room_name       VARCHAR(100) NOT NULL,
  current_song_id UUID REFERENCES songs(song_id) ON DELETE SET NULL,
  current_time_ms INTEGER DEFAULT 0,
  is_playing      BOOLEAN DEFAULT false,
  queue           JSONB DEFAULT '[]'::jsonb, -- Lưu dạng JSON cho nhẹ, dễ update realtime
  max_members     INTEGER DEFAULT 50,
  invite_code     VARCHAR(6) UNIQUE,         -- Mã join phòng (VD: A8FX9Q)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_members (
  member_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_room_user UNIQUE(room_id, user_id)
);

CREATE TABLE room_messages (
  message_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_host ON rooms(host_user_id);
CREATE INDEX idx_rooms_invite ON rooms(invite_code);
CREATE INDEX idx_rm_room ON room_members(room_id);
CREATE INDEX idx_rmsg_room ON room_messages(room_id, sent_at DESC);

-- Bật Realtime cho phòng trà
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;


-- Cấp quyền (Policies) cho các bảng Phòng trà (Tearoom)

-- 1. Bảng Rooms (Phòng)
CREATE POLICY "rooms_select_all" ON rooms FOR SELECT USING (true); -- Ai cũng xem được danh sách phòng
CREATE POLICY "rooms_insert_auth" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Đăng nhập mới được tạo
CREATE POLICY "rooms_update_host" ON rooms FOR UPDATE USING (auth.uid() = host_user_id); -- Chỉ chủ phòng được sửa tên/queue
CREATE POLICY "rooms_delete_host" ON rooms FOR DELETE USING (auth.uid() = host_user_id); -- Chỉ chủ phòng được xoá

-- 2. Bảng Room Members (Thành viên)
CREATE POLICY "rm_select_all" ON room_members FOR SELECT USING (true);
CREATE POLICY "rm_insert_auth" ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rm_delete_own" ON room_members FOR DELETE USING (auth.uid() = user_id);

-- 3. Bảng Room Messages (Chat)
CREATE POLICY "rmsg_select_all" ON room_messages FOR SELECT USING (true);
CREATE POLICY "rmsg_insert_auth" ON room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);