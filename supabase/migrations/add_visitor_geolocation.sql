-- Migration: Add geolocation columns to visitor_logs table
-- Run this migration on your Supabase database to enable the 3D globe feature

-- Add new geolocation columns to existing visitor_logs table
ALTER TABLE public.visitor_logs 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Create an index on country_code for faster aggregation queries
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country_code ON public.visitor_logs(country_code);

-- Create an index on location for geo queries
CREATE INDEX IF NOT EXISTS idx_visitor_logs_location ON public.visitor_logs(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comment describing the purpose
COMMENT ON COLUMN public.visitor_logs.country IS 'Full country name of visitor';
COMMENT ON COLUMN public.visitor_logs.country_code IS 'ISO 2-letter country code';
COMMENT ON COLUMN public.visitor_logs.city IS 'City name of visitor';
COMMENT ON COLUMN public.visitor_logs.latitude IS 'Latitude coordinate for globe visualization';
COMMENT ON COLUMN public.visitor_logs.longitude IS 'Longitude coordinate for globe visualization';
