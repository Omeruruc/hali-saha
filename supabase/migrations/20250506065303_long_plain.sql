/*
  # Add insert policy for users table
  
  1. Changes
    - Add policy to allow users to create their own record during signup
    
  2. Security
    - Policy ensures users can only insert their own data
    - Validates that the ID and email match the authenticated user
*/

CREATE POLICY "Users can create their own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND auth.email() = email
  );