'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { verifyAdminAccess, signInWithKakao, signOutKakao, ADMIN_EMAIL } from '@/lib/auth';
import { supabase } from '@/lib/storage';
import { UserProfile } from '@/types/database';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  Loader2,
  LogIn,
  LogOut,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // 권한 검증 실행 함수
  const checkAccess = async () => {
    setIsLoading(true);
    try {
      const result = await verifyAdminAccess();
      setIsAuthenticated(result.isAuthenticated);
      setIsAdmin(result.isAdmin);
      setUser(result.user);
      setProfile(result.profile);
    } catch (e) {
      console.error('AdminGuard check error:', e);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();

    if (!supabase) return;

    // 인증 상태 실시간 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleKakaoLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithKakao();
    } catch (err) {
      console.error('로그인 시작 실패:', err);
      setIsLoggingIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOutKakao();
    await signInWithKakao();
  };

  // 1. 권한 확인 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">관리자 권한 확인 중</h3>
            <p className="text-xs text-slate-500 mt-1">
              Supabase RLS 및 사용자 권한을 안전하게 검증하고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. 비로그인 상태 (로그인 페이지/모달 유도)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center border border-amber-200/60 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100/70 text-amber-800 rounded-full border border-amber-200">
              인증 필요
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              관리자 로그인이 필요합니다
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              온도별 평가 데이터 관리 페이지는 관리자 계정(
              <span className="font-semibold text-slate-700">{ADMIN_EMAIL}</span>
              )으로 로그인한 경우에만 접근할 수 있습니다.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleKakaoLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] text-sm font-bold rounded-2xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>카카오 계정으로 로그인</span>
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>메인 홈으로 돌아가기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. 일반 로그인 사용자 (관리자 권한 없음)
  if (!isAdmin) {
    const currentName = profile?.name || user?.user_metadata?.name || '사용자';
    const currentEmail = profile?.email || user?.email || '이메일 미제공';

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-rose-200/80 p-6 sm:p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-200 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full border border-rose-200">
              접근 차단 (403 Forbidden)
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              접근 권한이 없습니다. (관리자 전용)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              이 페이지는 시스템 관리자(
              <span className="font-semibold text-rose-600">{ADMIN_EMAIL}</span>
              )에게만 열려 있는 통계 및 데이터 관리 구역입니다.
            </p>
          </div>

          {/* 현재 로그인된 계정 정보 뱃지 */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
              {currentName.substring(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">{currentName}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-medium">
                  일반 사용자
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{currentEmail}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>메인 화면으로 이동</span>
            </Link>

            <button
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>관리자 계정으로 전환 (다시 로그인)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. 관리자 계정 인증 완료 -> 정상 렌더링
  return <>{children}</>;
};
