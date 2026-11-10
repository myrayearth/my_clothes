'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { OutfitRuleStep, OutfitSelection, OutfitCategory } from '@/types/outfit';
import { OutfitLog, UserGender } from '@/types/database';
import { getOutfitRuleByTemperature, getDefaultOutfitSelection, syncOnePieceSelection, isOnePieceItem } from '@/lib/outfit';
import {
  calculateWeightedRecommendations,
} from '@/lib/recommendation';
import { filterItemsByGender } from '@/lib/gender';
import {
  calculateTotalInsulation,
  getInsulationTargetRange,
  getInsulationStatus,
  getInsulationStatusMeta,
  getItemInsulationScore,
  clampUserOffset,
  scoreToCoverTemperature,
  getRelativeCoverStatus,
  getItemChipWarmthClasses,
} from '@/lib/insulation';
import { AllItemsModal } from '@/components/outfit/AllItemsModal';
import { isPinnedInnerItem, isInnerClothingItem } from '@/lib/itemPicker';
import { Shirt, RotateCcw, Check, Plus, ExternalLink, Sparkles, Thermometer, Zap, Users } from 'lucide-react';

interface OutfitSelectorProps {
  temperature: number;
  actualTemperature?: number;
  apparentTemperature?: number;
  timeSlotLabel: string;
  selection: OutfitSelection;
  onChangeSelection: (newSelection: OutfitSelection) => void;
  allLogs?: OutfitLog[];
  currentUser?: string;
  isLoggedIn?: boolean;
  gender?: UserGender;
}

export const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  temperature,
  actualTemperature,
  apparentTemperature,
  timeSlotLabel,
  selection,
  onChangeSelection,
  allLogs = [],
  currentUser = '게스트',
  isLoggedIn = false,
  gender = 'male',
}) => {
  const currentRule: OutfitRuleStep = getOutfitRuleByTemperature(temperature);

  // [모든 항목 보기] 모달 상태 관리
  const [modalCategory, setModalCategory] = useState<OutfitCategory | null>(null);

  // 게스트 데이터 반영 체크 상태 관리 (LocalStorage 영속화)
  const [includeGuestData, setIncludeGuestData] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ondo_fit_include_guest_data');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const handleToggleGuestData = () => {
    setIncludeGuestData((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ondo_fit_include_guest_data', String(next));
      }
      return next;
    });
  };

  // 성별 필터링 및 개인화/게스트 누적 가중치가 반영된 옵션 산출
  const { options: dynamicOptions, defaults: dynamicDefaults, weights } = useMemo(() => {
    return calculateWeightedRecommendations(
      currentRule,
      allLogs,
      temperature,
      currentUser,
      isLoggedIn,
      gender,
      includeGuestData
    );
  }, [currentRule, allLogs, temperature, currentUser, isLoggedIn, gender, includeGuestData]);

  // 원피스 상하의 동기화 및 안전장치가 적용된 selection 업데이트 래퍼
  const updateSelection = (newSelection: OutfitSelection) => {
    const synced = syncOnePieceSelection(newSelection, selection, temperature, gender);
    onChangeSelection(synced);
  };

  // 성별 변경 시 남성/여성 복장 안전 필터링 및 동기화
  useEffect(() => {
    const synced = syncOnePieceSelection(selection, undefined, temperature, gender);
    const isTopDiff = JSON.stringify(synced.top) !== JSON.stringify(selection.top);
    const isBottomDiff = JSON.stringify(synced.bottom) !== JSON.stringify(selection.bottom);
    if (isTopDiff || isBottomDiff) {
      onChangeSelection(synced);
    }
  }, [gender]);

  // 1. 기본 추천순 100% 반영 리셋: 룰셋의 순수 기본 추천값으로 복원 (5°C 미만은 이너 포함, 5°C 이상은 이너 제외)
  const handleResetToRuleDefault = () => {
    const rawDefaults = getDefaultOutfitSelection(currentRule, temperature);

    const genderFilteredDefaults: OutfitSelection = {
      outer: filterItemsByGender(rawDefaults.outer, gender),
      top: filterItemsByGender(rawDefaults.top, gender),
      bottom: filterItemsByGender(rawDefaults.bottom, gender),
      items: filterItemsByGender(rawDefaults.items, gender),
    };
    updateSelection(genderFilteredDefaults);
  };

  // 2. 평가 반영: 산출된 최적 추천 복장 적용
  const handleApplyAggregatedRecommendations = () => {
    updateSelection(dynamicDefaults);
  };

  // 3. 항목별(외투, 상의, 하의, 소품) 개별 리셋 핸들러: 해당 카테고리만 추천 기본값으로 복원
  const handleResetCategory = (category: 'outer' | 'top' | 'bottom' | 'items') => {
    updateSelection({
      ...selection,
      [category]: dynamicDefaults[category] || [],
    });
  };

  // ==========================================
  // 보온 수치 점수 (Insulation Score) 실시간 계산
  // ==========================================
  const totalInsulationScore = useMemo(() => {
    return calculateTotalInsulation(selection);
  }, [selection]);

  // 개인화 체질 보정값(User Offset) 계산 (최대 ±30점 제한)
  const userOffset = useMemo(() => {
    if (!isLoggedIn || !currentUser || currentUser === '게스트') return 0;
    const userLogs = allLogs.filter(
      (l) => l.user_name === currentUser && Math.abs(l.target_temp - temperature) <= 3
    );
    if (userLogs.length === 0) return 0;
    const avgScore = userLogs.reduce((sum, l) => sum + (l.score || 0), 0) / userLogs.length;
    // 추위를 느끼면(+) 목표점수 상향, 더위를 느끼면(-) 목표점수 하향
    return clampUserOffset(-avgScore * 4);
  }, [allLogs, temperature, currentUser, isLoggedIn]);

  const targetRange = useMemo(() => {
    return getInsulationTargetRange(temperature, userOffset);
  }, [temperature, userOffset]);

  // [신규] 보온 점수 -> 복장 적정 커버 기온 (°C) 환산
  const coverTemp = useMemo(() => {
    return scoreToCoverTemperature(totalInsulationScore);
  }, [totalInsulationScore]);

  // [신규] 현재 기준 온도(temperature) 대비 ±5°C 상대 범위 상태 산출
  const relativeStatus = useMemo(() => {
    return getRelativeCoverStatus(coverTemp, temperature);
  }, [coverTemp, temperature]);

  // 게이지 바 표시 범위: [temperature - 5, temperature + 5] (총 10°C 폭)
  const gaugeMinTemp = temperature - 5;
  const gaugeMaxTemp = temperature + 5;
  const rawCoverPct = ((coverTemp - gaugeMinTemp) / 10) * 100;
  const markerPct = Math.max(0, Math.min(100, rawCoverPct));
  const isLeftOverflow = coverTemp < gaugeMinTemp;
  const isRightOverflow = coverTemp > gaugeMaxTemp;

  const insulationStatus = useMemo(() => {
    return getInsulationStatus(
      totalInsulationScore,
      targetRange.min,
      targetRange.max,
      targetRange.hasNoUpperBound
    );
  }, [totalInsulationScore, targetRange]);

  const statusMeta = useMemo(() => {
    return getInsulationStatusMeta(insulationStatus);
  }, [insulationStatus]);

  /**
   * 다중 선택 카드의 이름(텍스트) 영역 클릭 핸들러
   * - 외투: 0개 선택 가능, 1개 선택 상태에서 다른 외투 클릭 시 단일 교체, 선택된 외투 클릭 시 해제
   * - 일반 옷: 1개 선택 상태에서 다른 일반 옷 클릭 시 단일 교체
   * - [예외 규칙] 이너(히트텍/발열내의/스타킹 등):
   *   1) 일반 옷 1개 상태에서 이너 클릭 시 기존 옷 유지 + 이너 추가 (레이어드)
   *   2) 이너 1개 상태에서 일반 옷 클릭 시 이너 유지 + 일반 옷 추가
   *   3) 이미 선택된 이너 클릭 시 토글 해제 (선택 취소)
   *   4) 일반 옷 + 이너 상태에서 다른 일반 옷 클릭 시 일반 옷만 교체되고 이너는 유지
   */
  const handleMultiSelectCardClick = (
    category: 'outer' | 'top' | 'bottom',
    item: string
  ) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);
    const isTargetInner = isInnerClothingItem(item);

    // 1. 이미 선택된 아이템을 클릭한 경우
    if (isSelected) {
      // 외투(outer)는 0개 선택(미착용)이 자유롭게 가능하므로 클릭 시 토글 해제
      if (category === 'outer') {
        updateSelection({
          ...selection,
          outer: currentList.filter((x) => x !== item),
        });
        return;
      }

      // 이너 아이템이면 토글 해제 (선택 취소)
      if (isTargetInner) {
        if (currentList.length > 1) {
          updateSelection({
            ...selection,
            [category]: currentList.filter((x) => x !== item),
          });
          return;
        }
        return;
      }

      // 일반 옷이고 2개 이상 선택되어 있는 경우 해제 가능
      if (currentList.length > 1) {
        updateSelection({
          ...selection,
          [category]: currentList.filter((x) => x !== item),
        });
        return;
      }

      // 1개만 남은 일반 옷은 최소 1개 유지
      return;
    }

    // 2. 선택되지 않은 아이템을 클릭한 경우
    if (currentList.length === 0) {
      updateSelection({
        ...selection,
        [category]: [item],
      });
      return;
    }

    // [원피스 특별 규칙 1]: 원피스를 클릭한 경우, 기존의 다른 원피스나 본의류는 새 원피스로 즉시 교체 (이너 레이어드 보존)
    if (isOnePieceItem(item)) {
      const inners = currentList.filter((x) => isInnerClothingItem(x) && !isOnePieceItem(x));
      updateSelection({
        ...selection,
        [category]: [...inners, item],
      });
      return;
    }

    // [원피스 특별 규칙 2]: 원피스가 선택된 상태에서 일반 본의류(스커트/바지/블라우스 등)를 클릭한 경우, 원피스를 새 본의류로 즉시 교체
    if (!isTargetInner && currentList.some(isOnePieceItem)) {
      const inners = currentList.filter((x) => isInnerClothingItem(x) && !isOnePieceItem(x));
      updateSelection({
        ...selection,
        [category]: [...inners, item],
      });
      return;
    }

    // 현재 1개만 선택되어 있는 상태
    if (currentList.length === 1) {
      const currentSingle = currentList[0];
      const isCurrentInner = isInnerClothingItem(currentSingle);

      // 외투(outer): 1개 선택 상태에서 텍스트 클릭 시 해당 외투로 단일 교체
      if (category === 'outer') {
        updateSelection({
          ...selection,
          outer: [item],
        });
        return;
      }

      // [예외 규칙 1]: 현재 일반 옷 1개인데 '이너' 클릭 -> 기존 옷 유지 + 이너 추가 (레이어드)
      if (!isCurrentInner && isTargetInner) {
        updateSelection({
          ...selection,
          [category]: [...currentList, item],
        });
        return;
      }

      // [예외 규칙 2]: 현재 이너 1개인데 일반 겉옷 클릭 -> 이너 유지 + 겉옷 추가 (레이어드)
      if (isCurrentInner && !isTargetInner) {
        updateSelection({
          ...selection,
          [category]: [...currentList, item],
        });
        return;
      }

      // 일반 옷 -> 다른 일반 옷, 또는 이너 -> 다른 이너: 단일 교체
      updateSelection({
        ...selection,
        [category]: [item],
      });
      return;
    }

    // 현재 2개 이상 선택되어 있는 상태
    if (category === 'outer') {
      updateSelection({
        ...selection,
        outer: [...currentList, item],
      });
      return;
    }

    const innerItems = currentList.filter(isInnerClothingItem);
    const nonInnerItems = currentList.filter((x) => !isInnerClothingItem(x));

    if (isTargetInner) {
      // 새 이너 클릭: 기존 이너 교체 또는 추가
      const nextList = [...nonInnerItems, item];
      updateSelection({
        ...selection,
        [category]: nextList,
      });
      return;
    } else {
      // 새 일반 옷 클릭: 기존 일반 옷이 1개였으면 일반 옷만 교체하고 이너 유지!
      if (nonInnerItems.length === 1 && innerItems.length > 0) {
        updateSelection({
          ...selection,
          [category]: [item, ...innerItems],
        });
        return;
      }

      updateSelection({
        ...selection,
        [category]: [...currentList, item],
      });
    }
  };

  /**
   * 다중 선택 카드의 '+ (아이콘)' 영역 클릭 핸들러 (레이어드 토글)
   */
  const handleMultiSelectIconClick = (
    category: 'outer' | 'top' | 'bottom',
    item: string
  ) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);

    if (currentList.length === 0) {
      updateSelection({
        ...selection,
        [category]: [item],
      });
      return;
    }

    if (isSelected) {
      if (category === 'outer' || currentList.length > 1) {
        updateSelection({
          ...selection,
          [category]: currentList.filter((x) => x !== item),
        });
      }
      return;
    }

    // '+' 클릭 시 기존 선택 유지한 채 추가 (다중 선택/레이어드)
    updateSelection({
      ...selection,
      [category]: [...currentList, item],
    });
  };

  // 모달용 토글
  const handleModalToggle = (category: 'outer' | 'top' | 'bottom', item: string) => {
    const currentList = selection[category];
    const isSelected = currentList.includes(item);
    if (isSelected) {
      if (category !== 'outer' && currentList.length <= 1) return;
      updateSelection({
        ...selection,
        [category]: currentList.filter((x) => x !== item),
      });
    } else {
      // [원피스 특별 규칙]: 원피스 선택 시 다른 원피스나 본의류를 새 원피스로 즉시 교체
      if (isOnePieceItem(item)) {
        const inners = currentList.filter((x) => isInnerClothingItem(x) && !isOnePieceItem(x));
        updateSelection({
          ...selection,
          [category]: [...inners, item],
        });
        return;
      }

      // [원피스 특별 규칙 2]: 원피스가 선택된 상태에서 일반 본의류를 선택한 경우 새 본의류로 즉시 교체
      if (!isInnerClothingItem(item) && currentList.some(isOnePieceItem)) {
        const inners = currentList.filter((x) => isInnerClothingItem(x) && !isOnePieceItem(x));
        updateSelection({
          ...selection,
          [category]: [...inners, item],
        });
        return;
      }

      updateSelection({
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
    updateSelection({
      ...selection,
      items: newItems,
    });
  };

  // =========================================================================
  // '모든 항목 보기' 선택 병합:
  // 기본 추천 후보 목록을 유지하면서, 사용자가 추가 선택한 항목 병합
  // (성별 필터링 반영)
  // =========================================================================

  // 1. OUTER 가시 목록 (추천 목록 유지 + 직접 선택한 외투 병합)
  const isOuterCustomSelected = selection.outer.some(
    (item) => item && item !== '없음' && !dynamicOptions.outer.includes(item)
  );
  const visibleOuterOptions = useMemo(() => {
    const base = filterItemsByGender(dynamicOptions.outer.filter((opt) => opt !== '없음'), gender);
    const customItems = selection.outer.filter(
      (item) => item && item !== '없음' && !base.includes(item)
    );
    return [...base, ...customItems];
  }, [selection.outer, dynamicOptions.outer, gender]);

  // 2. TOP 가시 목록 (추천 목록 유지 + 직접 선택한 상의 병합)
  const isTopCustomSelected = selection.top.some(
    (item) => item && !dynamicOptions.top.includes(item)
  );
  const visibleTopOptions = useMemo(() => {
    const base = filterItemsByGender(dynamicOptions.top, gender);
    const customItems = selection.top.filter(
      (item) => item && !base.includes(item)
    );
    return [...base, ...customItems];
  }, [selection.top, dynamicOptions.top, gender]);

  // 3. BOTTOM 가시 목록 (추천 목록 유지 + 직접 선택한 하의 병합)
  const isBottomCustomSelected = selection.bottom.some(
    (item) => item && !dynamicOptions.bottom.includes(item)
  );
  const visibleBottomOptions = useMemo(() => {
    const base = filterItemsByGender(dynamicOptions.bottom, gender);
    const customItems = selection.bottom.filter(
      (item) => item && !base.includes(item)
    );
    return [...base, ...customItems];
  }, [selection.bottom, dynamicOptions.bottom, gender]);

  // 4. ITEM 가시 목록 (추천 목록 유지 + 직접 선택한 소품 병합)
  const isItemCustomSelected = selection.items.some(
    (item) => item && !dynamicOptions.items.includes(item)
  );
  const visibleItemOptions = useMemo(() => {
    const base = filterItemsByGender(dynamicOptions.items, gender);
    const customItems = selection.items.filter(
      (item) => item && !base.includes(item)
    );
    return [...base, ...customItems];
  }, [selection.items, dynamicOptions.items, gender]);

  return (
    <div className="space-y-4">
      {/* 1. 복장 선택 및 게이지 플로우 래퍼: ITEM(소품)의 마지막 줄까지 게이지가 sticky로 유지됨 */}
      <div className="relative outfit-flow-wrapper space-y-4">
        {/* 컴포넌트 헤더 카드 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800">
                  {timeSlotLabel} 맞춤 복장 제안
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0 flex items-center gap-1">
                  <span>체감 {temperature}°C</span>
                </span>
                {actualTemperature !== undefined && actualTemperature !== temperature && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    실제 {actualTemperature}°C
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                  {currentRule.label}
                </span>

                {/* 가중치 추천 모드 뱃지 */}
                {weights.mode === 'personal_weighted' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    <span>내 맞춤 추천 ({weights.personalCount}건 반영)</span>
                  </span>
                ) : weights.mode === 'guest_weighted' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-600" />
                    <span>전체 사용자 의견 반영 ({weights.guestCount}건)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                    {weights.description}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                <strong className="text-brand-600 font-semibold">{currentRule.label}</strong> : {weights.description}
              </p>
            </div>

            {/* 복장 추천 리셋 제어 버튼 세트 */}
            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
              {/* 0. 전체 사용자 의견 반영 체크 버튼 */}
              <button
                type="button"
                onClick={handleToggleGuestData}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all active:scale-95 touch-manipulation border shadow-2xs cursor-pointer select-none ${
                  includeGuestData
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/80'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70 hover:text-slate-800'
                }`}
                title={
                  includeGuestData
                    ? '다른 사용자들의 체감 평가 데이터가 추천에 함께 반영 중입니다. (클릭 시 제외)'
                    : '다른 사용자들의 체감 평가 데이터를 추천에 함께 반영합니다.'
                }
              >
                <Users className={`w-3.5 h-3.5 ${includeGuestData ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>전체 사용자 의견 포함</span>
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] font-bold transition-colors ${
                    includeGuestData
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
              </button>

              {/* 1. 기본 추천 */}
              <button
                type="button"
                onClick={handleResetToRuleDefault}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg font-semibold transition-all active:scale-95 touch-manipulation border border-slate-200 shadow-2xs cursor-pointer"
                title="기온별 표준 기본 추천 복장으로 복원"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>기본 추천</span>
              </button>

              {/* 2. 맞춤 추천 */}
              <button
                type="button"
                onClick={handleApplyAggregatedRecommendations}
                className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg font-semibold transition-all active:scale-95 touch-manipulation border border-blue-200 shadow-2xs cursor-pointer"
                title="체감 평가 데이터가 반영된 맞춤 복장 적용"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>맞춤 추천</span>
              </button>
            </div>
          </div>
        </div>

        {/* 복장 선택 섹션 목록 카드 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-4">
        {/* 1. OUTER (외투 - 다중 선택 및 레이어드 지원) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>외투 (겉옷)</span>
                <span className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200/60 font-medium px-1.5 py-0.2 rounded">
                  + 겹쳐 입기
                </span>
              </label>
              {isOuterCustomSelected && (
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('outer')}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[전체 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetCategory('outer')}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition-all active:scale-95 touch-manipulation cursor-pointer border border-slate-200"
                title="외투 항목 초기화 (추천 기본값으로 복원)"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>초기화</span>
              </button>
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md truncate max-w-[190px]">
                {selection.outer.filter((x) => x && x !== '없음').length}개 선택
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleOuterOptions.map((opt) => {
              const isSelected = selection.outer.includes(opt);
              const isCustom = !dynamicOptions.outer.includes(opt);
              const isRecommended = opt === currentRule.recommend.outer;

              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs transition-all duration-150 select-none overflow-hidden ${getItemChipWarmthClasses(
                    opt,
                    'outer',
                    isSelected,
                    isRecommended
                  )}`}
                >
                  {/* 좌측 텍스트 (단일 선택 전환 또는 해제) */}
                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('outer', opt)}
                    className="min-h-[38px] py-1.5 px-3.5 flex items-center justify-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer flex-1"
                    title={isSelected ? '클릭하여 선택 해제' : `${opt} 선택`}
                  >
                    <span className={isSelected ? 'text-amber-950 font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-emerald-900 bg-emerald-100 border-emerald-400'
                            : 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span>추천</span>
                      </span>
                    )}
                    {isCustom && (
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.2 rounded border shrink-0 ${
                          isSelected
                            ? 'text-amber-900 bg-amber-200/80 border-amber-400'
                            : 'text-brand-700 bg-brand-50 border-brand-200'
                        }`}
                      >
                        직접선택
                      </span>
                    )}
                  </button>

                  {/* 우측 + 버튼 (레이어드/다중선택 추가 및 해제) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('outer', opt);
                    }}
                    className={`min-h-[38px] px-2.5 py-1.5 flex items-center justify-center border-l transition-colors active:scale-90 touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-200/90 hover:bg-amber-300 text-amber-950'
                        : 'border-inherit hover:bg-black/5 text-[#0b192c]/70 hover:text-[#0b192c]'
                    }`}
                    title={isSelected ? '선택 해제' : `${opt} 레이어드 추가`}
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 상의 (다중 선택 및 이너 예외) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>상의</span>
                <span className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200/60 font-medium px-1.5 py-0.2 rounded">
                  + 겹쳐 입기
                </span>
              </label>
              {isTopCustomSelected && (
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('top')}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[전체 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetCategory('top')}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition-all active:scale-95 touch-manipulation cursor-pointer border border-slate-200"
                title="상의 항목 초기화 (추천 기본값으로 복원)"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>초기화</span>
              </button>
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md truncate max-w-[190px]">
                {selection.top.length}개 선택
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleTopOptions.map((opt) => {
              const isSelected = selection.top.includes(opt);
              const isCustom = !dynamicOptions.top.includes(opt);
              const isInner = isPinnedInnerItem(opt, 'top', temperature) || isInnerClothingItem(opt);
              const isRecommended = currentRule.recommend.top.includes(opt);

              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs transition-all duration-150 select-none overflow-hidden ${getItemChipWarmthClasses(
                    opt,
                    'top',
                    isSelected,
                    isRecommended
                  )}`}
                >
                  {/* 좌측 텍스트 (단일 선택 전환, 이너 중복 예외 처리) */}
                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('top', opt)}
                    className="min-h-[38px] py-1.5 px-3.5 flex items-center justify-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer flex-1"
                    title={
                      isSelected
                        ? selection.top.length === 1 && !isInnerClothingItem(opt)
                          ? '최소 1개의 상의가 선택되어야 합니다.'
                          : '클릭하여 선택 해제'
                        : `${opt} 선택`
                    }
                  >
                    <span className={isSelected ? 'text-amber-950 font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isInner && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-sky-900 bg-sky-100 border-sky-300'
                            : 'text-sky-700 bg-sky-100/80 border-sky-300'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5 text-sky-500 shrink-0 fill-sky-500" />
                        <span>내의</span>
                      </span>
                    )}
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-emerald-900 bg-emerald-100 border-emerald-400'
                            : 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span>추천</span>
                      </span>
                    )}
                    {isCustom && (
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.2 rounded border shrink-0 ${
                          isSelected
                            ? 'text-amber-900 bg-amber-200/80 border-amber-400'
                            : 'text-brand-700 bg-brand-50 border-brand-200'
                        }`}
                      >
                        직접선택
                      </span>
                    )}
                  </button>

                  {/* 우측 + 버튼 (레이어드/다중선택 추가 및 해제) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('top', opt);
                    }}
                    className={`min-h-[38px] px-2.5 py-1.5 flex items-center justify-center border-l transition-colors active:scale-90 touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-200/90 hover:bg-amber-300 text-amber-950'
                        : 'border-inherit hover:bg-black/5 text-[#0b192c]/70 hover:text-[#0b192c]'
                    }`}
                    title={
                      isSelected
                        ? selection.top.length === 1
                          ? '최소 1개의 상의가 선택되어야 합니다.'
                          : '선택 해제'
                        : `${opt} 레이어드 추가`
                    }
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 하의 (다중 선택 및 이너 예외) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>하의</span>
                <span className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200/60 font-medium px-1.5 py-0.2 rounded">
                  + 겹쳐 입기
                </span>
              </label>
              {isBottomCustomSelected && (
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('bottom')}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[전체 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetCategory('bottom')}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition-all active:scale-95 touch-manipulation cursor-pointer border border-slate-200"
                title="하의 항목 초기화 (추천 기본값으로 복원)"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>초기화</span>
              </button>
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md truncate max-w-[190px]">
                {selection.bottom.length}개 선택
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleBottomOptions.map((opt) => {
              const isSelected = selection.bottom.includes(opt);
              const isCustom = !dynamicOptions.bottom.includes(opt);
              const isInner = isPinnedInnerItem(opt, 'bottom', temperature) || isInnerClothingItem(opt);
              const isRecommended = currentRule.recommend.bottom.includes(opt);

              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs transition-all duration-150 select-none overflow-hidden ${getItemChipWarmthClasses(
                    opt,
                    'bottom',
                    isSelected,
                    isRecommended
                  )}`}
                >
                  {/* 좌측 텍스트 (단일 선택 전환, 이너 중복 예외 처리) */}
                  <button
                    type="button"
                    onClick={() => handleMultiSelectCardClick('bottom', opt)}
                    className="min-h-[38px] py-1.5 px-3.5 flex items-center justify-center gap-1.5 active:opacity-80 touch-manipulation cursor-pointer flex-1"
                    title={
                      isSelected
                        ? selection.bottom.length === 1 && !isInnerClothingItem(opt)
                          ? '최소 1개의 하의가 선택되어야 합니다.'
                          : '클릭하여 선택 해제'
                        : `${opt} 선택`
                    }
                  >
                    <span className={isSelected ? 'text-amber-950 font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isInner && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-sky-900 bg-sky-100 border-sky-300'
                            : 'text-sky-700 bg-sky-100/80 border-sky-300'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5 text-sky-500 shrink-0 fill-sky-500" />
                        <span>내의</span>
                      </span>
                    )}
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-emerald-900 bg-emerald-100 border-emerald-400'
                            : 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span>추천</span>
                      </span>
                    )}
                    {isCustom && (
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.2 rounded border shrink-0 ${
                          isSelected
                            ? 'text-amber-900 bg-amber-200/80 border-amber-400'
                            : 'text-brand-700 bg-brand-50 border-brand-200'
                        }`}
                      >
                        직접선택
                      </span>
                    )}
                  </button>

                  {/* 우측 + 버튼 (레이어드/다중선택 추가 및 해제) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMultiSelectIconClick('bottom', opt);
                    }}
                    className={`min-h-[38px] px-2.5 py-1.5 flex items-center justify-center border-l transition-colors active:scale-90 touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-200/90 hover:bg-amber-300 text-amber-950'
                        : 'border-inherit hover:bg-black/5 text-[#0b192c]/70 hover:text-[#0b192c]'
                    }`}
                    title={
                      isSelected
                        ? selection.bottom.length === 1
                          ? '최소 1개의 하의가 선택되어야 합니다.'
                          : '선택 해제'
                        : `${opt} 레이어드 추가`
                    }
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 소품 / 액세서리 (다중 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>소품 / 액세서리</span>
                <span className="text-[10px] text-slate-400 font-normal">다중 선택</span>
              </label>
              {isItemCustomSelected && (
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                  직접 선택
                </span>
              )}
              <button
                type="button"
                onClick={() => setModalCategory('items')}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 underline underline-offset-2"
              >
                <span>[전체 보기]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetCategory('items')}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition-all active:scale-95 touch-manipulation cursor-pointer border border-slate-200"
                title="소품 항목 초기화 (추천 기본값으로 복원)"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>초기화</span>
              </button>
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md truncate max-w-[160px]">
                {selection.items.length > 0 ? `${selection.items.length}개 선택` : '선택 없음'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleItemOptions.map((opt) => {
              const isSelected = selection.items.includes(opt);
              const isCustom = !dynamicOptions.items.includes(opt);
              const isRecommended = currentRule.recommend.item.includes(opt);

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleItemToggle(opt)}
                  className={`min-h-[38px] py-1.5 px-3.5 text-xs rounded-xl border transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation select-none cursor-pointer ${getItemChipWarmthClasses(
                    opt,
                    'items',
                    isSelected,
                    isRecommended
                  )}`}
                >
                  <span className={isSelected ? 'text-amber-950 font-bold' : 'text-[#0b192c] font-semibold'}>
                    {opt}
                  </span>
                  {isRecommended && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                        isSelected
                          ? 'text-emerald-900 bg-emerald-100 border-emerald-400'
                          : 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span>추천</span>
                    </span>
                  )}
                  {isCustom && (
                    <span
                      className={`text-[9px] font-semibold px-1 py-0.2 rounded border shrink-0 ${
                        isSelected
                          ? 'text-amber-900 bg-amber-200/80 border-amber-400'
                          : 'text-brand-700 bg-brand-50 border-brand-200'
                      }`}
                    >
                      직접선택
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* 실시간 선택 조합 요약 카드 ('현재 코디' 요약: ITEM 소품 항목 통과 시 게이지 고정이 해제되며 노출) */}
      <div className="p-4 bg-white rounded-2xl shadow-xs border border-slate-200/90 text-xs text-slate-700 space-y-2">
        {/* 첫 번째 줄: 현재 옷차림 상태 (직관적 보온 상태 및 편차 수치 노출) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Shirt className="w-4 h-4 text-brand-600 shrink-0" />
            <span>현재 옷차림 보온 상태:</span>
            <span className={`${relativeStatus.badgeStyle} px-2 py-0.5 rounded-md text-xs`}>
              {relativeStatus.badgeText}
              {relativeStatus.diff !== 0 && (
                <span className="ml-1 font-extrabold opacity-95">
                  ({relativeStatus.diff > 0 ? `+${relativeStatus.diff}` : relativeStatus.diff}°C)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* 선택된 카테고리 목록 (미선택 카테고리 줄은 조건부로 아예 미렌더링, 최대 4줄) */}
        <div className="space-y-1 text-slate-700 pl-1 font-medium">
          {selection.outer && selection.outer.filter((x) => x && x !== '없음').length > 0 && (
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-500 w-10 shrink-0">외투:</span>
              <span className="font-semibold text-slate-900">
                {selection.outer.filter((x) => x && x !== '없음').join(', ')}
              </span>
            </div>
          )}
          {selection.top && selection.top.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-500 w-10 shrink-0">상의:</span>
              <span className="font-semibold text-slate-900">{selection.top.join(', ')}</span>
            </div>
          )}
          {selection.bottom && selection.bottom.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-500 w-10 shrink-0">하의:</span>
              <span className="font-semibold text-slate-900">{selection.bottom.join(', ')}</span>
            </div>
          )}
          {selection.items && selection.items.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-500 w-10 shrink-0">소품:</span>
              <span className="font-semibold text-slate-900">{selection.items.join(', ')}</span>
            </div>
          )}
        </div>
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
              ? selection.outer.filter((x) => x && x !== '없음')
              : modalCategory === 'top'
              ? selection.top
              : modalCategory === 'bottom'
              ? selection.bottom
              : selection.items
          }
          onToggleItem={(item) => {
            if (modalCategory === 'outer' || modalCategory === 'top' || modalCategory === 'bottom') {
              handleModalToggle(modalCategory, item);
            } else {
              handleItemToggle(item);
            }
          }}
          isSingleSelect={false}
          gender={gender}
          currentTemp={temperature}
        />
      )}
    </div>
  );
};
