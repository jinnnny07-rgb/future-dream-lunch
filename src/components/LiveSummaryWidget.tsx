import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Store, 
  ChevronRight, 
  Share2,
  Clock
} from 'lucide-react';
import { Booking, Restaurant, ThemeConfig } from '../types';
import { formatKRW } from '../utils';

interface LiveSummaryWidgetProps {
  bookings: Booking[];
  restaurants: Restaurant[];
  themeConfig: ThemeConfig;
  onOpenShareModal: (booking: Booking) => void;
  onSelectAdminSummary?: () => void;
}

export const LiveSummaryWidget: React.FC<LiveSummaryWidgetProps> = ({
  bookings,
  restaurants,
  themeConfig,
  onOpenShareModal,
  onSelectAdminSummary,
}) => {
  // Aggregated calculations
  const totalHeadcount = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.headcount, 0);
  }, [bookings]);

  const totalAmount = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [bookings]);

  // Aggregation per restaurant
  const restaurantStats = useMemo(() => {
    return restaurants.map((r) => {
      const bList = bookings.filter((b) => b.restaurantId === r.id);
      const headcount = bList.reduce((sum, b) => sum + b.headcount, 0);
      const ordersCount = bList.length;
      
      // Menu counts
      const menuCounts: Record<string, number> = {};
      bList.forEach((b) => {
        b.items.forEach((item) => {
          menuCounts[item.name] = (menuCounts[item.name] || 0) + item.quantity;
        });
      });

      return {
        restaurant: r,
        bookings: bList,
        headcount,
        ordersCount,
        menuCounts,
      };
    });
  }, [restaurants, bookings]);

  return (
    <div 
      id="live-summary-dashboard-widget"
      className="space-y-6"
    >
      {/* 1. Real-time KPI Card */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border shadow-sm transition-colors duration-200"
        style={{
          backgroundColor: themeConfig.isDark ? '#141c2e' : '#ffffff',
          borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div 
              className="p-2 rounded-xl text-white"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                실시간 점심 예약 집계
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                오늘 총 예약 및 식당별 이동 현황
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
            실시간 집계 중
          </span>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">총 이동 인원</span>
            <div className="flex items-baseline space-x-1">
              <strong className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {totalHeadcount}
              </strong>
              <span className="text-xs text-slate-500">명</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">접수 조(팀)</span>
            <div className="flex items-baseline space-x-1">
              <strong className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {bookings.length}
              </strong>
              <span className="text-xs text-slate-500">개 조</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">총 주문 식대</span>
            <div className="flex items-baseline space-x-0.5 truncate">
              <strong className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {formatKRW(totalAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. Breakdown per Restaurant */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <span>식당별 인원 및 메뉴 수량 합산</span>
            {onSelectAdminSummary && (
              <button
                onClick={onSelectAdminSummary}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center normal-case font-medium"
              >
                관리자 상세 보기
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {restaurantStats.map(({ restaurant, headcount, ordersCount, menuCounts }) => {
              const menuEntries = Object.entries(menuCounts);
              return (
                <div
                  key={restaurant.id}
                  className="p-3.5 rounded-2xl border bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 transition-shadow hover:shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center">
                      <Store className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      {restaurant.name}
                    </h4>

                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      총 {headcount}명 ({ordersCount}팀)
                    </div>
                  </div>

                  {/* Menu aggregated chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {menuEntries.length > 0 ? (
                      menuEntries.map(([name, qty]) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          {name} <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{qty}</strong>개
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">아직 예약된 메뉴가 없습니다.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Live Booking Activity Feed */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border shadow-sm transition-colors duration-200"
        style={{
          backgroundColor: themeConfig.isDark ? '#141c2e' : '#ffffff',
          borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
            최근 신청 피드 ({bookings.length}건)
          </h3>
          <span className="text-xs text-slate-500">실시간 반영</span>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-3.5 rounded-2xl border bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <strong className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {booking.representativeName}
                  </strong>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {booking.restaurantName} ({booking.headcount}명)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {booking.createdAt}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300">
                  {booking.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                </p>

                {booking.companions.length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    동행: {booking.companions.join(', ')}
                  </p>
                )}

                {booking.memo && (
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-1 rounded-md mt-1 inline-block">
                    💬 {booking.memo}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end space-y-1.5 shrink-0">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatKRW(booking.totalAmount)}
                </span>
                <button
                  onClick={() => onOpenShareModal(booking)}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="공유 메시지 복사"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
