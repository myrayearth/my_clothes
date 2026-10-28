import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';
import { OutfitLog, UserGender } from '@/types/database';
import { filterItemsByGender } from '@/lib/gender';
import { getSpectrumOutfitOptions } from '@/lib/itemPicker';

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
 * 특정 로그 그룹에서 해당 아이템의 평균 만족도 점수 계산
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
 * 1. 평가 없음: 기본 추천 100%
 * 2. 게스트 상태 (또는 개인평가 0건):
 *    - 게스트 평가 수 < 5개: 기본 추천 100% (소수 평가 오염 방지)
 *    - 게스트 평가 수 >= 5개: 게스트 평가 65% + 기본 추천 35%
 * 3. 로그인 상태 + 개인평가 있음:
 *    - 개인 평가 60% + 게스트 평가 20% + 기본 추천 20%
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

  const fallbackDefaults: OutfitSelection = {
    outer: filteredRecOuter,
    top: filteredRecTop.length > 0 ? filteredRecTop : [rawTop[0] || '티셔츠'],
    bottom: filteredRecBottom.length > 0 ? filteredRecBottom : [rawBottom[0] || '바지'],
    items: filteredRecItems,
  };

  // 2. 현재 기온(±2.5°C)과 매칭되는 로그 추출
  const tempTolerance = 2.5;
  const matchedLogs = allLogs.filter(
    (log) => Math.abs(log.target_temp - targetTemp) <= tempTolerance
  );

  // 3. 개인 평가와 게스트 평가로 엄격 분리
  const isPersonalLog = (log: OutfitLog) =>
    isLoggedIn &&
    currentUser &&
    currentUser !== '게스트' &&
    log.user_name === currentUser;

  const personalLogs = matchedLogs.filter(isPersonalLog);
  const guestLogs = matchedLogs.filter((log) => !isPersonalLog(log));

  const personalCount = personalLogs.length;
  const guestCount = guestLogs.length;
  const totalCount = matchedLogs.length;

  // 4. 가중치 결정
  let w_personal = 0;
  let w_guest = 0;
  let w_rule = 1.0;
  let mode: RecommendationWeights['mode'] = 'rule_only';
  let description = '기본 룰셋 100% 적용';

  if (personalCount > 0) {
    // Case 3: 개인 평가가 있는 로그인 상태
    mode = 'personal_weighted';
    if (guestCount > 0) {
      w_personal = 0.6;
      w_guest = 0.2;
      w_rule = 0.2;
      description = `개인화 맞춤 (내 평가 60% + 전체 20% + 기본 20%)`;
    } else {
      w_personal = 0.6;
      w_guest = 0;
      w_rule = 0.4;
      description = `개인화 맞춤 (내 평가 60% + 기본 40%)`;
    }
  } else if (guestCount >= 5) {
    // Case 2: 게스트 평가 5개 이상
    mode = 'guest_weighted';
    w_personal = 0;
    w_guest = 0.65;
    w_rule = 0.35;
    description = `전체 누적 평가 반영 (게스트 평가 65% + 기본 35%)`;
  } else {
    // Case 1: 평가 0개 또는 5개 미만
    mode = 'rule_only';
    w_personal = 0;
    w_guest = 0;
    w_rule = 1.0;
    description =
      guestCount > 0
        ? `누적 평가 수집 중 (${guestCount}/5건 미만, 기본 룰셋 100% 적용)`
        : '기본 룰셋 100% 적용';
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

  // 가중치가 기본 룰셋 100%일 때는 계산 비용 없이 즉시 반환
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
    // 유니크 아이템 합집합
    const allCandidateSet = new Set<string>([...candidateList, ...recommendList]);
    const items = Array.from(allCandidateSet);

    const scoredItems = items.map((item) => {
      // 1) 룰셋 기본 점수 (대표 추천이면 5.0, 후보 목록이면 2.5, 그 외 1.0)
      const ruleScore = recommendList.includes(item) ? 5.0 : candidateList.includes(item) ? 2.5 : 1.0;

      // 2) 개인 평가 점수
      const pStat = calculateGroupItemScore(item, category, personalLogs);
      const personalScore = pStat.count > 0 ? pStat.avgScore : ruleScore;

      // 3) 게스트 평가 점수
      const gStat = calculateGroupItemScore(item, category, guestLogs);
      const guestScore = gStat.count > 0 ? gStat.avgScore : ruleScore;

      // 4) 가중 합산
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
  if (filteredRecOuter === '없음' && mode !== 'personal_weighted') {
    bestOuter = '없음';
  }

  return {
    options: {
      outer: rawOuter,
      top: rawTop,
      bottom: rawBottom,
      items: rawItems,
    },
    defaults: {
      outer: bestOuter,
      top: [topResult.topItem],
      bottom: [bottomResult.topItem],
      items: filteredRecItems,
    },
    weights,
  };
}
