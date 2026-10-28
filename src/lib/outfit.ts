import outfitRulesData from '@/data/outfitRules.json';
import { STANDARD_ITEMS_BY_CATEGORY } from '@/data/itemScores';
import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';
import { isInnerClothingItem } from '@/lib/itemPicker';

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
 * - TOP: recommend.top 중 이너 항목을 제외한 주 추천 아이템 기본 선택
 * - BOTTOM: recommend.bottom 중 이너 항목을 제외한 주 추천 아이템 기본 선택
 * - ITEM: recommend.item 배열의 아이템들 기본 선택
 */
export function getDefaultOutfitSelection(rule: OutfitRuleStep): OutfitSelection {
  const nonInnerTop = rule.recommend.top.filter((i) => !isInnerClothingItem(i));
  const nonInnerBottom = rule.recommend.bottom.filter((i) => !isInnerClothingItem(i));

  return {
    outer: rule.recommend.outer,
    top: nonInnerTop.length > 0 ? nonInnerTop : [rule.recommend.top[rule.recommend.top.length - 1] || '기본 반팔'],
    bottom: nonInnerBottom.length > 0 ? nonInnerBottom : [rule.recommend.bottom[rule.recommend.bottom.length - 1] || '기본 긴바지'],
    items: [...rule.recommend.item],
  };
}

/**
 * 11단계 전체 기온 룰셋 및 표준 카탈로그에 존재하는 모든 카테고리별 의류 아이템 목록을 중복 없이 추출합니다.
 */
export function getAllUniqueCategoryItems(): {
  outer: string[];
  top: string[];
  bottom: string[];
  items: string[];
} {
  const outerSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.outer.map((i) => i.name));
  const topSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.top.map((i) => i.name));
  const bottomSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.bottom.map((i) => i.name));
  const itemsSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.items.map((i) => i.name));

  outfitRules.forEach((rule) => {
    rule.outer.forEach((i) => {
      if (i && i !== '없음') outerSet.add(i);
    });
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
