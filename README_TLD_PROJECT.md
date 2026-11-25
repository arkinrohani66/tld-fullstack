# سامانه ترابری هوشمند و مانیتورینگ زنجیره سرد TLD Logistics
## پلتفرم جامع کشوری حمل و نقل بار، رهگیری IoT و داوری دیجیتال

---

### مشخصات اصلی پروژه (Project Specs)
* **دامنه رسمی:** `tldlogistics.ir`
* **معماری فرانت‌اند:** React 19 + TypeScript + Vite + Tailwind CSS + PWA (دارای Service Worker آفلاین، مانیفست استاندارد و قابلیت نصب در اندروید/iOS و استخراج APK).
* **پایگاه داده و احراز هویت:** Supabase PostgreSQL 15+ (همراه با اسکریپت جامع `supabase_schema.sql` و سیاست‌های امنیتی سطح سطر RLS).
* **مدل مالی و کارمزد سامانه:** **۵ درصد (5.0%)** کارمزد قطعی سامانه از هر کرایه حمل، با تفکیک ۹٪ مالیات ارزش افزوده و واریز اتوماتیک به خزانه‌داری متمرکز هنگام آزادسازی وجه امانی (Escrow).
* **ماژول اینترنت اشیا (IoT / Telemetry):** دریافت بلادرنگ سنسورهای باک سوخت، دمای ۳ زون کانتینر منجمد، شوک/ضربه G و پلمپ الکترونیک دیجیتال TLD-Box.

---

### ساختار پوشه‌ها و فایل‌های داخل این فایل زیپ
* `src/screens/`: بیش از ۳۰ صفحه تخصصی راننده و صاحب بار (ثبت‌نام ۵ مرحله‌ای، داشبوردها، مناقصه بار، سفر فعال، مانیتورینگ سوخت، اسکنر بارکدخوان بارنامه با دوربین، داوری و حل اختلاف).
* `src/components/`: کامپوننت‌های ماژولار (ناوبری، هدر، سنسورهای IoT، اسکنر QR، احراز هویت بیومتریک FIDO2/WebAuthn، نصب PWA و مدیریت درآمد).
* `src/services/`: سرویس‌های ارتباط با Supabase، مدیریت کارمزد ۵٪ خزانه‌داری (`platformRevenueService.ts`)، تله‌متری (`tldTrackingService.ts`)، کیف پول و بارنامه.
* `src/context/`: مدیریت وضعیت مرکزی کلاینت (`AuthContext`, `LogisticsContext`, `LanguageContext`).
* `supabase_schema.sql`: فایل جامع SQL شامل ایجاد ۱۴ جدول دیتابیس، نمایه‌ها (Indexes)، قوانین امنیتی کامل RLS و داده‌های نمونه اولیه.
* `public/`: آیکون‌های PWA (در سایزهای ۱۹۲ و ۵۱۲)، مانیفست وب‌اپلیکیشن و لوگوهای رسمی.

---

### نحوه راه‌اندازی در محیط توسعه محلی (Local Development)

۱. اطمینان از نصب بودن Node.js (نسخه ۱۸ به بالا).
۲. نصب وابستگی‌ها در ترمینال:
```bash
npm install
```
۳. اجرای سرور توسعه محلی:
```bash
npm run dev
```
۴. ساخت نسخه نهایی پروداکشن (Build):
```bash
npm run build
```

---

### نحوه درون‌ریزی دیتابیس در Supabase (Database Setup)
> نکته: فایل واحدی به نام `supabase_schema.sql` وجود ندارد. ساختار دیتابیس در قالب
> migration‌های نسخه‌دار داخل پوشه `supabase/migrations/` نگهداری می‌شود و باید
> **به ترتیب تاریخ** اجرا شوند.

۱. وارد داشبورد پروژه خود در [Supabase](https://supabase.com) شوید.
۲. به بخش **SQL Editor** بروید.
۳. محتوای فایل‌های پوشه `supabase/migrations/` را به ترتیب زیر اجرا کنید:
   1. `20261105071303_escrow_settlement_and_waybills.sql`
   2. `20261105212408_lock_down_ledger_and_waybill_policies.sql`
   3. `20261105212801_escrow_waybill_functions_server_only.sql`
   4. `20261106150644_create_cargos_and_bids_tables.sql`
   5. `20261106150709_accept_driver_bid_and_cargo_owner_escrow_check.sql`
   6. `20261108103000_core_tables_rls_and_money_flow.sql`
   7. `20261109120000_fix_cargo_flow_counter_offers_and_visibility.sql` ← اصلاحات آخر
۴. توابع لبه (Edge Functions) را با `supabase functions deploy` منتشر کنید
   (`accept-counter-offer` هم جدید است).
۵. مقادیر `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` را در فایل `.env` قرار دهید
   (نمونه در `.env.example`).

---
توسعه‌یافته برای پلتفرم ترابری هوشمند TLD
tldlogistics.ir
