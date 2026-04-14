-- Add notification tracking columns to emergency_incidents
ALTER TABLE emergency_incidents
  ADD COLUMN IF NOT EXISTS notifications_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notifications_total INTEGER DEFAULT 0;
