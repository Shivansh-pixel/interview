/*
  # Add domain field to interviews table

  1. Changes
    - Add `domain` column to interviews table
    - Make domain field required
*/

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS domain text NOT NULL DEFAULT 'Frontend Development';