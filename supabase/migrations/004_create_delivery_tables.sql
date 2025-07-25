-- Create delivery status enum
CREATE TYPE delivery_status AS ENUM (
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'failed'
);

-- Update driver_applications table
ALTER TABLE driver_applications DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS driver_license_number;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS vehicle_make;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS vehicle_model;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS vehicle_year;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS vehicle_plate;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS emergency_contact_name;
ALTER TABLE driver_applications DROP COLUMN IF EXISTS emergency_contact_phone;

ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS address JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS vehicle_info JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  driver_id UUID NOT NULL REFERENCES profiles(id),
  status delivery_status NOT NULL DEFAULT 'assigned',
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_delivery_time TIMESTAMPTZ NOT NULL,
  actual_delivery_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  status delivery_status NOT NULL,
  location JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery ratings table
CREATE TABLE IF NOT EXISTS delivery_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create driver earnings table
CREATE TABLE IF NOT EXISTS driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES profiles(id),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  base_amount DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create driver availability table
CREATE TABLE IF NOT EXISTS driver_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES profiles(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (driver_id, day_of_week)
);

-- Create driver status table
CREATE TABLE IF NOT EXISTS driver_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_location JSONB,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_delivery_tracking_delivery_id ON delivery_tracking(delivery_id);
CREATE INDEX idx_delivery_ratings_delivery_id ON delivery_ratings(delivery_id);
CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX idx_driver_availability_driver_id ON driver_availability(driver_id);
CREATE INDEX idx_driver_status_driver_id ON driver_status(driver_id);

-- Add RLS policies
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_status ENABLE ROW LEVEL SECURITY;

-- Deliveries policies
CREATE POLICY "Drivers can view their assigned deliveries"
  ON deliveries FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Admins can manage all deliveries"
  ON deliveries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Delivery tracking policies
CREATE POLICY "Drivers can view and create tracking for their deliveries"
  ON delivery_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_tracking.delivery_id
      AND deliveries.driver_id = auth.uid()
    )
  );

-- Delivery ratings policies
CREATE POLICY "Customers can rate their deliveries"
  ON delivery_ratings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can view their own ratings"
  ON delivery_ratings FOR SELECT
  USING (auth.uid() = customer_id);

-- Driver earnings policies
CREATE POLICY "Drivers can view their earnings"
  ON driver_earnings FOR SELECT
  USING (auth.uid() = driver_id);

-- Driver availability policies
CREATE POLICY "Drivers can manage their availability"
  ON driver_availability FOR ALL
  USING (auth.uid() = driver_id);

-- Driver status policies
CREATE POLICY "Drivers can manage their status"
  ON driver_status FOR ALL
  USING (auth.uid() = driver_id);

CREATE POLICY "Anyone can view driver status"
  ON driver_status FOR SELECT
  USING (true);

-- Add triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_driver_earnings_updated_at
  BEFORE UPDATE ON driver_earnings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_driver_availability_updated_at
  BEFORE UPDATE ON driver_availability
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Add trigger for calculating earnings
CREATE OR REPLACE FUNCTION calculate_delivery_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Basic calculation: $5 base + $0.50 per minute of estimated delivery time
    INSERT INTO driver_earnings (
      driver_id,
      delivery_id,
      base_amount,
      bonus_amount,
      total_amount
    ) VALUES (
      NEW.driver_id,
      NEW.id,
      5.00,
      EXTRACT(EPOCH FROM (NEW.actual_delivery_time - NEW.assigned_at))/60 * 0.50,
      5.00 + (EXTRACT(EPOCH FROM (NEW.actual_delivery_time - NEW.assigned_at))/60 * 0.50)
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_delivery_earnings_trigger
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE PROCEDURE calculate_delivery_earnings(); 