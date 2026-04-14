-- ============================================================
-- 004: Fix infinite recursion in user_profiles RLS policies
-- The admin policies on user_profiles were querying user_profiles
-- inline, triggering the same policies again = infinite loop.
-- Fix: use is_admin() which is SECURITY DEFINER (bypasses RLS).
-- ============================================================

-- Drop the recursive policies on user_profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Recreate using is_admin() which bypasses RLS via SECURITY DEFINER
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (is_admin());

-- Also fix the policies on other tables to use is_admin() for consistency
DROP POLICY IF EXISTS "Admins can read all medical profiles" ON medical_profiles;
DROP POLICY IF EXISTS "Admins can read all contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Admins can read all incidents" ON emergency_incidents;
DROP POLICY IF EXISTS "Admins can update all incidents" ON emergency_incidents;

CREATE POLICY "Admins can read all medical profiles"
  ON medical_profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can read all contacts"
  ON emergency_contacts FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can read all incidents"
  ON emergency_incidents FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all incidents"
  ON emergency_incidents FOR UPDATE
  USING (is_admin());
