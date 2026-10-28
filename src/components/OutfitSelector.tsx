'use client';

import React from 'react';
import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';
import { getOutfitRuleByTemperature, getDefaultOutfitSelection } from '@/lib/outfit';
import { Shirt, RotateCcw, Check, Layers, Plus } from 'lucide-react';

interface OutfitSelectorProps {
  temperature: number;
  timeSlotLabel: string;
  selection: OutfitSelection;
  onChangeSelection: (newSelection: OutfitSelection) => void;
}

export const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  temperature,
  timeSlotLabel,
  selection,
  onChangeSelection,
}) => {
  const currentRule: OutfitRuleStep = getOutfitRuleByTemperature(temperature);

  const handleResetToDefault = () => {
    onChangeSelection(getDefaultOutfitSelection(currentRule));
  };

  const handleOuterChange = (outerItem: string) => {
    onChangeSelection({
      ...selection,
      outer: outerItem,
    });
  };

  const handleTopChange = (topItem: string) => {
    onChangeSelection({
      ...selection,
      top: topItem,
    });
  };

  const handleBottomChange = (bottomItem: string) => {
    onChangeSelection({
      ...selection,
      bottom: bottomItem,
    });
  };

  const handleItemToggle = (item: string) => {
    const isSelected = selection.items.includes(item);
    const newItems = isSelected
      ? selection.items.filter((i) => i !== item)
      : [...selection.items, item];

    onChangeSelection({
      ...selection,
      items: newItems,
    });
  };

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 sm:space-y-5">
      {/* 헤더: 추천 룰셋 단계 및 가이드 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 bg-blue-100/70 text-blue-700 rounded-lg shrink-0">
              <Shirt className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {timeSlotLabel} 맞춤 복장 제안
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
              {temperature}°C
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <strong className="text-blue-600 font-semibold">{currentRule.step}단계 ({currentRule.tempRange})</strong> : {currentRule.description}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="self-start sm:self-center flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg font-medium transition-all active:scale-95 touch-manipulation"
          title="이 시간대 추천 기본값으로 복원"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>추천값 리셋</span>
        </button>
      </div>

      {/* 복장 선택 섹션 목록 */}
      <div className="space-y-4">
        {/* 1. OUTER (외투 - 단일 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>OUTER (외투)</span>
              <span className="text-[10px] text-slate-400 font-normal">단일 선택</span>
            </label>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[160px]">
              선택: {selection.outer}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {currentRule.options.outer.map((opt) => {
              const isSelected = selection.outer === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOuterChange(opt)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TOP (상의 - 단일 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>TOP (상의)</span>
              <span className="text-[10px] text-slate-400 font-normal">단일 선택</span>
            </label>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[160px]">
              선택: {selection.top}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {currentRule.options.top.map((opt) => {
              const isSelected = selection.top === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleTopChange(opt)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. BOTTOM (하의 - 단일 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>BOTTOM (하의)</span>
              <span className="text-[10px] text-slate-400 font-normal">단일 선택</span>
            </label>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[160px]">
              선택: {selection.bottom}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {currentRule.options.bottom.map((opt) => {
              const isSelected = selection.bottom === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleBottomChange(opt)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. ITEM (소품/기타 - 다중 토글 칩) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>ITEM (소품 및 방한/냉방 아이템)</span>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 font-medium px-1.5 py-0.2 rounded">
                다중 선택
              </span>
            </label>
            <span className="text-xs text-slate-400">
              {selection.items.length > 0 ? `${selection.items.length}개 선택` : '선택 없음'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {currentRule.options.items.map((opt) => {
              const isSelected = selection.items.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleItemToggle(opt)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 flex items-center gap-1.5 active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 요약 스트립 (현재 내가 완성한 착장 조합) */}
      <div className="pt-3 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3.5 sm:p-4 rounded-b-2xl">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>오늘의 최종 결정 코디</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold shadow-2xs">
            외투: {selection.outer}
          </span>
          <span className="text-slate-300">+</span>
          <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold shadow-2xs">
            상의: {selection.top}
          </span>
          <span className="text-slate-300">+</span>
          <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold shadow-2xs">
            하의: {selection.bottom}
          </span>
          {selection.items.length > 0 && (
            <>
              <span className="text-slate-300">+</span>
              <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg text-indigo-700 font-semibold shadow-2xs">
                소품: {selection.items.join(', ')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
