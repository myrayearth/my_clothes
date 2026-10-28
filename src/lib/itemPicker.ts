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
 * 5도 미만 및 0도 미만 시 상의/하의 맨 앞에 고정(Pinning)할 이너 아이템 목록 반환
 * - 0°C 미만: 얇은 이너, 기모 이너 순으로 2종류 전면 배치
 * - 5°C 미만: 얇은 이너 1종류 전면 배치
 */
export function getPinnedInnerItems(
  category: 'outer' | 'top' | 'bottom' | 'items',
  temperature: number
): string[] {
  if (category !== 'top' && category !== 'bottom') return [];
  if (temperature < 0) {
    if (category === 'top') return ['얇은 이너', '기모 이너'];
    if (category === 'bottom') return ['하의 얇은 이너', '하의 기모 이너'];
  } else if (temperature < 5) {
    if (category === 'top') return ['얇은 이너'];
    if (category === 'bottom') return ['하의 얇은 이너'];
  }
  return [];
}

/**
 * 10°C 미만 시 고정(Pinning)할 단일 대표 이너 반환 (하위 호환 유지)
 */
export function getPinnedInnerItem(
  category: 'outer' | 'top' | 'bottom' | 'items',
  temperature: number
): string | null {
  const inners = getPinnedInnerItems(category, temperature);
  return inners.length > 0 ? inners[0] : null;
}

/**
 * 해당 아이템이 현재 기온에서 고정(Pinning)된 이너/발열내의인지 판별
 */
export function isPinnedInnerItem(
  item: string,
  category: 'outer' | 'top' | 'bottom' | 'items',
  temperature: number
): boolean {
  if (category !== 'top' && category !== 'bottom') return false;
  const pinned = getPinnedInnerItems(category, temperature);
  if (pinned.includes(item)) return true;
  return isInnerClothingItem(item);
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
 * 추천 아이템을 중심으로 위/아래 3개씩 총 7개 아이템 슬라이싱 (끝단은 반대쪽 최대 4개)
 * - 상의/하의: 5도 미만 얇은 이너 전면 배치, 0도 미만 얇은 이너+기모 이너 2종 전면 배치
 */
export function getCategorySpectrumItems(
  category: 'outer' | 'top' | 'bottom' | 'items',
  tierIndex: number,
  temperature: number,
  gender: UserGender = 'male'
): string[] {
  // 1. 표준 카테고리 전체 아이템 가져오기 및 성별 필터링
  const rawList = STANDARD_ITEMS_BY_CATEGORY[category]
    ? STANDARD_ITEMS_BY_CATEGORY[category].map((i) => i.name)
    : [];
  const genderFiltered = filterItemsByGender(rawList, gender);

  // 보온 점수 순 오름차순 정렬 (얇은 옷 -> 두꺼운 옷)
  const sorted = [...genderFiltered].sort(
    (a, b) => getItemInsulationScore(a) - getItemInsulationScore(b)
  );

  // 2. 상의/하의의 경우 이너 아이템 분리
  const isTopOrBottom = category === 'top' || category === 'bottom';
  const mainItems = isTopOrBottom ? sorted.filter((it) => !isInnerClothingItem(it)) : sorted;

  // 3. 현재 온도의 추천 대표 아이템(centerItem) 도출
  const rule = outfitRules[tierIndex] || outfitRules[0];
  let centerItem = '';

  if (category === 'outer') {
    centerItem = rule.recommend.outer;
    if (!centerItem || centerItem === '없음') {
      centerItem = mainItems[0] || '';
    }
  } else if (category === 'items') {
    centerItem = (rule.recommend.item && rule.recommend.item[0]) || mainItems[0] || '';
  } else {
    // 상의/하의: recommend 중 본의류(이너 제외) 우선 추출
    const recs = rule.recommend[category] || [];
    const nonInnerRec = recs.find((it) => !isInnerClothingItem(it));
    centerItem = nonInnerRec || recs[0] || mainItems[0] || '';
  }

  // 4. 본의류 목록에서 centerItem 인덱스 찾기
  let centerIndex = mainItems.indexOf(centerItem);
  if (centerIndex === -1) {
    const targetScore = getItemInsulationScore(centerItem);
    let minDiff = Infinity;
    mainItems.forEach((it, idx) => {
      const diff = Math.abs(getItemInsulationScore(it) - targetScore);
      if (diff < minDiff) {
        minDiff = diff;
        centerIndex = idx;
      }
    });
  }
  if (centerIndex === -1) {
    centerIndex = Math.floor(mainItems.length / 2);
  }

  // 5. 중심 아이템 기준 위/아래 3개씩 총 7개 슬라이싱 (끝단은 반대쪽 최대 4개)
  const L = mainItems.length;
  let downCount = Math.min(3, centerIndex);
  let upCount = Math.min(3, L - 1 - centerIndex);

  if (centerIndex < 3) {
    // 아래쪽 부족 (한쪽 끝: 민소매 등) -> 반대쪽(위쪽) 최대 4개까지
    upCount = Math.min(4, L - 1 - centerIndex);
  } else if (L - 1 - centerIndex < 3) {
    // 위쪽 부족 (한쪽 끝: 헤비다운 등) -> 반대쪽(아래쪽) 최대 4개까지
    downCount = Math.min(4, centerIndex);
  }

  const startIndex = Math.max(0, centerIndex - downCount);
  const endIndex = Math.min(L - 1, centerIndex + upCount);
  const slicedMain = mainItems.slice(startIndex, endIndex + 1);

  // 6. 5도 미만 / 0도 미만 이너 순차 전면 배치
  if (isTopOrBottom) {
    const pinnedInners = getPinnedInnerItems(category, temperature);
    return [...pinnedInners, ...slicedMain];
  }

  return slicedMain;
}

/**
 * 현재 기온과 성별에 맞춘 4개 카테고리 스펙트럼 선택지 맵 반환 (중심 기준 7개 + 이너)
 */
export function getSpectrumOutfitOptions(
  temperature: number,
  gender: UserGender = 'male'
): SpectrumOutfitOptions {
  const tierIndex = getOutfitRuleIndexByTemperature(temperature);

  return {
    outer: getCategorySpectrumItems('outer', tierIndex, temperature, gender),
    top: getCategorySpectrumItems('top', tierIndex, temperature, gender),
    bottom: getCategorySpectrumItems('bottom', tierIndex, temperature, gender),
    items: getCategorySpectrumItems('items', tierIndex, temperature, gender),
  };
}
