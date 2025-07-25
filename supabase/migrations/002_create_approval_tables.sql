-- Create approval_status enum
CREATE TYPE approval_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'needs_info');

-- Create approval_type enum
CREATE TYPE approval_type AS ENUM ('merchant', 'driver');

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  license_number VARCHAR(100) NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_plate VARCHAR(50) NOT NULL,
  vehicle_color VARCHAR(50) NOT NULL,
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(100),
  insurance_expiry DATE,
  background_check_status VARCHAR(50),
  background_check_date DATE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  earnings_total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'inactive',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_profile_id UNIQUE (profile_id)
);

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type approval_type NOT NULL,
  status approval_status DEFAULT 'pending',
  submitted_data JSONB NOT NULL,
  verification_data JSONB,
  admin_notes TEXT,
  internal_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval_documents table
CREATE TABLE IF NOT EXISTS approval_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_approval_requests_profile_id ON approval_requests(profile_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_type ON approval_requests(type);
CREATE INDEX idx_approval_documents_approval_id ON approval_documents(approval_id);
CREATE INDEX idx_drivers_profile_id ON drivers(profile_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Add RLS policies
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for approval_requests
CREATE POLICY "Enable read access for users to their own approval requests"
  ON approval_requests FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Enable insert access for authenticated users"
  ON approval_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Enable read access for admins"
  ON approval_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Enable write access for admins"
  ON approval_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Policies for approval_documents
CREATE POLICY "Enable read access for users to their own documents"
  ON approval_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM approval_requests
    WHERE approval_requests.id = approval_documents.approval_id
    AND approval_requests.profile_id = auth.uid()
  ));

CREATE POLICY "Enable insert access for users to their own documents"
  ON approval_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM approval_requests
    WHERE approval_requests.id = approval_documents.approval_id
    AND approval_requests.profile_id = auth.uid()
  ));

CREATE POLICY "Enable read access for admins to all documents"
  ON approval_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Enable write access for admins to all documents"
  ON approval_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Policies for drivers
CREATE POLICY "Enable read access for users to their own driver profile"
  ON drivers FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Enable read access for admins to all drivers"
  ON drivers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Enable write access for admins to all drivers"
  ON drivers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Policies for notifications
CREATE POLICY "Enable read access for users to their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Enable write access for admins to all notifications"
  ON notifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )); 