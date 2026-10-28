import React from 'react';
import { TargetTimeSlot, TimeSlotWeatherItem } from '@/types/weather';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { Clock, Briefcase, Sun, Home } from 'lucide-react';

interface TimeSlotTabsProps {
  timeSlots: Record<TargetTimeSlot, TimeSlotWeatherItem>;
  selectedSlot: TargetTimeSlot;
  onSelectSlot: (slot: TargetTimeSlot) => void;
}

const slotMeta: Record<
  TargetTimeSlot,
  { label: string; icon: React.ReactNode; sub: string }
> = {
  '08:00': {
    label: '08시',
    sub: '출근/등교',
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  '13:00': {
    label: '13시',
    sub: '낮 활동',
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  '19:00': {
    label: '19시',
    sub: '퇴근/귀가',
    icon: <Home className="w-3.5 h-3.5" />,
  },
};

export const TimeSlotTabs: React.FC<TimeSlotTabsProps> = ({
  timeSlots,
  selectedSlot,
  onSelectSlot,
}) => {
  const slots: TargetTimeSlot[] = ['08:00', '13:00', '19:00'];

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
        <h3 className="text-sm font-bold text-slate-800">
          시간대별 예보 및 복장 기준
        </h3>
        <span className="text-[11px] text-slate-400 font-normal">
          (탭 선택)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {slots.map((slot) => {
          const item = timeSlots[slot];
          const isSelected = selectedSlot === slot;
          const meta = slotMeta[slot];

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
                <span>{meta.label}</span>
                <span
                  className={`hidden sm:inline-block text-[10px] px-1 rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {meta.sub}
                </span>
              </div>

              {/* 날씨 아이콘 & 기온 */}
              <div className="flex items-center justify-center gap-1 my-1">
                <WeatherIcon weatherCode={item.weatherCode} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-lg sm:text-xl font-bold tracking-tight">
                  {item.temperature}°
                </span>
              </div>

              {/* 체감온도 및 날씨 요약 */}
              <div className="text-[10px] sm:text-[11px] font-medium opacity-80 leading-tight">
                <span>체감 {item.apparentTemperature}°</span>
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
