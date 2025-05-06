/*
  # Seed Cities Data
  
  Add initial city data for the application
*/

INSERT INTO cities (name)
VALUES
  ('İstanbul'),
  ('Ankara'),
  ('İzmir'),
  ('Antalya'),
  ('Bursa')
ON CONFLICT (name) DO NOTHING;