import outfitRulesData from '@/data/outfitRules.json';
import { STANDARD_ITEMS_BY_CATEGORY } from '@/data/itemScores';
import { getItemInsulationScore } from '@/lib/insulation';
import { filterItemsByGender } from '@/lib/gender';
import { OutfitRuleStep } from '@/types/outfit';
import { UserGender } from '@/types/database';

const outfitRules: OutfitRuleStep[] = outfitRulesData as OutfitRuleStep[];

export interface SpectrumOutfitOptions {
  outer: string[];
  top: string[];
  bottom: string[];
  items: string[];
}

/**
 * 기온에 따른 룰셋 인덱스 (0: 30°C+ ~ 10: -15°C 이하) 조회
 */
export function getOutfitRuleIndexByTemperature(temp: number): number {
  const roundedTemp = Math.round(temp);
  const matchedIndex = outfitRules.findIndex(
    (rule) => roundedTemp >= rule.min_temp && roundedTemp <= rule.max_temp
  );

  if (matchedIndex !== -1) return matchedIndex;
  if (roundedTemp >= 30) return 0;
  return outfitRules.length - 1;
}

/**
 * 10°C 미만 시 고정(Pinning)할 이너/발열내의 아이템 반환
 * - T <= -5°C (혹한기): 상의 '기모 이너', 하의 '하의 기모 이너'
 * - T < 10°C (추운 날씨): 상의 '얇은 이너', 하의 '하의 얇은 이너'
 */
export function getPinnedInnerItem(
  category: 'outer' | 'top' | 'bottom' | 'items',
  temperature: number
): string | null {
  if (temperature <= -5) {
    if (category === 'top') return '기모 이너';
    if (category === 'bottom') return '하의 기모 이너';
  } else if (temperature < 10) {
    if (category === 'top') return '얇은 이너';
    if (category === 'bottom') return '하의 얇은 이너';
  }
  return null;
}

/**
 * 해당 아이템이 현재 기온에서 고정(Pinning)된 이너/발열내의인지 판별
 */
export function isPinnedInnerItem(
  item: string,
  category: 'outer' | 'top' | 'bottom' | 'items',
  temperature: number
): boolean {
  if (temperature >= 10) return false;

  const directPinned = getPinnedInnerItem(category, temperature);
  if (directPinned && item === directPinned) return true;

  if (category === 'top') {
    return (
      item === '얇은 이너' ||
      item === '기모 이너' ||
      item === '기본 발열내의 (히트텍)' ||
      item === '특수 방한내의' ||
      item === '최고등급 발열내의'
    );
  }
  if (category === 'bottom') {
    return (
      item === '하의 얇은 이너' ||
      item === '하의 기모 이너' ||
      item === '하의 기본 발열내의' ||
      item === '하의 특수 방한내의'
    );
  }

  return false;
}

/**
 * 아이템 이름 기반 이너/발열내의/방한내의/타이즈 판별 함수
 */
export function isInnerClothingItem(item: string): boolean {
  if (!item) return false;
  return (
    item === '얇은 이너' ||
    item === '기모 이너' ||
    item === '하의 얇은 이너' ||
    item === '하의 기모 이너' ||
    item.includes('이너') ||
    item.includes('히트텍') ||
    item.includes('발열내의') ||
    item.includes('방한내의') ||
    item.includes('타이즈') ||
    item.includes('내의')
  );
}

/**
 * 단일 카테고리에 대한 스펙트럼 기반 선택지 추출 (카테고리당 10~14종 전체 스펙트럼 배치)
 */
export function getCategorySpectrumItems(
  category: 'outer' | 'top' | 'bottom' | 'items',
  tierIndex: number,
  temperature: number,
  gender: UserGender = 'male',
  targetCount: number = 14
): string[] {
  const pinnedItem = getPinnedInnerItem(category, temperature);
  const result: string[] = [];
  const seen = new Set<string>();

  const add = (item: string | undefined | null): boolean => {
    if (!item || item === '없음' || item.trim() === '' || seen.has(item)) return false;
    seen.add(item);
    result.push(item);
    return true;
  };

  const poolOf = (idx: number): string[] => {
    if (idx < 0 || idx >= outfitRules.length) return [];
    const raw = category === 'items' ? outfitRules[idx].item : outfitRules[idx][category];
    const clean = (raw || []).filter((i) => i && i !== '없음');
    return filterItemsByGender(clean, gender);
  };

  const repOf = (idx: number): string[] => {
    if (idx < 0 || idx >= outfitRules.length) return [];
    const r = outfitRules[idx].recommend;
    const raw =
      category === 'outer'
        ? r.outer && r.outer !== '없음'
          ? [r.outer]
          : []
        : category === 'items'
        ? r.item || []
        : r[category] || [];
    return filterItemsByGender((raw || []).filter((i) => i && i !== '없음'), gender);
  };

  // 1. [유사 보온 3개]: 현재 구간(i) 대표 1개 + 현재 후보군 2개
  const repList = repOf(tierIndex);
  for (const it of repList) {
    if (add(it)) break;
  }
  let cCur = 0;
  for (const it of poolOf(tierIndex)) {
    if (cCur >= 2) break;
    if (add(it)) cCur++;
  }

  // 2. [1단계 더 따뜻함 2개]: i+1 후보군 2개
  let cPlus1 = 0;
  for (const it of poolOf(tierIndex + 1)) {
    if (cPlus1 >= 2) break;
    if (add(it)) cPlus1++;
  }

  // 3. [2단계 이상 더 따뜻함 1개]: i+2 후보군 1개
  let cPlus2 = 0;
  for (const it of poolOf(tierIndex + 2)) {
    if (cPlus2 >= 1) break;
    if (add(it)) cPlus2++;
  }

  // 4. [1단계 더 시원함 2개]: i-1 후보군 2개
  let cMinus1 = 0;
  for (const it of poolOf(tierIndex - 1)) {
    if (cMinus1 >= 2) break;
    if (add(it)) cMinus1++;
  }

  // 5. [2단계 이상 더 시원함 1개]: i-2 후보군 1개
  let cMinus2 = 0;
  for (const it of poolOf(tierIndex - 2)) {
    if (cMinus2 >= 1) break;
    if (add(it)) cMinus2++;
  }

  // 6. 경계 구간 처리: 폭염 또는 혹한으로 인덱스를 벗어나 슬롯이 남을 때 인접 유효 구간으로 보충
  for (let dist = 1; dist < outfitRules.length && result.length < targetCount; dist++) {
    const dirs = tierIndex <= 2 ? [-1, 1] : [1, -1];
    for (const dir of dirs) {
      const idx = tierIndex + dist * dir;
      if (idx >= 0 && idx < outfitRules.length) {
        for (const it of poolOf(idx)) {
          if (result.length >= targetCount) break;
          add(it);
        }
        for (const it of repOf(idx)) {
          if (result.length >= targetCount) break;
          add(it);
        }
      }
    }
  }

  // 극단적인 경계에서 여전히 부족할 경우 표준 카탈로그에서 성별 필터 후 보충
  if (result.length < targetCount && STANDARD_ITEMS_BY_CATEGORY[category]) {
    const std = filterItemsByGender(
      STANDARD_ITEMS_BY_CATEGORY[category].map((i) => i.name),
      gender
    );
    for (const it of std) {
      if (result.length >= targetCount) break;
      add(it);
    }
  }

  // 7. 정렬 및 10°C 미만 Pinning 처리
  let others = result;
  if (pinnedItem) {
    others = others.filter((it) => it !== pinnedItem);
  }

  // 보온 점수 오름차순 (얇은 옷 -> 두꺼운 옷) 자연스러운 정렬
  others.sort((a, b) => getItemInsulationScore(a) - getItemInsulationScore(b));

  // 10°C 미만 시 얇은 이너 / 기모 이너는 레이어드 편의를 위해 맨 앞(index 0)에 고정
  let finalItems = pinnedItem ? [pinnedItem, ...others] : others;

  // 최대 14개로 캡 (신규 압축 카탈로그 전체 포함 및 2줄 레이아웃 최적화)
  if (finalItems.length > 14) {
    finalItems = finalItems.slice(0, 14);
  }

  return finalItems;
}

/**
 * 현재 기온과 성별에 맞춘 4개 카테고리 전체 스펙트럼 선택지 맵 반환 (카테고리별 10~14개)
 */
export function getSpectrumOutfitOptions(
  temperature: number,
  gender: UserGender = 'male',
  targetCount: number = 14
): SpectrumOutfitOptions {
  const tierIndex = getOutfitRuleIndexByTemperature(temperature);

  return {
    outer: getCategorySpectrumItems('outer', tierIndex, temperature, gender, targetCount),
    top: getCategorySpectrumItems('top', tierIndex, temperature, gender, targetCount),
    bottom: getCategorySpectrumItems('bottom', tierIndex, temperature, gender, targetCount),
    items: getCategorySpectrumItems('items', tierIndex, temperature, gender, targetCount),
  };
}
