-- ============================================================
-- داده نمایشی (Demo) برای دموی سرمایه‌گذار
-- حذف کامل با: supabase/demo-reset.sql
-- ============================================================

DO $$
DECLARE
  v_shipper uuid := 'b215a1fc-d1ee-4568-8ed9-bf04cb55c397';
  v_d1      uuid := 'c48c7a47-09ed-4aa9-a0a8-b91c505624b7';
  v_d2      uuid := 'dc5ca791-93e3-4548-bdc8-d96423ad43e5';
BEGIN
  -- کیف پول‌ها
  INSERT INTO public.wallets (user_id, balance_tomans) VALUES
    (v_shipper, 0), (v_d1, 18500000), (v_d2, 7250000)
  ON CONFLICT (user_id) DO NOTHING;

  -- پروفایل رانندگان (stats)
  INSERT INTO public.drivers (profile_id, truck_model, plate_number, fleet_type, rating, total_trips, on_time_rate, safety_score)
  VALUES
    (v_d1, 'ولوو FH16', '34 ع 582 ایران 72', 'تریلی کفی', 4.8, 142, 96.5, 98),
    (v_d2, 'اسکانیا R500', '22 ب 914 ایران 11', 'تریلی چادری', 4.5, 87, 91.2, 95)
  ON CONFLICT (profile_id) DO UPDATE
    SET truck_model = EXCLUDED.truck_model,
        plate_number = EXCLUDED.plate_number,
        rating = EXCLUDED.rating,
        total_trips = EXCLUDED.total_trips;

  -- صاحب بار
  INSERT INTO public.shippers (profile_id, user_id, company_name, company_type, verification_status)
  VALUES (v_shipper, v_shipper, 'شرکت فولاد پارس', 'سهامی خاص', 'APPROVED')
  ON CONFLICT (profile_id) DO UPDATE SET company_name = EXCLUDED.company_name;

  -- محموله‌ها
  INSERT INTO public.cargos (id, shipper_id, title, origin_city, destination_city, weight_tons, truck_type, status, agreed_fare_tomans, assigned_driver_id, created_at) VALUES
    ('CRG-DEMO-01', v_shipper, 'ورق فولادی ۶ میل', 'تهران', 'اصفهان', 24, 'تریلی کفی', 'PENDING_DRIVER', NULL, NULL, now() - interval '2 hours'),
    ('CRG-DEMO-02', v_shipper, 'محصولات لبنی پاستوریزه', 'تهران', 'مشهد', 18, 'تریلی یخچالی', 'DRIVER_ASSIGNED', 38500000, v_d1, now() - interval '1 day'),
    ('CRG-DEMO-03', v_shipper, 'پلیمر پتروشیمی', 'بندرعباس', 'تبریز', 26, 'تریلی کفی', 'IN_TRANSIT', 62000000, v_d2, now() - interval '3 days'),
    ('CRG-DEMO-04', v_shipper, 'کاشی و سرامیک', 'یزد', 'شیراز', 22, 'تریلی چادری', 'DELIVERED', 27500000, v_d1, now() - interval '8 days'),
    ('CRG-DEMO-05', v_shipper, 'قطعات یدکی خودرو', 'تهران', 'کرمان', 12, 'کامیون جفت', 'PENDING_DRIVER', NULL, NULL, now() - interval '30 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- پیشنهادها روی محموله اول
  INSERT INTO public.cargo_bids (cargo_id, driver_id, proposed_fare_tomans, ready_to_load_time, driver_notes, status)
  VALUES
    ('CRG-DEMO-01', v_d1, 24500000, 'فردا ساعت ۸ صبح', 'بیمه بار کامل، مهاربندی حرفه‌ای', 'PENDING'),
    ('CRG-DEMO-01', v_d2, 23800000, 'امروز عصر', 'امکان بارگیری فوری', 'PENDING')
  ON CONFLICT (cargo_id, driver_id) DO NOTHING;

  -- اسکروی فعال برای محموله دوم
  INSERT INTO public.escrow_accounts (cargo_id, shipper_id, driver_id, freight_amount_tomans, commission_amount_tomans, vat_amount_tomans, total_hold_amount_tomans, delivery_otp, status)
  VALUES ('CRG-DEMO-02', v_shipper, v_d1, 38500000, 1925000, 173250, 40598250, '482913', 'HELD_SECURE')
  ON CONFLICT DO NOTHING;

  -- تراکنش و درآمد نمونه
  INSERT INTO public.wallet_transactions (user_id, title, amount_tomans, type, related_entity_id)
  VALUES (v_d1, 'آزادسازی کرایه بار', 27500000, 'CREDIT', 'CRG-DEMO-04')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.driver_earnings (driver_id, cargo_id, gross_fare_amount, commission_amount, toll_deduction_amount, net_earnings_amount, date, status)
  VALUES (v_d1, 'CRG-DEMO-04', 27500000, 0, 0, 27500000, to_char(now(), 'YYYY/MM/DD'), 'PAID')
  ON CONFLICT DO NOTHING;

  -- اعلان‌ها
  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type, entity_id) VALUES
    (v_shipper, 'پیشنهاد جدید برای محموله شما', 'برای محموله «ورق فولادی ۶ میل» دو پیشنهاد جدید ثبت شد.', 'CARGO', 'INFO', 'CARGO', 'CRG-DEMO-01'),
    (v_shipper, 'وجه امانی مسدود شد', 'مبلغ ۴۰٬۵۹۸٬۲۵۰ تومان برای محموله لبنیات در حساب امانی مسدود شد.', 'FINANCIAL', 'SUCCESS', 'PAYMENT', 'CRG-DEMO-02'),
    (v_d1, 'پیشنهاد شما پذیرفته شد', 'پیشنهاد شما برای محموله «محصولات لبنی پاستوریزه» پذیرفته شد.', 'CARGO', 'SUCCESS', 'CARGO', 'CRG-DEMO-02'),
    (v_d1, 'کرایه شما آزاد شد', 'کرایه ۲۷٬۵۰۰٬۰۰۰ تومانی به کیف پول شما واریز شد.', 'FINANCIAL', 'SUCCESS', 'PAYMENT', 'CRG-DEMO-04'),
    (v_d2, 'سفر فعال', 'شما در مسیر بندرعباس به تبریز هستید. لطفاً هر ۲ ساعت موقعیت را به‌روزرسانی کنید.', 'TRIP', 'INFO', 'TRIP', 'CRG-DEMO-03')
  ON CONFLICT DO NOTHING;

  -- سفر برای محموله در مسیر
  INSERT INTO public.transport_trips (cargo_id, driver_id, origin, destination, status, progress_percentage, distance_covered_km, distance_remaining_km, total_distance_km)
  VALUES ('CRG-DEMO-03', v_d2, 'بندرعباس', 'تبریز', 'ACTIVE', 42, 640, 880, 1520)
  ON CONFLICT DO NOTHING;
END
$$;
