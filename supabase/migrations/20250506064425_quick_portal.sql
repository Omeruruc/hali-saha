/*
  # Initial schema for Halısaha Kirala platform

  1. New Tables
    - `users` (auth users with role)
    - `cities` (city list for Turkey)
    - `fields` (soccer fields with owner info)
    - `availabilities` (time slots for each field)
    - `reservations` (customer reservations)
  
  2. Security
    - Row Level Security for all tables
    - Policies for user access control
*/

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'customer')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS fields (
  id serial PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  city_id integer NOT NULL REFERENCES cities(id),
  name text NOT NULL,
  location text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availabilities (
  id serial PRIMARY KEY,
  field_id integer NOT NULL REFERENCES fields(id),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price integer NOT NULL,
  deposit_amount integer NOT NULL,
  is_reserved boolean DEFAULT false,
  UNIQUE (field_id, date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS reservations (
  id serial PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES users(id),
  availability_id integer NOT NULL REFERENCES availabilities(id) UNIQUE,
  deposit_paid boolean DEFAULT false,
  reservation_time timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users table
CREATE POLICY "Users can view their own data" 
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view customer emails for their reservations" 
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN availabilities a ON r.availability_id = a.id
      JOIN fields f ON a.field_id = f.id
      WHERE r.customer_id = users.id AND f.owner_id = auth.uid()
    )
  );

-- Cities table - publicly readable
CREATE POLICY "Cities are public"
  ON cities
  FOR SELECT
  TO authenticated
  USING (true);

-- Fields table
CREATE POLICY "Fields are publicly readable"
  ON fields
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can manage their fields"
  ON fields
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Availabilities table
CREATE POLICY "Availabilities are publicly readable"
  ON availabilities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Field owners can manage availabilities"
  ON availabilities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = availabilities.field_id
      AND fields.owner_id = auth.uid()
    )
  );

-- Reservations table
CREATE POLICY "Customers can view their own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Field owners can view reservations for their fields"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM availabilities a
      JOIN fields f ON a.field_id = f.id
      WHERE a.id = reservations.availability_id
      AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their reservations' payment status"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

-- Insert initial data for cities
INSERT INTO cities (name) VALUES
  ('İstanbul'),
  ('Ankara'),
  ('İzmir'),
  ('Antalya'),
  ('Bursa'),
  ('Adana'),
  ('Konya'),
  ('Trabzon'),
  ('Samsun'),
  ('Kayseri'),
  ('Gaziantep'),
  ('Eskişehir'),
  ('Mersin'),
  ('Diyarbakır')
ON CONFLICT (name) DO NOTHING;