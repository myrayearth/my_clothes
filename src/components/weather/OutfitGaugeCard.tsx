'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OutfitSelection } from '@/types/outfit';
import { OutfitLog, UserGender } from '@/types/database';
import {
  calculateTotalInsulation,
  clampUserOffset,
  scoreToCoverTemperature,
  getRelativeCoverStatus,
} from '@/lib/insulation';
import { Thermometer } from 'lucide-react';

interface OutfitGaugeCardProps {
  temperature: number;
  actualTemperature?: number;
  apparentTemperature?: number;
  selection: OutfitSelection;
  allLogs?: OutfitLog[];
  currentUser?: string;
  isLoggedIn?: boolean;
  gender?: UserGender;
  isManual?: boolean;
}

export const OutfitGaugeCard: React.FC<OutfitGaugeCardProps> = ({
  temperature,
  actualTemperature,
  selection,
  allLogs = [],
  currentUser,
  isLoggedIn = false,
  isManual = false,
}) => {
  const fullCardRef = useRef<HTMLDivElement>(null);
  const [isDocked, setIsDocked] = useState(false);

  // 인플로우(In-Flow) 풀 카드의 높이는 절대 변경하지 않아 문서 높이 변화(CLS) 및 천천히 스크롤 시 바운스 0% 보장
  useEffect(() => {
    let ticking = false;
    const dockOffset = isManual ? 0 : 44;

    const checkScroll = () => {
      if (!fullCardRef.current) return;
      const rect = fullCardRef.current.getBoundingClientRect();
      // 풀 카드의 하단이 도킹 영역(top 44px + 슬림 게이지 높이 약 58px = 102px)에 도달하면 슬림 고정 바로 배턴 터치
      const shouldDock = rect.bottom <= dockOffset + 62;
      setIsDocked((prev) => {
        if (prev !== shouldDock) {
          window.dispatchEvent(
            new CustomEvent('ondofit:gauge-dock', { detail: shouldDock })
          );
          return shouldDock;
        }
        return prev;
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    checkScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isManual]);

  // 보온 수치 점수 (Insulation Score) 실시간 계산
  const totalInsulationScore = useMemo(() => {
    return calculateTotalInsulation(selection);
  }, [selection]);

  // 개인화 체질 보정값(User Offset) 계산
  const userOffset = useMemo(() => {
    if (!isLoggedIn || !currentUser || currentUser === '게스트') return 0;
    const userLogs = allLogs.filter(
      (l) => l.user_name === currentUser && Math.abs(l.target_temp - temperature) <= 3
    );
    if (userLogs.length === 0) return 0;
    const avgScore = userLogs.reduce((sum, l) => sum + (l.score || 0), 0) / userLogs.length;
    return clampUserOffset(-avgScore * 4);
  }, [allLogs, temperature, currentUser, isLoggedIn]);

  // 보온 점수 -> 복장 적정 커버 기온 (°C) 환산
  const coverTemp = useMemo(() => {
    return scoreToCoverTemperature(totalInsulationScore);
  }, [totalInsulationScore]);

  // 현재 기준 온도(temperature) 대비 ±5°C 상대 범위 상태 산출
  const relativeStatus = useMemo(() => {
    return getRelativeCoverStatus(coverTemp, temperature);
  }, [coverTemp, temperature]);

  // 게이지 바 표시 범위: [temperature - 5, temperature + 5] (총 10°C 폭)
  const gaugeMinTemp = temperature - 5;
  const gaugeMaxTemp = temperature + 5;
  const rawCoverPct = ((coverTemp - gaugeMinTemp) / 10) * 100;
  const markerPct = Math.max(0, Math.min(100, rawCoverPct));
  const isLeftOverflow = coverTemp < gaugeMinTemp;
  const isRightOverflow = coverTemp > gaugeMaxTemp;

  // 공통 게이지 트랙 렌더러
  const renderGaugeTrack = () => (
    <div className="relative h-4 sm:h-5 w-full select-none">
      {/* 1. 과보온 구간 */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1/4 h-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] tracking-tight bg-rose-100/90 border-y border-l border-rose-500/80 rounded-l-full dark:bg-rose-500/25 dark:border-rose-400/80"
        title={`과보온 (${gaugeMinTemp}°C ~ ${temperature - 2.5}°C)`}
      >
        <span className="text-rose-950 font-bold dark:text-rose-200 truncate px-0.5">과보온</span>
      </div>

      {/* 2. 적정 구간 */}
      <div
        className="absolute top-0 bottom-0 left-1/4 w-1/2 h-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] tracking-tight bg-emerald-100/90 border border-emerald-500/80 dark:bg-emerald-500/25 dark:border-emerald-400/80"
        title={`적정 (${temperature - 2.5}°C ~ ${temperature + 2.5}°C)`}
      >
        <span className="text-emerald-950 font-bold dark:text-emerald-200 truncate px-0.5">적정 (±2.5°C)</span>
      </div>

      {/* 3. 보온 필요 구간 */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1/4 h-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] tracking-tight bg-sky-100/90 border-y border-r border-sky-500/80 rounded-r-full dark:bg-sky-500/25 dark:border-sky-400/80"
        title={`보온 필요 (${temperature + 2.5}°C ~ ${gaugeMaxTemp}°C)`}
      >
        <span className="text-sky-950 font-bold dark:text-sky-200 truncate px-0.5">보온 필요</span>
      </div>

      {/* 중앙 50% 기준 세로선 */}
      <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-900/70 dark:bg-white/80 z-10 pointer-events-none" />

      {/* 현재 마커 핀 */}
      <div
        className="absolute top-0 bottom-0 transition-all duration-300 ease-out z-20 pointer-events-none"
        style={{ left: `${markerPct}%` }}
      >
        <div
          className={`w-1 h-full -translate-x-1/2 shadow-xs ${
            relativeStatus.status === 'OVERHEATED'
              ? 'bg-rose-500'
              : relativeStatus.status === 'OPTIMAL'
              ? 'bg-emerald-600 dark:bg-emerald-500'
              : 'bg-sky-600 dark:bg-sky-500'
          }`}
        />
        <div
          className={`absolute -top-1 left-0 -translate-x-1/2 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs ${
            relativeStatus.status === 'OVERHEATED'
              ? 'bg-rose-500'
              : relativeStatus.status === 'OPTIMAL'
              ? 'bg-emerald-600 dark:bg-emerald-500'
              : 'bg-sky-600 dark:bg-sky-500'
          } ${isLeftOverflow || isRightOverflow ? 'animate-bounce' : ''}`}
        />
      </div>
    </div>
  );

  // 공통 1행 요약 렌더러
  const renderSummaryRow = () => (
    <div className="flex items-center justify-between gap-1.5 flex-wrap">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate">
          체감 복장: <strong className="text-slate-900 dark:text-white font-extrabold text-sm">약 {coverTemp}°C</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          (기준 <strong className="text-brand-700 dark:text-brand-400 font-bold">{temperature}°C</strong>
          {actualTemperature !== undefined && actualTemperature !== temperature && (
            <span className="ml-1 text-[10px] text-slate-400">/ 실제 {actualTemperature}°C</span>
          )}
          )
        </span>
        <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${relativeStatus.badgeStyle}`}>
          <span>{relativeStatus.badgeText}</span>
          {relativeStatus.diff !== 0 && (
            <span className="font-semibold opacity-90">
              ({relativeStatus.diff > 0 ? `+${relativeStatus.diff}` : relativeStatus.diff}°C)
            </span>
          )}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. 기본 상태 인플로우(In-Flow) 카드: 항상 원래 높이를 그대로 유지하여 천천히 스크롤해도 바운스 0% */}
      <div
        ref={fullCardRef}
        className={`w-full select-none bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 space-y-2.5 transition-opacity duration-150 ${
          isDocked ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-between px-0.5 pb-0.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              적정 체감 복장 분석
            </h4>
            <span className="text-[11px] text-slate-400 font-normal">
              (체감 기온 vs 현재 복장 보온도)
            </span>
          </div>
        </div>

        {renderSummaryRow()}
        {renderGaugeTrack()}

        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-0.5 pt-0.5">
          <span className={isLeftOverflow ? 'text-rose-600 font-bold' : ''}>
            ◀ {gaugeMinTemp}°C (두꺼움)
          </span>
          <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
            <span>🎯 기준 {temperature}°C</span>
          </div>
          <span className={isRightOverflow ? 'text-sky-600 font-bold' : ''}>
            {gaugeMaxTemp}°C (얇음) ▶
          </span>
        </div>
      </div>

      {/* 2. 상단 고정 슬림 게이지 바 (Out-of-Flow Fixed: 시간대 탭 바로 아래 도킹하여 단일 카드 형성, 바운스 0%) */}
      <div
        className={`fixed ${isManual ? 'top-0' : 'top-[44px]'} left-0 right-0 z-50 pointer-events-none transition-all duration-150 ${
          isDocked
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!isDocked}
      >
        <div className="max-w-2xl w-full mx-auto px-4">
          <div
            className={`w-full select-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md ${
              isManual ? 'rounded-b-2xl' : 'rounded-t-none rounded-b-2xl'
            } border-x border-b border-t border-slate-200/90 dark:border-slate-800 shadow-md px-3 py-2 space-y-1.5 ${
              isDocked ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            {renderSummaryRow()}
            {renderGaugeTrack()}
          </div>
        </div>
      </div>
    </>
  );
};
