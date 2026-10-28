'use client';

import React from 'react';
import { Sliders, ChevronUp, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';

interface ManualTempCheckerProps {
  temperature: number;
  onChangeTemp: (temp: number) => void;
  isActive: boolean;
  onActivate: () => void;
  defaultTemp?: number;
}

const PRESET_TEMPS = [-10, 0, 10, 15, 22, 28];

export const ManualTempChecker: React.FC<ManualTempCheckerProps> = ({
  temperature,
  onChangeTemp,
  isActive,
  onActivate,
  defaultTemp = 15,
}) => {
  const handleStep = (step: number) => {
    const next = Math.max(-40, Math.min(50, temperature + step));
    onChangeTemp(next);
    if (!isActive) {
      onActivate();
    }
  };

  const handlePresetClick = (preset: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeTemp(preset);
    if (!isActive) {
      onActivate();
    }
  };

  return (
    <div
      onClick={!isActive ? onActivate : undefined}
      role={!isActive ? 'button' : undefined}
      tabIndex={!isActive ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isActive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onActivate();
        }
      }}
      className={`w-full rounded-2xl p-4 sm:p-5 border transition-all duration-200 select-none flex flex-col justify-between ${
        !isActive ? 'cursor-pointer hover:border-indigo-300 hover:shadow-xs' : ''
      } ${
        isActive
          ? 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
          : 'bg-gradient-to-br from-white to-slate-50/80 border-slate-200/80 shadow-2xs'
      }`}
      title={!isActive ? '클릭하여 수동 기온 점검 모드 활성화' : undefined}
    >
      <div>
        {/* 상단 라벨 및 활성화 뱃지 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              수동 복장 점검
            </span>
          </div>

          <div>
            {isActive ? (
              <span className="text-[11px] font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-in fade-in">
                <CheckCircle2 className="w-3 h-3" />
                <span>수동 점검 활성</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 transition-colors flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>클릭하여 활성화</span>
              </span>
            )}
          </div>
        </div>

        {/* 온도 조절 메인 인터페이스 (숫자 표시 - 직접 입력 불가 & ▲/▼ 1°C 증감 버튼) */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="flex items-baseline select-none">
            <span
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                isActive ? 'text-indigo-950' : 'text-slate-800'
              }`}
            >
              {temperature}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-700 ml-1">
              °C
            </span>
          </div>

          {/* 1°C 증감 버튼 (화살표 아이콘으로만 기온 변경 가능) */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleStep(1)}
              className="p-2 sm:p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all active:scale-90 shadow-2xs hover:shadow-xs flex items-center justify-center cursor-pointer"
              title="1°C 올리기 (▲)"
            >
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="p-2 sm:p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all active:scale-90 shadow-2xs hover:shadow-xs flex items-center justify-center cursor-pointer"
              title="1°C 내리기 (▼)"
            >
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-1">
          {isActive
            ? '화살표를 눌러 기온을 조절하면 대표 추천 복장과 보온 지수가 실시간 갱신됩니다.'
            : '클릭하여 원하는 기온에서의 코디와 보온 적정성을 테스트하세요.'}
        </p>
      </div>

      {/* 하단 퀵 프리셋 버튼 */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] text-slate-400 font-semibold">빠른 온도:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {PRESET_TEMPS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => handlePresetClick(t, e)}
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border transition-all active:scale-95 ${
                temperature === t && isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border-slate-200'
              }`}
            >
              {t}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
