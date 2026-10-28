import outfitRulesData from '@/data/outfitRules.json';
import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';

const outfitRules: OutfitRuleStep[] = outfitRulesData as OutfitRuleStep[];

/**
 * 기온(섭씨)에 따라 11단계 5°C 단위 기온 룰셋 중 일치하는 단계를 반환합니다.
 * min_temp <= 기온 && 기온 <= max_temp
 */
export function getOutfitRuleByTemperature(temp: number): OutfitRuleStep {
  const roundedTemp = Math.round(temp);
  const matched = outfitRules.find(
    (rule) => roundedTemp >= rule.min_temp && roundedTemp <= rule.max_temp
  );

  if (!matched) {
    if (roundedTemp >= 30) return outfitRules[0];
    return outfitRules[outfitRules.length - 1];
  }

  return matched;
}

/**
 * 룰셋 단계의 대표 추천 의류 선택 객체를 복제하여 반환합니다.
 * - OUTER: recommend.outer 단일 선택
 * - TOP: recommend.top 배열의 아이템들 기본 선택
 * - BOTTOM: recommend.bottom 배열의 아이템들 기본 선택
 * - ITEM: recommend.item 배열의 아이템들 기본 선택
 */
export function getDefaultOutfitSelection(rule: OutfitRuleStep): OutfitSelection {
  return {
    outer: rule.recommend.outer,
    top: [...rule.recommend.top],
    bottom: [...rule.recommend.bottom],
    items: [...rule.recommend.item],
  };
}

/**
 * 11단계 전체 기온 룰셋에 존재하는 모든 카테고리별 의류 아이템 목록을 중복 없이 추출합니다.
 */
export function getAllUniqueCategoryItems(): {
  outer: string[];
  top: string[];
  bottom: string[];
  items: string[];
} {
  const outerSet = new Set<string>();
  const topSet = new Set<string>();
  const bottomSet = new Set<string>();
  const itemsSet = new Set<string>();

  outfitRules.forEach((rule) => {
    rule.outer.forEach((i) => outerSet.add(i));
    rule.top.forEach((i) => topSet.add(i));
    rule.bottom.forEach((i) => bottomSet.add(i));
    rule.item.forEach((i) => itemsSet.add(i));

    if (rule.recommend.outer && rule.recommend.outer !== '없음') {
      outerSet.add(rule.recommend.outer);
    }
    rule.recommend.top.forEach((i) => topSet.add(i));
    rule.recommend.bottom.forEach((i) => bottomSet.add(i));
    rule.recommend.item.forEach((i) => itemsSet.add(i));
  });

  return {
    outer: Array.from(outerSet),
    top: Array.from(topSet),
    bottom: Array.from(bottomSet),
    items: Array.from(itemsSet),
  };
}
