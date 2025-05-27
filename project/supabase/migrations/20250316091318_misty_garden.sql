/*
  # Create interviews table and security policies

  1. New Tables
    - `interviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `difficulty` (text)
      - `duration` (integer)
      - `score` (integer)
      - `feedback` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `interviews` table
    - Add policies for authenticated users to:
      - Read their own interviews
      - Create new interviews
*/

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  difficulty text NOT NULL,
  duration integer NOT NULL,
  score integer,
  feedback jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create interviews"
  ON interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);