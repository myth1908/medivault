-- ============================================================
-- 003: Content Management System — editable site content & guides
-- ============================================================

-- Site Content: key-value store for all editable text on the site
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT 'general',
  label TEXT NOT NULL DEFAULT '',
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'url', 'email')),
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(key);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (it's public)
CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT
  USING (true);

-- Only admins can update site content
CREATE POLICY "Admins can update site content"
  ON site_content FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert site content"
  ON site_content FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- First Aid Guides: fully manageable from admin
CREATE TABLE IF NOT EXISTS first_aid_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  emoji TEXT NOT NULL DEFAULT '🚨',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL DEFAULT '',
  steps JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_first_aid_guides_published ON first_aid_guides(is_published);
CREATE INDEX IF NOT EXISTS idx_first_aid_guides_category ON first_aid_guides(category);

ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;

-- Anyone can read published guides
CREATE POLICY "Anyone can read published guides"
  ON first_aid_guides FOR SELECT
  USING (is_published = true);

-- Admins can do everything with guides
CREATE POLICY "Admins full access to guides"
  ON first_aid_guides FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Auto-update timestamps
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_first_aid_guides_updated_at
  BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed default site content
-- ============================================================
INSERT INTO site_content (key, value, section, label, field_type, sort_order) VALUES
  -- Hero Section
  ('hero_badge', 'Emergency-Ready in Seconds', 'hero', 'Badge Text', 'text', 1),
  ('hero_title', 'Your Medical Emergency', 'hero', 'Title (line 1)', 'text', 2),
  ('hero_title_highlight', 'Platform', 'hero', 'Title Highlight Word', 'text', 3),
  ('hero_subtitle', 'Store your critical medical information, manage emergency contacts, and get instant help when every second counts.', 'hero', 'Subtitle', 'textarea', 4),
  ('hero_cta_primary', 'Create Your Profile — Free', 'hero', 'Primary Button Text', 'text', 5),
  ('hero_cta_secondary', 'Sign In', 'hero', 'Secondary Button Text', 'text', 6),

  -- Stats
  ('stat_1_value', '< 3s', 'stats', 'Stat 1 Value', 'text', 1),
  ('stat_1_label', 'SOS Alert Time', 'stats', 'Stat 1 Label', 'text', 2),
  ('stat_2_value', '24/7', 'stats', 'Stat 2 Value', 'text', 3),
  ('stat_2_label', 'Always Available', 'stats', 'Stat 2 Label', 'text', 4),
  ('stat_3_value', '100%', 'stats', 'Stat 3 Value', 'text', 5),
  ('stat_3_label', 'Encrypted Data', 'stats', 'Stat 3 Label', 'text', 6),
  ('stat_4_value', '50+', 'stats', 'Stat 4 Value', 'text', 7),
  ('stat_4_label', 'First Aid Guides', 'stats', 'Stat 4 Label', 'text', 8),

  -- SOS Section
  ('sos_title', 'One tap. That''s all it takes.', 'sos', 'SOS Title', 'text', 1),
  ('sos_subtitle', 'In an emergency, every second matters. MediVault''s SOS system alerts your contacts and emergency services with your location instantly.', 'sos', 'SOS Subtitle', 'textarea', 2),

  -- Features Section
  ('features_title', 'Everything you need in an emergency', 'features', 'Section Title', 'text', 1),
  ('features_subtitle', 'MediVault brings together all critical tools into one platform — always accessible, even offline.', 'features', 'Section Subtitle', 'textarea', 2),

  -- How It Works
  ('howit_title', 'Get set up in 3 minutes', 'howitworks', 'Section Title', 'text', 1),
  ('step_1_title', 'Create Account', 'howitworks', 'Step 1 Title', 'text', 2),
  ('step_1_desc', 'Sign up free and create your secure medical profile.', 'howitworks', 'Step 1 Description', 'text', 3),
  ('step_2_title', 'Add Your Info', 'howitworks', 'Step 2 Title', 'text', 4),
  ('step_2_desc', 'Enter blood type, allergies, medications, and emergency contacts.', 'howitworks', 'Step 2 Description', 'text', 5),
  ('step_3_title', 'You''re Protected', 'howitworks', 'Step 3 Title', 'text', 6),
  ('step_3_desc', 'Use the SOS button and access guides anytime, anywhere.', 'howitworks', 'Step 3 Description', 'text', 7),

  -- CTA Section
  ('cta_title', 'Be prepared before an emergency happens', 'cta', 'CTA Title', 'text', 1),
  ('cta_subtitle', 'Join thousands of people who trust MediVault with their emergency preparedness.', 'cta', 'CTA Subtitle', 'textarea', 2),
  ('cta_button', 'Create Your Free Account', 'cta', 'CTA Button Text', 'text', 3),

  -- Footer
  ('footer_tagline', 'Your health, always protected.', 'footer', 'Footer Tagline', 'text', 1)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Seed default first aid guides (move from hardcoded to DB)
-- ============================================================
INSERT INTO first_aid_guides (title, category, emoji, severity, description, steps, sort_order) VALUES
  ('CPR (Cardiopulmonary Resuscitation)', 'Cardiac', '❤️', 'critical',
   'Perform CPR on an unresponsive adult who is not breathing normally.',
   '[{"title":"Call 911","description":"Call emergency services immediately or ask someone nearby to call."},{"title":"Check Responsiveness","description":"Tap shoulders firmly and shout \"Are you okay?\" Check for breathing (no more than 10 seconds)."},{"title":"Position the Person","description":"Lay them on their back on a firm, flat surface. Kneel beside them."},{"title":"Open the Airway","description":"Tilt head back gently, lift chin to open the airway."},{"title":"Chest Compressions","description":"Place hands on center of chest. Compress at least 2 inches deep, 100-120 times per minute. Allow full chest recoil between compressions.","warning":"Push hard and fast — it''s okay if ribs crack."},{"title":"Rescue Breaths (if trained)","description":"Give 2 rescue breaths after every 30 compressions. Pinch nose, create seal, breathe for 1 second each."},{"title":"Continue Until Help Arrives","description":"Keep going until emergency services arrive, the person revives, or you are too exhausted to continue."}]',
   1),
  ('Choking — Heimlich Maneuver', 'Airway', '🫁', 'critical',
   'For a conscious adult or child (over 1 year) who is choking.',
   '[{"title":"Identify Choking","description":"Look for: cannot cough, speak, or breathe; grasping throat; bluish skin."},{"title":"Encourage Coughing","description":"If they can cough, encourage them to keep coughing. Only intervene if coughing stops or becomes ineffective."},{"title":"Give 5 Back Blows","description":"Lean them forward, give 5 firm blows between shoulder blades with the heel of your hand."},{"title":"Heimlich Maneuver","description":"Stand behind them, wrap arms around waist. Make a fist above navel, below ribs. Cover fist with other hand. Give 5 firm upward thrusts.","warning":"Do not perform on infants under 1 year."},{"title":"Alternate Back Blows & Thrusts","description":"Alternate between 5 back blows and 5 abdominal thrusts until object is expelled or person loses consciousness."},{"title":"If Unconscious","description":"Lower to ground, call 911, begin CPR. With each breath attempt, check mouth for visible object."}]',
   2),
  ('Severe Bleeding', 'Trauma', '🩹', 'high',
   'Control severe bleeding from a wound.',
   '[{"title":"Protect Yourself","description":"Use gloves or a plastic bag to protect from bloodborne pathogens if available."},{"title":"Apply Direct Pressure","description":"Press firmly on the wound with a clean cloth, gauze, or clothing. Do not remove — add more material on top if soaked."},{"title":"Elevate the Limb","description":"If possible, raise the injured area above heart level to slow bleeding."},{"title":"Apply a Tourniquet (limbs only)","description":"If bleeding is life-threatening and on an arm or leg: apply 2-3 inches above wound. Tighten until bleeding stops. Note the time.","warning":"Tourniquet causes pain and may damage tissue — only use for life-threatening bleeding."},{"title":"Keep Person Warm","description":"Cover with blankets to prevent shock. Keep them lying down with legs elevated if no head/spine injury."},{"title":"Call 911","description":"Severe bleeding is a medical emergency. Call immediately."}]',
   3),
  ('Stroke — FAST Recognition', 'Neurological', '🧠', 'critical',
   'Recognize and respond to a stroke using the FAST method.',
   '[{"title":"F — Face Drooping","description":"Ask the person to smile. Is one side of the face drooping or numb?"},{"title":"A — Arm Weakness","description":"Ask them to raise both arms. Does one arm drift downward or feel weak?"},{"title":"S — Speech Difficulty","description":"Ask them to repeat a simple phrase. Is speech slurred, strange, or impossible?"},{"title":"T — Time to Call 911","description":"If ANY of these signs are present, call 911 IMMEDIATELY. Note the time symptoms started.","warning":"Every minute counts — \"time is brain.\" Do not wait to see if symptoms improve."},{"title":"While Waiting","description":"Keep them calm and still. Do not give food, water, or medication. Loosen tight clothing. Do not leave them alone."}]',
   4),
  ('Burns Treatment', 'Trauma', '🔥', 'medium',
   'Treat minor to moderate burns correctly.',
   '[{"title":"Remove from Source","description":"Stop the burning: remove from heat, extinguish flames (stop drop roll), remove hot clothing/jewelry near burn — not stuck to skin."},{"title":"Cool the Burn","description":"Run cool (not cold/ice) water over the burn for 10-20 minutes. This reduces pain and limits damage.","warning":"Never use ice, butter, toothpaste, or any creams on fresh burns."},{"title":"Cover the Burn","description":"Loosely cover with a clean non-fluffy material (cling film works well). Do not use fluffy bandages or burst blisters."},{"title":"Seek Medical Help","description":"Go to A&E for: burns larger than palm, burns on face/hands/genitals/feet, chemical/electrical burns, burns in children or elderly."},{"title":"Manage Pain","description":"Over-the-counter pain relievers (ibuprofen, acetaminophen) can help for minor burns."}]',
   5),
  ('Suspected Fracture / Broken Bone', 'Trauma', '🦴', 'medium',
   'Manage a suspected broken bone before medical help arrives.',
   '[{"title":"Do Not Move","description":"Keep the injured person as still as possible. Do not try to straighten the bone."},{"title":"Immobilize the Injury","description":"Splint the fracture using padding and something rigid (board, rolled magazine). Extend splint beyond joints above and below fracture."},{"title":"Control Bleeding","description":"If there is an open wound, apply gentle pressure around (not directly on) the bone with clean dressing."},{"title":"Apply Ice Pack","description":"Apply ice wrapped in cloth to reduce swelling. Never apply ice directly to skin.","warning":"Do not apply ice to open wounds."},{"title":"Treat for Shock","description":"If they look pale and feel faint, keep warm, lie flat with legs raised (unless leg is injured)."},{"title":"Seek Medical Attention","description":"All suspected fractures need X-ray and medical evaluation. Call 911 for severe/spinal injuries."}]',
   6),
  ('Severe Allergic Reaction (Anaphylaxis)', 'Allergy', '⚠️', 'critical',
   'Respond to a life-threatening allergic reaction.',
   '[{"title":"Call 911 Immediately","description":"Anaphylaxis is life-threatening. Call emergency services at once."},{"title":"Use Epinephrine (EpiPen)","description":"If the person has an auto-injector (EpiPen), use it immediately in the outer thigh. Can be given through clothing.","warning":"A second dose may be given 5-15 minutes later if available and symptoms persist."},{"title":"Lay Them Down","description":"Have them lie flat with legs raised. If breathing is difficult, let them sit up. If unconscious and not breathing, prepare for CPR."},{"title":"Monitor Breathing","description":"Watch for worsening symptoms: throat swelling, difficulty breathing, loss of consciousness."},{"title":"Stay Until Help Arrives","description":"Do not leave them alone. Be prepared to perform CPR if they stop breathing."}]',
   7),
  ('Diabetic Emergency (Hypoglycemia)', 'Medical', '🍬', 'high',
   'Help someone experiencing low blood sugar.',
   '[{"title":"Recognize the Signs","description":"Look for: confusion, shakiness, sweating, pale skin, weakness, headache, rapid heartbeat."},{"title":"Give Fast-Acting Sugar","description":"If conscious and able to swallow: give 15-20g of fast sugar. Options: 4 glucose tablets, 4oz juice, 4oz regular soda (not diet), or hard candies.","warning":"Only give sugar if they are conscious and can swallow safely."},{"title":"Wait 15 Minutes","description":"Have them rest and recheck symptoms after 15 minutes. If not improving, repeat sugar and call 911."},{"title":"Give Follow-up Snack","description":"Once improved, give a snack with protein and carbs (crackers and peanut butter) to stabilize blood sugar."},{"title":"If Unconscious","description":"Call 911 immediately. Do not give anything by mouth. Place in recovery position."}]',
   8)
ON CONFLICT DO NOTHING;
