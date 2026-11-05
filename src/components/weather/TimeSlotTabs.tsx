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
  isGaugeDocked?: boolean;
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
  isGaugeDocked = false,
}) => {
  const slots: TargetTimeSlot[] = visibleSlots;
  const containerRef = useRef<HTMLDivElement>(null);
  const docTopRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 (풀 뷰) ~ 1 (슬림 1줄 스티키 뷰)

  useEffect(() => {
    const updateDocTop = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (docTopRef.current === null || scrollY < docTopRef.current - 50) {
          docTopRef.current = rect.top + scrollY;
        }
      }
    };

    updateDocTop();

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (docTopRef.current === null) {
        updateDocTop();
      }
      const docTop = docTopRef.current ?? 0;
      const TRANSITION_RANGE = 70; // 상단 도달 직전 70px에 걸쳐 부드럽게 축소

      const start = Math.max(0, docTop - TRANSITION_RANGE);
      if (scrollY <= start) {
        setScrollProgress(0);
      } else if (scrollY >= docTop) {
        setScrollProgress(1);
      } else {
        setScrollProgress((scrollY - start) / TRANSITION_RANGE);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      docTopRef.current = null;
      updateDocTop();
      handleScroll();
    });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isCompact = scrollProgress >= 0.95;

  return (
    <div
      ref={containerRef}
      className={`sticky top-0 z-40 w-full transition-all duration-150 select-none bg-white/98 dark:bg-slate-900/98 backdrop-blur-md ${
        isCompact
          ? `h-[44px] px-2.5 py-1 flex flex-col justify-center ${
              isGaugeDocked
                ? 'rounded-t-2xl rounded-b-none border-t border-x border-b border-slate-200/90 dark:border-slate-800 shadow-none'
                : 'rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm'
            }`
          : 'rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3 sm:p-3.5 space-y-2'
      }`}
    >
      {/* 상단 타이틀 바: 스크롤 진행도에 맞춰 서서히 페이드아웃 및 축소 */}
      <div
        style={{
          maxHeight: `${Math.max(0, (1 - scrollProgress) * 36)}px`,
          opacity: Math.max(0, 1 - scrollProgress * 1.4),
          marginBottom: `${(1 - scrollProgress) * 8}px`,
          overflow: 'hidden',
        }}
        className="flex items-center justify-between flex-wrap gap-2 transition-[max-height,opacity,margin] duration-75"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <span className="text-[11px] text-slate-400 font-normal">
            (탭 선택)
          </span>
        </div>
        {badge}
      </div>

      {/* 탭 그리드: 스크롤 축소 완료 시 h-[34px] 초슬림 1줄 인라인 뷰, 기본 시 넉넉한 카드 뷰 */}
      {isCompact ? (
        /* ================= [스티키 뷰: 완벽한 1줄 초슬림 인라인 탭 바] ================= */
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
        /* ================= [기본 뷰: 넉넉한 높이의 카드 그리드] ================= */
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
                className={`relative p-2 sm:p-2.5 rounded-xl border text-center transition-all active:scale-98 touch-manipulation cursor-pointer flex flex-col items-center justify-between ${
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
                  <span className="text-lg sm:text-xl font-bold tracking-tight" title={`체감 ${displayApparent}°C`}>
                    {displayApparent}°
                  </span>
                </div>

                {/* 실제 기온 (작게 표시) 및 날씨 요약 */}
                <div className="text-[10px] sm:text-[11px] font-medium opacity-80 leading-tight">
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
  );
};
