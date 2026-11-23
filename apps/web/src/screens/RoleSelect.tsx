import { Link } from 'react-router-dom';

/** انتخاب نقش: صاحب بار یا راننده — ورود و ثبت‌نام هر نقش از همین‌جا */
export default function RoleSelect() {
  return (
    <div className="roles">
      <h2>به TLD خوش آمدید</h2>
      <p className="muted">نقش خود را انتخاب کنید</p>
      <Link to="/register/shipper" className="role-card shipper">
        <strong>صاحب بار</strong>
        <span>ثبت و ارسال بار، دریافت پیشنهاد قیمت و پرداخت امانی</span>
        <span className="btn">ثبت‌نام / ورود صاحب بار</span>
      </Link>
      <Link to="/register/driver" className="role-card driver">
        <strong>راننده</strong>
        <span>مشاهده اعلام بارها، ثبت پیشنهاد و اعلام تحویل</span>
        <span className="btn">ثبت‌نام / ورود راننده</span>
      </Link>
    </div>
  );
}
