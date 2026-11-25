import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Badge, Spinner, ErrorNote, Button } from '../components/ui';
import { faDate } from '../lib/format';

interface ModuleRow {
  code: string;
  name_fa: string;
  name_en: string | null;
  name_tr: string | null;
  description: string | null;
  is_enabled: boolean;
  sort_order: number;
  updated_at: string;
}

export const ModulesPage: React.FC = () => {
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('feature_modules')
      .select('*')
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    setRows((data as ModuleRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (row: ModuleRow) => {
    setBusy(row.code);
    setError(null);
    const { error: err } = await supabase
      .from('feature_modules')
      .update({ is_enabled: !row.is_enabled })
      .eq('code', row.code);
    if (err) setError(err.message);
    else {
      await supabase.from('audit_log').insert({
        actor_role: 'ADMIN',
        action: 'module.toggle',
        entity: 'feature_modules',
        entity_id: row.code,
        before_data: { is_enabled: row.is_enabled },
        after_data: { is_enabled: !row.is_enabled },
      });
      await load();
    }
    setBusy(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <Card
        title="ماژول‌های پلتفرم"
        subtitle="خاموش‌کردن یک ماژول آن را از دسترس کاربران خارج می‌کند؛ افزودن ماژول جدید فقط یک ردیف در جدول feature_modules است"
        actions={<Button variant="ghost" onClick={load}>بازخوانی</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((m) => (
            <div
              key={m.code}
              className={`rounded-2xl border p-4 flex flex-col gap-2 ${
                m.is_enabled ? 'border-[#a9e2bd] bg-[#f6fdf9]' : 'border-[#e4e7ec] bg-[#fafbfc]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[12px] font-extrabold text-[#101828]">{m.name_fa}</div>
                  <div className="text-[10px] text-[#667085]" dir="ltr">{m.name_en || m.code}</div>
                </div>
                <Badge tone={m.is_enabled ? 'success' : 'muted'}>{m.is_enabled ? 'فعال' : 'غیرفعال'}</Badge>
              </div>
              {m.description && <p className="text-[10px] text-[#667085] leading-5">{m.description}</p>}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#eef0f6]">
                <span className="text-[9px] font-mono-num text-[#98a2b3]">{m.code}</span>
                <Button
                  variant={m.is_enabled ? 'danger' : 'success'}
                  disabled={busy === m.code}
                  onClick={() => toggle(m)}
                >
                  {m.is_enabled ? 'غیرفعال کردن' : 'فعال کردن'}
                </Button>
              </div>
              <div className="text-[9px] text-[#98a2b3]">آخرین تغییر: {faDate(m.updated_at)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
