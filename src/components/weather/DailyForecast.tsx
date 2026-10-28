'use client';

import React from 'react';
import { DailyForecastItem } from '@/types/weather';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { Check } from 'lucide-react';

interface DailyForecastProps {
  forecasts: DailyForecastItem[];
  selectedDate?: string | null;
  onSelectDate?: (date: string, item: DailyForecastItem) => void;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  forecasts,
  selectedDate,
  onSelectDate,
}) => {
  // 내일부터 6일간(D+1 ~ D+6, 총 6개 카드) 렌더링
  const displayForecasts = forecasts.slice(0, 6);

  return (
    <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs">
      {/* 내일부터 6일간 예보 가로 스크롤 카드 행 (섹션 타이틀 없이 일체화) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
        {displayForecasts.map((day) => {
          const isSelected = selectedDate === day.date;
          // dateStr 'YYYY-MM-DD'에서 'DD일' 추출
          const dayNumber = day.date ? parseInt(day.date.split('-')[2], 10) : null;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate?.(day.date, day)}
              className={`flex flex-col items-center justify-between min-w-[76px] sm:min-w-[82px] py-2.5 px-2 rounded-xl border text-center transition-all duration-150 touch-manipulation select-none active:scale-95 cursor-pointer relative shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/25'
                  : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80 text-slate-700 hover:border-slate-300'
              }`}
              title={`${day.dayName} 날씨 기준 복장 추천 보기`}
            >
              {/* 요일 및 일자(DD일) */}
              <div className="flex flex-col items-center">
                <span
                  className={`text-[11px] font-bold ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {day.dayName}
                </span>
                {dayNumber && (
                  <span
                    className={`text-[9px] ${
                      isSelected ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {dayNumber}일
                  </span>
                )}
              </div>

              {/* 날씨 아이콘 */}
              <div className="my-1.5">
                <WeatherIcon weatherCode={day.weatherCode} className="w-6 h-6 mx-auto" />
              </div>

              {/* 날씨 요약 텍스트 */}
              <div
                className={`text-[10px] truncate w-full mb-1 ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {day.weatherLabel}
              </div>

              {/* 최고 / 최저 기온 */}
              <div className="flex items-center justify-center gap-1 text-xs font-bold leading-none">
                <span className={isSelected ? 'text-white' : 'text-slate-900'}>
                  {day.tempMax}°
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>
                  /
                </span>
                <span className={`text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {day.tempMin}°
                </span>
              </div>

              {/* 활성화 상태 인디케이터 뱃지 */}
              {isSelected && (
                <div className="mt-1.5 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                  <Check className="w-2.5 h-2.5" />
                  <span>선택됨</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
