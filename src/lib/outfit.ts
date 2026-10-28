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
 * - 10°C 미만 (초겨울/겨울 추위/한파): 상/하의 보온 확보를 위해 이너 + 본의류 중복 기본 선택
 * - 10°C 이상: 이너는 기본 선택에서 제외하고 본의류만 단독 선택
 */
export function getDefaultOutfitSelection(rule: OutfitRuleStep, targetTemp?: number): OutfitSelection {
  const effectiveTemp = typeof targetTemp === 'number' ? targetTemp : (rule.min_temp + rule.max_temp) / 2;
  const isColdWeather = effectiveTemp < 10;

  let selectedTop: string[];
  let selectedBottom: string[];

  if (isColdWeather) {
    // 10°C 미만: 룰셋의 대표 추천(이너 + 본의류)을 그대로 복수 선택
    selectedTop = [...rule.recommend.top];
    selectedBottom = [...rule.recommend.bottom];

    // 만약 룰셋에 이너가 누락되어 있다면 자동 보강
    const hasInnerTop = selectedTop.some(isInnerClothingItem);
    if (!hasInnerTop) {
      const defaultInnerTop = effectiveTemp < 0 ? '기모 이너' : '얇은 이너';
      selectedTop = [defaultInnerTop, ...selectedTop];
    }
    const hasInnerBottom = selectedBottom.some(isInnerClothingItem);
    if (!hasInnerBottom) {
      const defaultInnerBottom = effectiveTemp < 0 ? '하의 기모 이너' : '하의 얇은 이너';
      selectedBottom = [defaultInnerBottom, ...selectedBottom];
    }
  } else {
    // 10°C 이상: 이너는 기본 선택에서 제외하고 본의류만 단독 선택
    const nonInnerTop = rule.recommend.top.filter((i) => !isInnerClothingItem(i));
    const nonInnerBottom = rule.recommend.bottom.filter((i) => !isInnerClothingItem(i));
    selectedTop = nonInnerTop.length > 0 ? nonInnerTop : [rule.recommend.top[rule.recommend.top.length - 1] || '기본 반팔'];
    selectedBottom = nonInnerBottom.length > 0 ? nonInnerBottom : [rule.recommend.bottom[rule.recommend.bottom.length - 1] || '기본 긴바지'];
  }

  return {
    outer: rule.recommend.outer,
    top: selectedTop,
    bottom: selectedBottom,
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
