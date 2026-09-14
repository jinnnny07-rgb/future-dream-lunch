import React from 'react';
import { Calculator, AlertTriangle, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { formatKRW } from '../utils';
import { ThemeConfig } from '../types';

interface BudgetCalculatorProps {
  headcount: number;
  totalOrderAmount: number;
  themeConfig: ThemeConfig;
}

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({
  headcount,
  totalOrderAmount,
  themeConfig,
}) => {
  const budgetPerPerson = themeConfig.budgetPerPerson || 10000;
  const totalBudget = headcount * budgetPerPerson;
  const difference = totalBudget - totalOrderAmount;
  const isOver = difference < 0;
  const overAmount = Math.abs(difference);
  const percent = totalBudget > 0 ? Math.round((totalOrderAmount / totalBudget) * 100) : 0;
  const avgPerPerson = headcount > 0 ? Math.round(totalOrderAmount / headcount) : 0;

  return (
    <div 
      id="live-budget-calculator"
      className="p-5 rounded-2xl border transition-all duration-200"
      style={{
        backgroundColor: themeConfig.isDark ? '#141c2e' : '#f8fafc',
        borderColor: isOver 
          ? (themeConfig.isDark ? '#7f1d1d' : '#fca5a5') 
          : (themeConfig.isDark ? '#1e293b' : '#e2e8f0'),
      }}
    >
      {/* Title & Status header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: themeConfig.primaryColor }}
          >
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              실시간 식대 지원 한도 계산기
              <span className="ml-2 text-xs font-normal text-slate-500">
                (인당 {formatKRW(budgetPerPerson)} 기준)
              </span>
            </h3>
          </div>
        </div>

        {/* Live Status Badge */}
        {isOver ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-bounce-short">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            한도 초과 ({formatKRW(overAmount)} 자부담)
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            지원 한도 내 ({formatKRW(difference)} 잔여)
          </span>
        )}
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
        {/* Box 1: Headcount */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">신청 인원수</span>
          <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            {headcount}명
          </span>
        </div>

        {/* Box 2: Total Limit */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">총 지원 한도</span>
          <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {formatKRW(totalBudget)}
          </span>
        </div>

        {/* Box 3: Total Order Amount */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">현재 주문 합계</span>
          <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            {formatKRW(totalOrderAmount)}
          </span>
        </div>

        {/* Box 4: Difference or Overage */}
        <div className={`p-3 rounded-xl border ${
          isOver 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
        }`}>
          <span className="text-[11px] block mb-0.5 opacity-80">
            {isOver ? '초과 부담액' : '잔여 지원금'}
          </span>
          <span className="text-base sm:text-lg font-extrabold">
            {isOver ? `+${formatKRW(overAmount)}` : formatKRW(difference)}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center text-xs mb-1 text-slate-500 dark:text-slate-400">
          <span>예산 사용률: <strong className={isOver ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-200'}>{percent}%</strong></span>
          <span>1인당 평균 지출: <strong>{formatKRW(avgPerPerson)}</strong></span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOver 
                ? 'bg-rose-500' 
                : percent > 85 
                ? 'bg-amber-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>

      {/* Warning Notice if Over Budget */}
      {isOver && (
        <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-start space-x-2.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block mb-0.5">식대 지원 한도를 {formatKRW(overAmount)} 초과하였습니다!</span>
            <span>
              총 결제 금액 중 지원 한도를 초과하는 금액은 신청 팀에서 식당 방문 시 직접 현장 결제(자부담)하셔야 합니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
