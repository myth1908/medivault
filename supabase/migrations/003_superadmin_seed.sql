-- ============================================================
-- Superadmin Bootstrap
-- Run this AFTER 002_admin_roles.sql
--
-- Replace the email below with the actual superadmin email
-- before executing, or use the /setup page in the app.
-- ============================================================

-- Usage example (run in Supabase SQL editor):
--
-- SELECT promote_to_superadmin('admin@yourapp.com');

CREATE OR REPLACE FUNCTION promote_to_superadmin(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User not found with email: ' || target_email;
  END IF;

  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'superadmin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin', updated_at = NOW();

  RETURN 'SUCCESS: ' || target_email || ' is now a superadmin (id: ' || target_user_id || ')';
END;
$$;
