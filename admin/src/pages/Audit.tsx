import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Spinner, EmptyState, ErrorNote, Button, Th, Td } from '../components/ui';
import { faDate, num } from '../lib/format';

interface AuditRow {
  id: number;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  created_at: string;
}

export const AuditPage: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('audit_log')
      .select('id, actor_id, actor_role, action, entity, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (err) setError(err.message);
    setRows((data as AuditRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <Card
        title="گزارش فعالیت‌ها (Audit Log)"
        subtitle={`${num(rows.length)} رویداد آخر`}
        actions={<Button variant="ghost" onClick={load}>بازخوانی</Button>}
      >
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState text="رویدادی ثبت نشده است." icon="history" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>زمان</Th>
                  <Th>اقدام</Th>
                  <Th>موجودیت</Th>
                  <Th>شناسه</Th>
                  <Th>نقش</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td className="text-[10px] text-[#667085] whitespace-nowrap">{faDate(r.created_at)}</Td>
                    <Td className="font-mono-num text-[10px] font-bold">{r.action}</Td>
                    <Td className="font-mono-num text-[10px]">{r.entity || '—'}</Td>
                    <Td className="font-mono-num text-[10px] text-[#98a2b3]">{r.entity_id || '—'}</Td>
                    <Td className="text-[10px]">{r.actor_role || '—'}</Td>
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
