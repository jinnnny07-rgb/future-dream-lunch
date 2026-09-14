import React, { useState } from 'react';
import { 
  BellRing, 
  ChevronRight, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { Notice, ThemeConfig } from '../types';

interface NoticeBannerProps {
  notices: Notice[];
  themeConfig: ThemeConfig;
  onSelectAdminNoticeTab?: () => void;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  notices,
  themeConfig,
  onSelectAdminNoticeTab,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!notices || notices.length === 0) return null;

  const pinnedNotices = notices.filter((n) => n.isPinned);
  const activeNotice = pinnedNotices.length > 0 ? pinnedNotices[currentIndex % pinnedNotices.length] : notices[0];

  const handleNext = () => {
    if (pinnedNotices.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % pinnedNotices.length);
    }
  };

  const getNoticeBadge = (type: Notice['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />,
          label: '식권안내',
        };
      case 'info':
        return {
          bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          icon: <Info className="w-3.5 h-3.5 mr-1 text-blue-600" />,
          label: '이동매너',
        };
      default:
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          icon: <BellRing className="w-3.5 h-3.5 mr-1 text-rose-600 animate-pulse" />,
          label: '필독공지',
        };
    }
  };

  const badge = getNoticeBadge(activeNotice.type);

  return (
    <div 
      id="notice-announcement-banner"
      className="mb-6 rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden"
      style={{
        backgroundColor: themeConfig.isDark ? '#1a2236' : '#ffffff',
        borderColor: themeConfig.isDark ? '#2a344d' : '#e2e8f0',
      }}
    >
      {/* Top Main Banner Bar */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
            {badge.icon}
            {badge.label}
          </span>
          <div className="flex-1 truncate">
            <span className="font-semibold text-sm mr-2 text-slate-800 dark:text-slate-100">
              {activeNotice.title}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
              {activeNotice.content}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {pinnedNotices.length > 1 && (
            <button
              onClick={handleNext}
              className="text-xs px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center"
              title="다음 중요 공지"
            >
              <span>{currentIndex + 1}/{pinnedNotices.length}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>전체 공지 {notices.length}건</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Notice List */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>등록된 공지사항 목록</span>
            {onSelectAdminNoticeTab && (
              <button
                onClick={onSelectAdminNoticeTab}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                관리자 패널에서 공지 수정
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {notices.map((n) => {
              const b = getNoticeBadge(n.type);
              return (
                <div
                  key={n.id}
                  className="p-3 rounded-xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${b.bg}`}>
                        {b.label}
                      </span>
                      <span className="text-[11px] text-slate-400">{n.date}</span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 mb-1">
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                      {n.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
