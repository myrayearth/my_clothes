import React from 'react';
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
}) => {
  const slots: TargetTimeSlot[] = visibleSlots;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* 1. 상단 섹션 타이틀 (스크롤 시 자연스럽게 위로 이동하여 퇴장) */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
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

      {/* 2. 초슬림 1줄 인라인 탭 바 (하드웨어 가속 sticky top-0 고정, 레이아웃 점프 0) */}
      <div
        className="sticky top-0 z-40 w-full select-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl rounded-b-none border-t border-x border-b-0 border-slate-200/90 dark:border-slate-800 shadow-xs h-[44px] px-2.5 py-1 flex flex-col justify-center"
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
  );
};
