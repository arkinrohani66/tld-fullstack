# TLD Logistics — پلتفرم حمل‌ونقل هوشمند

سامانه جامع حمل بار سنگین، رهگیری IoT و داوری دیجیتال، شامل **دو اپلیکیشن مستقل** که هر دو به یک دیتابیس Supabase وصل می‌شوند:

| اپ | مسیر | مخاطب | خروجی بیلد |
|---|---|---|---|
| **اپ اصلی** (PWA موبایل) | `src/` | راننده، صاحب بار | `dist/` |
| **وب مدیریتی** | `admin/` | مدیران پلتفرم | `dist-admin/` |
| **دیتابیس** | `supabase/` | — | migrations + edge functions |

---

## ۱. پیش‌نیازها

- Node.js ۱۸ یا بالاتر
- یک پروژه Supabase

## ۲. راه‌اندازی

```bash
npm install

cp .env.example .env      # سپس مقادیر Supabase را جایگزین کنید

npm run dev               # اپ اصلی روی http://localhost:3000
npm run admin:dev         # وب مدیریتی روی http://localhost:3100
```

### متغیرهای محیطی

| متغیر | توضیح |
|---|---|
| `VITE_SUPABASE_URL` | آدرس پروژه Supabase |
| `VITE_SUPABASE_ANON_KEY` | کلید عمومی (anon/publishable) — برای هر دو اپ |
| `VITE_USE_MOCK_DATA` | `true` = اجرا با داده آزمایشی و بدون دیتابیس |
| `VITE_GEMINI_API_KEY` | اختیاری، برای دستیار هوشمند |
| `VITE_GEMINI_MODEL_*` | اختیاری، نام مدل‌های دستیار (پیش‌فرض در `src/services/geminiService.ts`) |

> کلید `service_role` هرگز نباید در `.env` سمت کلاینت یا در مخزن قرار بگیرد. این کلید فقط برای اجرای migration و اسکریپت‌های سروری است.
>
> اگر `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` تعریف نشوند، هر دو اپ روی مقادیر پیش‌فرض دمو در `src/services/supabaseClient.ts` و `admin/src/lib/supabase.ts` بالا می‌آیند تا نصب اولیه بدون `.env` هم کار کند. کلید anon عمومی است؛ امنیت واقعی از RLS می‌آید.

## ۳. دیتابیس

ساختار در `supabase/migrations/` نگهداری می‌شود و باید **به ترتیب تاریخ** اجرا شود:

```
20261105071303_escrow_settlement_and_waybills.sql
20261105212408_lock_down_ledger_and_waybill_policies.sql
20261105212801_escrow_waybill_functions_server_only.sql
20261106150644_create_cargos_and_bids_tables.sql
20261106150709_accept_driver_bid_and_cargo_owner_escrow_check.sql
20261108103000_core_tables_rls_and_money_flow.sql
20261109120000_fix_cargo_flow_counter_offers_and_visibility.sql
20261109140000_modular_platform_core.sql
```

برای نصب یکجا، فایل `supabase/apply_now.sql` را در **SQL Editor** داشبورد Supabase اجرا کنید.

### معماری قابل توسعه

لایه پلتفرمی (migration آخر) امکان افزودن قابلیت‌های جدید را بدون بازنویسی اسکیما فراهم می‌کند:

| جدول | کاربرد |
|---|---|
| `feature_modules` | روشن/خاموش کردن ماژول‌ها بدون دیپلوی مجدد |
| `app_settings` | تنظیمات زمان اجرا به‌صورت JSONB |
| `status_definitions` | وضعیت‌های قابل افزودن (افزودن وضعیت = یک ردیف، نه migration) |
| `audit_log` | ثبت همه اقدامات مدیریتی |
| `media_assets` | مدارک و فایل‌های آپلودی |

افزودن یک قابلیت جدید معمولاً یعنی: یک migration کوچک + یک ردیف در `feature_modules` + یک صفحه در اپ.

## ۴. اسکریپت‌ها

| دستور | کار |
|---|---|
| `npm run dev` | اجرای اپ اصلی |
| `npm run admin:dev` | اجرای وب مدیریتی |
| `npm run build` | بیلد اپ اصلی (PWA) |
| `npm run admin:build` | بیلد وب مدیریتی |
| `npm run typecheck` / `typecheck:admin` | بررسی تایپ‌ها |
| `npm run clean` | حذف خروجی‌های بیلد |

> هر دو دستور بیلد از `scripts/build.mjs` عبور می‌کنند. این اسکریپت `TEMP/TMP` را به `.tmp-build/` داخل پروژه هدایت می‌کند؛ روی ویندوز اگر آنتی‌ویروس فایل موقت esbuild را قفل کند، بیلد با خطای `remove ...: Access is denied` وسط کار متوقف می‌شد و `dist/` نیمه‌کاره می‌ماند. اگر باز هم بیلد شکست خورد، پوشه پروژه را در آنتی‌ویروس استثنا کنید.

## ۵. دسترسی مدیریت

پس از اجرای migrationها، حساب مدیر باید در جدول `profiles` نقش `ADMIN` داشته باشد:

```sql
update public.profiles
   set role = 'ADMIN', verification_status = 'APPROVED'
 where email = 'admin@tldlogistics.ir';
```

سپس از `http://localhost:3100` با همان ایمیل/رمز وارد شوید. دسترسی در سمت سرور با تابع `is_admin()` و سیاست‌های RLS کنترل می‌شود، نه در مرورگر.

## ۶. امنیت

- تمام جداول RLS دارند؛ نوشتن مستقیم کلاینت فقط برای ردیف‌های خود کاربر مجاز است.
- پول و تخصیص بار فقط از طریق توابع `SECURITY DEFINER` (edge functions) انجام می‌شود.
- کلید عملیاتی (`service_role`) فقط در edge functions استفاده می‌شود.
- کارمزد پلتفرم: **۵٪ کرایه + ۹٪ مالیات بر ارزش افزوده روی کارمزد** (بر عهده صاحب بار).

## ۷. دیپلوی

- **اپ اصلی:** خروجی `dist/` را روی هر هاست استاتیک (Vercel/Netlify/Cloudflare Pages) بگذارید.
- **وب مدیریتی:** خروجی `dist-admin/` را روی یک دامنه جدا (مثلاً `admin.tldlogistics.ir`) منتشر کنید.
- Edge functions: `supabase functions deploy <name>`

---

توسعه‌یافته برای **TLD Logistics** — `tldlogistics.ir`
