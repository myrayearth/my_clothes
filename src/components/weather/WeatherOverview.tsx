import React from 'react';
import { ProcessedWeatherData, TargetTimeSlot } from '@/types/weather';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { ArrowUp, ArrowDown, Sparkles, CheckCircle2 } from 'lucide-react';

interface WeatherOverviewProps {
  weather: ProcessedWeatherData;
  isLoading?: boolean;
  selectedSlot?: TargetTimeSlot;
  onSelectCurrent?: () => void;
  isActive?: boolean;
}

export const WeatherOverview: React.FC<WeatherOverviewProps> = ({
  weather,
  isLoading = false,
  selectedSlot,
  onSelectCurrent,
  isActive,
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28 mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 bg-slate-200 rounded w-20"></div>
            <div className="h-4 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  const isCurrentActive = isActive !== undefined ? isActive : selectedSlot === 'current';

  return (
    <div
      onClick={onSelectCurrent}
      role={onSelectCurrent ? 'button' : undefined}
      tabIndex={onSelectCurrent ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelectCurrent && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelectCurrent();
        }
      }}
      className={`w-full rounded-2xl p-4 sm:p-5 border transition-all duration-200 select-none flex flex-col justify-between ${
        onSelectCurrent ? 'cursor-pointer hover:border-blue-300 hover:shadow-xs' : ''
      } ${
        isCurrentActive
          ? 'bg-gradient-to-br from-blue-50/80 via-white to-sky-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-md'
          : 'bg-gradient-to-br from-white to-slate-50/80 border-slate-200/80 shadow-2xs'
      }`}
      title={onSelectCurrent ? '클릭하여 현재 기온 기준 복장 추천 보기' : undefined}
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                실시간 현재 기온
              </span>
              {isCurrentActive ? (
                <span className="text-[11px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>실시간 추천 활성</span>
                </span>
              ) : onSelectCurrent ? (
                <span className="text-[11px] font-medium text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200 hover:border-blue-200 transition-colors flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>클릭하여 활성화</span>
                </span>
              ) : null}
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {weather.currentTemp}°
              </span>
              <span className="text-sm font-medium text-slate-500">
                체감 {weather.currentApparentTemp}°
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1">
              {weather.currentWeatherLabel}
            </p>
          </div>

          <div className="flex flex-col items-center shrink-0 ml-2">
            <div className="p-2 sm:p-2.5 bg-amber-50/60 rounded-2xl border border-amber-100/80 shadow-xs">
              <WeatherIcon weatherCode={weather.currentWeatherCode} className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
          </div>
        </div>
      </div>

      {/* 최고 / 최저 기온 */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-3 text-slate-600">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
            최고 <strong className="text-slate-800">{weather.todayMax}°</strong>
          </span>
          <span className="flex items-center gap-1">
            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
            최저 <strong className="text-slate-800">{weather.todayMin}°</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          일교차 {weather.todayMax - weather.todayMin}°
        </span>
      </div>
    </div>
  );
};
