import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';
import { OutfitLog, UserGender } from '@/types/database';
import { filterItemsByGender } from '@/lib/gender';
import { getSpectrumOutfitOptions, isInnerClothingItem } from '@/lib/itemPicker';

export interface RecommendationWeights {
  mode: 'rule_only' | 'guest_weighted' | 'personal_weighted';
  w_personal: number;
  w_guest: number;
  w_rule: number;
  personalCount: number;
  guestCount: number;
  totalCount: number;
  description: string;
}

export interface CalculatedOutfitOptions {
  options: {
    outer: string[];
    top: string[];
    bottom: string[];
    items: string[];
  };
  defaults: OutfitSelection;
  weights: RecommendationWeights;
}

/**
 * 기온 및 체감 점수(-5 ~ +5) 기반 착용 적합도 점수 환산 (0 ~ 5점)
 * 편차가 0일 때 5점 만점, ±5도일 때 0점
 */
function getSuitabilityScore(score: number): number {
  return Math.max(0, 5 - Math.abs(score));
}

/**
 * 특정 로그 그룹에서 해당 아이템의 평균 만족도 점수 및 착용 횟수 계산
 */
function calculateGroupItemScore(
  item: string,
  category: 'outer' | 'top' | 'bottom' | 'item',
  logs: OutfitLog[]
): { avgScore: number; count: number } {
  const relevantLogs = logs.filter((log) => {
    if (category === 'outer') return log.selected_outer === item;
    if (category === 'top') {
      const topArr = Array.isArray(log.selected_top) ? log.selected_top : [log.selected_top];
      return topArr.includes(item);
    }
    if (category === 'bottom') {
      const btmArr = Array.isArray(log.selected_bottom) ? log.selected_bottom : [log.selected_bottom];
      return btmArr.includes(item);
    }
    const itmArr = log.selected_items || [];
    return itmArr.includes(item);
  });

  if (relevantLogs.length === 0) {
    return { avgScore: 0, count: 0 };
  }

  const totalSuitability = relevantLogs.reduce((sum, log) => sum + getSuitabilityScore(log.score), 0);
  return {
    avgScore: totalSuitability / relevantLogs.length,
    count: relevantLogs.length,
  };
}

/**
 * 데이터 오염 방지 및 개인화 가중치 기반 동적 복장 추천 엔진
 *
 * [가중치 산출 원칙]
 * 1. 평가 0건: 기본 추천 100%
 * 2. 개인 평가 1건 이상: 개인 평가 최우선 (내 평가 70~80% + 누적/기본 반영)
 * 3. 누적 평가 1건 이상: 게스트/전체 누적 평가 반영 (누적 평가 75% + 기본 25%)
 */
export function calculateWeightedRecommendations(
  rule: OutfitRuleStep,
  allLogs: OutfitLog[],
  targetTemp: number,
  currentUser: string,
  isLoggedIn: boolean,
  gender: UserGender = 'male'
): CalculatedOutfitOptions {
  // 1. 스펙트럼 기반 기본 후보 목록 (각 카테고리별 10~14개 스펙트럼 배치 및 10°C 미만 이너 핀 고정)
  const spectrumOptions = getSpectrumOutfitOptions(targetTemp, gender, 14);
  const rawOuter = spectrumOptions.outer;
  const rawTop = spectrumOptions.top;
  const rawBottom = spectrumOptions.bottom;
  const rawItems = spectrumOptions.items;

  // 성별 필터링 적용된 대표 추천 기본값
  const filteredRecOuter = filterItemsByGender([rule.recommend.outer], gender)[0] || (rawOuter[0] || '없음');
  const filteredRecTop = filterItemsByGender(rule.recommend.top, gender);
  const filteredRecBottom = filterItemsByGender(rule.recommend.bottom, gender);
  const filteredRecItems = filterItemsByGender(rule.recommend.item, gender);

  const nonInnerRecTop = filteredRecTop.filter((i) => !isInnerClothingItem(i));
  const nonInnerRecBottom = filteredRecBottom.filter((i) => !isInnerClothingItem(i));

  const fallbackDefaults: OutfitSelection = {
    outer: filteredRecOuter,
    top: nonInnerRecTop.length > 0 ? nonInnerRecTop : (filteredRecTop.length > 0 ? filteredRecTop : [rawTop[0] || '기본 반팔']),
    bottom: nonInnerRecBottom.length > 0 ? nonInnerRecBottom : (filteredRecBottom.length > 0 ? filteredRecBottom : [rawBottom[0] || '기본 긴바지']),
    items: filteredRecItems,
  };

  // 2. 현재 기온(±2.5°C)과 매칭되는 로그 추출
  const tempTolerance = 2.5;
  const matchedLogs = allLogs.filter(
    (log) => Math.abs(log.target_temp - targetTemp) <= tempTolerance
  );

  // 3. 개인 평가와 게스트 평가 분리
  const isPersonalLog = (log: OutfitLog) =>
    Boolean(
      isLoggedIn &&
      currentUser &&
      currentUser !== '게스트' &&
      log.user_name === currentUser
    );

  const personalLogs = matchedLogs.filter(isPersonalLog);
  const guestLogs = matchedLogs.filter((log) => !isPersonalLog(log));

  const personalCount = personalLogs.length;
  const guestCount = guestLogs.length;
  const totalCount = matchedLogs.length;

  // 4. 가중치 결정 (1건의 평가라도 즉시 반영되도록 완화)
  let w_personal = 0;
  let w_guest = 0;
  let w_rule = 1.0;
  let mode: RecommendationWeights['mode'] = 'rule_only';
  let description = '기본 룰셋 100% 적용';

  if (personalCount > 0) {
    mode = 'personal_weighted';
    if (guestCount > 0) {
      w_personal = 0.7;
      w_guest = 0.2;
      w_rule = 0.1;
      description = `개인화 맞춤 (내 평가 70% + 전체 20% + 기본 10%)`;
    } else {
      w_personal = 0.8;
      w_guest = 0;
      w_rule = 0.2;
      description = `개인화 맞춤 (내 평가 80% + 기본 20%)`;
    }
  } else if (guestCount > 0) {
    mode = 'guest_weighted';
    w_personal = 0;
    w_guest = 0.75;
    w_rule = 0.25;
    description = `전체 누적 평가 반영 (누적 평가 75% + 기본 25%)`;
  } else {
    mode = 'rule_only';
    w_personal = 0;
    w_guest = 0;
    w_rule = 1.0;
    description = '기본 룰셋 100% 적용';
  }

  const weights: RecommendationWeights = {
    mode,
    w_personal,
    w_guest,
    w_rule,
    personalCount,
    guestCount,
    totalCount,
    description,
  };

  // 평가가 전혀 없는 경우 즉시 룰셋 기본값 반환
  if (w_rule === 1.0) {
    return {
      options: {
        outer: rawOuter,
        top: rawTop,
        bottom: rawBottom,
        items: rawItems,
      },
      defaults: fallbackDefaults,
      weights,
    };
  }

  // 5. 카테고리별 종합 점수 산출 및 랭킹 정렬 함수
  const scoreAndRankCategory = (
    candidateList: string[],
    recommendList: string[],
    category: 'outer' | 'top' | 'bottom' | 'item'
  ): { rankedOptions: string[]; topItem: string } => {
    // 로그에서 사용된 아이템들도 후보 목록에 성별 필터링 후 병합
    const loggedItems = matchedLogs.flatMap((log) => {
      if (category === 'outer') return log.selected_outer ? [log.selected_outer] : [];
      if (category === 'top') return Array.isArray(log.selected_top) ? log.selected_top : (log.selected_top ? [log.selected_top] : []);
      if (category === 'bottom') return Array.isArray(log.selected_bottom) ? log.selected_bottom : (log.selected_bottom ? [log.selected_bottom] : []);
      return log.selected_items || [];
    }).filter((name) => Boolean(name) && name !== '없음');

    const validLoggedItems = filterItemsByGender(loggedItems, gender);
    const allCandidateSet = new Set<string>([...candidateList, ...recommendList, ...validLoggedItems]);
    const items = Array.from(allCandidateSet);

    const scoredItems = items.map((item) => {
      // 1) 룰셋 사전 베이스라인 점수 (대표 추천: 3.2, 스펙트럼 후보: 2.0, 그 외: 1.5)
      const ruleScore = recommendList.includes(item) ? 3.2 : candidateList.includes(item) ? 2.0 : 1.5;

      // 2) 개인 평가 점수
      // - 착용 기록이 있는 경우: avgScore(0~5점) + 만족(3.5점 이상) 시 착용 빈도 신뢰도 보너스
      // - 착용 기록이 없는 경우: 사전 베이스라인(ruleScore) 부여
      const pStat = calculateGroupItemScore(item, category, personalLogs);
      const personalScore = pStat.count > 0
        ? pStat.avgScore + (pStat.avgScore >= 3.5 ? Math.min(0.5, pStat.count * 0.2) : 0)
        : ruleScore;

      // 3) 게스트/누적 평가 점수
      const gStat = calculateGroupItemScore(item, category, guestLogs);
      const guestScore = gStat.count > 0
        ? gStat.avgScore + (gStat.avgScore >= 3.5 ? Math.min(0.5, gStat.count * 0.1) : 0)
        : ruleScore;

      // 4) 가중 종합 점수
      const finalScore =
        w_personal * personalScore + w_guest * guestScore + w_rule * ruleScore;

      return { item, finalScore, count: pStat.count + gStat.count };
    });

    // 점수 높은 순 정렬
    scoredItems.sort((a, b) => b.finalScore - a.finalScore);

    const rankedOptions = scoredItems.map((s) => s.item);
    const topItem = rankedOptions[0] || (recommendList[0] || candidateList[0]);

    return { rankedOptions, topItem };
  };

  const outerResult = scoreAndRankCategory(rawOuter, [filteredRecOuter], 'outer');
  const topResult = scoreAndRankCategory(rawTop, filteredRecTop, 'top');
  const bottomResult = scoreAndRankCategory(rawBottom, filteredRecBottom, 'bottom');
  const itemResult = scoreAndRankCategory(rawItems, filteredRecItems, 'item');

  // 외투 1위 결정 (외투는 '없음' 추천이 기본일 때 고평가 외투가 없으면 '없음' 유지)
  let bestOuter = outerResult.topItem;
  if (filteredRecOuter === '없음' && mode === 'rule_only') {
    bestOuter = '없음';
  }

  const bestTop = topResult.rankedOptions.find((i) => !isInnerClothingItem(i)) || topResult.topItem;
  const bestBottom = bottomResult.rankedOptions.find((i) => !isInnerClothingItem(i)) || bottomResult.topItem;

  // 소품: 평가 로그에서 만족도(avgScore >= 3.0)가 높은 소품이 있으면 우선 포함, 없으면 기본 추천 소품 유지
  const highRatedItems = itemResult.rankedOptions.filter((item) => {
    const pStat = calculateGroupItemScore(item, 'item', personalLogs);
    const gStat = calculateGroupItemScore(item, 'item', guestLogs);
    const hasLog = pStat.count > 0 || gStat.count > 0;
    const avgScore = (pStat.count * pStat.avgScore + gStat.count * gStat.avgScore) / (pStat.count + gStat.count || 1);
    return hasLog && avgScore >= 3.0;
  });

  const bestItems = highRatedItems.length > 0 ? highRatedItems : filteredRecItems;

  // 기존 스펙트럼 옵션 순서에 랭킹 아이템을 자연스럽게 우선 배치
  const mergeRankedWithSpectrum = (ranked: string[], spectrum: string[]) => {
    const set = new Set(ranked);
    const remaining = spectrum.filter((item) => !set.has(item));
    return [...ranked, ...remaining];
  };

  return {
    options: {
      outer: mergeRankedWithSpectrum(outerResult.rankedOptions, rawOuter),
      top: mergeRankedWithSpectrum(topResult.rankedOptions, rawTop),
      bottom: mergeRankedWithSpectrum(bottomResult.rankedOptions, rawBottom),
      items: mergeRankedWithSpectrum(itemResult.rankedOptions, rawItems),
    },
    defaults: {
      outer: bestOuter,
      top: [bestTop],
      bottom: [bestBottom],
      items: bestItems,
    },
    weights,
  };
}
