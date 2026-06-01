-- Migration: Add password reset functionality to users table
-- Run this SQL in your Supabase SQL Editor

-- Add reset_token column (stores the password reset token)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- Add reset_token_expiry column (stores when the token expires)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token
ON users(reset_token)
WHERE reset_token IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('reset_token', 'reset_token_expiry');
