import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OfficialTaxInvoice, ShipperFullCargo, ElectronicWaybill, DigitalSmartContract } from '../types';

/**
 * Utility to generate a hidden or visible HTML container, render it via html2canvas,
 * and save it directly as a high-resolution A4 PDF via jsPDF.
 */
async function renderHtmlToPdf(
  htmlContent: string,
  filename: string,
  orientation: 'p' | 'portrait' | 'l' | 'landscape' = 'p'
): Promise<boolean> {
  // Create off-screen container for crisp rendering
  const container = document.createElement('div');
  container.id = 'pdf-render-sandbox';
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = orientation === 'p' || orientation === 'portrait' ? '800px' : '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'Vazirmatn, Tahoma, sans-serif';
  container.style.direction = 'rtl';
  container.style.color = '#111827';
  container.style.padding = '32px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    // Wait for any images or webfonts to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2, // 2x for sharp 300 DPI print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'p' || orientation === 'portrait' ? 800 : 1120,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pdfHeight);
    } else {
      // Multi-page handling
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export const pdfExportService = {
  /**
   * 1. Export Official Tax Invoice as Downloadable PDF
   */
  async exportTaxInvoicePDF(invoice: OfficialTaxInvoice): Promise<boolean> {
    const html = `
      <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; color: #1e293b; background: #ffffff; padding: 24px; border: 2px solid #00258e; border-radius: 16px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00258e; padding-bottom: 16px; margin-bottom: 20px;">
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #00258e; font-weight: bold; margin-bottom: 4px;">جمهوری اسلامی ایران - سازمان امور مالیاتی کشور</div>
            <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a;">صورتحساب الکترونیکی خدمات حمل و نقل جاده‌ای</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">فاکتور رسمی فروش خدمات ترابری (نوع اول - سامانه مودیان)</div>
          </div>
          <div style="text-align: left; background: #f1f5f9; padding: 10px 16px; border-radius: 12px; border: 1px solid #cbd5e1;">
            <div style="font-size: 11px; color: #475569;">شماره فاکتور: <strong style="color: #0f172a; font-family: monospace;">${invoice.invoiceNumber}</strong></div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">تاریخ صدور: <strong style="color: #0f172a;">${invoice.issueDate}</strong></div>
            <div style="font-size: 10px; color: #059669; margin-top: 4px; font-family: monospace;">شناسه یکتا: ${invoice.taxUniqueId}</div>
          </div>
        </div>

        <!-- Parties Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <!-- Seller Info -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.8;">
            <div style="font-weight: 800; color: #00258e; font-size: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              مشخصات فروشنده (ارائه‌دهنده خدمت):
            </div>
            <div><strong>نام شرکت:</strong> ${invoice.sellerInfo.legalName}</div>
            <div><strong>شناسه ملی / کد اقتصادی:</strong> <span style="font-family: monospace;">${invoice.sellerInfo.nationalId} / ${invoice.sellerInfo.economicCode}</span></div>
            <div><strong>کد پستی:</strong> <span style="font-family: monospace;">${invoice.sellerInfo.postalCode}</span></div>
            <div><strong>تلفن:</strong> <span style="font-family: monospace;">${invoice.sellerInfo.phone}</span></div>
            <div><strong>نشانی:</strong> ${invoice.sellerInfo.address}</div>
          </div>

          <!-- Buyer Info -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.8;">
            <div style="font-weight: 800; color: #059669; font-size: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              مشخصات خریدار (صاحب کالا / متقاضی حمل):
            </div>
            <div><strong>نام شخص / شرکت:</strong> ${invoice.buyerInfo.fullNameOrCompany}</div>
            <div><strong>شناسه ملی / کد اقتصادی:</strong> <span style="font-family: monospace;">${invoice.buyerInfo.nationalId} / ${invoice.buyerInfo.economicCode}</span></div>
            <div><strong>کد پستی:</strong> <span style="font-family: monospace;">${invoice.buyerInfo.postalCode}</span></div>
            <div><strong>تلفن:</strong> <span style="font-family: monospace;">${invoice.buyerInfo.phone}</span></div>
            <div><strong>نشانی:</strong> ${invoice.buyerInfo.address}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; text-align: right;">
          <thead>
            <tr style="background: #00258e; color: #ffffff;">
              <th style="padding: 10px; border: 1px solid #00258e; text-align: center; width: 40px;">ردیف</th>
              <th style="padding: 10px; border: 1px solid #00258e;">شرح کالا یا خدمت ترابری</th>
              <th style="padding: 10px; border: 1px solid #00258e; text-align: center;">مسیر و بارنامه</th>
              <th style="padding: 10px; border: 1px solid #00258e; text-align: left; width: 140px;">مبلغ پایه (تومان)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #ffffff;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">۱</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${invoice.itemDescription}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${invoice.route}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold; color: #00258e;">
                ${invoice.netFareTomans.toLocaleString('fa-IR')}
              </td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">۲</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">کارمزد پلتفرم هوشمند ترابری TLD و صدور حواله</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">سامانه مودیان</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">
                ${invoice.serviceFeeTomans.toLocaleString('fa-IR')}
              </td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">۳</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">حق بیمه تمام خطر حمل کالا (کلوز A معتبر کشوری)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">بیمه مرکزی</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">
                ${invoice.insuranceTomans.toLocaleString('fa-IR')}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Totals and Payment summary -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; font-size: 11px; max-width: 360px; line-height: 1.8;">
            <div style="font-weight: bold; color: #059669; margin-bottom: 4px;">✓ وضعیت پرداخت: تسویه کامل از طریق حساب امانی شاپرک</div>
            <div>شناسه رهگیری تراکنش: <strong style="font-family: monospace;">${invoice.paymentTrackingRef}</strong></div>
            <div>کد مالیاتی یکتا: <strong style="font-family: monospace; font-size: 10px;">${invoice.taxUniqueId}</strong></div>
          </div>

          <div style="width: 300px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 2;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #475569;">مجموع خالص خدمات و کارمزد:</span>
              <strong style="color: #0f172a;">${invoice.subtotalTomans.toLocaleString('fa-IR')} تومان</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #475569;">مالیات بر ارزش افزوده (VAT ۹٪):</span>
              <strong style="color: #0f172a;">${invoice.vat9PercentTomans.toLocaleString('fa-IR')} تومان</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #00258e; padding-top: 6px; margin-top: 6px; font-size: 13px; font-weight: 900; color: #00258e;">
              <span>مبلغ کل پرداخت شده:</span>
              <span>${invoice.totalPayableTomans.toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>

        <!-- Signatures & Stamp -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b;">
          <div style="text-align: center; width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fafafa;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 8px;">مهر و امضای دیجیتال صادرکننده</div>
            <div style="color: #00258e; font-weight: 900; font-size: 12px;">شرکت لجستیک TLD DIGITAL</div>
            <div style="font-size: 9px; color: #059669; margin-top: 4px;">احراز هویت الکترونیکی معتبر ✓</div>
          </div>

          <div style="text-align: center; width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fafafa;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 8px;">امضا و تایید خریدار خدمت</div>
            <div style="color: #334155; font-weight: bold; font-size: 11px;">${invoice.buyerInfo.fullNameOrCompany}</div>
            <div style="font-size: 9px; color: #059669; margin-top: 4px;">تایید شده از طریق درگاه امن ✓</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 16px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
          این سند یک برگ فاکتور رسمی الکترونیکی است و نسخه چاپی آن فاقد نیاز به امضای دستی معتبر قانونی می‌باشد • سامانه جامع TLD Logistics
        </div>
      </div>
    `;

    const filename = `TLD-Official-Tax-Invoice-${invoice.invoiceNumber || 'INV'}.pdf`;
    return renderHtmlToPdf(html, filename, 'p');
  },

  /**
   * 2. Export Official Cargo Manifest & Waybill as Downloadable PDF
   */
  async exportCargoManifestPDF(cargo: ShipperFullCargo, waybill?: ElectronicWaybill): Promise<boolean> {
    const waybillNum = waybill?.waybillNumber || `WBL-${cargo.id}-RMTO`;
    const trackingCode = waybill?.rmtoTrackingCode || '۹۸۴۷۲۹۱۸۴۷۲۶۱۹';
    const driverName = waybill?.driverFullName || cargo.assignedDriver?.fullName || 'محمدرضا سلطانی';
    const truckPlate = waybill?.truckPlateNumber || cargo.assignedDriver?.plateNumber || '۳۴ ع ۵۸۲ ایران ۷۲';
    const fare = (cargo.pricing?.finalOfferedFareTomans || 38500000).toLocaleString('fa-IR');

    const html = `
      <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; color: #1e293b; background: #ffffff; padding: 24px; border: 2px solid #0f172a; border-radius: 16px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; color: #00258e; font-weight: bold; margin-bottom: 4px;">سازمان راهداری و حمل و نقل جاده‌ای کشور • سامانه TLD DIGITAL</div>
            <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a;">مانیفست رسمی بار و بارنامه الکترونیکی (E-Waybill)</h1>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">مجوز تردد رسمی جاده‌ای و حمل کالای تجاری و صنعتی</div>
          </div>
          <div style="text-align: left; background: #f8fafc; padding: 10px 16px; border-radius: 12px; border: 1px solid #cbd5e1;">
            <div style="font-size: 11px; color: #475569;">شماره بارنامه: <strong style="color: #0f172a; font-family: monospace;">${waybillNum}</strong></div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">کد رهگیری راهداری: <strong style="color: #b91c1c; font-family: monospace;">${trackingCode}</strong></div>
            <div style="font-size: 10px; color: #059669; margin-top: 4px;">وضعیت: معتبر و دارای مجوز تردد فعال ✓</div>
          </div>
        </div>

        <!-- Route & Shipment Overview -->
        <div style="background: #f1f5f9; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 11px;">
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">مبدأ بارگیری:</span>
            <strong style="color: #0f172a; font-size: 12px;">${cargo.origin?.city || 'مبدأ'}</strong>
            <div style="color: #475569; font-size: 10px; margin-top: 2px;">${cargo.origin?.address || ''}</div>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">مقصد تخلیه:</span>
            <strong style="color: #0f172a; font-size: 12px;">${cargo.destination?.city || 'مقصد'}</strong>
            <div style="color: #475569; font-size: 10px; margin-top: 2px;">${cargo.destination?.address || ''}</div>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">مسافت و زمان تخمینی:</span>
            <strong style="color: #00258e; font-size: 12px;">${cargo.pricing?.distanceKm || 890} کیلومتر</strong>
            <div style="color: #059669; font-size: 10px; margin-top: 2px;">تحویل در بازه مجاز</div>
          </div>
        </div>

        <!-- Grid: Cargo Specs & Driver Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <!-- Cargo Specs -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.9; background: #ffffff;">
            <div style="font-weight: 800; color: #00258e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
              مشخصات و شرایط محموله:
            </div>
            <div><strong>عنوان بار:</strong> ${cargo.cargoInfo?.title || 'محموله تجاری'}</div>
            <div><strong>وزن ناخالص / خالص:</strong> ${cargo.cargoInfo?.weightTons || 22.5} تن</div>
            <div><strong>نوع بسته‌بندی:</strong> ${cargo.cargoInfo?.packaging || 'پالت صنعتی'}</div>
            <div><strong>ارزش اظهارشده:</strong> ${(cargo.cargoInfo?.declaredValueTomans || 850000000).toLocaleString('fa-IR')} تومان</div>
            <div><strong>دستورالعمل ویژه:</strong> ${cargo.cargoInfo?.specialInstructions || 'مهاربندی استاندارد با تسمه جغجغه‌ای'}</div>
          </div>

          <!-- Driver and Fleet -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.9; background: #ffffff;">
            <div style="font-weight: 800; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
              مشخصات متصدی حمل و ناوگان:
            </div>
            <div><strong>نام راننده:</strong> ${driverName}</div>
            <div><strong>کارت هوشمند راننده:</strong> <span style="font-family: monospace;">۲۹۸۴۷۱۲</span></div>
            <div><strong>شماره پلاک ناوگان:</strong> <strong style="color: #0f172a; font-family: monospace;">${truckPlate}</strong></div>
            <div><strong>نوع ناوگان:</strong> ${cargo.fleetReq?.truckTypeName || 'ترانزیت چادری کشویی'}</div>
            <div><strong>کرایه توافقی ثبت‌شده:</strong> <strong style="color: #00258e;">${fare} تومان</strong></div>
          </div>
        </div>

        <!-- Security & Insurance Badges -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 10px;">
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 10px; border-radius: 10px; text-align: center;">
            <div style="font-weight: bold; color: #00258e;">پلمپ هوشمند دیجیتال (IoT)</div>
            <div style="color: #475569; margin-top: 2px;">کد پلمپ: SEAL-8892-TLD</div>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 10px; text-align: center;">
            <div style="font-weight: bold; color: #059669;">بیمه‌نامه معتبر تمام خطر</div>
            <div style="color: #475569; margin-top: 2px;">بیمه‌گر: ${cargo.insurance?.underwriter || 'بیمه ایران'}</div>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 10px; text-align: center;">
            <div style="font-weight: bold; color: #b45309;">رهگیری ماهواره‌ای GPS</div>
            <div style="color: #475569; margin-top: 2px;">پوشش سراسری زنده</div>
          </div>
        </div>

        <!-- Signatures and QR Verification -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; background: #fafafa; font-size: 8px; text-align: center; color: #64748b;">
              [QR بارنامه]
            </div>
            <div>
              <div style="font-weight: bold; color: #0f172a;">کد احراز صلاحیت ترابری</div>
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">اسکن جهت بررسی اصالت در وب‌سایت سازمان راهداری</div>
            </div>
          </div>

          <div style="text-align: left;">
            <div style="font-weight: bold; color: #00258e; font-size: 12px;">سامانه ملی لجستیک هوشمند TLD</div>
            <div style="font-size: 10px; color: #059669; margin-top: 2px;">تاییدیه الکترونیک صادر گردید ✓</div>
          </div>
        </div>
      </div>
    `;

    const filename = `TLD-Cargo-Manifest-${cargo.cargoNumber || cargo.id}.pdf`;
    return renderHtmlToPdf(html, filename, 'p');
  },

  /**
   * 3. Export Driver/Shipper Trip History Report as Downloadable PDF
   */
  async exportTripHistoryPDF(
    trips: Array<{
      id: string;
      waybillNumber?: string;
      title: string;
      origin: string;
      destination: string;
      date: string;
      fare: string;
      netEarnings?: string;
      truck?: string;
      status?: string;
      deliveryTime?: string;
      ratingGiven?: number;
    }>,
    userTitle: string = 'کارنامه و سوابق جامع سفرهای حمل بار',
    userInfo: { name: string; smartCard?: string; mobile?: string } = { name: 'محمدرضا سلطانی' }
  ): Promise<boolean> {
    const totalTrips = trips.length;

    const tripsRows = trips
      .map(
        (t, idx) => `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">${(idx + 1).toLocaleString('fa-IR')}</td>
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">
            <strong style="color: #0f172a; display: block;">${t.title}</strong>
            <span style="color: #64748b; font-size: 9px; font-family: monospace;">${t.id} • ${t.waybillNumber || ''}</span>
          </td>
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">${t.origin}</td>
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">${t.destination}</td>
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">${t.date}</td>
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold; color: #00258e;">${t.fare}</td>
          <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center; color: #059669; font-weight: bold;">
            ${t.ratingGiven ? `${t.ratingGiven} ★` : 'موفق ✓'}
          </td>
        </tr>
      `
      )
      .join('');

    const html = `
      <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; color: #1e293b; background: #ffffff; padding: 24px; border: 2px solid #00258e; border-radius: 16px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00258e; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 11px; color: #00258e; font-weight: bold; margin-bottom: 4px;">گزارش رسمی سوابق عملکرد و حمل و نقل • TLD DIGITAL</div>
            <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a;">${userTitle}</h1>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">شامل مشخصات بارنامه‌ها، مبالغ ناخالص و خالص کرایه‌ها و امتیازات رضایت</div>
          </div>
          <div style="text-align: left; background: #f8fafc; padding: 10px 16px; border-radius: 12px; border: 1px solid #cbd5e1;">
            <div style="font-size: 11px; color: #475569;">نام متصدی: <strong style="color: #0f172a;">${userInfo.name}</strong></div>
            ${userInfo.smartCard ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">کارت هوشمند: <strong style="font-family: monospace;">${userInfo.smartCard}</strong></div>` : ''}
            <div style="font-size: 10px; color: #059669; margin-top: 4px;">تعداد کل سفرهای ثبت‌شده: ${totalTrips.toLocaleString('fa-IR')} سفر</div>
          </div>
        </div>

        <!-- Summary KPIs -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 11px;">
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 12px; text-align: center;">
            <span style="color: #475569; font-size: 10px; display: block;">شاخص رضایت کارفرمایان:</span>
            <strong style="font-size: 16px; color: #00258e;">۴.۹۵ از ۵.۰ ★</strong>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px; text-align: center;">
            <span style="color: #475569; font-size: 10px; display: block;">وضعیت تسویه مالی:</span>
            <strong style="font-size: 16px; color: #059669;">۱۰۰٪ تسویه آنی</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center;">
            <span style="color: #475569; font-size: 10px; display: block;">تحویل به‌موقع و سروقت:</span>
            <strong style="font-size: 16px; color: #0f172a;">۹۹.۲٪</strong>
          </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; text-align: right;">
          <thead>
            <tr style="background: #00258e; color: #ffffff;">
              <th style="padding: 10px 8px; border: 1px solid #00258e; text-align: center; width: 35px;">ردیف</th>
              <th style="padding: 10px 8px; border: 1px solid #00258e;">شرح محموله و بارنامه</th>
              <th style="padding: 10px 8px; border: 1px solid #00258e; text-align: center;">مبدأ</th>
              <th style="padding: 10px 8px; border: 1px solid #00258e; text-align: center;">مقصد</th>
              <th style="padding: 10px 8px; border: 1px solid #00258e; text-align: center; width: 75px;">تاریخ تحویل</th>
              <th style="padding: 10px 8px; border: 1px solid #00258e; text-align: left; width: 110px;">کرایه توافقی</th>
              <th style="padding: 10px 8px; border: 1px solid #00258e; text-align: center; width: 70px;">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${tripsRows}
          </tbody>
        </table>

        <!-- Footer Seal -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 10px; color: #64748b;">
          <div>این گزارش به عنوان گواهی رسمی عملکرد و سوابق فعالیت در ناوگان هوشمند TLD صادر گردیده است.</div>
          <div style="font-weight: bold; color: #00258e;">سامانه پایش هوشمند ترابری TLD DIGITAL</div>
        </div>
      </div>
    `;

    const filename = `TLD-Trip-History-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
    return renderHtmlToPdf(html, filename, 'p');
  },

  /**
   * 4. Export Digital Smart Contract as PDF
   */
  async exportDigitalContractPDF(contract: DigitalSmartContract): Promise<boolean> {
    const termsHtml = contract.termsAndConditions
      .map((term, i) => `<li style="margin-bottom: 6px;"><strong>ماده ${i + 1}:</strong> ${term}</li>`)
      .join('');

    const html = `
      <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; color: #1e293b; background: #ffffff; padding: 24px; border: 2px solid #00258e; border-radius: 16px;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #00258e; padding-bottom: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #00258e; font-weight: bold;">جمهوری اسلامی ایران - سامانه هوشمند ترابری جاده‌ای TLD</div>
          <h1 style="font-size: 18px; font-weight: 900; margin: 4px 0; color: #0f172a;">قرارداد هوشمند و رسمی حمل و نقل بار جاده‌ای</h1>
          <div style="font-size: 10px; color: #64748b;">منعقده بر اساس مواد ۱۰ و ۲۱۹ قانون مدنی کشور و شرایط عمومی حمل و نقل راهداری</div>
          <div style="font-size: 10px; color: #00258e; margin-top: 4px; font-family: monospace;">شماره قرارداد: ${contract.contractNumber}</div>
        </div>

        <!-- Parties -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; font-size: 11px; line-height: 1.8;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
            <div style="font-weight: bold; color: #00258e; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">طرف اول: کارفرما / صاحب کالا</div>
            <div><strong>نام و شرکت:</strong> ${contract.shipperCompany} (${contract.shipperName})</div>
            <div><strong>شناسه ملی:</strong> <span style="font-family: monospace;">${contract.shipperNationalId}</span></div>
            <div><strong>مبدأ بارگیری:</strong> ${contract.originAddress}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
            <div style="font-weight: bold; color: #059669; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">طرف دوم: متصدی حمل / راننده مسئول</div>
            <div><strong>نام راننده:</strong> ${contract.driverName}</div>
            <div><strong>کارت هوشمند و پلاک:</strong> <span style="font-family: monospace;">${contract.driverSmartCard} | ${contract.truckPlate}</span></div>
            <div><strong>مقصد تخلیه:</strong> ${contract.destinationAddress}</div>
          </div>
        </div>

        <!-- Terms -->
        <div style="background: #fdfdfd; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 10px; line-height: 1.8;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 6px; font-size: 11px;">مفاد و شرایط توافق‌شده قرارداد:</div>
          <ol style="margin: 0; padding-right: 18px; color: #334155;">
            ${termsHtml}
          </ol>
        </div>

        <!-- Financial Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 10px; text-align: center;">
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 8px; border-radius: 8px;">
            <span style="color: #475569; display: block;">کرایه توافقی:</span>
            <strong style="color: #00258e;">${contract.agreedFareTomans.toLocaleString('fa-IR')} تومان</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 8px;">
            <span style="color: #475569; display: block;">دموراژ ساعتی:</span>
            <strong>${contract.demurrageRatePerHourTomans.toLocaleString('fa-IR')} تومان</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 8px;">
            <span style="color: #475569; display: block;">مهلت بارگیری/تخلیه:</span>
            <strong>${contract.loadingTimeAllowanceHours} ساعت</strong>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px; border-radius: 8px;">
            <span style="color: #475569; display: block;">بیمه‌گر مسئول:</span>
            <strong style="color: #059669;">${contract.insuranceUnderwriter}</strong>
          </div>
        </div>

        <!-- Digital Signatures -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; font-size: 10px;">
          <div style="border: 1px dashed #00258e; border-radius: 8px; padding: 10px; text-align: center; background: #eef2ff;">
            <div style="font-weight: bold; color: #00258e;">امضای دیجیتال صاحب کالا ✓</div>
            <div style="color: #64748b; margin-top: 2px;">ثبت‌شده در تاریخ: ${contract.shipperSignatureDate}</div>
          </div>
          <div style="border: 1px dashed #059669; border-radius: 8px; padding: 10px; text-align: center; background: #ecfdf5;">
            <div style="font-weight: bold; color: #059669;">امضای دیجیتال راننده متصدی حمل ✓</div>
            <div style="color: #64748b; margin-top: 2px;">ثبت‌شده در تاریخ: ${contract.driverSignatureDate}</div>
          </div>
        </div>

        <div style="background: #0f172a; color: #94a3b8; padding: 6px; border-radius: 6px; font-family: monospace; font-size: 8px; text-align: center;" dir="ltr">
          ${contract.legalHash}
        </div>
      </div>
    `;

    const filename = `TLD-Smart-Contract-${contract.contractNumber}.pdf`;
    return renderHtmlToPdf(html, filename, 'p');
  },
};
