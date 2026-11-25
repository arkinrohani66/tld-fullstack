/*
# Explicit deny-all policies for platform revenue ledger and waybills

1. Modified Tables
- `platform_revenue_ledger`: adds one explicit SELECT policy that returns no rows to signed-in clients.
- `waybills`: adds one explicit SELECT policy that returns no rows to signed-in clients.

2. Security
- Neither table is granted to anon or authenticated, so direct client access was already impossible.
- The explicit policies document that intent and remove the "RLS enabled with no policy" finding.
- Settlement and waybill lookup keep working because they run through the existing privileged functions, which bypass these policies by design.

3. Important Notes
- No data is changed or removed.
*/

DROP POLICY IF EXISTS "platform_revenue_ledger_no_client_access" ON public.platform_revenue_ledger;
CREATE POLICY "platform_revenue_ledger_no_client_access" ON public.platform_revenue_ledger FOR SELECT
  TO authenticated USING (false);

DROP POLICY IF EXISTS "waybills_no_client_access" ON public.waybills;
CREATE POLICY "waybills_no_client_access" ON public.waybills FOR SELECT
  TO authenticated USING (false);
