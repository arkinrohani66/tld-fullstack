import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Button, Badge, Spinner, EmptyState, ErrorNote, Th, Td } from '../components/ui';
import { toman, faDate, num } from '../lib/format';

interface CargoRow {
  id: string;
  title: string;
  origin_city: string;
  destination_city: string;
  status: string;
  weight_tons: number | null;
  truck_type: string | null;
  agreed_fare_tomans: number | null;
  assigned_driver_id: string | null;
  shipper_id: string | null;
  created_at: string;
}

const STATUSES = ['PENDING_DRIVER', 'DRIVER_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

export const CargosPage: React.FC = () => {
  const [rows, setRows] = useState<CargoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from('cargos')
      .select('id, title, origin_city, destination_city, status, weight_tons, truck_type, agreed_fare_tomans, assigned_driver_id, shipper_id, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (filter !== 'ALL') q = q.eq('status', filter);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows((data as CargoRow[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const override = async (row: CargoRow, status: string) => {
    setBusy(row.id);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('cargos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (err) throw new Error(err.message);
      await supabase.from('audit_log').insert({
        actor_role: 'ADMIN',
        action: 'cargo.status_override',
        entity: 'cargos',
        entity_id: row.id,
        before_data: { status: row.status },
        after_data: { status },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-[#d0d5dd] bg-white px-3 py-1.5 text-[11px] font-bold"
        >
          <option value="ALL">همه وضعیت‌ها</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button variant="ghost" onClick={load}>بازخوانی</Button>
        <span className="text-[11px] text-[#667085]">{num(rows.length)} محموله</span>
      </div>

      <Card title="مانیتور محموله‌ها" subtitle="تغییر وضعیت توسط مدیر در audit_log ثبت می‌شود">
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState text="محموله‌ای با این فیلتر وجود ندارد." icon="inventory_2" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>شناسه</Th>
                  <Th>عنوان</Th>
                  <Th>مسیر</Th>
                  <Th>وزن</Th>
                  <Th>کرایه</Th>
                  <Th>وضعیت</Th>
                  <Th>تاریخ</Th>
                  <Th>تغییر وضعیت</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-mono-num text-[10px] text-[#667085]">{r.id}</Td>
                    <Td className="font-bold">{r.title}</Td>
                    <Td className="text-[10px]">
                      {r.origin_city} → {r.destination_city}
                    </Td>
                    <Td className="font-mono-num">{r.weight_tons ? `${num(r.weight_tons)} تن` : '—'}</Td>
                    <Td className="font-mono-num">{r.agreed_fare_tomans ? toman(r.agreed_fare_tomans) : '—'}</Td>
                    <Td>
                      <Badge tone={r.status === 'DELIVERED' ? 'success' : r.status === 'CANCELLED' ? 'danger' : 'default'}>
                        {r.status}
                      </Badge>
                    </Td>
                    <Td className="text-[10px] text-[#667085]">{faDate(r.created_at)}</Td>
                    <Td>
                      <select
                        disabled={busy === r.id}
                        value={r.status}
                        onChange={(e) => override(r, e.target.value)}
                        className="rounded-lg border border-[#d0d5dd] bg-white px-2 py-1 text-[10px] font-mono-num"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Td>
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
