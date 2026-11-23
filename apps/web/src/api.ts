let token: string | null = localStorage.getItem('tld_token');

export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem('tld_token', value);
  else localStorage.removeItem('tld_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'خطای شبکه');
  return data as T;
}
