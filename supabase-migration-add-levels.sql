-- Add levels column to subjects table
-- This stores which class levels a subject is assigned to (e.g., ["JSS 1", "JSS 2", "SSS 1"])
-- Empty array means the subject has no level assignments (will show via fallback behavior)

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS levels TEXT[] NOT NULL DEFAULT '{}';
