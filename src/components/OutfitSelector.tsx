'use client';

import React, { useState, useMemo } from 'react';
import { OutfitRuleStep, OutfitSelection, OutfitCategory } from '@/types/outfit';
import { OutfitLog, UserGender } from '@/types/database';
import { getOutfitRuleByTemperature, getDefaultOutfitSelection } from '@/lib/outfit';
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
} from '@/lib/insulation';
import { AllItemsModal } from '@/components/outfit/AllItemsModal';
import { isPinnedInnerItem } from '@/lib/itemPicker';
import { Shirt, RotateCcw, Check, Plus, ExternalLink, Sparkles, Thermometer, Zap } from 'lucide-react';

interface OutfitSelectorProps {
  temperature: number;
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

  // 성별 필터링 및 개인화/게스트 누적 가중치가 반영된 옵션 산출
  const { options: dynamicOptions, defaults: dynamicDefaults, weights } = useMemo(() => {
    return calculateWeightedRecommendations(
      currentRule,
      allLogs,
      temperature,
      currentUser,
      isLoggedIn,
      gender
    );
  }, [currentRule, allLogs, temperature, currentUser, isLoggedIn, gender]);

  // 1. 추천값 리셋 버튼: 룰셋의 순수 기본 추천값으로 복원
  const handleResetToRuleDefault = () => {
    const rawDefaults = getDefaultOutfitSelection(currentRule);
    const genderFilteredDefaults: OutfitSelection = {
      outer: filterItemsByGender([rawDefaults.outer], gender)[0] || (dynamicOptions.outer[0] || '없음'),
      top: filterItemsByGender(rawDefaults.top, gender),
      bottom: filterItemsByGender(rawDefaults.bottom, gender),
      items: filterItemsByGender(rawDefaults.items, gender),
    };
    onChangeSelection(genderFilteredDefaults);
  };

  // 2. 평가 반영 버튼: 산출된 최적 추천 복장 적용
  const handleApplyAggregatedRecommendations = () => {
    onChangeSelection(dynamicDefaults);
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

  const formatScoreBadge = (item: string) => {
    if (!item || item === '없음' || item === '미착용') return '';
    const score = getItemInsulationScore(item);
    const itemCoverTemp = scoreToCoverTemperature(score);
    const delta = Math.round(itemCoverTemp - temperature);
    return delta > 0 ? `(+${delta}도)` : `(${delta}도)`;
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
  // '모든 항목 보기' 선택 병합:
  // 기본 추천 후보 목록을 유지하면서, 사용자가 추가 선택한 항목 병합
  // (성별 필터링 반영)
  // =========================================================================

  // 1. OUTER 가시 목록 (추천 목록 유지 + 직접 선택한 외투 병합)
  const isOuterCustomSelected = Boolean(
    selection.outer &&
      selection.outer !== '없음' &&
      !dynamicOptions.outer.includes(selection.outer)
  );
  const visibleOuterOptions = useMemo(() => {
    const base = filterItemsByGender(dynamicOptions.outer.filter((opt) => opt !== '없음'), gender);
    if (
      selection.outer &&
      selection.outer !== '없음' &&
      !base.includes(selection.outer)
    ) {
      return [...base, selection.outer];
    }
    return base;
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
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {currentRule.label}
            </span>

            {/* 가중치 추천 모드 뱃지 */}
            {weights.mode === 'personal_weighted' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>개인화 반영 (내 기록 {weights.personalCount}건 / 전체 {weights.totalCount}건)</span>
              </span>
            ) : weights.mode === 'guest_weighted' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>누적 평가 반영 ({weights.guestCount}건)</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                {weights.description}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <strong className="text-blue-600 font-semibold">{currentRule.label}</strong> : {weights.description}
          </p>
        </div>

        {/* 복장 제안 제어 버튼 세트 */}
        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {/* 1. 추천값 리셋 버튼 */}
          <button
            type="button"
            onClick={handleResetToRuleDefault}
            className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg font-medium transition-all active:scale-95 touch-manipulation border border-slate-200"
            title="누적 평가가 반영되지 않은 기본 룰셋 추천값으로 복원"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>추천값 리셋</span>
          </button>

          {/* 2. 평가 반영 버튼 */}
          <button
            type="button"
            onClick={handleApplyAggregatedRecommendations}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all border touch-manipulation bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs active:scale-95 cursor-pointer font-semibold"
            title="가중치 추천 복장을 선택기에 즉시 적용"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>추천 복장 적용</span>
          </button>
        </div>
      </div>

      {/* [개편] 복장 적정 기온 (°C) 환산 및 ±5°C 상대 동적 게이지 그래프 */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-800/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3">
        {/* 상단 정보 텍스트 & 상태 뱃지 (2줄 구조) */}
        <div className="space-y-1.5 border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
          {/* 첫 번째 줄: 헤더 타이틀 */}
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-lg shrink-0">
              <Thermometer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              적정 체감 복장 분석
            </h4>
          </div>

          {/* 두 번째 줄: 현재 복장 커버 기온 & 우측 상태 뱃지 및 기준 기온 표시 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              현재 복장 커버 기온: <strong className="text-slate-900 dark:text-white font-bold text-sm">약 {coverTemp}°C</strong>
            </span>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                (기준 기온: <strong className="text-blue-700 dark:text-blue-400 font-bold">{temperature}°C</strong>)
              </span>

              {/* 3색 상태 뱃지: [적정] 초록 / [과보온] 빨강 / [보온 필요] 파랑 */}
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs flex items-center gap-1 transition-all duration-300 ${relativeStatus.badgeStyle}`}
              >
                <span>{relativeStatus.badgeText}</span>
                {relativeStatus.diff !== 0 && (
                  <span className="text-[10px] font-normal opacity-90">
                    ({relativeStatus.diff > 0 ? `+${relativeStatus.diff}` : relativeStatus.diff}°C)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 상태별 동적 안내 문구 */}
        <p className="text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-300 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          {relativeStatus.description}
        </p>

        {/* 현재 기준 기온(T_target) 기준 ±5°C 상대 동적 게이지 그래프 */}
        <div className="pt-2 pb-1">
          <div className="relative h-6 w-full bg-slate-200 dark:bg-slate-700/80 dark:ring-1 dark:ring-slate-600 rounded-full overflow-hidden shadow-inner border border-slate-300/60 dark:border-slate-600">
            {/* 1. 좌측 과보온 구역 (0% ~ 25%) */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1/4 bg-rose-100/60 dark:bg-rose-500/15"
              title={`과보온 구역 (${gaugeMinTemp}°C ~ ${temperature - 2.5}°C)`}
            />

            {/* 2. 중앙 적정 보온 구간 하이라이트 (25% ~ 75%, ±2.5°C 폭) */}
            <div
              className="absolute top-0 bottom-0 left-1/4 w-1/2 bg-emerald-100/80 border-x border-emerald-300 dark:bg-emerald-500/20 dark:border-x dark:border-emerald-400/60 shadow-xs flex items-center justify-center"
              title={`적정 보온 권장 범위 (${temperature - 2.5}°C ~ ${temperature + 2.5}°C)`}
            >
              <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 drop-shadow-sm tracking-wider uppercase select-none">
                적정 범위 (±2.5°C)
              </span>
            </div>

            {/* 3. 우측 보온 필요 구역 (75% ~ 100%) */}
            <div
              className="absolute top-0 bottom-0 right-0 w-1/4 bg-sky-100/60 dark:bg-sky-500/15"
              title={`보온 필요 구역 (${temperature + 2.5}°C ~ ${gaugeMaxTemp}°C)`}
            />

            {/* 중앙 50% 기준 기온(T_target) 점선 핀 */}
            <div
              className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l-2 border-dashed border-slate-400/80 dark:border-slate-500/70"
              title={`기준 기온: ${temperature}°C`}
            />

            {/* 현재 복장 커버 기온 마커 핀 */}
            <div
              className="absolute top-0 bottom-0 transition-all duration-300 ease-out z-10"
              style={{ left: `${markerPct}%` }}
            >
              {/* 마커 세로선 */}
              <div
                className={`w-1 h-full -translate-x-1/2 ${relativeStatus.markerColor} shadow-md`}
              />
              {/* 마커 헤드 뱃지 */}
              <div
                className={`absolute -top-1 left-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                  relativeStatus.markerPinClass
                } ${
                  isLeftOverflow || isRightOverflow ? 'animate-bounce ring-4 ring-offset-1' : ''
                }`}
                title={`현재 복장 커버 기온: 약 ${coverTemp}°C`}
              />
            </div>
          </div>

          {/* 게이지 하단 상대 기온 눈금 표시 */}
          <div className="relative mt-2 h-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium select-none flex items-center justify-between">
            <span className={`transition-colors ${isLeftOverflow ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
              ◀ {gaugeMinTemp}°C (두꺼움)
            </span>
            <span className="text-emerald-800 dark:text-emerald-300 font-bold hidden sm:inline">
              🎯 기준 기온 {temperature}°C
            </span>
            <span className={`transition-colors ${isRightOverflow ? 'text-sky-600 dark:text-sky-400 font-bold' : ''}`}>
              {gaugeMaxTemp}°C (얇음) ▶
            </span>
          </div>
        </div>
      </div>

      {/* 복장 선택 섹션 목록 */}
      <div className="space-y-4">
        {/* 1. OUTER (외투 - 단일 선택)
            요구사항: [+이름] -> [이름] 형태로 + 표시 삭제, 선택되었을 때의 체크(✓) 표시도 삭제 */}
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
              {selection.outer && selection.outer !== '없음' ? '1개 선택' : '0개 선택'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleOuterOptions.map((opt) => {
              const isSelected = selection.outer === opt;
              const isCustom = !dynamicOptions.outer.includes(opt);
              const isRecommended = opt === currentRule.recommend.outer;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOuterSelect(opt)}
                  title={isSelected ? '클릭하여 외투 선택 해제' : `${opt} 선택`}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isRecommended
                      ? 'bg-amber-50/40 text-slate-800 border-amber-300 hover:bg-amber-100/50'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* + 표시 삭제, 선택 시 체크 표시도 삭제: 순수 [이름] 형태 및 보온 점수 */}
                  <span>{opt}</span>
                  <span
                    className={`text-[10px] font-semibold shrink-0 ${
                      isSelected ? 'text-amber-200' : 'text-slate-400'
                    }`}
                  >
                    {formatScoreBadge(opt)}
                  </span>
                  {isRecommended && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                        isSelected
                          ? 'text-amber-300 bg-amber-950/60 border-amber-400/40'
                          : 'text-amber-700 bg-amber-50 border-amber-300'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      <span>추천</span>
                    </span>
                  )}
                  {isCustom && (
                    <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200 shrink-0">
                      직접선택
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TOP (상의 - 다중 선택)
            요구사항: 상의, 하의 '다중 선택' -> '+ 로 레이어드' */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>TOP (상의)</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 font-medium px-1.5 py-0.2 rounded">
                  + 로 레이어드
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
              {selection.top.length}개 선택
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleTopOptions.map((opt) => {
              const isSelected = selection.top.includes(opt);
              const isCustom = !dynamicOptions.top.includes(opt);
              const isInner = isPinnedInnerItem(opt, 'top', temperature);
              const isRecommended = currentRule.recommend.top.includes(opt);

              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs font-medium transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isRecommended
                      ? 'bg-amber-50/40 text-slate-800 border-amber-300 hover:bg-amber-100/50'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* 좌측 + / ✓ 아이콘 (레이어드 추가 및 해제) */}
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
                        : `${opt} 레이어드 추가`
                    }
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* 우측 텍스트 (단일 선택 전환) */}
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
                    <span
                      className={`text-[10px] font-semibold shrink-0 ${
                        isSelected ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {formatScoreBadge(opt)}
                    </span>
                    {isInner && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-sky-200 bg-sky-950/70 border-sky-400/40'
                            : 'text-sky-700 bg-sky-50 border-sky-300'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5 text-sky-500 shrink-0 fill-sky-500" />
                        <span>이너</span>
                      </span>
                    )}
                    {isRecommended && !isInner && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-amber-300 bg-amber-950/60 border-amber-400/40'
                            : 'text-amber-700 bg-amber-50 border-amber-300'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        <span>추천</span>
                      </span>
                    )}
                    {isCustom && (
                      <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-950/40 px-1 py-0.2 rounded border border-indigo-400/40 shrink-0">
                        직접선택
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BOTTOM (하의 - 다중 선택)
            요구사항: 상의, 하의 '다중 선택' -> '+ 로 레이어드' */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>BOTTOM (하의)</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 font-medium px-1.5 py-0.2 rounded">
                  + 로 레이어드
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
              {selection.bottom.length}개 선택
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleBottomOptions.map((opt) => {
              const isSelected = selection.bottom.includes(opt);
              const isCustom = !dynamicOptions.bottom.includes(opt);
              const isInner = isPinnedInnerItem(opt, 'bottom', temperature);
              const isRecommended = currentRule.recommend.bottom.includes(opt);

              return (
                <div
                  key={opt}
                  className={`inline-flex items-center rounded-xl border text-xs font-medium transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isRecommended
                      ? 'bg-amber-50/40 text-slate-800 border-amber-300 hover:bg-amber-100/50'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* 좌측 + / ✓ 아이콘 (레이어드 추가 및 해제) */}
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
                        : `${opt} 레이어드 추가`
                    }
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* 우측 텍스트 (단일 선택 전환) */}
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
                    <span
                      className={`text-[10px] font-semibold shrink-0 ${
                        isSelected ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {formatScoreBadge(opt)}
                    </span>
                    {isInner && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-sky-200 bg-sky-950/70 border-sky-400/40'
                            : 'text-sky-700 bg-sky-50 border-sky-300'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5 text-sky-500 shrink-0 fill-sky-500" />
                        <span>이너</span>
                      </span>
                    )}
                    {isRecommended && !isInner && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                          isSelected
                            ? 'text-amber-300 bg-amber-950/60 border-amber-400/40'
                            : 'text-amber-700 bg-amber-50 border-amber-300'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        <span>추천</span>
                      </span>
                    )}
                    {isCustom && (
                      <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-950/40 px-1 py-0.2 rounded border border-indigo-400/40 shrink-0">
                        직접선택
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. ITEM (소품 - 다중 선택)
            요구사항: [+이름] -> [이름] 형태로 + 표시 삭제, 선택 시 체크(✓) 표시는 유지 */}
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
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isRecommended
                      ? 'bg-amber-50/40 text-slate-800 border-amber-300 hover:bg-amber-100/50'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* + 표시 삭제, 선택 시에만 체크(✓) 표시 유지 */}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span>{opt}</span>
                  <span
                    className={`text-[10px] font-semibold shrink-0 ${
                      isSelected ? 'text-amber-200' : 'text-slate-400'
                    }`}
                  >
                    {formatScoreBadge(opt)}
                  </span>
                  {isRecommended && (
                    <span
                      className={`text-[9px] font-bold px-1 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${
                        isSelected
                          ? 'text-amber-300 bg-amber-950/60 border-amber-400/40'
                          : 'text-amber-700 bg-amber-50 border-amber-300'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      <span>추천</span>
                    </span>
                  )}
                  {isCustom && (
                    <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200 shrink-0">
                      직접선택
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 실시간 선택 조합 요약 카드 */}
      <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 text-xs text-slate-700 space-y-2">
        {/* 첫 번째 줄: 현재 코디: 복장 커버 기온 약 XX.X°C (상태 라벨) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Shirt className="w-4 h-4 text-blue-600 shrink-0" />
            <span>현재 코디: 복장 커버 기온 약 {coverTemp}°C ({relativeStatus.diff > 0 ? `+${relativeStatus.diff}` : relativeStatus.diff}°C)</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${relativeStatus.badgeStyle}`}>
              {relativeStatus.badgeText}
            </span>
          </div>
        </div>

        {/* 선택된 카테고리 목록 (미선택 카테고리 줄은 조건부로 아예 미렌더링, 최대 4줄) */}
        <div className="space-y-1 text-slate-700 pl-1 font-medium">
          {selection.outer && selection.outer !== '없음' && (
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-500 w-10 shrink-0">외투:</span>
              <span className="font-semibold text-slate-900">{selection.outer}</span>
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
          gender={gender}
          currentTemp={temperature}
        />
      )}
    </div>
  );
};
