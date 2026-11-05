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
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const handleScroll = () => {
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        setIsSticky(rect.top <= 2);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top <= 2);
      },
      {
        threshold: [0, 1],
        rootMargin: '0px 0px 0px 0px',
      }
    );

    observer.observe(sentinel);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* 스티키 전환 감지용 센티널 (크기 변형 없는 고정 위치 기준점) */}
      <div ref={sentinelRef} className="h-0 w-full pointer-events-none" />
      <div
        ref={containerRef}
        className={`sticky top-0 z-40 w-full transition-all duration-200 select-none ${
          isSticky
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-sm py-1.5 px-2.5 rounded-2xl'
            : 'relative'
        }`}
      >
      {/* 기본 뷰(스크롤 전) 상단 타이틀 바: 스티키 시 숨김 */}
      {!isSticky && (
        <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
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
      )}

      {/* 탭 그리드: 스티키 시 h-10 초슬림 1줄 인라인 뷰, 기본 시 넉넉한 카드 뷰 */}
      {isSticky ? (
        /* ================= [스티키 뷰: 완벽한 1줄 초슬림 인라인 탭 바] ================= */
        <div
          className={`grid gap-1 sm:gap-1.5 h-9 sm:h-10 items-center ${
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
                className={`flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer truncate ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-blue-600 ring-2 ring-slate-900/10 dark:ring-blue-500/20'
                    : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80'
                }`}
                title={`${meta.label} (${meta.sub}): 체감 ${displayApparent}°C (기온 ${item.temperature}°C)`}
              >
                <WeatherIcon
                  weatherCode={item.weatherCode}
                  isDay={slot === '19:00' ? false : slot === '08:00' || slot === '13:00' ? true : undefined}
                  size={15}
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
                className={`flex flex-col items-center justify-between min-h-[92px] p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 text-center relative touch-manipulation select-none active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                {/* 상단 라벨 */}
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold opacity-90 w-full">
                  {meta.icon}
                  <span>
                    {meta.label} ({meta.sub})
                  </span>
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
    </>
  );
};
