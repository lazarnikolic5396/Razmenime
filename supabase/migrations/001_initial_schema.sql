-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enums
CREATE TYPE user_role AS ENUM ('user', 'organization', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE ad_status AS ENUM ('active', 'inactive', 'deleted', 'removed_by_admin');
CREATE TYPE request_status AS ENUM ('active', 'fulfilled', 'closed', 'removed');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE requester_type AS ENUM ('organization', 'family');
CREATE TYPE condition AS ENUM ('odlično', 'dobro', 'solidno');

-- Create profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  user_role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  registration_number TEXT,
  logo_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  description TEXT,
  family_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Srbija',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geometry geography(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on geometry for spatial queries
CREATE INDEX idx_locations_geometry ON locations USING GIST(geometry);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_country ON locations(country);

-- Create ads table
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  location_id UUID REFERENCES locations(id),
  image_urls TEXT[] DEFAULT '{}',
  status ad_status DEFAULT 'active',
  condition condition NOT NULL,
  removed_reason TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on ads
CREATE INDEX idx_ads_user_id ON ads(user_id);
CREATE INDEX idx_ads_category_id ON ads(category_id);
CREATE INDEX idx_ads_location_id ON ads(location_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX idx_ads_title_desc ON ads USING gin(to_tsvector('serbian', title || ' ' || description));

-- Create donation_requests table
CREATE TABLE donation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requester_type requester_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  location_id UUID REFERENCES locations(id),
  image_urls TEXT[] DEFAULT '{}',
  quantity_needed INTEGER,
  quantity_received INTEGER DEFAULT 0,
  status request_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on donation_requests
CREATE INDEX idx_donation_requests_requester_id ON donation_requests(requester_id);
CREATE INDEX idx_donation_requests_requester_type ON donation_requests(requester_type);
CREATE INDEX idx_donation_requests_category_id ON donation_requests(category_id);
CREATE INDEX idx_donation_requests_status ON donation_requests(status);

-- Create donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES donation_requests(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on donations
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_request_id ON donations(request_id);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_participants CHECK (participant_1_id < participant_2_id),
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id)
);

-- Create indexes on conversations
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on activity_logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Create reported_content table
CREATE TABLE reported_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes on reported_content
CREATE INDEX idx_reported_content_reporter_id ON reported_content(reporter_id);
CREATE INDEX idx_reported_content_resource ON reported_content(resource_type, resource_id);
CREATE INDEX idx_reported_content_status ON reported_content(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donation_requests_updated_at BEFORE UPDATE ON donation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for messages
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Create function to update donation_requests quantity_received
CREATE OR REPLACE FUNCTION update_donation_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE donation_requests
  SET quantity_received = quantity_received + NEW.quantity
  WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donations
CREATE TRIGGER update_quantity_on_donation
  AFTER INSERT ON donations
  FOR EACH ROW EXECUTE FUNCTION update_donation_quantity();

-- Create function to set geometry from lat/lng
CREATE OR REPLACE FUNCTION set_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geometry = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for locations
CREATE TRIGGER set_geometry_on_location
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_location_geometry();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;

