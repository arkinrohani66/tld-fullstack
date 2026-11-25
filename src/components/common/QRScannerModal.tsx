import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useLanguage } from '../../context/LanguageContext';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  subtitle?: string;
  sampleCodes?: { label: string; code: string }[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'اسکنر هوشمند QR کد تحویل و بارنامه',
  subtitle = 'دوربین را مقابل بارکد دو‌بعدی یا QR کد مانیفست / تحویل‌گیرنده بگیرید',
  sampleCodes = [],
}) => {
  const { dir, language, trText } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');

  const animationFrameId = useRef<number | null>(null);

  // Play audio beep sound feedback on successful scan
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  const handleSuccessfulScan = (code: string) => {
    if (!code || scannedResult) return;
    setScannedResult(code);
    setIsScanning(false);
    playSuccessBeep();
    setTimeout(() => {
      onScan(code);
      onClose();
    }, 600);
  };

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    setCameraError(null);
    setScannedResult(null);
    setIsScanning(true);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(trText('دوربین در این مرورگر یا دستگاه پشتیبانی نمی‌شود.', 'The camera is not supported in this browser or device.', 'Kamera bu tarayıcıda veya cihazda desteklenmiyor.'));
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        // Check torch support
        const track = mediaStream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const capabilities = (track as any).getCapabilities?.() || {};
          if (capabilities.torch) {
            setTorchSupported(true);
          }
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setCameraError(
          err?.message?.includes('Permission')
            ? trText('دسترسی به دوربین توسط کاربر یا مرورگر مسدود شده است. می‌توانید بارکد را دستی یا از روی فایل تصویر بارگذاری کنید.', 'Camera access was blocked by the user or browser. You can enter the barcode manually or upload an image file.', 'Kamera erişimi kullanıcı veya tarayıcı tarafından engellendi. Barkodu elle girebilir veya bir görsel dosyası yükleyebilirsiniz.')
            : trText('امکان اتصال مستقیم به دوربین وجود ندارد. لطفاً از بارگذاری تصویر یا ورود کد استفاده کنید.', 'Cannot connect to the camera directly. Please upload an image or enter the code.', 'Kameraya doğrudan bağlanılamıyor. Lütfen bir görsel yükleyin veya kodu girin.')
        );
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isOpen, facingMode]);

  // Frame Processing Loop using jsQR
  useEffect(() => {
    if (!isOpen || !stream || !isScanning) return;

    const scanFrame = () => {
      if (!isScanning || scannedResult) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (qrCode && qrCode.data) {
            handleSuccessfulScan(qrCode.data);
            return;
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isOpen, stream, isScanning, scannedResult]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const newTorchState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorchState }],
        });
        setTorchOn(newTorchState);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Decode from uploaded image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleSuccessfulScan(code.data);
          } else {
            setCameraError(trText('هیچ کد QR معتبری در تصویر بارگذاری‌شده شناسایی نشد.', 'No valid QR code was detected in the uploaded image.', 'Yüklenen görselde geçerli bir QR kod bulunamadı.'));
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      dir={dir}
    >
      <div className="bg-[#1a1b23] border border-[#444655] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#444655] flex items-center justify-between bg-[#111218]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00258e] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-vazirmatn text-base font-bold text-white leading-tight">
                {title === 'اسکنر هوشمند QR کد تحویل و بارنامه' ? trText('اسکنر هوشمند QR کد تحویل و بارنامه', 'Smart Delivery & Waybill QR Scanner', 'Akıllı Teslimat ve İrsaliye QR Tarayıcısı') : title}
              </h3>
              <p className="font-jetbrains text-[11px] text-[#a6b4ff] mt-0.5" dir="ltr">
                PROOFOF_DELIVERY_SCANNER_V2
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#2f3039] hover:bg-[#444655] text-[#e2e1ed] flex items-center justify-center transition-colors cursor-pointer"
            title={trText('بستن', 'Close', 'Kapat')}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Video Scanner Area */}
        <div className="relative bg-black flex-1 min-h-[280px] max-h-[360px] flex items-center justify-center overflow-hidden">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Hidden Canvas for Decoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Viewfinder Overlay */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened outer mask */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Central Target Reticle */}
              <div className="relative w-60 h-60 md:w-64 md:h-64 border-2 border-transparent z-10">
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00d4ff] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00d4ff] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00d4ff] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00d4ff] rounded-br-lg" />

                {/* Animated Laser Line */}
                <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent shadow-[0_0_8px_#00d4ff] animate-bounce duration-1000 top-1/2" />

                {/* Center Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <span className="material-symbols-outlined text-white text-4xl">add</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute bottom-3 bg-black/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#00d4ff]/40 text-[11px] font-jetbrains text-[#00d4ff] flex items-center gap-1.5 z-20">
                <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-ping" />
                <span>CAMERA ACTIVE • SCANNING QR</span>
              </div>
            </div>
          )}

          {/* Camera Error Fallback Message */}
          {cameraError && (
            <div className="p-6 text-center max-w-sm z-20 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#ba1a1a]/20 text-[#ffb4a2] mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">videocam_off</span>
              </div>
              <p className="font-vazirmatn text-xs text-[#e2e1ed] leading-relaxed">
                {cameraError}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#00258e] hover:bg-[#0036c5] text-white text-xs font-jetbrains font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                <span>{trText('انتخاب تصویر بارکد از گالری', 'Choose barcode image from gallery', 'Galeriden barkod görseli seç')}</span>
              </button>
            </div>
          )}

          {/* Success Overlay Flash */}
          {scannedResult && (
            <div className="absolute inset-0 bg-[#00a368]/90 z-30 flex flex-col items-center justify-center text-white p-4 animate-fadeIn">
              <span className="material-symbols-outlined text-5xl mb-2 animate-bounce">check_circle</span>
              <span className="font-vazirmatn text-lg font-bold">{trText('بارکد با موفقیت اسکن شد', 'Barcode scanned successfully', 'Barkod başarıyla tarandı')}</span>
              <span className="font-jetbrains text-sm bg-black/40 px-3 py-1 rounded-lg mt-2 font-mono">
                {scannedResult}
              </span>
            </div>
          )}
        </div>

        {/* Camera Controls Bar */}
        <div className="p-3 bg-[#111218] border-t border-[#444655] flex items-center justify-around text-xs">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer font-jetbrains ${
                torchOn
                  ? 'bg-[#00d4ff] text-black border-[#00d4ff]'
                  : 'bg-[#2f3039] text-white border-[#444655] hover:bg-[#444655]'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {torchOn ? 'flashlight_on' : 'flashlight_off'}
              </span>
              <span>{torchOn ? trText('چراغ روشن', 'Light on', 'Işık açık') : trText('چراغ قوه', 'Flashlight', 'El feneri')}</span>
            </button>
          )}

          <button
            onClick={switchCamera}
            className="p-2.5 rounded-xl bg-[#2f3039] hover:bg-[#444655] border border-[#444655] text-white flex items-center gap-1.5 transition-colors cursor-pointer font-jetbrains"
          >
            <span className="material-symbols-outlined text-base">flip_camera_ios</span>
            <span>{trText('تغییر دوربین', 'Switch camera', 'Kamerayı değiştir')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#2f3039] hover:bg-[#444655] border border-[#444655] text-white flex items-center gap-1.5 transition-colors cursor-pointer font-jetbrains"
          >
            <span className="material-symbols-outlined text-base">photo_library</span>
            <span>{trText('آپلود تصویر', 'Upload image', 'Görsel yükle')}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Quick Test / Manual Entry Section */}
        <div className="p-4 bg-[#1a1b23] border-t border-[#444655] space-y-3">
          <p className="font-vazirmatn text-xs text-[#a6b4ff] leading-normal">
            {subtitle === 'دوربین را مقابل بارکد دو‌بعدی یا QR کد مانیفست / تحویل‌گیرنده بگیرید' ? trText('دوربین را مقابل بارکد دو‌بعدی یا QR کد مانیفست / تحویل‌گیرنده بگیرید', 'Point the camera at the 2D barcode or the manifest / recipient QR code', 'Kamerayı iki boyutlu barkoda veya manifesto / alıcı QR koduna doğrultun') : subtitle}
          </p>

          {/* Sample quick buttons for testing */}
          {sampleCodes.length > 0 && (
            <div>
              <div className="text-[10px] font-jetbrains text-[#747686] uppercase mb-1.5">
                QUICK TEST PROOF-OF-DELIVERY CODES:
              </div>
              <div className="flex flex-wrap gap-2">
                {sampleCodes.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuccessfulScan(item.code)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#2f3039] hover:bg-[#00258e] text-[#e2e1ed] hover:text-white border border-[#444655] text-[11px] font-jetbrains flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    <span>{trText(item.label)}</span>
                    <span className="text-[#00d4ff] font-bold">({item.code})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={trText('یا کد تحویل / بارنامه را دستی بنویسید...', 'Or type the delivery / waybill code manually...', 'Veya teslimat / irsaliye kodunu elle yazın...')}
              className="flex-1 px-3 py-2 rounded-xl bg-[#111218] border border-[#444655] font-jetbrains text-xs text-white placeholder:text-[#747686] focus:outline-none focus:border-[#00258e]"
            />
            <button
              onClick={() => {
                if (manualCode.trim()) {
                  handleSuccessfulScan(manualCode.trim());
                }
              }}
              disabled={!manualCode.trim()}
              className="px-4 py-2 rounded-xl bg-[#00258e] hover:bg-[#0036c5] disabled:opacity-50 text-white text-xs font-jetbrains font-bold transition-all cursor-pointer"
            >
              {trText('تأیید', 'Confirm', 'Onayla')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
