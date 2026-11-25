const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const toman = (value: number | string | null | undefined): string => {
  const n = Number(value || 0);
  return `${n.toLocaleString('fa-IR')} تومان`;
};

export const num = (value: number | string | null | undefined): string =>
  Number(value || 0).toLocaleString('fa-IR');

export const latin = (value: number | string | null | undefined): string =>
  String(value ?? '');

export const faDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const shortId = (id?: string | null): string => (id ? String(id).slice(0, 8) : '—');

export const persianToLatinDigits = (input: string): string =>
  input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));

export const toE164 = (mobile: string): string => {
  const digits = (mobile || '').trim().replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+98')) return digits;
  if (digits.startsWith('0098')) return `+98${digits.slice(4)}`;
  if (digits.startsWith('0')) return `+98${digits.slice(1)}`;
  if (digits.startsWith('+')) return digits;
  return `+98${digits}`;
};
