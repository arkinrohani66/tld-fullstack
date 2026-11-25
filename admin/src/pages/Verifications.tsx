import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Button, Badge, Spinner, EmptyState, ErrorNote, Th, Td } from '../components/ui';
import { faDate, num } from '../lib/format';
import { useAdminAuth } from '../context/AdminAuth';

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  verification_status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}

const TABS = [
  { key: 'PENDING', label: 'در انتظار تأیید' },
  { key: 'APPROVED', label: 'تأییدشده' },
  { key: 'REJECTED', label: 'ردشده' },
  { key: 'ALL', label: 'همه' },
] as const;

export const VerificationsPage: React.FC = () => {
  const { profile: admin } = useAdminAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('PENDING');
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from('profiles')
      .select('user_id, full_name, phone, email, role, verification_status, rejection_reason, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (tab !== 'ALL') q = q.eq('verification_status', tab);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows((data as ProfileRow[]) || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const audit = async (action: string, entityId: string, after: unknown) => {
    try {
      await supabase.from('audit_log').insert({
        actor_id: admin?.user_id,
        actor_role: 'ADMIN',
        action,
        entity: 'profiles',
        entity_id: entityId,
        after_data: after as any,
      });
    } catch {
      /* audit failure must not block the action */
    }
  };

  const setStatus = async (row: ProfileRow, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setBusyId(row.user_id);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({
          verification_status: status,
          rejection_reason: status === 'REJECTED' ? reason || 'عدم تطابق مدارک' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', row.user_id);
      if (err) throw new Error(err.message);

      await supabase.from('notifications').insert({
        user_id: row.user_id,
        title: status === 'APPROVED' ? 'احراز هویت تأیید شد' : 'مدارک نیاز به اصلاح دارد',
        message:
          status === 'APPROVED'
            ? 'مدارک شما تأیید شد و دسترسی کامل به پلتفرم فعال گردید.'
            : `مدارک شما رد شد: ${reason || 'عدم تطابق مدارک'}`,
        category: 'SECURITY',
        severity: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      });

      await audit(`verification.${status.toLowerCase()}`, row.user_id, { status, reason });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'عملیات ناموفق بود.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
              tab === t.key
                ? 'bg-[#00258e] text-white'
                : 'bg-white text-[#344054] border border-[#d0d5dd]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <Button variant="ghost" onClick={load}>
          بازخوانی
        </Button>
      </div>

      <Card title="صف احراز هویت" subtitle={`${num(rows.length)} پرونده در این تب`}>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState text="پرونده‌ای در این وضعیت وجود ندارد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <Th>نام</Th>
                  <Th>موبایل</Th>
                  <Th>نقش</Th>
                  <Th>وضعیت</Th>
                  <Th>تاریخ ثبت</Th>
                  <Th>اقدام</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {rows.map((r) => (
                  <tr key={r.user_id}>
                    <Td className="font-bold">{r.full_name || '—'}</Td>
                    <Td className="font-mono-num" >{r.phone || '—'}</Td>
                    <Td>{r.role || '—'}</Td>
                    <Td>
                      <Badge
                        tone={
                          r.verification_status === 'APPROVED'
                            ? 'success'
                            : r.verification_status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {r.verification_status || '—'}
                      </Badge>
                    </Td>
                    <Td className="text-[10px] text-[#667085]">{faDate(r.created_at)}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Button
                          variant="success"
                          disabled={busyId === r.user_id || r.verification_status === 'APPROVED'}
                          onClick={() => setStatus(r, 'APPROVED')}
                        >
                          تأیید
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busyId === r.user_id}
                          onClick={() => {
                            const reason = window.prompt('دلیل رد مدارک:', 'عدم تطابق مدارک');
                            if (reason !== null) setStatus(r, 'REJECTED', reason);
                          }}
                        >
                          رد
                        </Button>
                      </div>
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
