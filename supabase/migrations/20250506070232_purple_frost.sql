/*
  # Fix users table RLS policies

  1. Changes
    - Update RLS policies for the users table to properly handle user creation
    - Ensure users can only create their own record with correct role
    - Maintain existing policies for viewing data
  
  2. Security
    - Enable RLS on users table (already enabled)
    - Update insert policy to properly handle user creation
    - Maintain existing select policies
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can create their own record" ON users;

-- Create new insert policy with proper checks
CREATE POLICY "Users can create their own record" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND email = auth.email()
    AND role IN ('admin', 'customer')
  );