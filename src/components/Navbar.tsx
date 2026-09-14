import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Sun, 
  Moon, 
  Clock, 
  Users, 
  UtensilsCrossed, 
  Lock,
  LogOut
} from 'lucide-react';
import { ThemeConfig } from '../types';

interface NavbarProps {
  isAdminMode: boolean;
  isAdminAuthenticated?: boolean;
  onToggleAdmin: () => void;
  onLogoutAdmin?: () => void;
  themeConfig: ThemeConfig;
  onToggleTheme: () => void;
  totalBookings: number;
  totalHeadcount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminMode,
  isAdminAuthenticated = false,
  onToggleAdmin,
  onLogoutAdmin,
  themeConfig,
  onToggleTheme,
  totalBookings,
  totalHeadcount,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      // Dynamic Deadline from themeConfig (default: 10:30)
      const [dlHours, dlMins] = (themeConfig.deadlineTime || '10:30').split(':').map(Number);
      const deadline = new Date();
      deadline.setHours(dlHours || 10, dlMins || 30, 0, 0);

      if (now > deadline) {
        setRemainingTime(`마감됨 (${themeConfig.deadlineTime || '10:30'} 마감)`);
      } else {
        const diffMs = deadline.getTime() - now.getTime();
        const mins = Math.floor(diffMs / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setRemainingTime(`${themeConfig.deadlineTime || '10:30'} 마감까지 ${mins}분 ${secs}초`);
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [themeConfig.deadlineTime]);

  return (
    <header 
      id="main-navbar"
      className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: themeConfig.isDark ? 'rgba(19, 27, 46, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center p-1.5 bg-white border border-slate-200 dark:border-slate-700 shadow-md transition-transform hover:scale-105"
            >
              <img 
                src="/logo-future-dream.svg" 
                alt="Future & Dream Academy Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: themeConfig.isDark ? '#f8fafc' : themeConfig.primaryColor }}>
                {themeConfig.siteTitle}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {themeConfig.siteSubtitle}
              </p>
            </div>
          </div>

          {/* Center Info Stats (Hidden on small mobile) */}
          <div className="hidden lg:flex items-center space-x-6 px-4 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>현재 시각: <strong className="font-semibold">{timeString}</strong></span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">{remainingTime}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>신청 현황: <strong>{totalBookings}팀</strong> ({totalHeadcount}명 이동 예정)</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Mode Button */}
            <button
              id="btn-toggle-theme"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={themeConfig.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              aria-label="테마 전환"
            >
              {themeConfig.isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Admin Toggle Button */}
            <div className="flex items-center space-x-1.5">
              <button
                id="btn-toggle-admin"
                onClick={onToggleAdmin}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm ${
                  isAdminMode 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300 dark:ring-rose-900' 
                    : 'text-white hover:opacity-90'
                }`}
                style={{
                  backgroundColor: isAdminMode ? undefined : themeConfig.primaryColor,
                }}
              >
                {isAdminMode ? (
                  <>
                    <User className="w-4 h-4" />
                    <span>신청 폼 보기</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>관리자 모드</span>
                  </>
                )}
              </button>

              {isAdminMode && onLogoutAdmin && (
                <button
                  id="btn-logout-admin"
                  onClick={onLogoutAdmin}
                  title="관리자 로그아웃 (잠금)"
                  className="p-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
