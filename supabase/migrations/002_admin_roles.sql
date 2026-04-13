-- ============================================================
-- Admin Roles & Audit Log
-- ============================================================

-- Role hierarchy enum
CREATE TYPE user_role AS ENUM ('user', 'responder', 'admin', 'superadmin');

-- User roles table (source of truth for authorization)
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'user',
  granted_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: get calling user's role (uses service-role client to bypass RLS for internal checks)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid()),
    'user'::user_role
  );
$$;

-- Helper: is the calling user at least admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_my_role() IN ('admin', 'superadmin');
$$;

-- Helper: is the calling user a superadmin?
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_my_role() = 'superadmin';
$$;

-- Policies for user_roles
CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  USING (is_admin());

CREATE POLICY "Superadmins can manage roles"
  ON user_roles FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Policies for audit_log
CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_admin());

-- Extend medical_profiles RLS to allow admin read-all
CREATE POLICY "Admins can read all profiles"
  ON medical_profiles FOR SELECT
  USING (is_admin());

-- Extend emergency_incidents RLS to allow admin read/update all
CREATE POLICY "Admins can read all incidents"
  ON emergency_incidents FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all incidents"
  ON emergency_incidents FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Extend emergency_contacts RLS to allow admin read
CREATE POLICY "Admins can read all contacts"
  ON emergency_contacts FOR SELECT
  USING (is_admin());

-- Auto-update updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: when this migration runs, if there are already auth users with no role,
-- insert 'user' role for them to avoid null gaps.
INSERT INTO user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;
