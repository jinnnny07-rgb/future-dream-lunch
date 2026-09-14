import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { ThemeConfig } from '../types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  themeConfig: ThemeConfig;
  correctPin?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  themeConfig,
  correctPin = '9707',
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === correctPin) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md text-white"
            style={{ backgroundColor: themeConfig.primaryColor }}
          >
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              관리자 인증 (Admin Lock)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              관리자 대시보드 접근을 위해 비밀번호를 입력해 주세요.
            </p>
          </div>
        </div>

        {/* PIN Input Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              관리자 비밀번호
            </label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="비밀번호 입력"
                className={`w-full pl-10 pr-11 py-3 rounded-xl border text-center text-lg font-mono tracking-widest bg-slate-50 dark:bg-slate-800 transition-all ${
                  error 
                    ? 'border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-200' 
                    : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showPin ? '숨기기' : '보기'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-1 text-rose-500 text-xs font-semibold pt-1 animate-shake">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>비밀번호가 올바르지 않습니다. 다시 확인해 주세요.</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              id="btn-admin-auth-submit"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center space-x-1 hover:opacity-95"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <span>인증 및 입장</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            🔒 일반 교육생의 무단 접근 및 메뉴/공지 수정을 방지합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
