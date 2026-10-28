'use client';

import React, { useState, useMemo } from 'react';
import { OutfitRuleStep, OutfitSelection, OutfitCategory } from '@/types/outfit';
import { getOutfitRuleByTemperature, getDefaultOutfitSelection } from '@/lib/outfit';
import {
  TemperatureAggregatedResult,
  getPrioritizedOutfitOptions,
} from '@/lib/recommendation';
import { AllItemsModal } from '@/components/outfit/AllItemsModal';
import { Shirt, RotateCcw, Check, Plus, ExternalLink, Sparkles } from 'lucide-react';

interface OutfitSelectorProps {
  temperature: number;
  timeSlotLabel: string;
  selection: OutfitSelection;
  onChangeSelection: (newSelection: OutfitSelection) => void;
  aggregated?: TemperatureAggregatedResult | null;
}

export const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  temperature,
  timeSlotLabel,
  selection,
  onChangeSelection,
  aggregated,
}) => {
  const currentRule: OutfitRuleStep = getOutfitRuleByTemperature(temperature);

  // [모든 항목 보기] 모달 상태 관리
  const [modalCategory, setModalCategory] = useState<OutfitCategory | null>(null);

  // 기온 룰셋 및 실시간 누적 집계 데이터 결합 우선순위 옵션
  const { options: dynamicOptions, defaults: dynamicDefaults, aggregatedCount } = useMemo(() => {
    return getPrioritizedOutfitOptions(currentRule, aggregated || null);
  }, [currentRule, aggregated]);

  const handleResetToDefault = () => {
    onChangeSelection(dynamicDefaults);
  };

  // OUTER 단일 선택 변경 (클릭 시 선택, 이미 선택된 외투 클릭 시 '없음'으로 선택 해제 토글)
  const handleOuterSelect = (outerItem: string) => {
    const nextOuter = selection.outer === outerItem ? '없음' : outerItem;
    onChangeSelection({
      ...selection,
      outer: nextOuter,
    });
  };

  /**
   * 다중 선택 카드의 전체/이름(텍스트) 영역 클릭 핸들러
   * (TOP, BOTTOM은 최소 1개 유지 원칙)
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

    // 2. 현재 1개만 선택된 상태 (단일 전환 이동으로 1개 유지)
    if (currentList.length === 1) {
      if (isSelected) {
        // 이미 1개 선택된 카드 클릭 시: 최소 1개 유지 원칙에 따라 해제 불가
        return;
      } else {
        // 다른 카드의 텍스트 클릭: 교체 (단일 선택 이동)
        onChangeSelection({
          ...selection,
          [category]: [item],
        });
      }
      return;
    }

    // 3. 현재 2개 이상 선택된 상태
    if (isSelected) {
      onChangeSelection({
        ...selection,
        [category]: currentList.filter((x) => x !== item),
      });
    } else {
      onChangeSelection({
        ...selection,
        [category]: [...currentList, item],
      });
    }
  };

  /**
   * 다중 선택 카드의 '+ (아이콘)' 영역 클릭 핸들러
   */
  const handleMultiSelectIconClick = (
    category: 'top' | 'bottom',
    item: string
  ) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);

    if (currentList.length === 0) {
      onChangeSelection({
        ...selection,
        [category]: [item],
      });
      return;
    }

    if (currentList.length === 1) {
      if (isSelected) {
        return; // 최소 1개 유지
      } else {
        // 다른 카드의 '+' 아이콘 클릭: 기존 선택 유지한 채 추가 (다중 선택 시작)
        onChangeSelection({
          ...selection,
          [category]: [...currentList, item],
        });
      }
      return;
    }

    if (isSelected) {
      onChangeSelection({
        ...selection,
        [category]: currentList.filter((x) => x !== item),
      });
    } else {
      onChangeSelection({
        ...selection,
        [category]: [...currentList, item],
      });
    }
  };

  // 모달용 토글
  const handleModalToggle = (category: 'top' | 'bottom', item: string) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);
    if (isSelected) {
      if (currentList.length <= 1) return;
      onChangeSelection({
        ...selection,
        [category]: currentList.filter((x) => x !== item),
      });
    } else {
      onChangeSelection({
        ...selection,
        [category]: [...currentList, item],
      });
    }
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

  // =========================================================================
  // 요구사항 5: 추천 외 항목 선택 시 UI 노출 처리 ('모든 항목 보기' 연동)
  // 기본 기온 추천 뷰에는 표시되지 않지만, 사용자가 모달에서 특정 아이템을 선택한 경우:
  // - 메인 추천 카드 영역에서 미선택된 기본 추천 항목 숨김/제외
  // - 사용자가 직접 선택한 항목만 메인 선택 뷰에 명확하게 배치 노출
  // =========================================================================

  // 1. OUTER 가시 목록
  const isOuterCustomSelected = Boolean(
    selection.outer &&
      selection.outer !== '없음' &&
      !dynamicOptions.outer.includes(selection.outer)
  );
  const visibleOuterOptions = useMemo(() => {
    if (isOuterCustomSelected && selection.outer && selection.outer !== '없음') {
      return [selection.outer];
    }
    return dynamicOptions.outer.filter((opt) => opt !== '없음');
  }, [isOuterCustomSelected, selection.outer, dynamicOptions.outer]);

  // 2. TOP 가시 목록
  const isTopCustomSelected = selection.top.some(
    (item) => item && !dynamicOptions.top.includes(item)
  );
  const visibleTopOptions = useMemo(() => {
    if (isTopCustomSelected) {
      return selection.top;
    }
    return dynamicOptions.top;
  }, [isTopCustomSelected, selection.top, dynamicOptions.top]);

  // 3. BOTTOM 가시 목록
  const isBottomCustomSelected = selection.bottom.some(
    (item) => item && !dynamicOptions.bottom.includes(item)
  );
  const visibleBottomOptions = useMemo(() => {
    if (isBottomCustomSelected) {
      return selection.bottom;
    }
    return dynamicOptions.bottom;
  }, [isBottomCustomSelected, selection.bottom, dynamicOptions.bottom]);

  // 4. ITEM 가시 목록
  const isItemCustomSelected = selection.items.some(
    (item) => item && !dynamicOptions.items.includes(item)
  );
  const visibleItemOptions = useMemo(() => {
    if (isItemCustomSelected) {
      return selection.items;
    }
    return dynamicOptions.items;
  }, [isItemCustomSelected, selection.items, dynamicOptions.items]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-4">
      {/* 컴포넌트 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {timeSlotLabel} 맞춤 복장 제안
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
              {temperature}°C
            </span>
            {aggregatedCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>누적 평가 {aggregatedCount}건 반영</span>
              </span>
            )}
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
              {isOuterCustomSelected && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  직접 선택
                </span>
              )}
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
              선택: {selection.outer && selection.outer !== '없음' ? selection.outer : '없음'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {visibleOuterOptions.map((opt) => {
              const isSelected = selection.outer === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOuterSelect(opt)}
                  title={isSelected ? '클릭하여 외투 선택 해제' : `${opt} 선택`}
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
              {isTopCustomSelected && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('top')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[190px]">
              상의 ({selection.top.length}): {selection.top.length > 0 ? selection.top.join(' + ') : '선택 없음'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {visibleTopOptions.map((opt) => {
              const isSelected = selection.top.includes(opt);
              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs font-medium transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('top', opt)}
                    className="min-h-[38px] pl-3 pr-2 py-1.5 flex items-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer"
                    title={
                      isSelected
                        ? selection.top.length === 1
                          ? '최소 1개의 상의가 선택되어야 합니다.'
                          : '클릭하여 선택 해제'
                        : `${opt} 단일 선택 (교체)`
                    }
                  >
                    <span>{opt}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('top', opt);
                    }}
                    className={`min-h-[38px] px-2 py-1.5 flex items-center justify-center border-l transition-colors active:scale-90 touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'border-slate-700 hover:bg-slate-800 text-blue-400'
                        : 'border-slate-200 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700'
                    }`}
                    title={
                      isSelected
                        ? selection.top.length === 1
                          ? '최소 1개의 상의가 선택되어야 합니다.'
                          : '선택 해제'
                        : `${opt} 추가 (다중 선택)`
                    }
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
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
              {isBottomCustomSelected && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('bottom')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[190px]">
              하의 ({selection.bottom.length}): {selection.bottom.length > 0 ? selection.bottom.join(' + ') : '선택 없음'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {visibleBottomOptions.map((opt) => {
              const isSelected = selection.bottom.includes(opt);
              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs font-medium transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('bottom', opt)}
                    className="min-h-[38px] pl-3 pr-2 py-1.5 flex items-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer"
                    title={
                      isSelected
                        ? selection.bottom.length === 1
                          ? '최소 1개의 하의가 선택되어야 합니다.'
                          : '클릭하여 선택 해제'
                        : `${opt} 단일 선택 (교체)`
                    }
                  >
                    <span>{opt}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('bottom', opt);
                    }}
                    className={`min-h-[38px] px-2 py-1.5 flex items-center justify-center border-l transition-colors active:scale-90 touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'border-slate-700 hover:bg-slate-800 text-blue-400'
                        : 'border-slate-200 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700'
                    }`}
                    title={
                      isSelected
                        ? selection.bottom.length === 1
                          ? '최소 1개의 하의가 선택되어야 합니다.'
                          : '선택 해제'
                        : `${opt} 추가 (다중 선택)`
                    }
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. ITEM (소품 - 다중 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>ITEM (소품)</span>
                <span className="text-[10px] text-slate-400 font-normal">다중 선택</span>
              </label>
              {isItemCustomSelected && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('items')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[모든 항목 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[160px]">
              {selection.items.length > 0 ? `${selection.items.length}개 선택` : '선택 없음'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {visibleItemOptions.map((opt) => {
              const isSelected = selection.items.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleItemToggle(opt)}
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
      </div>

      {/* 실시간 선택 조합 요약 배너 */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2 flex-wrap">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          <Shirt className="w-3.5 h-3.5 text-blue-600" />
          현재 코디:
        </span>
        <span className="text-slate-800">
          [외투] {selection.outer && selection.outer !== '없음' ? selection.outer : '없음'}
        </span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-800">
          [상의] {selection.top.length > 0 ? selection.top.join(' + ') : '선택 없음'}
        </span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-800">
          [하의] {selection.bottom.length > 0 ? selection.bottom.join(' + ') : '선택 없음'}
        </span>
        {selection.items.length > 0 && (
          <>
            <span className="text-slate-400">•</span>
            <span className="text-slate-800">[소품] {selection.items.join(', ')}</span>
          </>
        )}
      </div>

      {/* 5. [모든 항목 보기] 카탈로그 모달 */}
      {modalCategory && (
        <AllItemsModal
          isOpen={true}
          onClose={() => setModalCategory(null)}
          category={modalCategory}
          categoryTitle={
            modalCategory === 'outer'
              ? '외투 (OUTER)'
              : modalCategory === 'top'
              ? '상의 (TOP)'
              : modalCategory === 'bottom'
              ? '하의 (BOTTOM)'
              : '소품 (ITEM)'
          }
          selectedItems={
            modalCategory === 'outer'
              ? selection.outer && selection.outer !== '없음'
                ? [selection.outer]
                : []
              : modalCategory === 'top'
              ? selection.top
              : modalCategory === 'bottom'
              ? selection.bottom
              : selection.items
          }
          onToggleItem={(item) => {
            if (modalCategory === 'outer') {
              handleOuterSelect(item);
            } else if (modalCategory === 'top' || modalCategory === 'bottom') {
              handleModalToggle(modalCategory, item);
            } else {
              handleItemToggle(item);
            }
          }}
          isSingleSelect={modalCategory === 'outer'}
        />
      )}
    </div>
  );
};
