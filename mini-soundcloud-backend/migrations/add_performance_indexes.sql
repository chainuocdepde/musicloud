-- Performance Optimization Migration
-- Adds critical indexes to improve query performance and eliminate timeouts
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- SONGS TABLE INDEXES
-- ============================================

-- Index on uploaded_by_id for user uploads queries
CREATE INDEX IF NOT EXISTS idx_songs_uploaded_by_id
ON songs(uploaded_by_id);

-- Index on is_public for filtering public songs
CREATE INDEX IF NOT EXISTS idx_songs_is_public
ON songs(is_public)
WHERE is_public = true;

-- Composite index for public songs ordered by upload date
CREATE INDEX IF NOT EXISTS idx_songs_public_uploaded_at
ON songs(is_public, uploaded_at DESC)
WHERE is_public = true;

-- Index on play_count for trending/sorting queries
CREATE INDEX IF NOT EXISTS idx_songs_play_count
ON songs(play_count DESC);

-- Index on artist for similar songs and search queries
CREATE INDEX IF NOT EXISTS idx_songs_artist
ON songs(artist);

-- Text search indexes for title and artist (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_songs_title_lower
ON songs(LOWER(title));

CREATE INDEX IF NOT EXISTS idx_songs_artist_lower
ON songs(LOWER(artist));

-- ============================================
-- PLAY_HISTORY TABLE INDEXES
-- ============================================

-- Index on user_id for user history queries
CREATE INDEX IF NOT EXISTS idx_play_history_user_id
ON play_history(user_id);

-- Index on song_id for song play tracking
CREATE INDEX IF NOT EXISTS idx_play_history_song_id
ON play_history(song_id);

-- Composite index for user history sorted by date
CREATE INDEX IF NOT EXISTS idx_play_history_user_played_at
ON play_history(user_id, played_at DESC);

-- Composite index for recent plays detection (duplicate prevention)
CREATE INDEX IF NOT EXISTS idx_play_history_user_song_played_at
ON play_history(user_id, song_id, played_at DESC);

-- Index on played_at for date range queries
CREATE INDEX IF NOT EXISTS idx_play_history_played_at
ON play_history(played_at DESC);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index on email for login queries (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Index on username for login queries (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- Index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- ============================================
-- OFFLINE_DOWNLOADS TABLE INDEXES
-- ============================================

-- Index on user_id for user downloads queries
CREATE INDEX IF NOT EXISTS idx_offline_downloads_user_id
ON offline_downloads(user_id);

-- Index on song_id for song download tracking
CREATE INDEX IF NOT EXISTS idx_offline_downloads_song_id
ON offline_downloads(song_id);

-- ============================================
-- VERIFY INDEXES
-- ============================================

-- Check all indexes on songs table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'songs'
ORDER BY indexname;

-- Check all indexes on play_history table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'play_history'
ORDER BY indexname;

-- Check all indexes on users table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- Check all indexes on offline_downloads table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'offline_downloads'
ORDER BY indexname;
