ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

