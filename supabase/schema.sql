-- Create status enum
CREATE TYPE location_status AS ENUM ('active', 'inactive');

-- Create type enum
CREATE TYPE location_type AS ENUM ('project', 'storage');

-- Create locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type location_type NOT NULL,
  status location_status DEFAULT 'active' NOT NULL,
  description TEXT,
  
  -- Constraints
  CONSTRAINT name_length CHECK (char_length(name) >= 3)
);

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read locations (publicly available for this demo)
CREATE POLICY "Allow public read access" ON locations
  FOR SELECT USING (true);

-- Insert dummy data for Georgia, USA (Atlanta area)
INSERT INTO locations (name, address, lat, lng, type, status, description) VALUES
('Atlanta Downtown Project', '123 Peachtree St, Atlanta, GA 30303', 33.7537, -84.3863, 'project', 'active', 'Ongoing moving project in Downtown Atlanta'),
('Buckhead Moving', '3400 Around Lenox Rd NE, Atlanta, GA 30326', 33.8472, -84.3621, 'project', 'active', 'Residential move in Buckhead area'),
('Savannah Logistics Hub', '1000 Business Center Dr, Savannah, GA 31405', 32.0835, -81.0998, 'storage', 'active', 'Main storage facility near Savannah port'),
('Marietta Storage', '1100 S Marietta Pkwy SE, Marietta, GA 30060', 33.9526, -84.5499, 'storage', 'active', 'Regional storage center in Marietta');
