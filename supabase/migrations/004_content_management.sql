-- ============================================================
-- Content Management Tables
-- ============================================================

-- First Aid Guides (admin-editable, replaces hardcoded array)
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

-- Announcements / News (shown on dashboard)
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

-- Site Settings (key/value store for editable content)
CREATE TABLE IF NOT EXISTS site_settings (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  updated_by   UUID REFERENCES auth.users(id),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guides_category ON first_aid_guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_published ON first_aid_guides(published);
CREATE INDEX IF NOT EXISTS idx_guides_sort_order ON first_aid_guides(sort_order);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(pinned);

-- RLS
ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for published guides
CREATE POLICY "Anyone can read published guides"
  ON first_aid_guides FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Admins can manage all guides"
  ON first_aid_guides FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Public read for active announcements
CREATE POLICY "Anyone authenticated can read published announcements"
  ON announcements FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Admins can manage all announcements"
  ON announcements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Site settings: admins write, anyone can read
CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Auto-update updated_at
CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default site settings
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

-- Seed the default hardcoded guides into the DB
INSERT INTO first_aid_guides (title, category, emoji, severity, description, steps, published, sort_order) VALUES
(
  'CPR (Cardiopulmonary Resuscitation)', 'Cardiac', '❤️', 'critical',
  'Perform CPR on an unresponsive adult who is not breathing normally.',
  '[
    {"order":1,"title":"Call 911","description":"Call emergency services immediately or ask someone nearby to call."},
    {"order":2,"title":"Check Responsiveness","description":"Tap shoulders firmly and shout \"Are you okay?\" Check for breathing (no more than 10 seconds)."},
    {"order":3,"title":"Position the Person","description":"Lay them on their back on a firm, flat surface. Kneel beside them."},
    {"order":4,"title":"Open the Airway","description":"Tilt head back gently, lift chin to open the airway."},
    {"order":5,"title":"Chest Compressions","description":"Place hands on center of chest. Compress at least 2 inches deep, 100-120 times per minute. Allow full chest recoil between compressions.","warning":"Push hard and fast — it''s okay if ribs crack."},
    {"order":6,"title":"Rescue Breaths (if trained)","description":"Give 2 rescue breaths after every 30 compressions. Pinch nose, create seal, breathe for 1 second each."},
    {"order":7,"title":"Continue Until Help Arrives","description":"Keep going until emergency services arrive, the person revives, or you are too exhausted to continue."}
  ]'::jsonb, TRUE, 1
),
(
  'Choking — Heimlich Maneuver', 'Airway', '🫁', 'critical',
  'For a conscious adult or child (over 1 year) who is choking.',
  '[
    {"order":1,"title":"Identify Choking","description":"Look for: cannot cough, speak, or breathe; grasping throat; bluish skin."},
    {"order":2,"title":"Encourage Coughing","description":"If they can cough, encourage them to keep coughing."},
    {"order":3,"title":"Give 5 Back Blows","description":"Lean them forward, give 5 firm blows between shoulder blades with the heel of your hand."},
    {"order":4,"title":"Heimlich Maneuver","description":"Stand behind them, wrap arms around waist. Make a fist above navel, below ribs. Give 5 firm upward thrusts.","warning":"Do not perform on infants under 1 year."},
    {"order":5,"title":"Alternate Back Blows & Thrusts","description":"Alternate between 5 back blows and 5 abdominal thrusts until object is expelled or person loses consciousness."},
    {"order":6,"title":"If Unconscious","description":"Lower to ground, call 911, begin CPR. With each breath attempt, check mouth for visible object."}
  ]'::jsonb, TRUE, 2
),
(
  'Severe Bleeding', 'Trauma', '🩸', 'high',
  'Control severe bleeding from a wound.',
  '[
    {"order":1,"title":"Protect Yourself","description":"Use gloves or a plastic bag to protect from bloodborne pathogens if available."},
    {"order":2,"title":"Apply Direct Pressure","description":"Press firmly on the wound with a clean cloth, gauze, or clothing. Do not remove — add more material on top if soaked."},
    {"order":3,"title":"Elevate the Limb","description":"If possible, raise the injured area above heart level to slow bleeding."},
    {"order":4,"title":"Apply a Tourniquet (limbs only)","description":"If bleeding is life-threatening and on an arm or leg: apply 2-3 inches above wound. Tighten until bleeding stops. Note the time.","warning":"Tourniquet causes pain and may damage tissue — only use for life-threatening bleeding."},
    {"order":5,"title":"Keep Person Warm","description":"Cover with blankets to prevent shock. Keep them lying down with legs elevated if no head/spine injury."},
    {"order":6,"title":"Call 911","description":"Severe bleeding is a medical emergency. Call immediately."}
  ]'::jsonb, TRUE, 3
),
(
  'Stroke — FAST Recognition', 'Neurological', '🧠', 'critical',
  'Recognize and respond to a stroke using the FAST method.',
  '[
    {"order":1,"title":"F — Face Drooping","description":"Ask the person to smile. Is one side of the face drooping or numb?"},
    {"order":2,"title":"A — Arm Weakness","description":"Ask them to raise both arms. Does one arm drift downward or feel weak?"},
    {"order":3,"title":"S — Speech Difficulty","description":"Ask them to repeat a simple phrase. Is speech slurred, strange, or impossible?"},
    {"order":4,"title":"T — Time to Call 911","description":"If ANY of these signs are present, call 911 IMMEDIATELY. Note the time symptoms started.","warning":"Every minute counts — ''time is brain.'' Do not wait to see if symptoms improve."},
    {"order":5,"title":"While Waiting","description":"Keep them calm and still. Do not give food, water, or medication. Loosen tight clothing. Do not leave them alone."}
  ]'::jsonb, TRUE, 4
),
(
  'Burns Treatment', 'Trauma', '🔥', 'medium',
  'Treat minor to moderate burns correctly.',
  '[
    {"order":1,"title":"Remove from Source","description":"Stop the burning: remove from heat, extinguish flames (stop drop roll), remove hot clothing/jewelry near burn — not stuck to skin."},
    {"order":2,"title":"Cool the Burn","description":"Run cool (not cold/ice) water over the burn for 10-20 minutes. This reduces pain and limits damage.","warning":"Never use ice, butter, toothpaste, or any creams on fresh burns."},
    {"order":3,"title":"Cover the Burn","description":"Loosely cover with a clean non-fluffy material (cling film works well). Do not use fluffy bandages or burst blisters."},
    {"order":4,"title":"Seek Medical Help","description":"Go to A&E for: burns larger than palm, burns on face/hands/genitals/feet, chemical/electrical burns, burns in children or elderly."},
    {"order":5,"title":"Manage Pain","description":"Over-the-counter pain relievers (ibuprofen, acetaminophen) can help for minor burns."}
  ]'::jsonb, TRUE, 5
),
(
  'Suspected Fracture / Broken Bone', 'Trauma', '🦴', 'medium',
  'Manage a suspected broken bone before medical help arrives.',
  '[
    {"order":1,"title":"Do Not Move","description":"Keep the injured person as still as possible. Do not try to straighten the bone."},
    {"order":2,"title":"Immobilize the Injury","description":"Splint the fracture using padding and something rigid (board, rolled magazine). Extend splint beyond joints above and below fracture."},
    {"order":3,"title":"Control Bleeding","description":"If there is an open wound, apply gentle pressure around (not directly on) the bone with clean dressing."},
    {"order":4,"title":"Apply Ice Pack","description":"Apply ice wrapped in cloth to reduce swelling. Never apply ice directly to skin.","warning":"Do not apply ice to open wounds."},
    {"order":5,"title":"Treat for Shock","description":"If they look pale and feel faint, keep warm, lie flat with legs raised (unless leg is injured)."},
    {"order":6,"title":"Seek Medical Attention","description":"All suspected fractures need X-ray and medical evaluation. Call 911 for severe/spinal injuries."}
  ]'::jsonb, TRUE, 6
),
(
  'Severe Allergic Reaction (Anaphylaxis)', 'Allergy', '🌡️', 'critical',
  'Respond to a life-threatening allergic reaction.',
  '[
    {"order":1,"title":"Call 911 Immediately","description":"Anaphylaxis is life-threatening. Call emergency services at once."},
    {"order":2,"title":"Use Epinephrine (EpiPen)","description":"If the person has an auto-injector (EpiPen), use it immediately in the outer thigh. Can be given through clothing.","warning":"A second dose may be given 5-15 minutes later if available and symptoms persist."},
    {"order":3,"title":"Lay Them Down","description":"Have them lie flat with legs raised. If breathing is difficult, let them sit up. If unconscious and not breathing, prepare for CPR."},
    {"order":4,"title":"Monitor Breathing","description":"Watch for worsening symptoms: throat swelling, difficulty breathing, loss of consciousness."},
    {"order":5,"title":"Stay Until Help Arrives","description":"Do not leave them alone. Be prepared to perform CPR if they stop breathing."}
  ]'::jsonb, TRUE, 7
),
(
  'Diabetic Emergency (Hypoglycemia)', 'Medical', '🩺', 'high',
  'Help someone experiencing low blood sugar.',
  '[
    {"order":1,"title":"Recognize the Signs","description":"Look for: confusion, shakiness, sweating, pale skin, weakness, headache, rapid heartbeat."},
    {"order":2,"title":"Give Fast-Acting Sugar","description":"If conscious and able to swallow: give 15-20g of fast sugar. Options: 4 glucose tablets, 4oz juice, 4oz regular soda (not diet), or hard candies.","warning":"Only give sugar if they are conscious and can swallow safely."},
    {"order":3,"title":"Wait 15 Minutes","description":"Have them rest and recheck symptoms after 15 minutes. If not improving, repeat sugar and call 911."},
    {"order":4,"title":"Give Follow-up Snack","description":"Once improved, give a snack with protein and carbs (crackers and peanut butter) to stabilize blood sugar."},
    {"order":5,"title":"If Unconscious","description":"Call 911 immediately. Do not give anything by mouth. Place in recovery position."}
  ]'::jsonb, TRUE, 8
)
ON CONFLICT DO NOTHING;
