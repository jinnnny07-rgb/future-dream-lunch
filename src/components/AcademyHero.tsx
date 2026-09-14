import React from 'react';
import { 
  Sparkles, 
  ArrowDownCircle, 
  Clock, 
  Ticket, 
  Calculator, 
  ShieldCheck, 
  Building2,
  Users,
  Award
} from 'lucide-react';
import { ThemeConfig } from '../types';
import { formatKRW } from '../utils';

interface AcademyHeroProps {
  themeConfig: ThemeConfig;
  totalHeadcount: number;
  totalBookings: number;
  onScrollToForm: () => void;
  onScrollToNotices: () => void;
}

export const AcademyHero: React.FC<AcademyHeroProps> = ({
  themeConfig,
  totalHeadcount,
  totalBookings,
  onScrollToForm,
  onScrollToNotices,
}) => {
  const budget = themeConfig.budgetPerPerson || 10000;
  const deadline = themeConfig.deadlineTime || '10:30';

  return (
    <section 
      id="shinsegae-academy-hero"
      aria-label="신세계 퓨쳐앤드림 아카데미 인트로"
      className="relative rounded-3xl overflow-hidden border shadow-xl mb-8 transition-all duration-300"
      style={{
        backgroundColor: themeConfig.isDark ? '#0f172a' : '#ffffff',
        borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
      }}
    >
      {/* Luxurious Top Metallic Brand Stripe */}
      <div 
        className="h-2.5 w-full shadow-inner"
        style={{
          background: `linear-gradient(90deg, #1e1b4b 0%, #2C2B70 30%, #4338ca 60%, #C6C4C3 85%, #f59e0b 100%)`
        }}
      />

      {/* Subtle Prestige Ambient Gradients */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15 dark:opacity-25"
        style={{ backgroundColor: '#2C2B70' }}
      />
      <div 
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-10 dark:opacity-20"
        style={{ backgroundColor: '#4338ca' }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Prestigious Copy & CTAs (7 of 12 columns) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Hero Badge Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div 
                className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-xs border"
                style={{
                  backgroundColor: themeConfig.isDark ? 'rgba(44, 43, 112, 0.4)' : '#f8fafc',
                  color: themeConfig.primaryColor,
                  borderColor: themeConfig.secondaryColor,
                }}
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                SHINSEGAE GROUP • 미래 인재 양성
              </div>

              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                <span>오늘 {deadline} 마감</span>
              </div>
            </div>

            {/* Main Typographic Hierarchy */}
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                Future &amp; Dream Academy
              </span>
              <h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight"
                style={{ color: themeConfig.isDark ? '#f8fafc' : '#1e1b4b' }}
              >
                신세계 퓨쳐앤드림 아카데미
              </h1>
              <p className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">
                그룹 교육생 점심 사전 신청 &amp; 실시간 식대 정산 시스템
              </p>
            </div>

            {/* Editorial Narrative */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              신세계 퓨쳐앤드림 아카데미 교육생 여러분의 편안한 점심시간을 위한 예약 플랫폼입니다. <strong>1인당 {formatKRW(budget)}</strong>의 교육생 식대 지원을 바탕으로 메뉴 선택, 식당별 이동 인원 집계를 지원합니다.
            </p>

            {/* Premium Feature Showcase Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center space-x-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 block">인당 10,000원</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">식대 지원 자동 계산</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center space-x-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: '#d97706' }}
                >
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 block">식권/일반 연동</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">칭마레이 등 식권 안내</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center space-x-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: '#059669' }}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 block">스마트 집계</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">식당 사전 통화/문자 요약</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onScrollToForm}
                id="hero-btn-apply-lunch"
                className="py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 flex items-center space-x-2"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                <span>지금 점심 신청하기</span>
                <ArrowDownCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onScrollToNotices}
                className="py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                마감 &amp; 식권 공지 보기
              </button>

              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-1 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>오늘 <strong>{totalBookings}팀</strong> ({totalHeadcount}명) 접수 완료</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Executive Brand Plaque (ONLY 그림1 Logo, No Text) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div 
              className="w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden flex items-center justify-center transition-transform duration-300 hover:shadow-2xl"
              style={{
                background: themeConfig.isDark 
                  ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
                  : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderColor: themeConfig.isDark ? '#334155' : '#cbd5e1',
              }}
            >
              {/* Refined Gold Border Ring & Image Frame */}
              <div 
                className="w-full h-64 sm:h-72 rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 shadow-inner flex items-center justify-center relative transition-transform hover:scale-[1.02] duration-200"
              >
                {/* Gold corner accent pins */}
                <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-amber-400/80 shadow-xs" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400/80 shadow-xs" />
                <span className="absolute bottom-2.5 left-2.5 w-2 h-2 rounded-full bg-amber-400/80 shadow-xs" />
                <span className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400/80 shadow-xs" />

                {/* ONLY 그림1 (Future & Dream Academy Staircase Logo) */}
                <img 
                  src="/logo-future-dream.svg" 
                  alt="신세계 퓨쳐앤드림 아카데미 공식 로고"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
