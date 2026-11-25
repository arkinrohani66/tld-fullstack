import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.js';

const VEHICLE_TYPES = ['کشنده تریلر', 'تک', 'جفت', 'کمپرسی', 'یخچال‌دار', 'خاور'];

/** ثبت‌نام کامل راننده با مشخصات وسیله نقلیه */
export default function DriverRegister() {
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
        role: 'driver',
        profile: {
          licenseNumber: f.licenseNumber,
          vehicleType: f.vehicleType,
          plateNumber: f.plateNumber,
          province: f.province,
          city: f.city,
        },
      });
      nav('/driver', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>ثبت‌نام راننده</h2>
      <p className="muted">مشخصات خود و وسیله نقلیه‌تان را کامل وارد کنید</p>

      <h3>اطلاعات شخصی</h3>
      <input name="fullName" placeholder="نام و نام خانوادگی *" required minLength={3} />
      <input name="phone" placeholder="شماره موبایل (09xxxxxxxxx) *" required pattern="09[0-9]{9}" />
      <input name="password" type="password" placeholder="رمز عبور (حداقل ۶ کاراکتر) *" required minLength={6} />

      <h3>گواهینامه و وسیله نقلیه</h3>
      <input name="licenseNumber" placeholder="شماره گواهینامه *" required />
      <select name="vehicleType" required defaultValue="">
        <option value="" disabled>نوع وسیله نقلیه *</option>
        {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <input name="plateNumber" placeholder="شماره پلاک (مثال: 12ب345ایران22) *" required />
      <input name="province" placeholder="استان *" required />
      <input name="city" placeholder="شهر *" required />

      {error && <p className="error">{error}</p>}
      <button type="submit">ثبت‌نام و ورود</button>
      <p className="muted">قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login/driver">ورود راننده</Link></p>
    </form>
  );
}
