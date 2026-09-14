import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MessageSquare, 
  Share2, 
  Send,
  ExternalLink
} from 'lucide-react';
import { Booking, ThemeConfig } from '../types';
import { generateSlackShareText, generateKakaoShareText, copyToClipboard, formatKRW } from '../utils';

interface ShareModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  booking,
  isOpen,
  onClose,
  themeConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'slack' | 'kakao' | 'link'>('slack');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const slackText = generateSlackShareText(booking);
  const kakaoText = generateKakaoShareText(booking);
  const shareUrl = window.location.href;

  const handleCopy = async (type: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden transition-all transform scale-100"
        style={{
          backgroundColor: themeConfig.isDark ? '#141c2e' : '#ffffff',
          borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
        }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div 
              className="p-2 rounded-xl text-white"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                점심 신청 내역 팀 공유하기
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                팀원들이 볼 수 있도록 슬랙이나 카카오톡으로 간편하게 전송하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Quick Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {booking.restaurantName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                총 {booking.headcount}명 ({booking.representativeName})
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 truncate">
              {booking.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-semibold">
              <span>총 주문액: {formatKRW(booking.totalAmount)}</span>
              <span className={booking.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {booking.difference < 0 ? `초과 ${formatKRW(Math.abs(booking.difference))}` : '지원 한도 내'}
              </span>
            </div>
          </div>

          {/* Tab Selection: Slack vs Kakao vs Direct Link */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setActiveTab('slack')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'slack'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Slack (마크다운)</span>
            </button>
            <button
              onClick={() => setActiveTab('kakao')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'kakao'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>카카오톡 (줄글)</span>
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'link'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>페이지 링크</span>
            </button>
          </div>

          {/* Preview Box */}
          <div className="relative">
            <textarea
              readOnly
              rows={6}
              value={
                activeTab === 'slack'
                  ? slackText
                  : activeTab === 'kakao'
                  ? kakaoText
                  : shareUrl
              }
              className="w-full p-3.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 resize-none focus:outline-hidden"
            />
          </div>

          {/* Action Button */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => {
                const text = activeTab === 'slack' ? slackText : activeTab === 'kakao' ? kakaoText : shareUrl;
                handleCopy(activeTab, text);
              }}
              className="flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
              style={{
                backgroundColor: activeTab === 'kakao' ? '#FEE500' : themeConfig.primaryColor,
                color: activeTab === 'kakao' ? '#181600' : '#ffffff',
              }}
            >
              {copiedType === activeTab ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>복사 완료되었습니다!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    {activeTab === 'slack' ? '슬랙 메시지 복사하기' : activeTab === 'kakao' ? '카카오톡 텍스트 복사하기' : '링크 복사하기'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
