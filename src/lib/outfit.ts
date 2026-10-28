import outfitRulesData from '@/data/outfitRules.json';
import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';

const outfitRules: OutfitRuleStep[] = outfitRulesData as OutfitRuleStep[];

/**
 * 기온(섭씨)에 따라 8단계 기온 룰셋 중 일치하는 단계를 반환합니다.
 */
export function getOutfitRuleByTemperature(temp: number): OutfitRuleStep {
  const roundedTemp = Math.round(temp);
  const matched = outfitRules.find(
    (rule) => roundedTemp >= rule.minTemp && roundedTemp <= rule.maxTemp
  );

  // 일치하는 규칙이 없으면 가장 가까운 경계값 반환
  if (!matched) {
    if (roundedTemp >= 28) return outfitRules[0];
    return outfitRules[outfitRules.length - 1];
  }

  return matched;
}

/**
 * 룰셋 단계의 기본 의류 선택 객체를 복제하여 반환합니다.
 */
export function getDefaultOutfitSelection(rule: OutfitRuleStep): OutfitSelection {
  return {
    outer: rule.defaults.outer,
    top: rule.defaults.top,
    bottom: rule.defaults.bottom,
    items: [...rule.defaults.items],
  };
}
