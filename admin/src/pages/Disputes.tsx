import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, ErrorNote, Button, Th, Td } from '../components/ui';
import { toman, faDate, num } from '../lib/format';

interface DisputeRow {
  id: string;
  driver_id: string;
  cargo_id: string | null;
  dispute_type: string;
  title: string;
  description: string;
  claimed_amount: number;
  status: string;
  created_at: string;
}

const DECISIONS: { key: string; label: string; tone: string }[] = [
  { key: 'UNDER_REVIEW', label: 'در حال بررسی', tone: 'warning' },
  { key: 'APPROVED', label: 'تأیید', tone: 'success' },
  { key: 'REJECTED', label: 'رد', tone: 'danger' },
  { key: 'RESOLVED_WITH_PAYOUT', label: 'حل با پرداخت', tone: 'success' },
];

export const DisputesPage: React.FC = () => {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('driver_disputes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) setError(err.message);
    setRows((data as DisputeRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (row: DisputeRow, status: string) => {
    setError(null);
    const note = window.prompt('یادداشت داوری (اختیاری):', '') || null;
    const { error: err } = await supabase
      .from('driver_disputes')
      .update({ status, arbitration_note: note })
      .eq('id', row.id);
    if (err) {
      setError(err.message);
      return;
    }
    await supabase.from('audit_log').insert({
      actor_role: 'ADMIN',
      action: `dispute.${status.toLowerCase()}`,
      entity: 'driver_disputes',
      entity_id: row.id,
      before_data: { status: row.status },
      after_data: { status, note },
    });
    await supabase.from('notifications').insert({
      user_id: row.driver_id,
      title: 'به‌روزرسانی پرونده داوری',
      message: `وضعیت پرونده «${row.title}» به ${status} تغییر یافت.`,
      category: 'SYSTEM',
      severity: status === 'REJECTED' ? 'WARNING' : 'INFO',
    });
    load();
  };

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[#667085]">{num(rows.length)} پرونده</span>
        <Button variant="ghost" onClick={load}>بازخوانی</Button>
      </div>

      <Card title="داوری و اختلافات" subtitle="تصمیم‌ها در audit_log ثبت و به راننده اعلان می‌شود">
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState text="پرونده‌ای ثبت نشده است." icon="gavel" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>عنوان</Th>
                  <Th>نوع</Th>
                  <Th>مبلغ مطالبه</Th>
                  <Th>وضعیت</Th>
                  <Th>تاریخ</Th>
                  <Th>تصمیم</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-bold">
                      {r.title}
                      <div className="text-[10px] text-[#98a2b3] mt-0.5 max-w-[260px] truncate">{r.description}</div>
                    </Td>
                    <Td className="text-[10px] font-mono-num">{r.dispute_type}</Td>
                    <Td className="font-mono-num">{toman(r.claimed_amount)}</Td>
                    <Td>
                      <Badge
                        tone={
                          r.status === 'REJECTED' ? 'danger' : r.status === 'UNDER_REVIEW' ? 'warning' : 'success'
                        }
                      >
                        {r.status}
                      </Badge>
                    </Td>
                    <Td className="text-[10px] text-[#667085]">{faDate(r.created_at)}</Td>
                    <Td>
                      <select
                        value={r.status}
                        onChange={(e) => decide(r, e.target.value)}
                        className="rounded-lg border border-[#d0d5dd] bg-white px-2 py-1 text-[10px]"
                      >
                        {DECISIONS.map((d) => (
                          <option key={d.key} value={d.key}>{d.label}</option>
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
