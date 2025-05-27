/*
  # Add INSERT policy for profiles table

  1. Changes
    - Add INSERT policy to allow authenticated users to create their own profile
    
  2. Security
    - Policy ensures users can only insert their own profile data
    - Validates that the email matches their authenticated email
*/

CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND 
    auth.email() = email
  );