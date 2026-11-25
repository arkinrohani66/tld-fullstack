import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, StatCard, Spinner, Badge } from '../components/ui';
import { toman, num, faDate } from '../lib/format';

interface Kpi {
  drivers: number;
  shippers: number;
  pendingVerifications: number;
  openCargos: number;
  assignedCargos: number;
  deliveredCargos: number;
  heldEscrow: number;
  releasedEscrow: number;
  commission: number;
  vat: number;
  disputes: number;
}

const emptyKpi: Kpi = {
  drivers: 0,
  shippers: 0,
  pendingVerifications: 0,
  openCargos: 0,
  assignedCargos: 0,
  deliveredCargos: 0,
  heldEscrow: 0,
  releasedEscrow: 0,
  commission: 0,
  vat: 0,
  disputes: 0,
};

const countOf = async (table: string, apply?: (q: any) => any): Promise<number> => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
};

export const OverviewPage: React.FC = () => {
  const [kpi, setKpi] = useState<Kpi>(emptyKpi);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [drivers, shippers, pending, open, assigned, delivered, disputes, held, released] =
        await Promise.all([
          countOf('drivers'),
          countOf('shippers'),
          countOf('profiles', (q) => q.eq('verification_status', 'PENDING')),
          countOf('cargos', (q) => q.eq('status', 'PENDING_DRIVER')),
          countOf('cargos', (q) => q.eq('status', 'DRIVER_ASSIGNED')),
          countOf('cargos', (q) => q.eq('status', 'DELIVERED')),
          countOf('driver_disputes', (q) => q.neq('status', 'REJECTED')),
          countOf('escrow_accounts', (q) => q.eq('status', 'HELD_SECURE')),
          countOf('escrow_accounts', (q) => q.eq('status', 'RELEASED_TO_DRIVER')),
        ]);

      const { data: ledger } = await supabase
        .from('platform_revenue_ledger')
        .select('commission_amount_tomans, vat_amount_tomans')
        .limit(2000);
      const commission = (ledger || []).reduce((a, r: any) => a + Number(r.commission_amount_tomans || 0), 0);
      const vat = (ledger || []).reduce((a, r: any) => a + Number(r.vat_amount_tomans || 0), 0);

      setKpi({
        drivers,
        shippers,
        pendingVerifications: pending,
        openCargos: open,
        assignedCargos: assigned,
        deliveredCargos: delivered,
        heldEscrow: held,
        releasedEscrow: released,
        commission,
        vat,
        disputes,
      });

      const { data: latest } = await supabase
        .from('cargos')
        .select('id, title, status, agreed_fare_tomans, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      setRecent(latest || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="رانندگان" value={num(kpi.drivers)} icon="local_shipping" />
        <StatCard label="صاحبان بار" value={num(kpi.shippers)} icon="business_center" />
        <StatCard
          label="در انتظار تأیید"
          value={num(kpi.pendingVerifications)}
          tone="warning"
          icon="pending_actions"
          hint="پرونده‌های احراز هویت"
        />
        <StatCard
          label="اختلافات باز"
          value={num(kpi.disputes)}
          tone="danger"
          icon="gavel"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="بارهای باز" value={num(kpi.openCargos)} icon="inventory_2" />
        <StatCard label="در حال حمل" value={num(kpi.assignedCargos)} icon="route" />
        <StatCard label="تحویل‌شده" value={num(kpi.deliveredCargos)} tone="success" icon="check_circle" />
        <StatCard
          label="اسکروی فعال"
          value={num(kpi.heldEscrow)}
          icon="lock"
          hint={`${num(kpi.releasedEscrow)} تسویه‌شده`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <StatCard
          label="کارمزد جمع‌آوری‌شده (۵٪)"
          value={toman(kpi.commission)}
          tone="success"
          icon="account_balance"
        />
        <StatCard
          label="مالیات بر ارزش افزوده (۹٪ کارمزد)"
          value={toman(kpi.vat)}
          tone="warning"
          icon="receipt_long"
        />
      </div>

      <Card title="آخرین محموله‌ها" subtitle="۶ ردیف آخر جدول cargos">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="text-right text-[10px] font-bold text-[#667085] px-3 py-2">شناسه</th>
                <th className="text-right text-[10px] font-bold text-[#667085] px-3 py-2">عنوان</th>
                <th className="text-right text-[10px] font-bold text-[#667085] px-3 py-2">وضعیت</th>
                <th className="text-right text-[10px] font-bold text-[#667085] px-3 py-2">کرایه</th>
                <th className="text-right text-[10px] font-bold text-[#667085] px-3 py-2">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7]">
              {recent.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 text-[10px] font-mono-num text-[#667085]">{c.id}</td>
                  <td className="px-3 py-2 text-[11px] font-bold">{c.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone={c.status === 'DELIVERED' ? 'success' : c.status === 'PENDING_DRIVER' ? 'warning' : 'default'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-[11px] font-mono-num">
                    {c.agreed_fare_tomans ? toman(c.agreed_fare_tomans) : '—'}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-[#667085]">{faDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
