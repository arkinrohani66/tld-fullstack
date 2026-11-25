/*
# TLD Platform — Modular Core (قابل توسعه برای ماژول‌های آینده)

هدف: ساخت یک لایه «پلتفرمی» روی جداول موجود، به‌گونه‌ای که افزودن بخش‌های جدید
(ماژول جدید، وضعیت جدید، تنظیمات جدید، دسترسی جدید) بدون بازنویسی اسکیما و صرفاً
با یک migration کوچک یا یک ردیف داده انجام شود.

اجزای اضافه‌شده:
1. توابع کمکی سراسری: is_admin()، current_role_name()، touch_updated_at()
2. app_settings      — تنظیمات زمان اجرا (key/value JSONB) بدون نیاز به دیپلوی مجدد
3. feature_modules   — فعال/غیرفعال کردن ماژول‌ها و rollout تدریجی
4. status_definitions— ماشین وضعیت قابل توسعه (status جدید = یک ردیف داده)
5. audit_log         — ثبت همه اقدامات مدیریتی
6. media_assets      — فایل‌ها/مدارک آپلودی به‌صورت یکپارچه
7. policies ادمین     — دسترسی خواندن/نوشتن مدیر روی همه جداول عملیاتی
8. seed اولیه

نکته: این فایل idempotent است و بعد از 20261108103000 اجرا می‌شود.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role_name() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role_name() TO authenticated;

-- تریگر عمومی به‌روزرسانی updated_at که روی هر جدول جدیدی قابل اتصال است
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. app_settings — تنظیمات زمان اجرا
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

DROP POLICY IF EXISTS "app_settings_read_public" ON public.app_settings;
CREATE POLICY "app_settings_read_public" ON public.app_settings FOR SELECT
  TO anon, authenticated USING (is_public OR public.is_admin());

DROP POLICY IF EXISTS "app_settings_admin_write" ON public.app_settings;
CREATE POLICY "app_settings_admin_write" ON public.app_settings FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_app_settings_touch ON public.app_settings;
CREATE TRIGGER trg_app_settings_touch BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 3. feature_modules — فعال‌سازی ماژول‌ها
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_modules (
  code text PRIMARY KEY,
  name_fa text NOT NULL,
  name_en text,
  name_tr text,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_modules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feature_modules FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.feature_modules TO anon, authenticated;
GRANT ALL ON public.feature_modules TO service_role;

DROP POLICY IF EXISTS "feature_modules_read" ON public.feature_modules;
CREATE POLICY "feature_modules_read" ON public.feature_modules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "feature_modules_admin_write" ON public.feature_modules;
CREATE POLICY "feature_modules_admin_write" ON public.feature_modules FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_feature_modules_touch ON public.feature_modules;
CREATE TRIGGER trg_feature_modules_touch BEFORE UPDATE ON public.feature_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 4. status_definitions — ماشین وضعیت قابل توسعه
--    افزودن وضعیت جدید در آینده = یک INSERT، نه تغییر CHECK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.status_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  code text NOT NULL,
  label_fa text NOT NULL,
  label_en text,
  label_tr text,
  color text DEFAULT '#747686',
  sort_order integer NOT NULL DEFAULT 100,
  is_terminal boolean NOT NULL DEFAULT false,
  allowed_next text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity, code)
);

ALTER TABLE public.status_definitions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.status_definitions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.status_definitions TO anon, authenticated;
GRANT ALL ON public.status_definitions TO service_role;

DROP POLICY IF EXISTS "status_definitions_read" ON public.status_definitions;
CREATE POLICY "status_definitions_read" ON public.status_definitions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "status_definitions_admin_write" ON public.status_definitions;
CREATE POLICY "status_definitions_admin_write" ON public.status_definitions FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5. audit_log — ردگیری اقدامات
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  entity text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log FOR SELECT
  TO authenticated USING (public.is_admin());

-- ============================================================
-- 6. media_assets — یکپارچه‌سازی فایل‌ها و مدارک
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  bucket text NOT NULL DEFAULT 'documents',
  path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  kind text NOT NULL DEFAULT 'DOCUMENT'
    CHECK (kind IN ('DOCUMENT', 'PHOTO', 'WAYBILL', 'SIGNATURE', 'AVATAR', 'OTHER')),
  entity text,
  entity_id text,
  is_public boolean NOT NULL DEFAULT false,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON public.media_assets (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_entity ON public.media_assets (entity, entity_id);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.media_assets FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

DROP POLICY IF EXISTS "media_assets_owner_or_admin" ON public.media_assets;
CREATE POLICY "media_assets_owner_or_admin" ON public.media_assets FOR SELECT
  TO authenticated USING (owner_id = auth.uid() OR is_public OR public.is_admin());

DROP POLICY IF EXISTS "media_assets_insert_own" ON public.media_assets;
CREATE POLICY "media_assets_insert_own" ON public.media_assets FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "media_assets_update_own" ON public.media_assets;
CREATE POLICY "media_assets_update_own" ON public.media_assets FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- 7. ADMIN POLICIES — دسترسی مدیر به داده عملیاتی
--    (بدون این‌ها پنل مدیریت وب هیچ ردیفی نمی‌بیند)
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'drivers', 'shippers', 'shipper_documents', 'cargos', 'cargo_bids',
    'transport_trips', 'trip_locations', 'trip_checkpoints', 'driver_vehicles',
    'driver_earnings', 'driver_settlements', 'driver_disputes', 'driver_reviews',
    'escrow_accounts', 'wallets', 'wallet_transactions', 'platform_revenue_ledger',
    'waybills', 'notifications', 'conversations', 'messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'admin_full_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      'admin_full_' || t, t
    );
  END LOOP;
END
$$;

-- Admin باید بتواند نقش کاربر را تغییر دهد (برای تأیید/رد مدارک)
GRANT UPDATE (role, verification_status, rejection_reason, updated_at)
  ON public.profiles TO authenticated;

-- ============================================================
-- 8. SEED
-- ============================================================
INSERT INTO public.app_settings (key, value, description, is_public) VALUES
  ('platform.identity', '{"domain":"tldlogistics.ir","support_phone":"+982191000000","support_email":"support@tldlogistics.ir"}', 'هویت و راه‌های تماس پلتفرم', true),
  ('finance.commission', '{"rate_percent":5,"vat_percent":9,"currency":"TOMAN","model":"ON_TOP_OF_FREIGHT"}', 'نرخ کارمزد و مالیات پلتفرم', true),
  ('finance.escrow', '{"otp_length":6,"max_otp_attempts":5,"auto_release_hours":72}', 'تنظیمات حساب امانی', false),
  ('limits.cargo', '{"max_weight_tons":40,"min_fare_tomans":500000}', 'محدودیت‌های ثبت بار', true),
  ('locales', '{"default":"fa","supported":["fa","en","tr"]}', 'زبان‌های پشتیبانی‌شده', true),
  ('maintenance', '{"enabled":false,"message":""}', 'حالت تعمیرات سامانه', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.feature_modules (code, name_fa, name_en, name_tr, description, is_enabled, sort_order) VALUES
  ('auth',        'احراز هویت و ثبت‌نام', 'Authentication', 'Kimlik Doğrulama', 'ورود، ثبت‌نام و مدیریت نقش‌ها', true, 10),
  ('cargo',       'اعلام بار و محموله', 'Cargo Posting', 'Yük İlanı', 'ثبت و مدیریت محموله‌ها', true, 20),
  ('bidding',     'مناقصه و پیشنهاد قیمت', 'Bidding', 'Teklif Sistemi', 'پیشنهاد رانندگان و پیشنهاد متقابل', true, 30),
  ('contract',    'قرارداد دیجیتال', 'Digital Contract', 'Dijital Sözleşme', 'قرارداد و امضای الکترونیک', true, 40),
  ('escrow',      'حساب امانی', 'Escrow', 'Emanet Hesabı', 'مسدودسازی و آزادسازی وجه', true, 50),
  ('settlement',  'تسویه و کیف پول', 'Settlement & Wallet', 'Ödeme ve Cüzdan', 'کیف پول، تسویه و درگاه', true, 60),
  ('trips',       'سفر و رهگیری', 'Trips & Tracking', 'Sefer ve Takip', 'چرخه سفر، چک‌پوینت و موقعیت', true, 70),
  ('waybill',     'بارنامه الکترونیک', 'E-Waybill', 'e-İrsaliye', 'صدور و اعتبارسنجی بارنامه', true, 80),
  ('iot',         'تله‌متری TLD-Box', 'IoT Telemetry', 'IoT Telemetri', 'سنسورها، دما، پلمپ هوشمند', false, 90),
  ('fuel',        'مانیتورینگ سوخت', 'Fuel Monitoring', 'Yakıt İzleme', 'مصرف سوخت و راندمان', false, 100),
  ('backhaul',    'بار برگشت', 'Backhaul', 'Dönüş Yükü', 'پیشنهاد بار برگشت', false, 110),
  ('disputes',    'داوری و اختلافات', 'Disputes', 'Anlaşmazlıklar', 'ثبت و رسیدگی به شکایات', true, 120),
  ('chat',        'گفتگو', 'Messaging', 'Mesajlaşma', 'چت راننده و صاحب بار', true, 130),
  ('ai',          'دستیار هوشمند', 'AI Assistant', 'Yapay Zekâ Asistanı', 'دستیار Gemini', false, 140),
  ('admin',       'پنل مدیریت', 'Admin Console', 'Yönetim Paneli', 'اتاق فرمان و مدیریت پلتفرم', true, 150)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.status_definitions (entity, code, label_fa, label_en, label_tr, color, sort_order, is_terminal, allowed_next) VALUES
  ('cargo', 'PENDING_DRIVER', 'در انتظار راننده', 'Waiting for driver', 'Sürücü bekleniyor', '#b27b00', 10, false, ARRAY['DRIVER_ASSIGNED','CANCELLED']),
  ('cargo', 'DRIVER_ASSIGNED', 'راننده تخصیص یافته', 'Driver assigned', 'Sürücü atandı', '#1967d2', 20, false, ARRAY['LOADING','CANCELLED']),
  ('cargo', 'LOADING', 'در حال بارگیری', 'Loading', 'Yükleniyor', '#0ea5e9', 30, false, ARRAY['IN_TRANSIT','CANCELLED']),
  ('cargo', 'IN_TRANSIT', 'در مسیر', 'In transit', 'Yolda', '#6366f1', 40, false, ARRAY['DELIVERED']),
  ('cargo', 'DELIVERED', 'تحویل شده', 'Delivered', 'Teslim edildi', '#00a368', 50, true, ARRAY[]::text[]),
  ('cargo', 'CANCELLED', 'لغو شده', 'Cancelled', 'İptal edildi', '#ba1a1a', 60, true, ARRAY[]::text[]),
  ('bid', 'PENDING', 'در انتظار بررسی', 'Pending', 'Beklemede', '#b27b00', 10, false, ARRAY['COUNTER_OFFER','ACCEPTED','REJECTED','CANCELLED','EXPIRED']),
  ('bid', 'COUNTER_OFFER', 'پیشنهاد متقابل', 'Counter offer', 'Karşı teklif', '#1967d2', 20, false, ARRAY['ACCEPTED','CANCELLED','EXPIRED']),
  ('bid', 'ACCEPTED', 'پذیرفته شده', 'Accepted', 'Kabul edildi', '#00a368', 30, true, ARRAY[]::text[]),
  ('bid', 'REJECTED', 'رد شده', 'Rejected', 'Reddedildi', '#ba1a1a', 40, true, ARRAY[]::text[]),
  ('bid', 'CANCELLED', 'لغو شده', 'Cancelled', 'İptal edildi', '#5f6368', 50, true, ARRAY[]::text[]),
  ('bid', 'EXPIRED', 'منقضی شده', 'Expired', 'Süresi doldu', '#5f6368', 60, true, ARRAY[]::text[]),
  ('escrow', 'HELD_SECURE', 'مسدود و امن', 'Held secure', 'Emanette', '#1967d2', 10, false, ARRAY['RELEASED_TO_DRIVER']),
  ('escrow', 'RELEASED_TO_DRIVER', 'آزاد شده به راننده', 'Released to driver', 'Sürücüye ödendi', '#00a368', 20, true, ARRAY[]::text[]),
  ('trip', 'SCHEDULED', 'زمان‌بندی شده', 'Scheduled', 'Planlandı', '#b27b00', 10, false, ARRAY['ACTIVE','DELAYED']),
  ('trip', 'ACTIVE', 'در حال اجرا', 'Active', 'Aktif', '#6366f1', 20, false, ARRAY['COMPLETED','DELAYED']),
  ('trip', 'DELAYED', 'تأخیر', 'Delayed', 'Gecikmiş', '#f97316', 30, false, ARRAY['ACTIVE','COMPLETED']),
  ('trip', 'COMPLETED', 'تکمیل شده', 'Completed', 'Tamamlandı', '#00a368', 40, true, ARRAY[]::text[]),
  ('dispute', 'SUBMITTED', 'ثبت شده', 'Submitted', 'Gönderildi', '#b27b00', 10, false, ARRAY['UNDER_REVIEW']),
  ('dispute', 'UNDER_REVIEW', 'در حال بررسی', 'Under review', 'İnceleniyor', '#1967d2', 20, false, ARRAY['APPROVED','REJECTED','RESOLVED_WITH_PAYOUT']),
  ('dispute', 'APPROVED', 'تأیید شده', 'Approved', 'Onaylandı', '#00a368', 30, true, ARRAY[]::text[]),
  ('dispute', 'REJECTED', 'رد شده', 'Rejected', 'Reddedildi', '#ba1a1a', 40, true, ARRAY[]::text[]),
  ('dispute', 'RESOLVED_WITH_PAYOUT', 'حل شده با پرداخت', 'Resolved with payout', 'Ödeme ile çözüldü', '#00a368', 50, true, ARRAY[]::text[]),
  ('settlement', 'PENDING', 'در انتظار', 'Pending', 'Beklemede', '#b27b00', 10, false, ARRAY['PROCESSING']),
  ('settlement', 'PROCESSING', 'در حال واریز', 'Processing', 'İşleniyor', '#1967d2', 20, false, ARRAY['SUCCESS']),
  ('settlement', 'SUCCESS', 'واریز شد', 'Paid out', 'Ödendi', '#00a368', 30, true, ARRAY[]::text[])
ON CONFLICT (entity, code) DO NOTHING;
