import outfitRulesData from '@/data/outfitRules.json';
import { OutfitRuleStep, OutfitSelection, OutfitCategory } from '@/types/outfit';

const outfitRules: OutfitRuleStep[] = outfitRulesData as OutfitRuleStep[];

/**
 * 기온(섭씨)에 따라 8단계 기온 룰셋 중 일치하는 단계를 반환합니다.
 */
export function getOutfitRuleByTemperature(temp: number): OutfitRuleStep {
  const roundedTemp = Math.round(temp);
  const matched = outfitRules.find(
    (rule) => roundedTemp >= rule.minTemp && roundedTemp <= rule.maxTemp
  );

  if (!matched) {
    if (roundedTemp >= 28) return outfitRules[0];
    return outfitRules[outfitRules.length - 1];
  }

  return matched;
}

/**
 * 룰셋 단계의 기본 의류 선택 객체를 복제하여 반환합니다.
 * (상/하의 다중 선택 지원을 위해 배열로 래핑)
 */
export function getDefaultOutfitSelection(rule: OutfitRuleStep): OutfitSelection {
  return {
    outer: rule.defaults.outer,
    top: [rule.defaults.top],
    bottom: [rule.defaults.bottom],
    items: [...rule.defaults.items],
  };
}

/**
 * 8단계 전체 기온 룰셋에 존재하는 모든 카테고리별 의류 아이템 목록을 중복 없이 추출합니다.
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
    rule.options.outer.forEach((i) => outerSet.add(i));
    rule.options.top.forEach((i) => topSet.add(i));
    rule.options.bottom.forEach((i) => bottomSet.add(i));
    rule.options.items.forEach((i) => itemsSet.add(i));
  });

  return {
    outer: Array.from(outerSet),
    top: Array.from(topSet),
    bottom: Array.from(bottomSet),
    items: Array.from(itemsSet),
  };
}
