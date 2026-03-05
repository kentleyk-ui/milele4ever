-- Migration: Full service request form based on Milele form
-- Drop existing table and recreate with full schema
DROP TABLE IF EXISTS service_requests;

CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'cancelled')),
  
  -- 1. Identité du défunt
  deceased_full_name TEXT,
  deceased_first_names TEXT,
  deceased_age INTEGER,
  deceased_sex TEXT CHECK (deceased_sex IN ('homme', 'femme', 'autre')),
  death_date DATE,
  death_time TEXT,
  death_location TEXT,
  death_location_type TEXT CHECK (death_location_type IN ('hopital', 'domicile', 'autre')),
  
  -- 2. Rites & préférences
  religion TEXT CHECK (religion IN ('musulman', 'chretien', 'juif', 'bouddhiste', 'laic', 'autre')),
  religion_other TEXT,
  service_type TEXT CHECK (service_type IN ('enterrement', 'cremation', 'inhumation_ecologique', 'ceremonie_virtuelle', 'aucun')),
  
  -- 3. Transport mortuaire
  needs_vehicle BOOLEAN DEFAULT false,
  vehicle_pickup_location TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('corbillard_standard', 'luxe', 'minibus_famille')),
  transport_urgency TEXT CHECK (transport_urgency IN ('24h_max', 'pas_urgence')),
  
  -- 4. Lieu final
  cemetery_crematorium TEXT,
  use_geolocation BOOLEAN DEFAULT false,
  scatter_ashes BOOLEAN DEFAULT false,
  scatter_ashes_location TEXT,
  
  -- 5. Fleurs & décoration
  flowers_options TEXT[] DEFAULT '{}',
  flowers_other TEXT,
  
  -- 6. Musique & ambiance
  music_option TEXT CHECK (music_option IN ('playlist_personnelle', 'musique_live', 'silence_complet')),
  music_playlist_url TEXT,
  
  -- 7. Repas & invités
  needs_catering BOOLEAN DEFAULT false,
  catering_guest_count INTEGER,
  catering_type TEXT[] DEFAULT '{}',
  catering_allergies TEXT,
  
  -- 8. Programme & annonces
  auto_generate_program BOOLEAN DEFAULT true,
  custom_program_text TEXT,
  notification_methods TEXT[] DEFAULT '{}',
  contacts_to_notify JSONB DEFAULT '[]',
  
  -- 9. Mur mémorial
  memorial_access TEXT CHECK (memorial_access IN ('prive', 'public')) DEFAULT 'prive',
  memorial_content_types TEXT[] DEFAULT '{}',
  memorial_notifications BOOLEAN DEFAULT true,
  
  -- 10. Paiement & support
  estimated_amount DECIMAL(10, 2),
  payment_method TEXT CHECK (payment_method IN ('carte', 'virement', 'echelonne')),
  needs_human_support BOOLEAN DEFAULT false,
  support_type TEXT CHECK (support_type IN ('appel', 'chat_ia')),
  
  -- 11. Message personnel
  personal_message TEXT,
  
  -- Validation
  is_confirmed BOOLEAN DEFAULT false,
  
  -- Metadata
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_service_requests_user ON service_requests(user_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_request_updated
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_service_request_timestamp();

-- RLS Policies
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service requests"
  ON service_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own service requests"
  ON service_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service requests"
  ON service_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft requests"
  ON service_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');
