-- ============================================================
-- MediVault — Run this entire file in Supabase SQL Editor
-- ============================================================

-- PART 1: Admin Roles & Audit Log

CREATE TYPE IF NOT EXISTS user_role AS ENUM ('user', 'responder', 'admin', 'superadmin');

CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'user',
  granted_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_my_role() IN ('admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_my_role() = 'superadmin';
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Admins can read all roles') THEN
    CREATE POLICY "Admins can read all roles" ON user_roles FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='Superadmins can manage roles') THEN
    CREATE POLICY "Superadmins can manage roles" ON user_roles FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='Admins can read audit log') THEN
    CREATE POLICY "Admins can read audit log" ON admin_audit_log FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='System can insert audit log') THEN
    CREATE POLICY "System can insert audit log" ON admin_audit_log FOR INSERT WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='medical_profiles' AND policyname='Admins can read all profiles') THEN
    CREATE POLICY "Admins can read all profiles" ON medical_profiles FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='emergency_incidents' AND policyname='Admins can read all incidents') THEN
    CREATE POLICY "Admins can read all incidents" ON emergency_incidents FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='emergency_incidents' AND policyname='Admins can update all incidents') THEN
    CREATE POLICY "Admins can update all incidents" ON emergency_incidents FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='emergency_contacts' AND policyname='Admins can read all contacts') THEN
    CREATE POLICY "Admins can read all contacts" ON emergency_contacts FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_user_roles_updated_at') THEN
    CREATE TRIGGER update_user_roles_updated_at
      BEFORE UPDATE ON user_roles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

INSERT INTO user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- PART 2: Superadmin helper function

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

-- Make richard@redi-ngo a superadmin automatically
SELECT promote_to_superadmin('richard@redi-ngo');

-- PART 3: Content Management Tables

CREATE TABLE IF NOT EXISTS first_aid_guides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'General',
  emoji        TEXT NOT NULL DEFAULT '🩹',
  severity     TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description  TEXT NOT NULL DEFAULT '',
  steps        JSONB NOT NULL DEFAULT '[]',
  published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES auth.users(id),
  updated_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  type         TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'emergency')),
  published    BOOLEAN NOT NULL DEFAULT FALSE,
  pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id),
  updated_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  updated_by   UUID REFERENCES auth.users(id),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_category ON first_aid_guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_published ON first_aid_guides(published);
CREATE INDEX IF NOT EXISTS idx_guides_sort_order ON first_aid_guides(sort_order);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(pinned);

ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='first_aid_guides' AND policyname='Anyone can read published guides') THEN
    CREATE POLICY "Anyone can read published guides" ON first_aid_guides FOR SELECT USING (published = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='first_aid_guides' AND policyname='Admins can manage all guides') THEN
    CREATE POLICY "Admins can manage all guides" ON first_aid_guides FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Anyone authenticated can read published announcements') THEN
    CREATE POLICY "Anyone authenticated can read published announcements" ON announcements FOR SELECT USING (published = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Admins can manage all announcements') THEN
    CREATE POLICY "Admins can manage all announcements" ON announcements FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Anyone can read site settings') THEN
    CREATE POLICY "Anyone can read site settings" ON site_settings FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Admins can manage site settings') THEN
    CREATE POLICY "Admins can manage site settings" ON site_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_guides_updated_at') THEN
    CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON first_aid_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_announcements_updated_at') THEN
    CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

INSERT INTO site_settings (key, value, description) VALUES
  ('site_name',          'MediVault',                             'Platform name shown in the navbar and title'),
  ('hero_title',         'Your Medical Emergency Platform',       'Landing page hero heading'),
  ('hero_subtitle',      'Store your critical medical information, manage emergency contacts, and get instant help when every second counts.', 'Landing page hero subheading'),
  ('hero_cta_primary',   'Create Your Profile — Free',            'Primary CTA button text'),
  ('hero_cta_secondary', 'Sign In',                               'Secondary CTA button text'),
  ('stats_sos_time',     '< 3s',                                  'Stat: SOS alert time'),
  ('stats_availability', '24/7',                                  'Stat: Availability'),
  ('stats_encryption',   '100%',                                  'Stat: Encryption label'),
  ('stats_guides',       '50+',                                   'Stat: Number of guides'),
  ('footer_tagline',     'Your health, always protected.',        'Footer tagline text'),
  ('dashboard_welcome',  'Your emergency dashboard is ready.',    'Dashboard welcome subtitle'),
  ('support_email',      'support@medivault.app',                 'Support contact email')
ON CONFLICT (key) DO NOTHING;

INSERT INTO first_aid_guides (title, category, emoji, severity, description, steps, published, sort_order) VALUES
(
  'CPR (Cardiopulmonary Resuscitation)', 'Cardiac', '❤️', 'critical',
  'Perform CPR on an unresponsive adult who is not breathing normally.',
  '[{"order":1,"title":"Call 911","description":"Call emergency services immediately or ask someone nearby to call."},{"order":2,"title":"Check Responsiveness","description":"Tap shoulders firmly and shout \"Are you okay?\" Check for breathing (no more than 10 seconds)."},{"order":3,"title":"Position the Person","description":"Lay them on their back on a firm, flat surface. Kneel beside them."},{"order":4,"title":"Open the Airway","description":"Tilt head back gently, lift chin to open the airway."},{"order":5,"title":"Chest Compressions","description":"Place hands on center of chest. Compress at least 2 inches deep, 100-120 times per minute.","warning":"Push hard and fast — it is okay if ribs crack."},{"order":6,"title":"Rescue Breaths (if trained)","description":"Give 2 rescue breaths after every 30 compressions."},{"order":7,"title":"Continue Until Help Arrives","description":"Keep going until emergency services arrive or the person revives."}]'::jsonb,
  TRUE, 1
),
(
  'Choking — Heimlich Maneuver', 'Airway', '🫁', 'critical',
  'For a conscious adult or child (over 1 year) who is choking.',
  '[{"order":1,"title":"Identify Choking","description":"Look for: cannot cough, speak, or breathe; grasping throat; bluish skin."},{"order":2,"title":"Encourage Coughing","description":"If they can cough, encourage them to keep coughing."},{"order":3,"title":"Give 5 Back Blows","description":"Lean them forward, give 5 firm blows between shoulder blades with the heel of your hand."},{"order":4,"title":"Heimlich Maneuver","description":"Stand behind them, wrap arms around waist. Make a fist above navel. Give 5 firm upward thrusts.","warning":"Do not perform on infants under 1 year."},{"order":5,"title":"Alternate & Repeat","description":"Alternate between 5 back blows and 5 abdominal thrusts until object is expelled."},{"order":6,"title":"If Unconscious","description":"Lower to ground, call 911, begin CPR."}]'::jsonb,
  TRUE, 2
),
(
  'Severe Bleeding', 'Trauma', '🩸', 'high',
  'Control severe bleeding from a wound.',
  '[{"order":1,"title":"Protect Yourself","description":"Use gloves or a plastic bag if available."},{"order":2,"title":"Apply Direct Pressure","description":"Press firmly on the wound with a clean cloth. Do not remove — add more material on top if soaked."},{"order":3,"title":"Elevate the Limb","description":"Raise the injured area above heart level to slow bleeding."},{"order":4,"title":"Apply a Tourniquet","description":"For life-threatening limb bleeding: apply 2-3 inches above wound and tighten until bleeding stops.","warning":"Only use for life-threatening bleeding."},{"order":5,"title":"Call 911","description":"Severe bleeding is a medical emergency."}]'::jsonb,
  TRUE, 3
),
(
  'Stroke — FAST Recognition', 'Neurological', '🧠', 'critical',
  'Recognize and respond to a stroke using the FAST method.',
  '[{"order":1,"title":"F — Face Drooping","description":"Ask the person to smile. Is one side drooping?"},{"order":2,"title":"A — Arm Weakness","description":"Ask them to raise both arms. Does one drift downward?"},{"order":3,"title":"S — Speech Difficulty","description":"Ask them to repeat a phrase. Is speech slurred or impossible?"},{"order":4,"title":"T — Time to Call 911","description":"If ANY sign is present, call 911 immediately.","warning":"Every minute counts. Do not wait to see if symptoms improve."},{"order":5,"title":"While Waiting","description":"Keep them calm, do not give food or water, loosen tight clothing."}]'::jsonb,
  TRUE, 4
),
(
  'Burns Treatment', 'Trauma', '🔥', 'medium',
  'Treat minor to moderate burns correctly.',
  '[{"order":1,"title":"Remove from Source","description":"Stop the burning: remove from heat, extinguish flames."},{"order":2,"title":"Cool the Burn","description":"Run cool (not cold) water over the burn for 10-20 minutes.","warning":"Never use ice, butter, or creams on fresh burns."},{"order":3,"title":"Cover the Burn","description":"Loosely cover with a clean non-fluffy material."},{"order":4,"title":"Seek Medical Help","description":"Go to A&E for large burns, facial burns, or burns in children."}]'::jsonb,
  TRUE, 5
),
(
  'Severe Allergic Reaction', 'Allergy', '🌡️', 'critical',
  'Respond to a life-threatening allergic reaction (Anaphylaxis).',
  '[{"order":1,"title":"Call 911 Immediately","description":"Anaphylaxis is life-threatening."},{"order":2,"title":"Use EpiPen","description":"If available, inject in outer thigh immediately.","warning":"A second dose may be given after 5-15 minutes if symptoms persist."},{"order":3,"title":"Lay Them Down","description":"Lay flat with legs raised. If breathing is hard, let them sit up."},{"order":4,"title":"Monitor Breathing","description":"Watch for throat swelling or loss of consciousness."},{"order":5,"title":"Stay Until Help Arrives","description":"Be prepared to perform CPR."}]'::jsonb,
  TRUE, 6
),
(
  'Diabetic Emergency', 'Medical', '🩺', 'high',
  'Help someone experiencing low blood sugar (Hypoglycemia).',
  '[{"order":1,"title":"Recognize the Signs","description":"Confusion, shakiness, sweating, pale skin, rapid heartbeat."},{"order":2,"title":"Give Fast-Acting Sugar","description":"4 glucose tablets, 4oz juice, or 4oz regular soda.","warning":"Only give sugar if they are conscious and can swallow."},{"order":3,"title":"Wait 15 Minutes","description":"Recheck symptoms. If not improving, repeat and call 911."},{"order":4,"title":"If Unconscious","description":"Call 911 immediately. Do not give anything by mouth."}]'::jsonb,
  TRUE, 7
)
ON CONFLICT DO NOTHING;
