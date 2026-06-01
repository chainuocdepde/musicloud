-- Migration: Add is_active field to users table
-- Purpose: Enable/disable user accounts
-- Date: 2026-06-02

-- Add is_active column to users table
-- Default to TRUE for existing users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Update existing users to be active by default
UPDATE users
SET is_active = TRUE
WHERE is_active IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_is_active
ON users(is_active);

-- Add comment to document the column
COMMENT ON COLUMN users.is_active IS 'User account status: TRUE = active, FALSE = disabled by admin';
