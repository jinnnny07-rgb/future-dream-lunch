/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_RESTAURANTS, 
  INITIAL_BOOKINGS, 
  INITIAL_NOTICES, 
  DEFAULT_THEME_CONFIG, 
  DEFAULT_SEO_CONFIG 
} from './mockData';
import { Restaurant, Booking, Notice, ThemeConfig, SeoConfig } from './types';
import { Navbar } from './components/Navbar';
import { NoticeBanner } from './components/NoticeBanner';
import { AcademyHero } from './components/AcademyHero';
import { BookingForm } from './components/BookingForm';
import { LiveSummaryWidget } from './components/LiveSummaryWidget';
import { AdminPanel } from './components/AdminPanel';
import { ShareModal } from './components/ShareModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ShieldCheck, User, Sparkles, Lock } from 'lucide-react';

export default function App() {
  // Persistent State (localStorage with initial fallbacks)
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const saved = localStorage.getItem('app_restaurants');
    if (saved) {
      try {
        const parsed: Restaurant[] = JSON.parse(saved);
        return parsed.map((r) => ({
          ...r,
          voucherOnly: false,
          category: r.category.replace(' / 식권 전용', '').replace(' / 식권전용', ''),
          description: r.description.replace(' (※ 반드시 사전 식권 지참)', ''),
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_RESTAURANTS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('app_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('app_notices');
    if (saved) {
      try {
        const parsed: Notice[] = JSON.parse(saved);
        return parsed.map((n) => {
          if (n.id === 'notice-1') {
            return {
              ...n,
              content: n.content.replace(/11:30/g, '10:30'),
            };
          }
          if (n.id === 'notice-2') {
            return {
              ...n,
              content: n.content.replace(/11:45/g, '10:45'),
            };
          }
          return n;
        });
      } catch (e) {
        return INITIAL_NOTICES;
      }
    }
    return INITIAL_NOTICES;
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('app_theme_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.siteTitle || parsed.siteTitle === '신세계 퓨쳐앤드림 아카데미' || parsed.siteTitle === '스마트 그룹 점심 신청 센터') {
          parsed.siteTitle = DEFAULT_THEME_CONFIG.siteTitle;
        }
        if (!parsed.siteSubtitle || parsed.siteSubtitle.includes('임직원') || parsed.siteSubtitle.includes('실시간 그룹 점심 예약')) {
          parsed.siteSubtitle = DEFAULT_THEME_CONFIG.siteSubtitle;
        }
        if (!parsed.deadlineTime || parsed.deadlineTime === '11:30') {
          parsed.deadlineTime = '10:30';
        }
        return { ...DEFAULT_THEME_CONFIG, ...parsed };
      } catch (e) {
        return DEFAULT_THEME_CONFIG;
      }
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [seoConfig, setSeoConfig] = useState<SeoConfig>(() => {
    const saved = localStorage.getItem('app_seo_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.metaTitle?.includes('신세계 퓨쳐앤드림') || parsed.metaTitle?.includes('그룹 점심 신청')) {
          return DEFAULT_SEO_CONFIG;
        }
        return { ...DEFAULT_SEO_CONFIG, ...parsed };
      } catch {
        return DEFAULT_SEO_CONFIG;
      }
    }
    return DEFAULT_SEO_CONFIG;
  });

  // UI State & Admin Auth State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [sharingBooking, setSharingBooking] = useState<Booking | null>(null);

  // Admin access handler protected with PIN
  const handleRequestAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      return;
    }

    if (isAdminAuthenticated) {
      setIsAdminMode(true);
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAdminAuthModalOpen(false);
    setIsAdminMode(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setIsAdminMode(false);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('app_restaurants', JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    localStorage.setItem('app_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('app_notices', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('app_theme_config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  useEffect(() => {
    localStorage.setItem('app_seo_config', JSON.stringify(seoConfig));
  }, [seoConfig]);

  // Apply Theme CSS variables and dark mode to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeConfig.primaryColor);
    root.style.setProperty('--secondary-color', themeConfig.secondaryColor);
    root.style.setProperty('--accent-color', themeConfig.accentColor || '#3b82f6');
    root.style.setProperty('--font-family', themeConfig.font);

    if (themeConfig.isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
  }, [themeConfig]);

  // Apply SEO tags to document
  useEffect(() => {
    document.title = seoConfig.metaTitle || themeConfig.siteTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seoConfig.metaDescription);

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', seoConfig.keywords);
  }, [seoConfig, themeConfig.siteTitle]);

  // Handlers
  const handleToggleTheme = () => {
    setThemeConfig((prev) => ({ ...prev, isDark: !prev.isDark }));
  };

  const handleUpdateThemeConfig = (updated: Partial<ThemeConfig>) => {
    setThemeConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleResetTheme = () => {
    setThemeConfig(DEFAULT_THEME_CONFIG);
  };

  const handleAddBooking = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  const totalHeadcount = bookings.reduce((sum, b) => sum + b.headcount, 0);

  const scrollToForm = () => {
    const el = document.getElementById('student-lunch-booking-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToNotices = () => {
    const el = document.getElementById('notice-announcement-banner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Navigation Bar */}
      <Navbar
        isAdminMode={isAdminMode}
        isAdminAuthenticated={isAdminAuthenticated}
        onToggleAdmin={handleRequestAdminMode}
        onLogoutAdmin={handleAdminLogout}
        themeConfig={themeConfig}
        onToggleTheme={handleToggleTheme}
        totalBookings={bookings.length}
        totalHeadcount={totalHeadcount}
      />

      {/* 2. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Shinsegae Future & Dream Academy Intro Hero Section */}
        <AcademyHero
          themeConfig={themeConfig}
          totalHeadcount={totalHeadcount}
          totalBookings={bookings.length}
          onScrollToForm={scrollToForm}
          onScrollToNotices={scrollToNotices}
        />

        {/* Notice Announcement Banner */}
        <NoticeBanner
          notices={notices}
          themeConfig={themeConfig}
          onSelectAdminNoticeTab={handleRequestAdminMode}
        />

        {/* View Mode Switching Notice Badge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              현재 모드:
            </span>
            <span 
              className="px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center shadow-xs"
              style={{
                backgroundColor: isAdminMode ? '#dc2626' : themeConfig.primaryColor,
                color: '#ffffff',
              }}
            >
              {isAdminMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  관리자 모드 (대시보드 CMS 활성화)
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 mr-1" />
                  교육생 점심 신청 모드
                </>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {isAdminMode && (
              <button
                onClick={handleAdminLogout}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 underline flex items-center"
              >
                관리자 로그아웃(잠금)
              </button>
            )}
            <button
              onClick={handleRequestAdminMode}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline flex items-center"
            >
              {isAdminMode ? '← 일반 사용자 신청 화면으로 전환' : '🔒 관리자 패널로 전환 (PIN 필요) →'}
            </button>
          </div>
        </div>

        {/* Conditional View or Split View */}
        {isAdminMode ? (
          /* ADMIN MODE VIEW */
          <div className="space-y-8 animate-fade-in">
            <AdminPanel
              restaurants={restaurants}
              onUpdateRestaurants={setRestaurants}
              bookings={bookings}
              onUpdateBookings={setBookings}
              notices={notices}
              onUpdateNotices={setNotices}
              themeConfig={themeConfig}
              onUpdateThemeConfig={handleUpdateThemeConfig}
              onResetTheme={handleResetTheme}
              seoConfig={seoConfig}
              onUpdateSeoConfig={setSeoConfig}
              onCloseAdmin={() => setIsAdminMode(false)}
            />

            {/* Also show summary widget underneath in admin mode for quick glance */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                현장 예약 현황 요약 미리보기
              </h3>
              <LiveSummaryWidget
                bookings={bookings}
                restaurants={restaurants}
                themeConfig={themeConfig}
                onOpenShareModal={(b) => setSharingBooking(b)}
              />
            </div>
          </div>
        ) : (
          /* USER MODE SPLIT VIEW (Left/Top: Application Form, Right/Bottom: Real-time Live Summary) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: Student Lunch Booking Form (7 of 12 columns on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              <BookingForm
                restaurants={restaurants}
                themeConfig={themeConfig}
                onSubmitBooking={handleAddBooking}
                onOpenShareModal={(b) => setSharingBooking(b)}
              />
            </div>

            {/* Right Column: Real-time Live Summary & Reservation Copy (5 of 12 columns on desktop) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <LiveSummaryWidget
                bookings={bookings}
                restaurants={restaurants}
                themeConfig={themeConfig}
                onOpenShareModal={(b) => setSharingBooking(b)}
                onSelectAdminSummary={handleRequestAdminMode}
              />
            </div>
          </div>
        )}
      </main>

      {/* 3. Social Share Modal */}
      <ShareModal
        booking={sharingBooking}
        isOpen={!!sharingBooking}
        onClose={() => setSharingBooking(null)}
        themeConfig={themeConfig}
      />

      {/* 4. Admin PIN Authentication Lock Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
        themeConfig={themeConfig}
        correctPin={themeConfig.adminPassword || '9707'}
      />

      {/* 4. Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {themeConfig.siteTitle} • {themeConfig.siteSubtitle}
          </p>
          <p className="text-[11px]">
            기본 지정 색상: 메인 (#2C2B70) / 서브 (#C6C4C3) | 1인당 기본 지원 식대: {themeConfig.budgetPerPerson?.toLocaleString()}원
          </p>
        </div>
      </footer>
    </div>
  );
}
