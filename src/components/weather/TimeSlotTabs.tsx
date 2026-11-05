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
  const fullCardRef = useRef<HTMLDivElement>(null);
  const [isDocked, setIsDocked] = useState(false);
  const [isGaugeDocked, setIsGaugeDocked] = useState(false);

  // 인플로우(In-Flow) 풀 카드의 높이는 절대 변경하지 않아 문서 높이 변화(CLS) 및 스크롤 바운스 0% 보장
  useEffect(() => {
    let ticking = false;

    const checkScroll = () => {
      if (!fullCardRef.current) return;
      const rect = fullCardRef.current.getBoundingClientRect();
      // 풀 카드의 하단이 상단 고정 슬림 바 높이(44px) 부근에 도달하면 슬림 고정 바로 자연스럽게 배턴 터치
      const shouldDock = rect.bottom <= 52;
      setIsDocked((prev) => (prev !== shouldDock ? shouldDock : prev));
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

    const handleGaugeDock = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsGaugeDocked(Boolean(customEvent.detail));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    window.addEventListener('ondofit:gauge-dock', handleGaugeDock);
    checkScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('ondofit:gauge-dock', handleGaugeDock);
    };
  }, []);

  return (
    <>
      {/* 1. 기본 상태 인플로우(In-Flow) 카드: 항상 원래 높이를 그대로 유지하여 천천히 스크롤해도 바운스 0% */}
      <div
        ref={fullCardRef}
        className={`w-full select-none bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-3 sm:p-3.5 space-y-2.5 transition-opacity duration-150 ${
          isDocked ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
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
      </div>

      {/* 2. 상단 고정 슬림 1줄 바 (Out-of-Flow Fixed: 문서 높이에 영향을 주지 않아 바운스 원천 차단) */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-150 ${
          isDocked
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!isDocked}
      >
        <div className="max-w-2xl w-full mx-auto px-4">
          <div
            className={`w-full select-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-[44px] px-2.5 py-1 flex flex-col justify-center border-slate-200/90 dark:border-slate-800 ${
              isDocked ? 'pointer-events-auto' : 'pointer-events-none'
            } ${
              isGaugeDocked
                ? 'rounded-t-2xl rounded-b-none border-t border-x border-b-0 shadow-none'
                : 'rounded-b-2xl border-x border-b shadow-sm'
            }`}
          >
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
          </div>
        </div>
      </div>
    </>
  );
};
