import { supabase } from '@/lib/storage';
import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';

export interface ItemScoreStat {
  name: string;
  score: number; // 평균 적합도 점수 (0 ~ 5)
  count: number; // 평가 횟수
}

export interface TemperatureAggregatedResult {
  target_temp: number;
  total_eval_count: number;
  outers: ItemScoreStat[];
  tops: ItemScoreStat[];
  bottoms: ItemScoreStat[];
  items: ItemScoreStat[];
}

/**
 * 기온별 전체 누적 평가 데이터를 기반으로 집계된 상위 추천 아이템을 조회합니다.
 */
export async function fetchAggregatedRecommendations(
  targetTemp: number
): Promise<TemperatureAggregatedResult | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc(
      'get_temperature_aggregated_recommendations',
      { target_temperature: targetTemp }
    );

    if (error || !data) {
      console.warn('RPC aggregated recommendations error:', error?.message);
      return null;
    }

    return data as TemperatureAggregatedResult;
  } catch (e) {
    console.warn('Failed to fetch aggregated recommendations:', e);
    return null;
  }
}

/**
 * 기본 기온 룰셋(11단계)과 누적 평가 집계 결과를 결합하여
 * 가장 높은 평가를 받은 상위 아이템이 우선순위로 배치된 동적 추천 옵션 목록을 산출합니다.
 */
export function getPrioritizedOutfitOptions(
  rule: OutfitRuleStep,
  aggregated: TemperatureAggregatedResult | null
): {
  options: {
    outer: string[];
    top: string[];
    bottom: string[];
    items: string[];
  };
  defaults: OutfitSelection;
  aggregatedCount: number;
} {
  // 기본 외투 목록에서 '없음' 제거
  const baseOuter = rule.outer.filter((item) => item !== '없음');
  const baseTop = [...rule.top];
  const baseBottom = [...rule.bottom];
  const baseItems = [...rule.item];

  // recommend 항목이 후보 리스트에 누락된 경우 선두에 포함 보장
  if (rule.recommend.outer !== '없음' && !baseOuter.includes(rule.recommend.outer)) {
    baseOuter.unshift(rule.recommend.outer);
  }
  rule.recommend.top.forEach((t) => {
    if (!baseTop.includes(t)) baseTop.unshift(t);
  });
  rule.recommend.bottom.forEach((b) => {
    if (!baseBottom.includes(b)) baseBottom.unshift(b);
  });
  rule.recommend.item.forEach((i) => {
    if (!baseItems.includes(i)) baseItems.unshift(i);
  });

  const ruleDefaults: OutfitSelection = {
    outer: rule.recommend.outer,
    top: [...rule.recommend.top],
    bottom: [...rule.recommend.bottom],
    items: [...rule.recommend.item],
  };

  if (!aggregated || aggregated.total_eval_count === 0) {
    return {
      options: {
        outer: baseOuter,
        top: baseTop,
        bottom: baseBottom,
        items: baseItems,
      },
      defaults: ruleDefaults,
      aggregatedCount: 0,
    };
  }

  // 집계 데이터에서 평점 높은 순서대로 추출
  const sortAndMerge = (baseList: string[], evaluatedList: ItemScoreStat[]): string[] => {
    const highRated = evaluatedList
      .filter((i) => i.score >= 1.0)
      .map((i) => i.name);

    // 고평가 아이템 우선 배치 + 기존 룰셋 아이템 중복 제거 병합
    const merged = Array.from(new Set([...highRated, ...baseList]));
    return merged;
  };

  const prioritizedOuter = sortAndMerge(baseOuter, aggregated.outers);
  const prioritizedTop = sortAndMerge(baseTop, aggregated.tops);
  const prioritizedBottom = sortAndMerge(baseBottom, aggregated.bottoms);
  const prioritizedItems = sortAndMerge(baseItems, aggregated.items);

  // 동적 기본 선택값: 평가 1위 아이템이 있으면 1위 아이템으로 자동 반영
  const bestOuter =
    aggregated.outers.length > 0 && aggregated.outers[0].score >= 1.0
      ? aggregated.outers[0].name
      : ruleDefaults.outer;

  const bestTop =
    aggregated.tops.length > 0 && aggregated.tops[0].score >= 1.0
      ? [aggregated.tops[0].name]
      : ruleDefaults.top;

  const bestBottom =
    aggregated.bottoms.length > 0 && aggregated.bottoms[0].score >= 1.0
      ? [aggregated.bottoms[0].name]
      : ruleDefaults.bottom;

  const bestItems =
    aggregated.items.length > 0 && aggregated.items[0].score >= 1.0
      ? [aggregated.items[0].name]
      : ruleDefaults.items;

  return {
    options: {
      outer: prioritizedOuter,
      top: prioritizedTop,
      bottom: prioritizedBottom,
      items: prioritizedItems,
    },
    defaults: {
      outer: bestOuter,
      top: bestTop,
      bottom: bestBottom,
      items: bestItems,
    },
    aggregatedCount: aggregated.total_eval_count,
  };
}
