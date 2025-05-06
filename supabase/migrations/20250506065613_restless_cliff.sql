/*
  # Initial Database Schema Setup

  1. Tables
    - users (auth integration, role management)
    - cities (location management)
    - fields (sports field details)
    - availabilities (time slots)
    - reservations (booking management)

  2. Security
    - Enable RLS on all tables
    - Set up appropriate policies for each table
*/

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'customer'))
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Fields Table
CREATE TABLE IF NOT EXISTS fields (
  id serial PRIMARY KEY,
  owner_id uuid REFERENCES users(id) NOT NULL,
  city_id integer REFERENCES cities(id) NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fields_owner_role CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = owner_id 
      AND users.role = 'admin'
    )
  )
);

ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Availabilities Table
CREATE TABLE IF NOT EXISTS availabilities (
  id serial PRIMARY KEY,
  field_id integer REFERENCES fields(id) NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price integer NOT NULL,
  deposit_amount integer NOT NULL,
  is_reserved boolean DEFAULT false,
  CONSTRAINT availabilities_times_check CHECK (end_time > start_time),
  CONSTRAINT availabilities_amounts_check CHECK (deposit_amount < price),
  UNIQUE(field_id, date, start_time, end_time)
);

ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id serial PRIMARY KEY,
  customer_id uuid REFERENCES users(id) NOT NULL,
  availability_id integer REFERENCES availabilities(id) NOT NULL,
  deposit_paid boolean DEFAULT false,
  reservation_time timestamptz DEFAULT now(),
  CONSTRAINT reservations_customer_role CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = customer_id 
      AND users.role = 'customer'
    )
  ),
  UNIQUE(availability_id)
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;