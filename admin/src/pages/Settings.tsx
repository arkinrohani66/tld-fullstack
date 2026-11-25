import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Spinner, ErrorNote, Button } from '../components/ui';
import { faDate } from '../lib/format';

interface SettingRow {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

export const SettingsPage: React.FC = () => {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('app_settings')
      .select('*')
      .order('key', { ascending: true });
    if (err) setError(err.message);
    const list = (data as SettingRow[]) || [];
    setRows(list);
    setDrafts(Object.fromEntries(list.map((r) => [r.key, JSON.stringify(r.value, null, 2)])));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (row: SettingRow) => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(drafts[row.key]);
    } catch {
      setError(`JSON نامعتبر برای کلید ${row.key}`);
      return;
    }
    const { error: err } = await supabase
      .from('app_settings')
      .update({ value: parsed })
      .eq('key', row.key);
    if (err) {
      setError(err.message);
      return;
    }
    await supabase.from('audit_log').insert({
      actor_role: 'ADMIN',
      action: 'setting.update',
      entity: 'app_settings',
      entity_id: row.key,
      before_data: row.value as any,
      after_data: parsed as any,
    });
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <Card
        title="تنظیمات پلتفرم"
        subtitle="مقادیر JSON؛ بدون دیپلوی مجدد اعمال می‌شوند. تغییرات در audit_log ثبت می‌شود."
        actions={<Button variant="ghost" onClick={load}>بازخوانی</Button>}
      >
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.key} className="rounded-xl border border-[#e4e7ec] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-extrabold font-mono-num text-[#101828]">{r.key}</div>
                  <div className="text-[10px] text-[#667085]">{r.description || '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#98a2b3]">{faDate(r.updated_at)}</span>
                  <Button onClick={() => save(r)}>ذخیره</Button>
                </div>
              </div>
              <textarea
                dir="ltr"
                value={drafts[r.key] ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-[#d0d5dd] p-2 text-[11px] font-mono-num bg-[#fcfcfd]"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
