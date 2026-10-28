'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithKakao, signOutKakao, isUserAdmin } from '@/lib/auth';
import { UserProfile } from '@/types/database';
import { LogOut, Loader2, User as UserIcon, BarChart3, ShieldCheck } from 'lucide-react';

interface KakaoAuthBarProps {
  currentProfile: UserProfile | null;
  isAuthenticated: boolean;
  onAuthChange: () => void;
}

export const KakaoAuthBar: React.FC<KakaoAuthBarProps> = ({
  currentProfile,
  isAuthenticated,
  onAuthChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithKakao();
    } catch (err) {
      console.error(err);
      alert('카카오 로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOutKakao();
      onAuthChange();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated && currentProfile ? (
        // 로그인 상태 UI
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 관리자인 경우 관리자 대시보드 바로가기 버튼 */}
          {(currentProfile.role === 'admin' || isUserAdmin(currentProfile)) && (
            <Link
              href="/admin/evaluations"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all active:scale-95 shadow-2xs"
              title="온도별 평가 데이터 관리 (관리자 전용)"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">평가 관리</span>
            </Link>
          )}

          <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-1.5 pr-2.5 shadow-2xs">
            {/* 아바타 */}
            <div className="relative">
              {currentProfile.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.name}
                  className="w-7 h-7 rounded-xl object-cover ring-1 ring-amber-400/50"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center ring-1 ring-amber-400/40">
                  {currentProfile.name.slice(0, 1)}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FEE500] rounded-full flex items-center justify-center border border-white shadow-xs"
                title="카카오 로그인 연동됨"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="#191919"
                  className="w-2 h-2"
                >
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.012l-1.08 4.025c-.097.362.316.65.617.433l4.757-3.15c.144.01.29.016.436.016 4.97 0 9-3.185 9-7.116S16.97 3 12 3z" />
                </svg>
              </span>
            </div>

            {/* 사용자 이름 및 카카오 배지 */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                  {currentProfile.name}
                </span>
                <span className="text-[9px] font-extrabold px-1 py-0.2 bg-[#FEE500] text-[#191919] rounded">
                  카카오
                </span>
                {(currentProfile.role === 'admin' || isUserAdmin(currentProfile)) && (
                  <span className="text-[9px] font-bold px-1 py-0.2 bg-indigo-100 text-indigo-700 rounded border border-indigo-200">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {currentProfile.email || '개인 데이터 연동 중'}
              </span>
            </div>

            {/* 로그아웃 버튼 */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="ml-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              title="카카오 로그아웃 (기본 사용자로 전환)"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        // 비로그인 상태 UI (게스트 뱃지 + 카카오 로그인 버튼)
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200/60">
            게스트
          </span>
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold text-xs rounded-xl transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs disabled:opacity-50 touch-manipulation"
            title="카카오 계정으로 3초 만에 로그인"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#191919]" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="#191919"
                className="w-3.5 h-3.5 shrink-0"
              >
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.012l-1.08 4.025c-.097.362.316.65.617.433l4.757-3.15c.144.01.29.016.436.016 4.97 0 9-3.185 9-7.116S16.97 3 12 3z" />
              </svg>
            )}
            <span>카카오 로그인</span>
          </button>
        </div>
      )}
    </div>
  );
};
