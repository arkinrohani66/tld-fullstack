import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, Conversation } from '../types';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { isSupabaseConfigured, getTargetSupabaseUrl } from '../services/supabaseClient';

interface MessagesScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

type MessageFilter = 'ALL' | 'UNREAD' | 'DISPATCH' | 'DRIVERS' | 'CARGO';

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onNavigate }) => {
  const { role, isOffline, showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { conversations, setActiveConversationId, sendMessage, openChatForEntity } = useLogistics();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MessageFilter>('ALL');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState('دیسپچ مرکزی');
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleOpenConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id);
    onNavigate('CHAT');
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) {
      showToast('error', trText('لطفاً متن پیام را وارد کنید.', 'Please enter the message text.', 'Lütfen mesaj metnini girin.'));
      return;
    }

    try {
      setIsSending(true);
      const convId = openChatForEntity(newRecipient, 'DISPATCH_SUPPORT');
      await sendMessage(convId, newMessageText.trim());
      showToast('success', trText(`پیام با موفقیت به ${newRecipient} ارسال گردید.`, `Message sent to ${newRecipient} successfully.`, `Mesaj ${newRecipient} alıcısına başarıyla gönderildi.`));
      setShowNewChatModal(false);
      setNewMessageText('');
      onNavigate('CHAT');
    } catch (err: any) {
      showToast('error', err.message || trText('خطا در ارسال پیام', 'Failed to send the message', 'Mesaj gönderilirken hata oluştu'));
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Search query
    if (searchQuery.trim()) {
      const matchQuery =
        c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.cargoId && c.cargoId.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchQuery) return false;
    }

    // Tab filter
    if (activeTab === 'UNREAD') return c.unreadCount > 0;
    if (activeTab === 'DISPATCH')
      return (
        c.participantRole.includes('SUPPORT') ||
        c.participantName.includes('دیسپچ') ||
        c.id === 'conv_support'
      );
    if (activeTab === 'DRIVERS')
      return c.participantRole.includes('DRIVER') || c.participantRole.includes('راننده');
    if (activeTab === 'CARGO') return Boolean(c.cargoId);
    return true;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn antialiased relative"
      dir={dir}
    >
      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="MESSAGES" onNavigate={onNavigate} />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="bg-[#fbf8ff] border-b border-[#c4c5da] w-full top-0 sticky flex justify-between items-center px-4 md:px-8 h-16 shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(homeScreen)}
              className="p-2 text-[#00258e] hover:bg-[#e8e7f3] transition-colors rounded-full cursor-pointer"
              title={trText('بازگشت', 'Back', 'Geri')}
            >
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-[#1a1b23]">{trText('پیام‌ها', 'Messages', 'Mesajlar')}</h1>
              <span className="font-jetbrains text-[11px] text-[#00258e] tracking-wider font-mono" dir="ltr">
                MESSAGES & DISPATCH
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border border-[#c4c5da] rounded-xl text-xs font-jetbrains">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured() && !isOffline ? 'bg-[#00a368]' : 'bg-amber-500'
                }`}
              />
              <span className="text-[#444655]">
                {isSupabaseConfigured() && !isOffline ? 'LIVE CHAT' : 'LOCAL'}
              </span>
            </div>

            <button
              onClick={() => setShowNewChatModal(true)}
              className="bg-[#00258e] hover:bg-[#0036c5] text-white px-3.5 py-2 rounded-xl text-xs font-jetbrains font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit_square</span>
              <span className="font-vazirmatn hidden sm:inline">{trText('پیام جدید', 'New Message', 'Yeni Mesaj')}</span>
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-4 md:px-8 py-3 bg-white border-b border-[#c4c5da]">
          <div className="max-w-3xl mx-auto relative flex items-center w-full h-11 rounded-xl bg-[#fbf8ff] border border-[#c4c5da] focus-within:border-[#00258e] focus-within:ring-1 focus-within:ring-[#00258e] transition-all">
            <span className="material-symbols-outlined text-[#747686] ms-3 me-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={trText('جستجو در متن پیام، نام کاربر یا شناسه بار...', 'Search message text, user name or cargo ID...', 'Mesaj metni, kullanıcı adı veya yük kimliğiyle arayın...')}
              className="w-full bg-transparent border-none outline-none font-vazirmatn text-xs text-[#1a1b23] placeholder:text-[#747686] h-full pe-3"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="w-full overflow-x-auto no-scrollbar border-b border-[#c4c5da] bg-[#fbf8ff] sticky top-16 z-10">
          <div className="flex gap-2 px-4 md:px-8 py-2.5 w-max max-w-3xl mx-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-white text-[#444655] hover:bg-[#e8e7f3] border border-[#c4c5da]'
              }`}
            >
              {trText('همه', 'All', 'Tümü')}
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'UNREAD'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-white text-[#444655] hover:bg-[#e8e7f3] border border-[#c4c5da]'
              }`}
            >
              <span>{trText('خوانده نشده', 'Unread', 'Okunmamış')}</span>
              {totalUnread > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'UNREAD' ? 'bg-white text-[#00258e]' : 'bg-[#00258e] text-white'
                  }`}
                >
                  {totalUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('DISPATCH')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'DISPATCH'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-white text-[#444655] hover:bg-[#e8e7f3] border border-[#c4c5da]'
              }`}
            >
              {trText('پشتیبانی دیسپچ', 'Dispatch Support', 'Sevk Desteği')}
            </button>
            <button
              onClick={() => setActiveTab('DRIVERS')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'DRIVERS'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-white text-[#444655] hover:bg-[#e8e7f3] border border-[#c4c5da]'
              }`}
            >
              {trText('رانندگان', 'Drivers', 'Sürücüler')}
            </button>
            <button
              onClick={() => setActiveTab('CARGO')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'CARGO'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-white text-[#444655] hover:bg-[#e8e7f3] border border-[#c4c5da]'
              }`}
            >
              {trText('اعلان بار', 'Cargo Alerts', 'Yük Bildirimleri')}
            </button>
          </div>
        </div>

        {/* Message Cards List */}
        <main className="flex-1 px-4 md:px-8 py-4 max-w-3xl w-full mx-auto space-y-3 pb-32">
          {filteredConversations.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#e8e7f3] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-[#00258e]">forum</span>
              </div>
              <h3 className="text-base font-bold text-[#1a1b23] mb-1">{trText('گفتگویی یافت نشد', 'No conversations found', 'Sohbet bulunamadı')}</h3>
              <p className="text-xs text-[#747686] mb-4">
                {trText('شما می‌توانید یک گفتگوی جدید با دیسپچ یا رانندگان آغاز کنید.', 'You can start a new conversation with dispatch or drivers.', 'Sevk veya sürücülerle yeni bir sohbet başlatabilirsiniz.')}
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-[#00258e] text-white px-4 py-2 rounded-xl text-xs font-jetbrains font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="font-vazirmatn">{trText('شروع گفتگوی جدید', 'Start New Chat', 'Yeni Sohbet Başlat')}</span>
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isUnread = conv.unreadCount > 0;
              const isDispatch =
                conv.participantRole.includes('SUPPORT') ||
                conv.participantName.includes('دیسپچ') ||
                conv.id === 'conv_support';

              return (
                <div
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden p-4 shadow-sm hover:shadow-md active:scale-[0.99] flex items-start gap-3.5 ${
                    isUnread
                      ? 'border-[#00258e] border-s-4 border-s-[#00258e] bg-[#00258e]/5'
                      : 'border-[#c4c5da] hover:border-[#00258e]/40'
                  }`}
                >
                  {/* Avatar with status indicator */}
                  <div className="relative shrink-0">
                    {conv.participantAvatar ? (
                      <img
                        src={conv.participantAvatar}
                        alt={conv.participantName}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#c4c5da]"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                          isDispatch
                            ? 'bg-[#00258e] text-white'
                            : 'bg-[#e8e7f3] text-[#00258e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {isDispatch ? 'support_agent' : 'person'}
                        </span>
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        conv.onlineStatus === 'ONLINE'
                          ? 'bg-[#00a368]'
                          : conv.onlineStatus === 'BUSY'
                          ? 'bg-amber-500'
                          : 'bg-[#747686]'
                      }`}
                    />
                  </div>

                  {/* Conversation details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1a1b23] truncate">
                          {conv.participantName}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-jetbrains font-bold uppercase ${
                            isDispatch
                              ? 'bg-[#00258e]/10 text-[#00258e]'
                              : 'bg-[#e8e7f3] text-[#444655]'
                          }`}
                        >
                          {isDispatch ? 'DISPATCH' : conv.participantRole || 'DRIVER'}
                        </span>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#747686] shrink-0" dir="ltr">
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed truncate ${
                        isUnread ? 'font-semibold text-[#1a1b23]' : 'text-[#444655]'
                      }`}
                    >
                      {conv.lastMessage}
                    </p>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#c4c5da]/30">
                      <div className="flex items-center gap-2">
                        {conv.cargoId && (
                          <span
                            className="bg-[#f4f2fe] text-[#00258e] font-jetbrains text-[10px] font-bold px-2 py-0.5 rounded border border-[#00258e]/20"
                            dir="ltr"
                          >
                            {conv.cargoId}
                          </span>
                        )}
                        <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                          {conv.id}
                        </span>
                      </div>

                      {isUnread && (
                        <div className="bg-[#00258e] text-white font-jetbrains text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>{conv.unreadCount < 10 ? `0${conv.unreadCount}` : conv.unreadCount}</span>
                          <span>UNREAD</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* Floating Action Button (FAB) */}
        <div className="fixed bottom-20 md:bottom-8 left-6 z-30">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-[#00258e] hover:bg-[#0036c5] text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">chat</span>
            <span className="font-jetbrains text-xs font-semibold uppercase tracking-wider">
              NEW CHAT
            </span>
          </button>
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#1a1b23]/50 backdrop-blur-xs"
              onClick={() => setShowNewChatModal(false)}
            />
            <div className="bg-white rounded-2xl border border-[#c4c5da] shadow-2xl p-6 relative z-10 max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-[#c4c5da] mb-4">
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('ارسال پیام جدید', 'Send New Message', 'Yeni Mesaj Gönder')}</h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-[#747686] hover:text-[#1a1b23] p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleStartNewChat} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#444655] mb-1.5">{trText('گیرنده پیام', 'Message Recipient', 'Mesaj Alıcısı')}</label>
                  <select
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 text-sm text-[#1a1b23] focus:border-[#00258e] outline-none"
                  >
                    <option value="دیسپچ مرکزی">{trText('مرکز دیسپچ و اعزام (Dispatch Support)', 'Dispatch & Assignment Center', 'Sevk ve Görev Merkezi')}</option>
                    <option value="پشتیبانی فنی">{trText('پشتیبانی فنی سیستم (Technical)', 'Technical Support', 'Teknik Destek')}</option>
                    <option value="امور مالی">{trText('امور مالی و حسابداری (Finance)', 'Finance & Accounting', 'Finans ve Muhasebe')}</option>
                    <option value="راننده همکار">{trText('ناوگان رانندگان (Drivers Fleet)', 'Drivers Fleet', 'Sürücü Filosu')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444655] mb-1.5">{trText('متن پیام', 'Message Text', 'Mesaj Metni')}</label>
                  <textarea
                    rows={4}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={trText('پیام خود را به صورت کامل بنویسید...', 'Write your message in full...', 'Mesajınızı ayrıntılı yazın...')}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 text-sm text-[#1a1b23] focus:border-[#00258e] outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#444655] hover:bg-[#f4f2fe] cursor-pointer"
                  >
                    {trText('انصراف', 'Cancel', 'İptal')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !newMessageText.trim()}
                    className="bg-[#00258e] hover:bg-[#0036c5] text-white px-5 py-2.5 rounded-xl text-xs font-jetbrains font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSending && (
                      <span className="material-symbols-outlined text-sm animate-spin">
                        progress_activity
                      </span>
                    )}
                    <span className="font-vazirmatn">{trText('ارسال در سامانه', 'Send in System', 'Sistemde Gönder')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="MESSAGES" onNavigate={onNavigate} />
    </div>
  );
};
