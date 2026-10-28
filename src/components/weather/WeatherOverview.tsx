import React from 'react';
import { ProcessedWeatherData } from '@/types/weather';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface WeatherOverviewProps {
  weather: ProcessedWeatherData;
  isLoading?: boolean;
}

export const WeatherOverview: React.FC<WeatherOverviewProps> = ({ weather, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28 mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-12 bg-slate-200 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-36"></div>
          </div>
          <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-white to-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            실시간 현재 기온
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-black text-slate-900 tracking-tight">
              {weather.currentTemp}°
            </span>
            <span className="text-sm font-medium text-slate-500">
              체감 {weather.currentApparentTemp}°
            </span>
          </div>

          <p className="text-base font-semibold text-slate-700 mt-1">
            {weather.currentWeatherLabel}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/80 shadow-xs">
            <WeatherIcon weatherCode={weather.currentWeatherCode} className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* 최고 / 최저 기온 */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
            최고 <strong className="text-slate-800">{weather.todayMax}°</strong>
          </span>
          <span className="flex items-center gap-1">
            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
            최저 <strong className="text-slate-800">{weather.todayMin}°</strong>
          </span>
        </div>
        <span className="text-xs text-slate-400">
          일교차 {weather.todayMax - weather.todayMin}°C
        </span>
      </div>
    </div>
  );
};
