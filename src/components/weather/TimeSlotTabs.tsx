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
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <h3 className="text-sm font-bold text-slate-800">
            {title}
          </h3>
          <span className="text-[11px] text-slate-400 font-normal">
            (탭 선택)
          </span>
        </div>
        {badge}
      </div>

      <div className={`grid gap-2 sm:gap-2.5 ${
        slots.length === 3 ? 'grid-cols-3' : 'grid-cols-2 xs:grid-cols-4 sm:grid-cols-4'
      }`}>
        {slots.map((slot) => {
          const item = timeSlots[slot];
          if (!item) return null;
          const isSelected = selectedSlot === slot;
          const meta = slotMeta[slot];

          // 체감 기온 기준 우선 (산출 불가 시 실제 기온으로 폴백)
          const hasApparent = typeof item.apparentTemperature === 'number' && !isNaN(item.apparentTemperature);
          const displayApparent = hasApparent ? item.apparentTemperature : item.temperature;
          const isDiff = hasApparent && item.apparentTemperature !== item.temperature;

          return (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={`flex flex-col items-center justify-between min-h-[92px] p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 text-center relative touch-manipulation select-none active:scale-95 ${
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
    </div>
  );
};