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

  // 1. 추천값 리셋 버튼: 평가가 반영되지 않은 최초 DB/규칙 기본 추천값으로 복원
  const handleResetToRuleDefault = () => {
    const baseline = getDefaultOutfitSelection(currentRule);
    onChangeSelection(baseline);
  };

  // 2. 평가 반영 버튼: 현재 온도 누적 평가 기반 동적 추천값 적용
  const handleApplyAggregatedRecommendations = () => {
    if (aggregatedCount > 0) {
      onChangeSelection(dynamicDefaults);
    }
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
   * 다중 선택 카드의 이름(텍스트) 영역 클릭 핸들러
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
  // 요구사항 4: '모든 항목 보기' 선택 병합 개선
  // 기존 기본 추천 항목 목록을 100% 유지하면서,
  // 모달에서 사용자가 추가 선택한 항목들을 뒤에 병합(Merge/Append)하여 노출
  // =========================================================================

  // 1. OUTER 가시 목록 (추천 목록 유지 + 직접 선택한 외투 병합)
  const isOuterCustomSelected = Boolean(
    selection.outer &&
      selection.outer !== '없음' &&
      !dynamicOptions.outer.includes(selection.outer)
  );
  const visibleOuterOptions = useMemo(() => {
    const base = dynamicOptions.outer.filter((opt) => opt !== '없음');
    if (
      selection.outer &&
      selection.outer !== '없음' &&
      !base.includes(selection.outer)
    ) {
      return [...base, selection.outer];
    }
    return base;
  }, [selection.outer, dynamicOptions.outer]);

  // 2. TOP 가시 목록 (추천 목록 유지 + 직접 선택한 상의 병합)
  const isTopCustomSelected = selection.top.some(
    (item) => item && !dynamicOptions.top.includes(item)
  );
  const visibleTopOptions = useMemo(() => {
    const customItems = selection.top.filter(
      (item) => item && !dynamicOptions.top.includes(item)
    );
    return [...dynamicOptions.top, ...customItems];
  }, [selection.top, dynamicOptions.top]);

  // 3. BOTTOM 가시 목록 (추천 목록 유지 + 직접 선택한 하의 병합)
  const isBottomCustomSelected = selection.bottom.some(
    (item) => item && !dynamicOptions.bottom.includes(item)
  );
  const visibleBottomOptions = useMemo(() => {
    const customItems = selection.bottom.filter(
      (item) => item && !dynamicOptions.bottom.includes(item)
    );
    return [...dynamicOptions.bottom, ...customItems];
  }, [selection.bottom, dynamicOptions.bottom]);

  // 4. ITEM 가시 목록 (추천 목록 유지 + 직접 선택한 소품 병합)
  const isItemCustomSelected = selection.items.some(
    (item) => item && !dynamicOptions.items.includes(item)
  );
  const visibleItemOptions = useMemo(() => {
    const customItems = selection.items.filter(
      (item) => item && !dynamicOptions.items.includes(item)
    );
    return [...dynamicOptions.items, ...customItems];
  }, [selection.items, dynamicOptions.items]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-4">
      {/* 컴포넌트 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800">
              {timeSlotLabel} 맞춤 복장 제안
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
              {temperature}°C
            </span>
            {aggregatedCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>누적 평가 {aggregatedCount}건 반영 중</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                기본 룰셋 적용
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <strong className="text-blue-600 font-semibold">{currentRule.step}단계 ({currentRule.tempRange})</strong> : {currentRule.description}
          </p>
        </div>

        {/* 요구사항 2: 복장 제안 제어 버튼 세트 */}
        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {/* 1. 추천값 리셋 버튼 */}
          <button
            type="button"
            onClick={handleResetToRuleDefault}
            className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg font-medium transition-all active:scale-95 touch-manipulation border border-slate-200"
            title="누적 평가가 반영되지 않은 기본 설정 추천값으로 복원"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>추천값 리셋</span>
          </button>

          {/* 2. 평가 반영(x건) 버튼 (0건 예외 처리 및 툴팁) */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleApplyAggregatedRecommendations}
              disabled={aggregatedCount === 0}
              title={
                aggregatedCount === 0
                  ? '해당 온도의 누적 평가 데이터가 없습니다.'
                  : `누적 평가 ${aggregatedCount}건을 반영한 추천 복장 적용`
              }
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all border touch-manipulation ${
                aggregatedCount === 0
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs active:scale-95 cursor-pointer font-semibold'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${aggregatedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>평가 반영({aggregatedCount}건)</span>
            </button>
            {aggregatedCount === 0 && (
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 whitespace-nowrap bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg border border-slate-700">
                해당 온도의 누적 평가 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
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
              const isCustom = !dynamicOptions.outer.includes(opt);
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
                  {/* 요구사항 3: [+ 이름] 및 [✓ 이름] 표기 통일 */}
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{opt}</span>
                  {isCustom && (
                    <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                      직접선택
                    </span>
                  )}
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
              const isCustom = !dynamicOptions.top.includes(opt);
              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs font-medium transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* 요구사항 3: [+ 이름] 레이아웃 통일 - 좌측에 + / ✓ 아이콘 배치 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('top', opt);
                    }}
                    className={`min-h-[38px] pl-2.5 pr-2 py-1.5 flex items-center justify-center border-r transition-colors active:scale-90 touch-manipulation cursor-pointer ${
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

                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('top', opt)}
                    className="min-h-[38px] pl-2 pr-3 py-1.5 flex items-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer"
                    title={
                      isSelected
                        ? selection.top.length === 1
                          ? '최소 1개의 상의가 선택되어야 합니다.'
                          : '클릭하여 선택 해제'
                        : `${opt} 단일 선택 (교체)`
                    }
                  >
                    <span>{opt}</span>
                    {isCustom && (
                      <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-950/40 px-1 py-0.2 rounded border border-indigo-400/40">
                        직접선택
                      </span>
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
              const isCustom = !dynamicOptions.bottom.includes(opt);
              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs font-medium transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* 요구사항 3: [+ 이름] 레이아웃 통일 - 좌측에 + / ✓ 아이콘 배치 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('bottom', opt);
                    }}
                    className={`min-h-[38px] pl-2.5 pr-2 py-1.5 flex items-center justify-center border-r transition-colors active:scale-90 touch-manipulation cursor-pointer ${
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

                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('bottom', opt)}
                    className="min-h-[38px] pl-2 pr-3 py-1.5 flex items-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer"
                    title={
                      isSelected
                        ? selection.bottom.length === 1
                          ? '최소 1개의 하의가 선택되어야 합니다.'
                          : '클릭하여 선택 해제'
                        : `${opt} 단일 선택 (교체)`
                    }
                  >
                    <span>{opt}</span>
                    {isCustom && (
                      <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-950/40 px-1 py-0.2 rounded border border-indigo-400/40">
                        직접선택
                      </span>
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
              const isCustom = !dynamicOptions.items.includes(opt);
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
                  {/* 요구사항 3: [+ 이름] 및 [✓ 이름] 표기 통일 */}
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{opt}</span>
                  {isCustom && (
                    <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                      직접선택
                    </span>
                  )}
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