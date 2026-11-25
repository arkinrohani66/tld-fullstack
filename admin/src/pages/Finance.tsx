import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, StatCard, Badge, Spinner, EmptyState, ErrorNote, Button, Th, Td } from '../components/ui';
import { toman, faDate, num } from '../lib/format';

interface EscrowRow {
  id: string;
  cargo_id: string;
  shipper_id: string;
  driver_id: string;
  freight_amount_tomans: number;
  commission_amount_tomans: number;
  vat_amount_tomans: number;
  total_hold_amount_tomans: number;
  status: string;
  created_at: string;
  released_at: string | null;
}

interface LedgerRow {
  id: string;
  cargo_id: string;
  commission_amount_tomans: number;
  vat_amount_tomans: number;
  total_platform_cut_tomans: number;
  created_at: string;
}

interface SettlementRow {
  id: string;
  driver_id: string;
  settlement_reference: string;
  amount: number;
  status: string;
  bank_name: string | null;
  iban: string | null;
  requested_at: string;
}

export const FinancePage: React.FC = () => {
  const [escrows, setEscrows] = useState<EscrowRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [e, l, s] = await Promise.all([
      supabase.from('escrow_accounts').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('platform_revenue_ledger').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('driver_settlements').select('*').order('requested_at', { ascending: false }).limit(200),
    ]);
    if (e.error) setError(e.error.message);
    setEscrows((e.data as EscrowRow[]) || []);
    setLedger((l.data as LedgerRow[]) || []);
    setSettlements((s.data as SettlementRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markSettled = async (row: SettlementRow) => {
    setError(null);
    const { error: err } = await supabase
      .from('driver_settlements')
      .update({ status: 'SUCCESS', settled_at: new Date().toISOString() })
      .eq('id', row.id);
    if (err) setError(err.message);
    else load();
  };

  const commission = ledger.reduce((a, r) => a + Number(r.commission_amount_tomans || 0), 0);
  const vat = ledger.reduce((a, r) => a + Number(r.vat_amount_tomans || 0), 0);
  const held = escrows.filter((e) => e.status === 'HELD_SECURE').reduce((a, e) => a + Number(e.total_hold_amount_tomans || 0), 0);
  const pendingPayouts = settlements.filter((s) => s.status !== 'SUCCESS');

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="کارمزد کل (۵٪)" value={toman(commission)} tone="success" icon="percent" />
        <StatCard label="VAT کارمزد (۹٪)" value={toman(vat)} tone="warning" icon="receipt" />
        <StatCard label="وجه مسدود در اسکرو" value={toman(held)} icon="lock" />
        <StatCard label="تسویه‌های در انتظار" value={num(pendingPayouts.length)} tone="danger" icon="pending_actions" />
      </div>

      <Card
        title="درخواست‌های تسویه"
        subtitle="پس از تأیید، وضعیت به SUCCESS تغییر می‌کند (کسر موجودی قبلاً در تابع request_payout انجام شده است)"
        actions={<Button variant="ghost" onClick={load}>بازخوانی</Button>}
      >
        {settlements.length === 0 ? (
          <EmptyState text="درخواست تسویه‌ای ثبت نشده است." icon="payments" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>مرجع</Th>
                  <Th>مبلغ</Th>
                  <Th>بانک / شبا</Th>
                  <Th>وضعیت</Th>
                  <Th>تاریخ</Th>
                  <Th>اقدام</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-mono-num text-[10px]">{s.settlement_reference}</Td>
                    <Td className="font-mono-num font-bold">{toman(s.amount)}</Td>
                    <Td className="text-[10px]">
                      {s.bank_name || '—'}
                      <div className="font-mono-num text-[9px] text-[#98a2b3]">{s.iban || ''}</div>
                    </Td>
                    <Td>
                      <Badge tone={s.status === 'SUCCESS' ? 'success' : s.status === 'PROCESSING' ? 'warning' : 'muted'}>
                        {s.status}
                      </Badge>
                    </Td>
                    <Td className="text-[10px] text-[#667085]">{faDate(s.requested_at)}</Td>
                    <Td>
                      <Button variant="success" disabled={s.status === 'SUCCESS'} onClick={() => markSettled(s)}>
                        تأیید واریز
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="حساب‌های امانی" subtitle="۱۰٪ ردیف آخر">
        {escrows.length === 0 ? (
          <EmptyState text="حساب امانی ثبت نشده است." icon="lock" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>کد بار</Th>
                  <Th>کرایه</Th>
                  <Th>کارمزد</Th>
                  <Th>VAT</Th>
                  <Th>کل مسدودی</Th>
                  <Th>وضعیت</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {escrows.slice(0, 50).map((e) => (
                  <tr key={e.id}>
                    <Td className="font-mono-num text-[10px]">{e.cargo_id}</Td>
                    <Td className="font-mono-num">{toman(e.freight_amount_tomans)}</Td>
                    <Td className="font-mono-num">{toman(e.commission_amount_tomans)}</Td>
                    <Td className="font-mono-num">{toman(e.vat_amount_tomans)}</Td>
                    <Td className="font-mono-num font-bold">{toman(e.total_hold_amount_tomans)}</Td>
                    <Td>
                      <Badge tone={e.status === 'RELEASED_TO_DRIVER' ? 'success' : 'warning'}>{e.status}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="دفتر درآمد پلتفرم" subtitle={`${num(ledger.length)} ردیف`}>
        {ledger.length === 0 ? (
          <EmptyState text="درآمدی ثبت نشده است." icon="account_balance" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>کد بار</Th>
                  <Th>کارمزد</Th>
                  <Th>VAT</Th>
                  <Th>جمع</Th>
                  <Th>تاریخ</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {ledger.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-mono-num text-[10px]">{r.cargo_id}</Td>
                    <Td className="font-mono-num">{toman(r.commission_amount_tomans)}</Td>
                    <Td className="font-mono-num">{toman(r.vat_amount_tomans)}</Td>
                    <Td className="font-mono-num font-bold">{toman(r.total_platform_cut_tomans)}</Td>
                    <Td className="text-[10px] text-[#667085]">{faDate(r.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
