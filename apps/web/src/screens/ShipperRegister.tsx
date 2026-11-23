import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.js';

const SHIPPER_FIELDS: { name: string; label: string; required?: boolean }[] = [
  { name: 'companyName', label: 'نام شرکت / کسب‌وکار', required: true },
  { name: 'nationalId', label: 'شناسه ملی شرکت', required: true },
  { name: 'economicCode', label: 'کد اقتصادی (اختیاری)' },
  { name: 'province', label: 'استان', required: true },
  { name: 'city', label: 'شهر', required: true },
  { name: 'landlinePhone', label: 'تلفن ثابت (اختیاری)' },
  { name: 'address', label: 'آدرس کامل دفتر', required: true },
];

/** ثبت‌نام کامل صاحب بار با مشخصات کامل */
export default function ShipperRegister() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      await register({
        phone: f.phone,
        password: f.password,
        fullName: f.fullName,
        role: 'shipper',
        profile: {
          companyName: f.companyName,
          nationalId: f.nationalId,
          economicCode: f.economicCode,
          province: f.province,
          city: f.city,
          address: f.address,
          landlinePhone: f.landlinePhone,
        },
      });
      nav('/shipper', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>ثبت‌نام صاحب بار</h2>
      <p className="muted">مشخصات خود و کسب‌وکارتان را کامل وارد کنید</p>

      <h3>اطلاعات شخصی</h3>
      <input name="fullName" placeholder="نام و نام خانوادگی *" required minLength={3} />
      <input name="phone" placeholder="شماره موبایل (09xxxxxxxxx) *" required pattern="09[0-9]{9}" />
      <input name="password" type="password" placeholder="رمز عبور (حداقل ۶ کاراکتر) *" required minLength={6} />

      <h3>اطلاعات کسب‌وکار</h3>
      {SHIPPER_FIELDS.map((f) => (
        <input key={f.name} name={f.name} placeholder={`${f.label}${f.required ? ' *' : ''}`} required={f.required} />
      ))}

      {error && <p className="error">{error}</p>}
      <button type="submit">ثبت‌نام و ورود</button>
      <p className="muted">قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login/shipper">ورود صاحب بار</Link></p>
    </form>
  );
}
