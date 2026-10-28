import React from 'react';
import { DailyForecastItem } from '@/types/weather';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { CalendarDays } from 'lucide-react';

interface DailyForecastProps {
  forecasts: DailyForecastItem[];
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ forecasts }) => {
  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-1.5 mb-3.5">
        <CalendarDays className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-800">7일간 주간 예보</h3>
      </div>

      {/* 가로 스크롤 가능한 일간 날씨 카드 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
        {forecasts.map((day, idx) => {
          const isToday = idx === 0;

          return (
            <div
              key={day.date}
              className={`flex flex-col items-center justify-between min-w-[76px] p-3 rounded-xl border text-center transition-all ${
                isToday
                  ? 'bg-blue-50/60 border-blue-200 font-semibold'
                  : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/60'
              }`}
            >
              <span
                className={`text-xs ${
                  isToday ? 'text-blue-700 font-bold' : 'text-slate-600'
                }`}
              >
                {day.dayName}
              </span>

              <div className="my-2.5">
                <WeatherIcon weatherCode={day.weatherCode} className="w-6 h-6 mx-auto" />
              </div>

              <div className="text-[11px] text-slate-500 truncate w-full mb-1">
                {day.weatherLabel}
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="font-bold text-slate-800">{day.tempMax}°</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-500">{day.tempMin}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
