'use client';

import React, { useState } from 'react';
import { OutfitRuleStep, OutfitSelection, OutfitCategory } from '@/types/outfit';
import { getOutfitRuleByTemperature, getDefaultOutfitSelection } from '@/lib/outfit';
import { AllItemsModal } from '@/components/outfit/AllItemsModal';
import { Shirt, RotateCcw, Check, Layers, Plus, ExternalLink } from 'lucide-react';

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

  // [모든 항목 보기] 모달 상태 관리
  const [modalCategory, setModalCategory] = useState<OutfitCategory | null>(null);

  const handleResetToDefault = () => {
    onChangeSelection(getDefaultOutfitSelection(currentRule));
  };

  // OUTER 단일 선택 변경
  const handleOuterSelect = (outerItem: string) => {
    onChangeSelection({
      ...selection,
      outer: outerItem,
    });
  };

  /**
   * 다중 선택 카드의 전체/이름(텍스트) 영역 클릭 핸들러
   * 1. 현재 0개 선택 상태: 1개 선택됨
   * 2. 현재 1개 선택 상태:
   *    - 다른 카드의 텍스트 클릭: 기존 선택 해제 후 해당 아이템만 단일 선택 (단일 전환)
   *    - 이미 선택된 카드의 텍스트 클릭: 선택 해제 (0개)
   * 3. 현재 2개 이상 선택 상태:
   *    - 미선택 카드 클릭: 다중 선택 추가
   *    - 이미 선택된 카드 클릭: 선택 해제
   */
  const handleMultiSelectCardClick = (
    category: 'top' | 'bottom',
    item: string
  ) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);

    // 1. 현재 0개 선택 상태
    if (currentList.length === 0) {
      onChangeSelection({
        ...selection,
        [category]: [item],
      });
      return;
    }

    // 2. 현재 1개만 선택된 상태
    if (currentList.length === 1) {
      if (isSelected) {
        // 이미 선택된 카드 클릭 시 해제
        onChangeSelection({
          ...selection,
          [category]: [],
        });
      } else {
        // 다른 카드의 텍스트 클릭: 기존 선택 해제하고 해당 아이템만 단일 선택
        onChangeSelection({
          ...selection,
          [category]: [item],
        });
      }
      return;
    }

    // 3. 현재 2개 이상 선택된 상태
    if (isSelected) {
      // 이미 선택된 카드 클릭: 해제
      onChangeSelection({
        ...selection,
        [category]: currentList.filter((x) => x !== item),
      });
    } else {
      // 미선택 카드 클릭: 추가
      onChangeSelection({
        ...selection,
        [category]: [...currentList, item],
      });
    }
  };

  /**
   * 다중 선택 카드의 '+ (아이콘)' 영역 클릭 핸들러
   * 1. 현재 0개 선택 상태: 1개 선택됨
   * 2. 현재 1개 선택 상태:
   *    - 다른 카드의 '+' 아이콘 클릭: 기존 선택 유지 + 해당 아이템 추가 (다중 선택 시작)
   *    - 이미 선택된 카드의 체크 아이콘 클릭: 선택 해제 (0개)
   * 3. 현재 2개 이상 선택 상태:
   *    - 미선택 카드 클릭: 다중 선택 추가
   *    - 이미 선택된 카드 클릭: 선택 해제
   */
  const handleMultiSelectIconClick = (
    category: 'top' | 'bottom',
    item: string
  ) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);

    // 1. 현재 0개 선택 상태
    if (currentList.length === 0) {
      onChangeSelection({
        ...selection,
        [category]: [item],
      });
      return;
    }

    // 2. 현재 1개만 선택된 상태
    if (currentList.length === 1) {
      if (isSelected) {
        // 이미 선택된 카드 클릭 시 해제
        onChangeSelection({
          ...selection,
          [category]: [],
        });
      } else {
        // 다른 카드의 '+' 아이콘 클릭: 기존 선택 유지한 채 추가 (다중 선택 시작)
        onChangeSelection({
          ...selection,
          [category]: [...currentList, item],
        });
      }
      return;
    }

    // 3. 현재 2개 이상 선택된 상태
    if (isSelected) {
      // 이미 선택된 카드 클릭: 해제
      onChangeSelection({
        ...selection,
        [category]: currentList.filter((x) => x !== item),
      });
    } else {
      // 미선택 카드 클릭: 추가
      onChangeSelection({
        ...selection,
        [category]: [...currentList, item],
      });
    }
  };

  // 모달용 단순 토글
  const handleModalToggle = (category: 'top' | 'bottom', item: string) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);
    const nextList = isSelected
      ? currentList.filter((x) => x !== item)
      : [...currentList, item];
    onChangeSelection({
      ...selection,
      [category]: nextList,
    });
  };

  // ITEM 다중 토글
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
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>OUTER (외투)</span>
                <span className="text-[10px] text-slate-400 font-normal">단일 선택</span>
              </label>
              <button
                type="button"
                onClick={() => setModalCategory('outer')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
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
                  onClick={() => handleOuterSelect(opt)}
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

        {/* 2. TOP (상의 - 다중 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>TOP (상의)</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 font-medium px-1.5 py-0.2 rounded">
                  다중 선택
                </span>
              </label>
              <button
                type="button"
                onClick={() => setModalCategory('top')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[180px]">
              선택 ({selection.top.length}): {selection.top.length > 0 ? selection.top.join(' + ') : '선택 없음'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {currentRule.options.top.map((opt) => {
              const isSelected = selection.top.includes(opt);
              return (
                <div
                  key={opt}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMultiSelectCardClick('top', opt)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMultiSelectCardClick('top', opt);
                    }
                  }}
                  className={`group min-h-[38px] pl-1.5 pr-3 py-1 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98] touch-manipulation ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('top', opt);
                    }}
                    title={
                      isSelected
                        ? '선택 해제'
                        : selection.top.length === 1
                        ? '다중 선택으로 추가 (+)'
                        : '선택 추가 (+)'
                    }
                    className={`p-1 rounded-lg transition-colors flex items-center justify-center ${
                      isSelected
                        ? 'hover:bg-white/20 text-blue-400'
                        : 'hover:bg-slate-200/80 text-slate-400 group-hover:text-blue-600'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                  <span className="flex-1 py-0.5">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BOTTOM (하의 - 다중 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>BOTTOM (하의)</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 font-medium px-1.5 py-0.2 rounded">
                  다중 선택
                </span>
              </label>
              <button
                type="button"
                onClick={() => setModalCategory('bottom')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[180px]">
              선택 ({selection.bottom.length}): {selection.bottom.length > 0 ? selection.bottom.join(' + ') : '선택 없음'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {currentRule.options.bottom.map((opt) => {
              const isSelected = selection.bottom.includes(opt);
              return (
                <div
                  key={opt}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMultiSelectCardClick('bottom', opt)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMultiSelectCardClick('bottom', opt);
                    }
                  }}
                  className={`group min-h-[38px] pl-1.5 pr-3 py-1 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98] touch-manipulation ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('bottom', opt);
                    }}
                    title={
                      isSelected
                        ? '선택 해제'
                        : selection.bottom.length === 1
                        ? '다중 선택으로 추가 (+)'
                        : '선택 추가 (+)'
                    }
                    className={`p-1 rounded-lg transition-colors flex items-center justify-center ${
                      isSelected
                        ? 'hover:bg-white/20 text-blue-400'
                        : 'hover:bg-slate-200/80 text-slate-400 group-hover:text-blue-600'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                  <span className="flex-1 py-0.5">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. ITEM (소품/기타 - 다중 토글 칩) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>ITEM (소품 및 방한/냉방 아이템)</span>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 font-medium px-1.5 py-0.2 rounded">
                  다중 선택
                </span>
              </label>
              <button
                type="button"
                onClick={() => setModalCategory('items')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
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
            상의: {selection.top.length > 0 ? selection.top.join(' + ') : '선택 없음'}
          </span>
          <span className="text-slate-300">+</span>
          <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold shadow-2xs">
            하의: {selection.bottom.length > 0 ? selection.bottom.join(' + ') : '선택 없음'}
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

      {/* 전체 아이템 보기 모달 */}
      {modalCategory && (
        <AllItemsModal
          isOpen={Boolean(modalCategory)}
          onClose={() => setModalCategory(null)}
          category={modalCategory}
          categoryTitle={
            modalCategory === 'outer'
              ? '외투(OUTER)'
              : modalCategory === 'top'
              ? '상의(TOP)'
              : modalCategory === 'bottom'
              ? '하의(BOTTOM)'
              : '소품(ITEM)'
          }
          selectedItems={
            modalCategory === 'outer'
              ? [selection.outer]
              : modalCategory === 'top'
              ? selection.top
              : modalCategory === 'bottom'
              ? selection.bottom
              : selection.items
          }
          onToggleItem={(item) => {
            if (modalCategory === 'outer') {
              handleOuterSelect(item);
            } else if (modalCategory === 'top') {
              handleModalToggle('top', item);
            } else if (modalCategory === 'bottom') {
              handleModalToggle('bottom', item);
            } else if (modalCategory === 'items') {
              handleItemToggle(item);
            }
          }}
          isSingleSelect={modalCategory === 'outer'}
        />
      )}
    </div>
  );
};
