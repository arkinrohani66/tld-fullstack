-- 002_user_profiles.sql — پروفایل کامل صاحب بار و راننده
-- پروفایل به صورت JSONB نگه داشته می‌شود تا افزودن فیلد جدید در آینده آسان باشد.

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}';
