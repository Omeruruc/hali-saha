/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing insert policy that was too restrictive
    - Create new insert policy that allows users to create their own record during signup
    - Policy ensures users can only:
      - Set their own ID (matching their auth.uid())
      - Use their verified email
      - Set role as 'customer' only during signup

  2. Security
    - Maintains security by ensuring users can only create their own record
    - Restricts role to 'customer' for new signups
    - Preserves existing select policies
*/

-- Drop the existing overly restrictive insert policy
DROP POLICY IF EXISTS "Users can create their own record" ON users;

-- Create new insert policy that properly handles signup
CREATE POLICY "Enable user signup" ON users
FOR INSERT TO authenticated
WITH CHECK (
  -- User can only create their own record
  id = auth.uid() 
  -- Email must match their authenticated email
  AND email = auth.email()
  -- New signups can only be customers
  AND role = 'customer'
);