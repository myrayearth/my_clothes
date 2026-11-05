'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TargetTimeSlot, TimeSlotWeatherItem } from '@/types/weather';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { Clock, Briefcase, Sun, Home, Sparkles } from 'lucide-react';

interface TimeSlotTabsProps {
  timeSlots: Record<TargetTimeSlot, TimeSlotWeatherItem>;
  selectedSlot: TargetTimeSlot;
  onSelectSlot: (slot: TargetTimeSlot) => void;
  title?: string;
  badge?: React.ReactNode;
  visibleSlots?: TargetTimeSlot[];
}

const slotMeta: Record<
  TargetTimeSlot,
  { label: string; icon: React.ReactNode; sub: string }
> = {
  'current': {
    label: '현재',
    sub: '실시간',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  '08:00': {
    label: '08시',
    sub: '아침',
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  '13:00': {
    label: '13시',
    sub: '낮',
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  '19:00': {
    label: '19시',
    sub: '저녁',
    icon: <Home className="w-3.5 h-3.5" />,
  },
};

export const TimeSlotTabs: React.FC<TimeSlotTabsProps> = ({
  timeSlots,
  selectedSlot,
  onSelectSlot,
  title = '시간대별 예보 및 복장 기준',
  badge,
  visibleSlots = ['current', '08:00', '13:00', '19:00'],
}) => {
  const slots: TargetTimeSlot[] = visibleSlots;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // 정적 센티널 감지: 스크롤 축소/확대 시 높이 변화에 영향받지 않도록 센티널을 외부에 고정
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!sentinelRef.current) {
            ticking = false;
            return;
          }
          const rect = sentinelRef.current.getBoundingClientRect();
          // 25px 히스테리시스 데드밴드로 진동(바운스) 방지
          if (rect.top <= 0) {
            setIsSticky(true);
          } else if (rect.top > 25) {
            setIsSticky(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* 1. 정적 센티널: 상단 닿는 시점을 감지 (위치 불변으로 바운스 0%) */}
      <div
        ref={sentinelRef}
        className="absolute -top-1 left-0 w-full h-1 pointer-events-none opacity-0"
        aria-hidden="true"
      />

      {/* 2. 스티키 탭 바 컨테이너 (기본 상태: 풍부한 정보 카드 뷰 / 스크롤 시: 초슬림 1줄 인라인 뷰) */}
      <div
        className={`sticky top-0 z-40 w-full select-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl rounded-b-none border-t border-x border-b-0 border-slate-200/90 dark:border-slate-800 shadow-xs transition-all duration-150 ${
          isSticky
            ? 'h-[44px] px-2.5 py-1 flex flex-col justify-center'
            : 'p-3 sm:p-3.5 space-y-2'
        }`}
      >
        {/* 상단 섹션 타이틀: 기본 뷰에서만 노출, 스티키 고정 시 숨김 */}
        {!isSticky && (
          <div className="flex items-center justify-between flex-wrap gap-2 px-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                (시간대별 상세 예보)
              </span>
            </div>
            {badge}
          </div>
        )}

        {/* 탭 목록: 스티키 시 초슬림 1줄 그리드, 기본 상태 시 넉넉한 4개 카드 그리드 */}
        {isSticky ? (
          /* ================= [스티키 뷰: 완벽한 1줄 초슬림 인라인 탭 바 (h-[34px])] ================= */
          <div
            className={`grid gap-1 sm:gap-1.5 h-[34px] items-center ${
              slots.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
            }`}
          >
            {slots.map((slot) => {
              const item = timeSlots[slot];
              if (!item) return null;
              const isSelected = selectedSlot === slot;
              const meta = slotMeta[slot];

              const hasApparent = typeof item.apparentTemperature === 'number' && !isNaN(item.apparentTemperature);
              const displayApparent = hasApparent ? item.apparentTemperature : item.temperature;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 h-[32px] px-1 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer truncate ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs dark:bg-blue-600 ring-2 ring-slate-900/10 dark:ring-blue-500/20'
                      : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80'
                  }`}
                  title={`${meta.label} (${meta.sub}): 체감 ${displayApparent}°C (기온 ${item.temperature}°C)`}
                >
                  <WeatherIcon
                    weatherCode={item.weatherCode}
                    isDay={slot === '19:00' ? false : slot === '08:00' || slot === '13:00' ? true : undefined}
                    size={14}
                    className="shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold">{meta.label}</span>
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight">{displayApparent}°</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* ================= [기본 상태 뷰: 정보가 한눈에 다 보이는 넉넉한 카드 그리드] ================= */
          <div
            className={`grid gap-2 sm:gap-2.5 ${
              slots.length === 3 ? 'grid-cols-3' : 'grid-cols-2 xs:grid-cols-4 sm:grid-cols-4'
            }`}
          >
            {slots.map((slot) => {
              const item = timeSlots[slot];
              if (!item) return null;
              const isSelected = selectedSlot === slot;
              const meta = slotMeta[slot];

              const hasApparent = typeof item.apparentTemperature === 'number' && !isNaN(item.apparentTemperature);
              const displayApparent = hasApparent ? item.apparentTemperature : item.temperature;
              const isDiff = hasApparent && item.apparentTemperature !== item.temperature;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`relative p-2 sm:p-2.5 rounded-xl border text-center transition-all active:scale-98 touch-manipulation cursor-pointer flex flex-col items-center justify-between min-h-[92px] ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 shadow-xs ring-1 ring-blue-400/40'
                      : 'bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{meta.label}</span>
                    <span className="text-[10px] opacity-75">({meta.sub})</span>
                  </div>

                  {/* 날씨 아이콘 & 체감 기온 (크게 표시) */}
                  <div className="flex items-center justify-center gap-1.5 my-1">
                    <WeatherIcon
                      weatherCode={item.weatherCode}
                      isDay={slot === '19:00' ? false : slot === '08:00' || slot === '13:00' ? true : undefined}
                      size={24}
                      className="shrink-0"
                    />
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white" title={`체감 ${displayApparent}°C`}>
                      {displayApparent}°
                    </span>
                  </div>

                  {/* 실제 기온 (작게 표시) 및 날씨 요약 */}
                  <div className="text-[10px] sm:text-[11px] font-medium opacity-80 leading-tight text-slate-600 dark:text-slate-300">
                    <span>{isDiff ? `실제 ${item.temperature}°` : `기온 ${item.temperature}°`}</span>
                    <span className="hidden xs:inline mx-0.5">•</span>
                    <span className="hidden xs:inline">{item.weatherLabel}</span>
                  </div>

                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
