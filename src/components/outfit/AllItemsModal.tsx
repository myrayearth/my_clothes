'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { OutfitCategory } from '@/types/outfit';
import { UserGender } from '@/types/database';
import { getAllUniqueCategoryItems } from '@/lib/outfit';
import { filterItemsByGender } from '@/lib/gender';
import { getItemInsulationScore, scoreToCoverTemperature } from '@/lib/insulation';
import { ITEM_SEASONS } from '@/data/itemScores';
import { X, Check, Shirt, Sun, CloudSun, Snowflake } from 'lucide-react';

export type SeasonTab = 'summer' | 'spring_autumn' | 'winter';

interface AllItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: OutfitCategory;
  categoryTitle: string;
  selectedItems: string[]; // outer의 경우 단일 문자열이 1개 원소로 전달됨
  onToggleItem: (item: string) => void;
  isSingleSelect?: boolean;
  gender?: UserGender;
  currentTemp?: number;
}

/**
 * 아이템의 계절 분류 헬퍼 함수
 */
export function getItemSeason(category: OutfitCategory, item: string): SeasonTab {
  if (ITEM_SEASONS[item]) {
    return ITEM_SEASONS[item];
  }

  // 1. 외투 (Outer)
  if (category === 'outer') {
    const winterOuterKeywords = [
      '패딩', '다운', '코트', '무스탕', '플리스', '후리스', '파카'
    ];
    if (winterOuterKeywords.some((kw) => item.includes(kw))) {
      return 'winter';
    }
    return 'spring_autumn';
  }

  // 2. 상의 (Top)
  if (category === 'top') {
    const summerTopKeywords = ['반팔', '민소매', '쿨맥스', '카라 티셔츠', '피케', '7부'];
    const winterTopKeywords = [
      '기모', '히트텍', '발열', '터틀넥', '스웨터', '헤비', '방한', '이너', '경량'
    ];
    if (summerTopKeywords.some((kw) => item.includes(kw))) return 'summer';
    if (winterTopKeywords.some((kw) => item.includes(kw))) return 'winter';
    return 'spring_autumn';
  }

  // 3. 하의 (Bottom)
  if (category === 'bottom') {
    const summerBottomKeywords = ['반바지', '쇼츠', '냉감', '린넨'];
    const winterBottomKeywords = [
      '기모', '본딩', '방한', '패딩', '융기모', '타이즈', '두꺼운 데님', '방풍'
    ];
    if (summerBottomKeywords.some((kw) => item.includes(kw))) return 'summer';
    if (winterBottomKeywords.some((kw) => item.includes(kw))) return 'winter';
    return 'spring_autumn';
  }

  // 4. 소품 (Item)
  if (category === 'items') {
    const summerItemKeywords = ['손풍기', '양산', '쿨링', '쿨토시', '부채', '선글라스', '손수건', '캡모자', '우산'];
    const winterItemKeywords = [
      '장갑', '목도리', '핫팩', '머플러', '비니', '귀마개', '워머', '어그', '방풍', '바라클라바', '스노우', '마스크', '방한', '양말'
    ];
    if (summerItemKeywords.some((kw) => item.includes(kw))) return 'summer';
    if (winterItemKeywords.some((kw) => item.includes(kw))) return 'winter';
    return 'spring_autumn';
  }

  return 'spring_autumn';
}

export const AllItemsModal: React.FC<AllItemsModalProps> = ({
  isOpen,
  onClose,
  category,
  categoryTitle,
  selectedItems,
  onToggleItem,
  isSingleSelect = false,
  gender = 'male',
  currentTemp = 15,
}) => {
  // 기본 계절 탭 계산
  const defaultTab = useMemo<SeasonTab>(() => {
    if (category === 'outer') {
      return currentTemp <= 9 ? 'winter' : 'spring_autumn';
    }
    if (currentTemp >= 25) return 'summer';
    if (currentTemp <= 9) return 'winter';
    return 'spring_autumn';
  }, [category, currentTemp]);

  const [activeTab, setActiveTab] = useState<SeasonTab>(defaultTab);

  // 모달이 열리거나 카테고리/기온이 변경될 때 적절한 탭으로 초기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const allItemsMap = getAllUniqueCategoryItems();
  const rawItems = allItemsMap[category] || [];
  // OUTER에서 '없음' 항목 제외
  const allCategoryItems = category === 'outer' ? rawItems.filter((i) => i !== '없음') : rawItems;
  // 남성 선택 시 여성 전용 복장 필터링
  const genderFilteredItems = filterItemsByGender(allCategoryItems, gender);

  // 현재 활성화된 탭의 아이템 필터링
  const displayedItems = genderFilteredItems.filter(
    (item) => getItemSeason(category, item) === activeTab
  );

  // 각 탭별 통계 (아이템 개수 및 선택된 개수)
  const tabStats = {
    summer: {
      total: genderFilteredItems.filter((i) => getItemSeason(category, i) === 'summer').length,
      selected: selectedItems.filter(
        (i) => i !== '없음' && getItemSeason(category, i) === 'summer'
      ).length,
    },
    spring_autumn: {
      total: genderFilteredItems.filter((i) => getItemSeason(category, i) === 'spring_autumn').length,
      selected: selectedItems.filter(
        (i) => i !== '없음' && getItemSeason(category, i) === 'spring_autumn'
      ).length,
    },
    winter: {
      total: genderFilteredItems.filter((i) => getItemSeason(category, i) === 'winter').length,
      selected: selectedItems.filter(
        (i) => i !== '없음' && getItemSeason(category, i) === 'winter'
      ).length,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* 모달 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Shirt className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {categoryTitle} 전체 카탈로그
              </h3>
              <p className="text-[11px] text-slate-500">
                계절별 탭에서 원하는 복장을 선택하세요 ({isSingleSelect ? '단일 선택' : '다중 선택'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상단 계절별 탭 (Outer: 봄·가을 / 겨울 2개, Top/Bottom/Item: 여름 / 봄·가을 / 겨울 3개) */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70">
          <div
            className={`grid gap-1.5 bg-slate-200/80 p-1 rounded-2xl ${
              category === 'outer' ? 'grid-cols-2' : 'grid-cols-3'
            }`}
          >
            {/* 외투가 아닐 때만 [여름] 탭 노출 */}
            {category !== 'outer' && (
              <button
                type="button"
                onClick={() => setActiveTab('summer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer ${
                  activeTab === 'summer'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-orange-500" />
                <span>여름</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    activeTab === 'summer'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-slate-300/80 text-slate-600'
                  }`}
                >
                  {tabStats.summer.total}
                  {tabStats.summer.selected > 0 && ` • ${tabStats.summer.selected}`}
                </span>
              </button>
            )}

            {/* [봄·가을] 탭 */}
            <button
              type="button"
              onClick={() => setActiveTab('spring_autumn')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer ${
                category === 'outer' ? 'col-span-1' : ''
              } ${
                activeTab === 'spring_autumn'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5 text-blue-500" />
              <span>봄·가을</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  activeTab === 'spring_autumn'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-300/80 text-slate-600'
                }`}
              >
                {tabStats.spring_autumn.total}
                {tabStats.spring_autumn.selected > 0 && ` • ${tabStats.spring_autumn.selected}`}
              </span>
            </button>

            {/* [겨울] 탭 */}
            <button
              type="button"
              onClick={() => setActiveTab('winter')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer ${
                category === 'outer' ? 'col-span-1' : ''
              } ${
                activeTab === 'winter'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-indigo-500" />
              <span>겨울</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  activeTab === 'winter'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-slate-300/80 text-slate-600'
                }`}
              >
                {tabStats.winter.total}
                {tabStats.winter.selected > 0 && ` • ${tabStats.winter.selected}`}
              </span>
            </button>
          </div>
        </div>

        {/* 아이템 목록 그리드 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              {activeTab === 'summer'
                ? '여름 의류'
                : activeTab === 'spring_autumn'
                ? '봄·가을 환절기 의류'
                : '겨울 방한 의류'}{' '}
              ({displayedItems.length}개)
            </span>
            <span className="text-blue-600 font-semibold">
              총 {selectedItems.filter((x) => x && x !== '없음').length}개 선택됨
            </span>
          </div>

          {displayedItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              해당 계절에 등록된 의류가 없습니다.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {displayedItems.map((item) => {
                const isSelected = selectedItems.includes(item);
                const score = getItemInsulationScore(item);
                const itemCoverTemp = Math.round(scoreToCoverTemperature(score));
                const baseTemp = currentTemp !== undefined ? currentTemp : 20;
                const diff = Math.round(itemCoverTemp - baseTemp);
                const scoreBadge = `현재 대비 ${diff > 0 ? `+${diff}` : diff}도`;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onToggleItem(item)}
                    title={
                      isSingleSelect
                        ? isSelected
                          ? '클릭하여 선택 해제'
                          : `${item} 선택`
                        : (category === 'top' || category === 'bottom') &&
                          isSelected &&
                          selectedItems.length === 1
                        ? '최소 1개 선택이 유지되어야 합니다 (다른 옷을 추가 후 해제 가능)'
                        : isSelected
                        ? '클릭하여 선택 해제'
                        : '선택 추가'
                    }
                    className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 touch-manipulation select-none flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    <span>{item}</span>
                    <span
                      className={`text-[10px] font-semibold shrink-0 ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      ({scoreBadge})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            탭을 이동해도 선택된 복장은 안전하게 유지됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
