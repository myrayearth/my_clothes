import React from 'react';
import { ProcessedWeatherData, TargetTimeSlot } from '@/types/weather';
import { AnimatedWeatherIcon } from '@/components/AnimatedWeatherIcon';
import {
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Thermometer,
  Minus,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';

interface WeatherOverviewProps {
  weather: ProcessedWeatherData;
  isLoading?: boolean;
  selectedSlot?: TargetTimeSlot;
  onSelectCurrent?: () => void;
  isActive?: boolean;
  isReturnMode?: boolean;
  // 수동 복장 점검 통합 props
  isManual?: boolean;
  manualTemp?: number;
  onManualTempChange?: (temp: number) => void;
  onToggleMode?: (mode: 'live' | 'manual') => void;
}

const PRESET_TEMPS = [-10, 0, 10, 15, 22, 28];

/**
 * 수동 설정 온도에 따른 적정 가상 날씨 코드 매핑
 */
const getVirtualWeatherCodeByTemp = (temp: number): number => {
  if (temp >= 28) return 0; // 맑음 / 태양 (무더위)
  if (temp >= 20) return 1; // 약간 흐림 (초여름/따뜻)
  if (temp >= 10) return 3; // 흐림 (선선한 환절기)
  if (temp >= 0) return 45; // 안개 (쌀쌀한 초겨울)
  return 71; // 눈 (영하 혹한기)
};

export const WeatherOverview: React.FC<WeatherOverviewProps> = ({
  weather,
  isLoading = false,
  selectedSlot,
  onSelectCurrent,
  isActive,
  isReturnMode = false,
  isManual = false,
  manualTemp = 15,
  onManualTempChange,
  onToggleMode,
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
  const shouldShowReturnGuide = !isManual && (isReturnMode || (!isCurrentActive && !!onSelectCurrent));

  // 체감 기온 기준 우선 (산출 불가 시 실제 기온으로 폴백)
  const hasApparent = typeof weather.currentApparentTemp === 'number' && !isNaN(weather.currentApparentTemp);
  const displayApparent = hasApparent ? weather.currentApparentTemp : weather.currentTemp;
  const isDiff = hasApparent && weather.currentApparentTemp !== weather.currentTemp;

  // 수동 모드 조절 핸들러
  const handleStep = (step: number) => {
    if (!onManualTempChange) return;
    const next = Math.max(-20, Math.min(35, manualTemp + step));
    onManualTempChange(next);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onManualTempChange) return;
    const next = parseInt(e.target.value, 10);
    if (!isNaN(next)) {
      onManualTempChange(Math.max(-20, Math.min(35, next)));
    }
  };

  return (
    <div
      onClick={!isManual && shouldShowReturnGuide ? onSelectCurrent : undefined}
      role={!isManual && shouldShowReturnGuide ? 'button' : undefined}
      tabIndex={!isManual && shouldShowReturnGuide ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isManual && shouldShowReturnGuide && onSelectCurrent && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelectCurrent();
        }
      }}
      className={`w-full rounded-2xl p-4 sm:p-5 border transition-all duration-200 select-none flex flex-col justify-between relative group ${
        !isManual && shouldShowReturnGuide ? 'cursor-pointer' : ''
      } ${
        isManual
          ? 'bg-gradient-to-br from-brand-50/80 via-white to-sky-50/50 border-brand-300 ring-2 ring-brand-400/20 shadow-md'
          : isCurrentActive
          ? 'bg-gradient-to-br from-blue-50/80 via-white to-sky-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-md'
          : shouldShowReturnGuide
          ? 'bg-gradient-to-br from-white to-blue-50/30 border-slate-200/90 hover:border-blue-400 hover:ring-2 hover:ring-blue-400/25 hover:shadow-md'
          : 'bg-gradient-to-br from-white to-slate-50/80 border-slate-200/80 shadow-2xs'
      }`}
    >
      <div>
        {/* 상단 뱃지 및 모드 전환 토글 세그먼트 */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isManual ? (
              <span className="text-xs font-bold text-brand-700 bg-brand-100/90 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1 shadow-2xs">
                <Thermometer className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                <span>수동 복장 점검</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                <span>실시간 체감</span>
              </span>
            )}

            {!isManual && isCurrentActive ? (
              <span className="text-[11px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-in fade-in">
                <CheckCircle2 className="w-3 h-3" />
                <span>실시간 추천 활성</span>
              </span>
            ) : !isManual && shouldShowReturnGuide ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded-full border border-blue-200 transition-colors flex items-center gap-1 shadow-2xs">
                <RotateCcw className="w-3 h-3" />
                <span>클릭 시 오늘 날씨로 복귀</span>
              </span>
            ) : null}
          </div>

          {/* 1. 토글 버튼: [실시간 / 수동설정] 세그먼트 컨트롤 */}
          {onToggleMode && (
            <div
              className="flex items-center bg-slate-200/70 p-0.5 rounded-xl border border-slate-300/80 shadow-2xs shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onToggleMode('live')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  !isManual
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Open-Meteo 실시간 관측 날씨 기준으로 추천"
              >
                실시간
              </button>
              <button
                type="button"
                onClick={() => onToggleMode('manual')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isManual
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="임의의 체감 기온(-20°C ~ +35°C)을 직접 설정하여 복장 점검"
              >
                수동설정
              </button>
            </div>
          )}
        </div>

        {/* 메인 기온 인터페이스: [실시간] vs [수동설정] 분기 */}
        {!isManual ? (
          /* ================= [실시간 모드 뷰] ================= */
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight"
                  title={`체감 기온 ${displayApparent}°C`}
                >
                  {displayApparent}°
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {isDiff ? `실제 ${weather.currentTemp}°` : `기온 ${weather.currentTemp}°`}
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1">
                {weather.currentWeatherLabel}
              </p>
            </div>

            <div className="flex flex-col items-center shrink-0 ml-2">
              <div className="p-1 sm:p-2 bg-gradient-to-br from-amber-50/80 via-white to-sky-50/60 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center">
                <AnimatedWeatherIcon
                  weatherCode={weather.currentWeatherCode}
                  size={64}
                  className="drop-shadow-xs"
                />
              </div>
            </div>
          </div>
        ) : (
          /* ================= [수동 설정 모드 뷰] ================= */
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              {/* 기온 표시 및 스텝퍼 버튼 */}
              <div className="flex items-center gap-3">
                <div className="flex items-baseline select-none">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-brand-950">
                    {manualTemp}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-700 ml-1">
                    °C
                  </span>
                </div>

                {/* 1°C 증감 버튼 */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    disabled={manualTemp <= -20}
                    className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
                    title="1°C 내리기"
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    disabled={manualTemp >= 35}
                    className="p-1.5 sm:p-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
                    title="1°C 올리기"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* 가상 날씨 아이콘 */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="p-1.5 sm:p-2 bg-brand-50/90 rounded-2xl border border-brand-200/90 shadow-xs ring-1 ring-brand-300/40 flex items-center justify-center"
                  title={`설정 기온(${manualTemp}°C) 가상 날씨`}
                >
                  <AnimatedWeatherIcon
                    weatherCode={getVirtualWeatherCodeByTemp(manualTemp)}
                    isDay={true}
                    size={48}
                    className="animate-pulse"
                  />
                </div>
              </div>
            </div>

            {/* 인라인 온도 슬라이더 (-20°C ~ +35°C) */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                <span className="text-blue-600">-20°C (혹한)</span>
                <span className="text-slate-400">직접 슬라이더로 조절</span>
                <span className="text-rose-600">+35°C (폭염)</span>
              </div>
              <input
                type="range"
                min={-20}
                max={35}
                step={1}
                value={manualTemp}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            {/* 빠른 프리셋 기온 칩 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-slate-400 font-medium mr-0.5">빠른 선택:</span>
              {PRESET_TEMPS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onManualTempChange && onManualTempChange(preset)}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                    manualTemp === preset
                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {preset}°C
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 최고 / 최저 기온 (실시간 모드 시) 혹은 실시간 날씨 기온 비교 안내 (수동 모드 시) */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
        {!isManual ? (
          <>
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
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-[11px] text-slate-500">
            <span>
              현재 실제 관측 체감: <strong className="text-slate-700 font-semibold">{displayApparent}°C</strong>
              {displayApparent !== manualTemp && (
                <span className="text-brand-600 font-bold ml-1">
                  ({manualTemp - displayApparent > 0 ? `+${manualTemp - displayApparent}` : manualTemp - displayApparent}°C 차이)
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onToggleMode && onToggleMode('live')}
              className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
            >
              실시간 날씨로 복귀
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
