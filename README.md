# TLD Fullstack — سامانه لجستیک حمل و نقل سنگین

نسخه فول‌استک ماژولار TLD Logistics: بازار آنلاین حمل بار (اعلام بار، مناقعه قیمت)، پرداخت امانی (escrow) با کارمزد ۵٪ و ۹٪ مالیات بر آن، بارنامه الکترونیک و تله‌متری IoT (TLD-Box).

## معماری

```
tld-fullstack/
├── apps/
│   ├── api/            بک‌اند Express + TypeScript + PostgreSQL
│   │   ├── src/modules/   دامنه‌های کسب‌وکار (هر کدام مستقل)
│   │   │   ├── auth/      ثبت‌نام، ورود، JWT
│   │   │   ├── cargos/    اعلام بار و مشاهده
│   │   │   ├── bids/      پیشنهاد قیمت راننده و پذیرش توسط صاحب بار
│   │   │   ├── escrow/    واریز امانی، تسویه، کارمزد، بارنامه
│   │   │   └── tracking/  تله‌متری TLD-Box
│   │   └── migrations/    مایگریشن‌های SQL
│   └── web/            فرانت‌اند React 19 + Vite (فارسی RTL)
├── packages/shared/    انواع و ثابت‌های مشترک (قرارداد API)
└── scripts/            مایگریشن و seed
```

## اجرا

```bash
# پیش‌نیاز: PostgreSQL (یا docker compose up -d)
export DATABASE_URL=postgres://ubuntu:ubuntu@localhost:5432/app

npm install
npm run db:migrate
npm run db:seed          # کاربران نمونه: 09120000001 (صاحب بار) و 09120000002 (راننده)، رمز 123456
npm run dev:api          # بک‌اند روی پورت 4000
npm run dev:web          # فرانت‌اند روی پورت 5173 (پروکسی /api به 4000)
```

## افزودن قابلیت جدید (طراحی ماژولار)

1. پوشه جدید در `apps/api/src/modules/<name>/index.ts` بسازید که `{ prefix, router }` صادر کند.
2. آن را در آرایه `modules` در `apps/api/src/modules/index.ts` ثبت کنید — همین.
3. جدول‌های جدید را در `apps/api/migrations/00N_*.sql` اضافه کنید (`npm run db:migrate`).
4. انواع مشترک را در `packages/shared/src/index.ts` بگذارید تا فرانت و بک هم‌نسخه بمانند.

## جریان کاری بار

`listed` → (پیشنهاد راننده + پذیرش صاحب بار) → `assigned` → واریز امانی → `funded` → شروع حمل + بارنامه → `in_transit` → اعلام تحویل → `delivered` → تسویه (آزادسازی منهای ۵٪ کارمزد و ۹٪ مالیات آن) → `released`

## تنظیمات محیطی (apps/api)

| متغیر | پیش‌فرض |
|---|---|
| `DATABASE_URL` | `postgres://ubuntu:ubuntu@localhost:5432/app` |
| `PORT` | `4000` |
| `JWT_SECRET` | مقدار توسعه — در production حتماً ست شود |
