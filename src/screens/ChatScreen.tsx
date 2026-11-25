import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, MessageDeliveryStatus, ChatMessage } from '../types';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { transcribeAudio, GeminiNotConfiguredError } from '../services/geminiService';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error ?? new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(blob);
  });

interface ChatScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { trText } = useLanguage();
  const {
    activeConversationId,
    getActiveConversation,
    getMessagesForConversation,
    sendMessage,
    setSelectedCargoId,
  } = useLogistics();

  const [inputMessage, setInputMessage] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversation = getActiveConversation();
  const messages = getMessagesForConversation(activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    const textToSend = inputMessage;
    setInputMessage('');
    await sendMessage(activeConversationId, textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpenCargo = (cargoId?: string) => {
    if (cargoId) {
      setSelectedCargoId(cargoId);
      onNavigate('CARGOS');
    }
  };

  const handleToggleVoiceRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        showToast('info', trText('در حال تبدیل پیام صوتی به متن...', 'Converting voice message to text...', 'Sesli mesaj metne dönüştürülüyor...'));

        try {
          const base64Data = await blobToBase64(audioBlob);
          if (base64Data) {
            const transcribedText = await transcribeAudio(base64Data, 'audio/webm');
            if (transcribedText.trim()) {
              setInputMessage((prev) => (prev ? `${prev} ${transcribedText.trim()}` : transcribedText.trim()));
              showToast('success', trText('پیام صوتی رونویسی شد.', 'Voice message transcribed.', 'Sesli mesaj metne dönüştürüldü.'));
            }
          }
        } catch (e) {
          console.error(e);
          const message =
            e instanceof GeminiNotConfiguredError
              ? e.message
              : trText('خطا در رونویسی صوت', 'Failed to transcribe the audio', 'Ses metne dönüştürülemedi');
          showToast('error', message);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('info', trText('در حال ضبط پیام صوتی... برای اتمام دوباره کلیک کنید.', 'Recording voice message... click again to stop.', 'Sesli mesaj kaydediliyor... bitirmek için tekrar tıklayın.'));
    } catch (err) {
      console.error(err);
      showToast('error', trText('دسترسی به میکروفون میسر نشد.', 'Microphone access is not available.', 'Mikrofona erişilemedi.'));
    }
  };

  const handleSendQuickAttachment = (type: string) => {
    setShowAttachmentMenu(false);
    showToast('success', trText(`${type} پیوست و ارسال شد.`, `${type} attached and sent.`, `${type} eklendi ve gönderildi.`));
    sendMessage(activeConversationId, trText(`📎 [سند الکترونیکی: ${type}]`, `📎 [Electronic document: ${type}]`, `📎 [Elektronik belge: ${type}]`));
  };

  const renderStatusIcon = (status: MessageDeliveryStatus) => {
    switch (status) {
      case 'SENDING':
        return <span className="material-symbols-outlined text-[13px] animate-spin text-white/70">progress_activity</span>;
      case 'SENT':
        return <span className="material-symbols-outlined text-[14px] text-white/70">check</span>;
      case 'DELIVERED':
        return <span className="material-symbols-outlined text-[14px] text-white/80">done_all</span>;
      case 'READ':
        return <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>;
      case 'FAILED':
        return <span className="material-symbols-outlined text-[14px] text-[#ffdad6]">error</span>;
      default:
        return null;
    }
  };

  const participantName = conversation?.participantName || trText('Ali Rezaei / علی رضایی', 'Ali Rezaei', 'Ali Rızai');
  const cargoTag = conversation?.cargoId || 'CARGO-000124';
  const avatarUrl =
    conversation?.participantAvatar ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAYyht2rhK6bT_--TGqiDi1dTO3uknlCoTdl_urU_9jq4daUzXgWYRe1_EEHKH9aLweIwkGxPQ3ouWBFYJDRQ8zctxVeYC-dRZopR-JJlSQjhf3BCZzqo0nNOFS3ibGnA0Po4uy0EJwld-xmmgQvk6LnOXw1pVkrsYkrcP8spIUsYEUyH20hRZg_V4MOG8SRNGjR58SjiZ3UX2RLWLXzYUiiQUCNkAtfwiMNlTamkKa3EAZQbQCA8WO';

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] h-screen flex flex-col md:flex-row overflow-hidden font-vazirmatn antialiased selection:bg-[#b9c3ff]">
      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="CHAT" onNavigate={onNavigate} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fbf8ff] relative">
        {/* TopAppBar */}
        <header className="bg-[#eeedf9] w-full top-0 sticky border-b border-[#c4c5d7] flex items-center justify-between px-4 h-16 z-50 flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('MESSAGES')}
              className="text-[#444655] hover:bg-[#e2e1ed] transition-colors p-2 rounded-full active:opacity-80 cursor-pointer"
              title={trText('بازگشت به پیام‌ها', 'Back to Messages', 'Mesajlara Dön')}
            >
              <span className="material-symbols-outlined rtl:rotate-180" style={{ fontVariationSettings: "'FILL' 1" }}>
                arrow_back
              </span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={participantName}
                  className="w-10 h-10 rounded-full object-cover border border-[#c4c5d7]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a368] border-2 border-[#eeedf9]" />
              </div>
              <div className="flex flex-col">
                <span className="font-vazirmatn text-sm font-bold text-[#1a1b23] leading-tight">
                  {participantName}
                </span>
                <span className="font-jetbrains text-[11px] text-[#444655] leading-tight" dir="ltr">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              onClick={() => handleOpenCargo(cargoTag)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#e8e7f3] rounded border border-[#c4c5d7] cursor-pointer hover:bg-[#dde1ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[#444655] text-base">local_shipping</span>
              <span className="font-jetbrains text-xs font-bold text-[#00258e]" dir="ltr">
                {cargoTag}
              </span>
            </div>
            <button
              onClick={() => showToast('info', trText('اطلاعات تماس و ناوگان راننده متصل است', 'Contact details and the connected driver fleet are available', 'İletişim bilgileri ve bağlı sürücü filosu mevcut'))}
              className="text-[#444655] hover:bg-[#e2e1ed] transition-colors p-2 rounded-full active:opacity-80 cursor-pointer"
              title={trText('بیشتر', 'More', 'Daha fazla')}
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#fbf8ff]">
          {/* Context Card (Sticky Top) */}
          <div className="w-full z-30 p-3 pb-1 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md border border-[#c4c5d7] rounded-xl p-3 shadow-[0px_4px_12px_rgba(0,72,255,0.08)] max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-shrink-0 w-10 h-10 bg-[#e8e7f3] rounded-lg flex items-center justify-center text-[#00258e]">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    package
                  </span>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-1 mb-0.5" dir="ltr">
                    <span className="font-jetbrains text-sm font-bold text-[#1a1b23]">THR</span>
                    <span className="material-symbols-outlined text-[#747686] text-sm">arrow_forward</span>
                    <span className="font-jetbrains text-sm font-bold text-[#1a1b23]">ISF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-jetbrains text-[10px] font-bold bg-[#0036c5] text-white px-2 py-0.5 rounded">
                      IN_TRANSIT
                    </span>
                    <span className="font-jetbrains text-xs text-[#444655]" dir="ltr">
                      ETA: 14:30
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenCargo(cargoTag)}
                className="w-full sm:w-auto font-jetbrains text-xs font-bold bg-white border border-[#c4c5d7] text-[#00258e] px-4 py-2 rounded hover:bg-[#eeedf9] transition-colors uppercase cursor-pointer"
              >
                {trText('مشاهده بار (View Cargo)', 'View Cargo', 'Yükü Görüntüle')}
              </button>
            </div>
          </div>

          {/* Chat Messages Canvas */}
          <div className="flex-1 overflow-y-auto p-4 pt-2 pb-24 flex flex-col gap-4" id="chat-container">
            {/* Date Divider */}
            <div className="flex justify-center my-1">
              <span className="font-jetbrains text-[11px] font-bold text-[#444655] bg-[#e8e7f3] px-3 py-1 rounded">
                TODAY, 08:45
              </span>
            </div>

            {/* Render Messages */}
            {messages.map((msg: ChatMessage) => {
              // 1. System Log Message
              if (msg.isSystemAlert) {
                return (
                  <div key={msg.id} className="flex justify-center w-full my-1">
                    <div className="bg-[#eeedf9] border border-[#c4c5d7] rounded-xl px-4 py-2.5 max-w-md w-full flex items-start gap-2.5 shadow-xs">
                      <span className="material-symbols-outlined text-[#00258e] text-lg mt-0.5 shrink-0">
                        info
                      </span>
                      <div className="flex flex-col">
                        <span className="font-vazirmatn text-xs leading-relaxed text-[#1a1b23]">
                          {msg.text}
                        </span>
                        <span className="font-jetbrains text-[10px] text-[#444655] mt-1 font-semibold" dir="ltr">
                          SYS_LOG | {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. System Telemetry Snapshot Component
              if (msg.telemetrySnapshot) {
                const { speed, weight, temperature, timestamp } = msg.telemetrySnapshot;
                return (
                  <div key={msg.id} className="flex justify-center w-full my-2">
                    <div className="bg-white border border-[#c4c5d7] rounded-xl p-3 max-w-md w-full flex flex-col gap-2.5 shadow-[0px_4px_12px_rgba(0,72,255,0.08)]">
                      <div className="flex items-center justify-between border-b border-[#c4c5d7] pb-2">
                        <div className="flex items-center gap-1.5 text-[#444655]">
                          <span className="material-symbols-outlined text-base">sensors</span>
                          <span className="font-jetbrains text-xs font-bold uppercase">
                            Telemetry Snapshot
                          </span>
                        </div>
                        <span className="font-jetbrains text-xs text-[#444655]" dir="ltr">
                          {timestamp}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Speed */}
                        <div className="flex flex-col items-center p-2.5 bg-[#f4f2fe] rounded border border-[#c4c5d7]">
                          <span className="material-symbols-outlined text-[#00258e] text-lg mb-1">
                            speed
                          </span>
                          <div className="font-jetbrains text-lg font-bold text-[#1a1b23]">{speed}</div>
                          <span className="font-jetbrains text-[10px] text-[#444655]">km/h</span>
                        </div>

                        {/* Weight */}
                        <div className="flex flex-col items-center p-2.5 bg-[#f4f2fe] rounded border border-[#c4c5d7]">
                          <span className="material-symbols-outlined text-[#545f72] text-lg mb-1">
                            weight
                          </span>
                          <div className="font-jetbrains text-lg font-bold text-[#1a1b23]">{weight}</div>
                          <span className="font-jetbrains text-[10px] text-[#444655]">t</span>
                        </div>

                        {/* Temp (Alert/Error container) */}
                        <div className="flex flex-col items-center p-2.5 bg-[#ffdad6] rounded border border-[#ba1a1a]">
                          <span className="material-symbols-outlined text-[#ba1a1a] text-lg mb-1">
                            thermostat
                          </span>
                          <div className="font-jetbrains text-lg font-bold text-[#93000a]">
                            {temperature}
                          </div>
                          <span className="font-jetbrains text-[10px] font-bold text-[#93000a]">°C</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. Driver/Receiver Message (Inbound)
              if (!msg.isOutgoing) {
                return (
                  <div key={msg.id} className="flex flex-col items-start gap-1 max-w-[85%] sm:max-w-md">
                    <div className="bg-[#e8e7f3] border border-[#c4c5d7] text-[#1a1b23] rounded-2xl rounded-tr-none shadow-[0px_4px_12px_rgba(0,72,255,0.06)] overflow-hidden">
                      {msg.imageUrl && (
                        <div className="p-1">
                          <img
                            src={msg.imageUrl}
                            alt={trText('تصویر ارسالی راننده', 'Image sent by the driver', 'Sürücünün gönderdiği görsel')}
                            className="w-full h-44 sm:h-52 object-cover rounded-xl border border-[#c4c5d7]"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-vazirmatn text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="font-jetbrains text-[11px] text-[#444655]" dir="ltr">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              }

              // 4. Sender/User Message (Outbound)
              return (
                <div key={msg.id} className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-md self-end">
                  <div className="bg-[#00258e] text-white p-3 sm:p-3.5 rounded-2xl rounded-tl-none shadow-[0px_4px_12px_rgba(0,37,142,0.15)]">
                    <p className="font-vazirmatn text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 px-1 text-[#444655]">
                    <span className="font-jetbrains text-[11px]" dir="ltr">
                      {msg.timestamp}
                    </span>
                    {renderStatusIcon(msg.status)}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Message Composer (Bottom Bar) */}
          <footer className="absolute bottom-0 left-0 w-full bg-[#eeedf9] border-t border-[#c4c5d7] p-3 z-40">
            {/* Quick Attachments Popup Menu */}
            {showAttachmentMenu && (
              <div className="absolute bottom-16 start-4 bg-white border border-[#c4c5d7] rounded-2xl p-2 shadow-2xl flex flex-col gap-1 z-50 font-vazirmatn text-xs animate-fadeIn">
                <button
                  onClick={() => handleSendQuickAttachment(trText('بارنامه الکترونیکی', 'Electronic Waybill', 'Elektronik İrsaliye'))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#eeedf9] text-[#1a1b23] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-[#00258e]">description</span>
                  <span>{trText('ارسال بارنامه الکترونیکی', 'Send electronic waybill', 'Elektronik irsaliye gönder')}</span>
                </button>
                <button
                  onClick={() => handleSendQuickAttachment(trText('عکس قبض باسکول', 'Weighbridge Receipt Photo', 'Kantar Fişi Fotoğrafı'))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#eeedf9] text-[#1a1b23] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-[#00258e]">receipt_long</span>
                  <span>{trText('تصویر قبض باسکول', 'Weighbridge receipt photo', 'Kantar fişi fotoğrafı')}</span>
                </button>
                <button
                  onClick={() => handleSendQuickAttachment(trText('موقعیت مکانی زنده', 'Live Location', 'Canlı Konum'))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#eeedf9] text-[#1a1b23] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-[#00258e]">my_location</span>
                  <span>{trText('اشتراک‌گذاری GPS لحظه‌ای', 'Share live GPS location', 'Anlık GPS konumunu paylaş')}</span>
                </button>
              </div>
            )}

            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="flex-shrink-0 text-[#444655] hover:bg-[#e2e1ed] hover:text-[#00258e] transition-colors p-2.5 rounded-full border border-[#c4c5d7] bg-white mb-0.5 cursor-pointer"
                title={trText('پیوست سند یا تصویر', 'Attach document or image', 'Belge veya görsel ekle')}
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>

              {/* Voice input with gemini-3.5-transcribe */}
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                disabled={transcribing}
                className={`flex-shrink-0 p-2.5 rounded-full border mb-0.5 transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] animate-pulse ring-4 ring-[#ba1a1a]/30'
                    : transcribing
                    ? 'bg-[#fbbc04] text-white border-[#fbbc04]'
                    : 'bg-white hover:bg-[#eeedf9] text-[#00258e] border-[#c4c5d7]'
                }`}
                title={trText('ضبط صدا و رونویسی با gemini-3.5-transcribe', 'Record audio and transcribe with gemini-3.5-transcribe', 'Ses kaydet ve gemini-3.5-transcribe ile metne dönüştür')}
              >
                <span className="material-symbols-outlined text-xl">
                  {transcribing ? 'hourglass_empty' : 'mic'}
                </span>
              </button>

              <div className="flex-1 bg-white border border-[#c4c5d7] rounded-xl focus-within:border-[#00258e] focus-within:ring-1 focus-within:ring-[#00258e] transition-all flex items-end">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={trText('پیام خود را بنویسید...', 'Write your message...', 'Mesajınızı yazın...')}
                  rows={1}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none font-vazirmatn text-xs sm:text-sm text-[#1a1b23] p-2.5 min-h-[42px] max-h-[120px]"
                />
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                className={`flex-shrink-0 p-2.5 rounded-xl shadow-[0px_4px_12px_rgba(0,37,142,0.15)] mb-0.5 flex items-center justify-center transition-all ${
                  inputMessage.trim()
                    ? 'bg-[#00258e] text-white hover:bg-[#0036c5] cursor-pointer'
                    : 'bg-[#c4c5d7] text-white/70 cursor-not-allowed'
                }`}
                title={trText('ارسال پیام', 'Send message', 'Mesaj gönder')}
              >
                <span className="material-symbols-outlined text-xl rtl:rotate-180" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
