-- دسترسی خواندن جداول مالی برای ادمین (وب مدیریتی)
-- قبلاً ledger برای همه‌ی کلاینت‌ها بسته بود؛ حالا ادمین می‌تواند بخواند.

DROP POLICY IF EXISTS "platform_revenue_ledger_admin_read" ON public.platform_revenue_ledger;
CREATE POLICY "platform_revenue_ledger_admin_read" ON public.platform_revenue_ledger FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "escrow_accounts_admin_read" ON public.escrow_accounts;
CREATE POLICY "escrow_accounts_admin_read" ON public.escrow_accounts FOR SELECT
  TO authenticated USING (public.is_admin());
