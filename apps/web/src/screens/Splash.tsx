import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.js';

/** صفحه اسپلش: چند لحظه لوگو و شعار، بعد هدایت به انتخاب نقش یا صفحه نقش */
export default function Splash() {
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      nav(user ? `/${user.role}` : '/roles', { replace: true });
    }, 1800);
    return () => clearTimeout(t);
  }, [nav, user]);

  return (
    <div className="splash">
      <div className="splash-logo">TLD</div>
      <h1>تی‌ال‌دی لجستیک</h1>
      <p className="muted">سامانه هوشمند لجستیک حمل و نقل سنگین</p>
      <div className="splash-bar"><span /></div>
    </div>
  );
}
