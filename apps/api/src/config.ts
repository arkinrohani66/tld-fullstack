/** پیکربندی از طریق متغیرهای محیطی — هیچ مقدار حساسی در کد ذخیره نمی‌شود. */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`متغیر محیطی ${name} تنظیم نشده است`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'postgres://ubuntu:ubuntu@localhost:5432/app'),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
};
