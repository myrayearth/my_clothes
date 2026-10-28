import { ITEM_SCORES as RAW_ITEM_SCORES } from '@/data/itemScores';
import { migrateItem } from '@/lib/dataMigration';

/**
 * 의류 아이템별 보온 수치 점수 (Insulation Score) 및 기온별 권장 범위 정의
 */

export const ITEM_SCORES: Record<string, number> = RAW_ITEM_SCORES;

/**
 * 단일 아이템의 보온 수치 점수 조회
 */
export function getItemInsulationScore(item: string): number {
  if (!item || item === '없음' || item === '미착용' || item.trim() === '') return 0;
  const trimmed = item.trim();
  if (ITEM_SCORES[trimmed] !== undefined) {
    return ITEM_SCORES[trimmed];
  }

  // 레거시 치환 룰 조회
  const migrated = migrateItem(trimmed);
  if (migrated.length > 0 && (migrated.length > 1 || migrated[0] !== trimmed)) {
    return migrated.reduce((sum, m) => sum + (ITEM_SCORES[m] ?? 0), 0);
  }

  // 사전 미등록 아이템 키워드 휴리스틱 매핑
  if (trimmed.includes('패딩조끼') || trimmed.includes('패딩 조끼')) return 32;
  if (trimmed.includes('패딩') || trimmed.includes('다운')) return 50;
  if (trimmed.includes('코트') || trimmed.includes('자켓')) return 35;
  if (trimmed.includes('기모')) return 30;
  if (trimmed.includes('발열내의') || trimmed.includes('히트텍') || trimmed.includes('타이즈')) return 14;
  if (
    trimmed.includes('니트') ||
    trimmed.includes('맨투맨') ||
    trimmed.includes('후드') ||
    trimmed.includes('스웨터')
  )
    return 20;
  if (
    trimmed.includes('핫팩') ||
    trimmed.includes('목도리') ||
    trimmed.includes('워머') ||
    trimmed.includes('머플러')
  )
    return 10;
  if (trimmed.includes('손풍기')) return -3;
  if (
    trimmed.includes('양산') ||
    trimmed.includes('부채') ||
    trimmed.includes('쿨') ||
    trimmed.includes('모자')
  )
    return -2;

  // 단종/완전 미등록 아이템은 0점 안전 fallback (Crash 방지)
  return 0;
}

/**
 * 개인화 체질 보정(User Offset) 상·하한선 제한
 * 피드백 누적 시 목표 점수 보정값이 무한히 발산하지 않도록 최대 ±30점 범위로 클램프
 */
export function clampUserOffset(userOffset: number): number {
  return Math.max(-30, Math.min(30, userOffset));
}

/**
 * 선택된 전체 복장의 총 보온 지수(점수) 계산
 * 1. 소품(Item) 점수 합산 캡 적용: 최대 +30점, 최소 -10점
 * 2. 총 보온 지수 하한값 설정: Math.max(0, ...) 적용하여 음수 점수 방지
 */
export function calculateTotalInsulation(selected: {
  outer: string;
  top: string[];
  bottom: string[];
  items?: string[];
  item?: string[];
}): number {
  const outerScore = getItemInsulationScore(selected.outer);

  const topArr = selected.top || [];
  const topScore = topArr.reduce((sum, item) => sum + getItemInsulationScore(item), 0);

  const btmArr = selected.bottom || [];
  const bottomScore = btmArr.reduce((sum, item) => sum + getItemInsulationScore(item), 0);

  const itemsArr = selected.items || selected.item || [];
  const rawItemScore = itemsArr.reduce((sum, item) => sum + getItemInsulationScore(item), 0);

  // [안전장치 1] 소품 점수 합산 캡(Cap) 적용: 최대 +30점, 최소 -10점 제한
  const cappedItemScore = Math.max(-10, Math.min(30, rawItemScore));

  // [안전장치 2] 총 보온 지수 하한값 설정 (0점 미만 음수 발생 원천 방지)
  const finalTotalScore = Math.max(0, outerScore + topScore + bottomScore + cappedItemScore);

  return finalTotalScore;
}

export interface InsulationTargetRange {
  min: number;
  max: number;
  label: string;
  hasNoUpperBound?: boolean;
}

/**
 * 기온별 권장 보온 지수 합계 범위 반환
 * - 30°C 이상: 0 ~ 8점
 * - 25°C ~ 29°C: 10 ~ 20점
 * - 20°C ~ 24°C: 40 ~ 55점
 * - 15°C ~ 19°C: 55 ~ 75점
 * - 10°C ~ 14°C: 80 ~ 105점
 * - 5°C ~ 9°C: 110 ~ 135점
 * - 0°C ~ 4°C: 145 ~ 185점
 * - -5°C ~ -1°C: 180 ~ 215점
 * - -10°C ~ -6°C: 215 ~ 255점
 * - -15°C ~ -11°C: 255 ~ 295점
 * - -15°C 이하: 295점 이상 (상한선 없음)
 */
export function getInsulationTargetRange(temp: number, userOffset: number = 0): InsulationTargetRange {
  const roundedTemp = Math.round(temp);
  const clampedOffset = clampUserOffset(userOffset);

  let baseMin = 0;
  let baseMax = 0;
  let hasNoUpperBound = false;

  if (roundedTemp >= 30) {
    baseMin = 0;
    baseMax = 8;
  } else if (roundedTemp >= 25) {
    baseMin = 10;
    baseMax = 20;
  } else if (roundedTemp >= 20) {
    baseMin = 40;
    baseMax = 55;
  } else if (roundedTemp >= 15) {
    baseMin = 55;
    baseMax = 75;
  } else if (roundedTemp >= 10) {
    baseMin = 80;
    baseMax = 105;
  } else if (roundedTemp >= 5) {
    baseMin = 110;
    baseMax = 135;
  } else if (roundedTemp >= 0) {
    baseMin = 145;
    baseMax = 185;
  } else if (roundedTemp >= -5) {
    baseMin = 180;
    baseMax = 215;
  } else if (roundedTemp >= -10) {
    baseMin = 215;
    baseMax = 255;
  } else if (roundedTemp >= -15) {
    baseMin = 255;
    baseMax = 295;
  } else {
    baseMin = 295;
    baseMax = 350;
    hasNoUpperBound = true;
  }

  const finalMin = Math.max(0, baseMin + clampedOffset);
  const finalMax = hasNoUpperBound
    ? Math.max(finalMin + 55, baseMax + clampedOffset)
    : Math.max(finalMin, baseMax + clampedOffset);

  const label = hasNoUpperBound ? `${finalMin}점 이상` : `${finalMin} ~ ${finalMax}점`;

  return { min: finalMin, max: finalMax, label, hasNoUpperBound };
}

export type InsulationStatus = 'COLD' | 'OPTIMAL' | 'HOT';

/**
 * 룰셋 기준 점수-기온 매핑 테이블 (점수 오름차순, 구간 선형 보간용)
 * 한국 기상청 및 체감 표준 11단계 기온 구간의 대표 추천 복장 점수를 기준 온도로 정확히 매핑
 */
export const ANCHOR_POINTS = [
  { score: 0, temp: 35 },
  { score: 15, temp: 27 },
  { score: 50, temp: 22 },
  { score: 67, temp: 17 },
  { score: 86, temp: 12 },    // 86점일 때 정확히 12°C 매핑 (환절기 오판정 해결)
  { score: 120, temp: 7 },
  { score: 170, temp: 2 },
  { score: 195, temp: -3 },
  { score: 235, temp: -8 },
  { score: 275, temp: -13 },
  { score: 320, temp: -20 },
];

/**
 * 보온 점수 -> 복장 적정 커버 기온(-20°C ~ +35°C) 역산 함수
 * - 단순 1차 선형 비례식의 왜곡을 방지하기 위해 '구간 선형 보간(Piecewise Linear Interpolation)' 적용
 * - 점수가 86점(10~14°C 추천 복장)일 때 정확히 12.0°C로 환산되어 ±2.5°C 적정 존 중앙(50%)에 안착합니다.
 */
export function scoreToCoverTemperature(score: number): number {
  const maxScore = ANCHOR_POINTS[ANCHOR_POINTS.length - 1].score;
  const s = Math.max(0, Math.min(maxScore, score));

  if (s <= ANCHOR_POINTS[0].score) {
    return ANCHOR_POINTS[0].temp;
  }
  if (s >= maxScore) {
    return ANCHOR_POINTS[ANCHOR_POINTS.length - 1].temp;
  }

  // 구간 탐색 및 선형 보간
  for (let i = 0; i < ANCHOR_POINTS.length - 1; i++) {
    const p1 = ANCHOR_POINTS[i];
    const p2 = ANCHOR_POINTS[i + 1];

    if (s >= p1.score && s <= p2.score) {
      const ratio = (s - p1.score) / (p2.score - p1.score);
      const temp = p1.temp + ratio * (p2.temp - p1.temp);
      return Math.round(temp * 10) / 10;
    }
  }

  return s <= 0 ? 35 : -20;
}

export type RelativeCoverStatus = 'OPTIMAL' | 'OVERHEATED' | 'COLD_NEED_WARMTH';

/**
 * 현재 기준 기온(targetTemp) 대비 복장 커버 기온(coverTemp)의 상대적 상태 산출
 * - 적정 상태 (초록색): |coverTemp - targetTemp| <= 2.5°C
 * - 과보온 상태 (빨간색 - 방향): coverTemp < targetTemp - 2.5°C (옷이 너무 두꺼워 더 낮은 온도를 가리킴)
 * - 보온 필요 상태 (파란색 + 방향): coverTemp > targetTemp + 2.5°C (옷이 너무 얇아 더 높은 온도를 가리킴)
 */
export function getRelativeCoverStatus(
  coverTemp: number,
  targetTemp: number
): {
  status: RelativeCoverStatus;
  badgeText: string;
  badgeStyle: string;
  description: string;
  textColor: string;
  markerColor: string;
  diff: number;
} {
  const diff = Math.round((coverTemp - targetTemp) * 10) / 10;

  // 1. 적정 상태 (초록색)
  if (Math.abs(diff) <= 2.5) {
    return {
      status: 'OPTIMAL',
      badgeText: '적정',
      badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      description: `현재 기온(약 ${targetTemp}°C)에 적합한 보온 수준입니다.`,
      textColor: 'text-emerald-700',
      markerColor: 'bg-emerald-600',
      diff,
    };
  }

  // 2. 과보온 상태 (빨간색) - 옷이 너무 두꺼움
  if (diff < -2.5) {
    return {
      status: 'OVERHEATED',
      badgeText: '과보온',
      badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      description: '현재 기온보다 두껍습니다. 땀이 나거나 더울 수 있어요. (외투나 이너를 가볍게 조절하세요)',
      textColor: 'text-rose-700',
      markerColor: 'bg-rose-600',
      diff,
    };
  }

  // 3. 보온 필요 상태 (파란색) - 옷이 너무 얇음
  return {
    status: 'COLD_NEED_WARMTH',
    badgeText: '보온 필요',
    badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
    description: '현재 기온보다 얇습니다. 쌀쌀할 수 있으니 겉옷이나 내의를 챙기세요.',
    textColor: 'text-sky-700',
    markerColor: 'bg-sky-600',
    diff,
  };
}

/**
 * 현재 보온 지수와 권장 범위 비교 상태 산출
 * - -15°C 이하 등 hasNoUpperBound인 경우 상한 초과 과보온 판정 제외
 */
export function getInsulationStatus(
  totalScore: number,
  minTarget: number,
  maxTarget: number,
  hasNoUpperBound: boolean = false
): InsulationStatus {
  if (totalScore < minTarget) return 'COLD';
  if (!hasNoUpperBound && totalScore > maxTarget) return 'HOT';
  return 'OPTIMAL';
}

/**
 * 상태별 UI 라벨 및 색상 스타일 반환
 */
export function getInsulationStatusMeta(status: InsulationStatus): {
  badgeText: string;
  badgeStyle: string;
  description: string;
  textColor: string;
  progressColor: string;
} {
  switch (status) {
    case 'COLD':
      return {
        badgeText: '보온 부족',
        badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300',
        description: '춥거나 쌀쌀할 수 있어요. 겉옷이나 레이어드 이너를 챙기세요!',
        textColor: 'text-sky-700',
        progressColor: 'bg-sky-500',
      };
    case 'HOT':
      return {
        badgeText: '과보온',
        badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
        description: '땀이 나거나 더울 수 있어요. 한 겹 가볍게 입는 것을 추천해요!',
        textColor: 'text-rose-700',
        progressColor: 'bg-rose-500',
      };
    case 'OPTIMAL':
    default:
      return {
        badgeText: '적정',
        badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        description: '현재 기온에 딱 맞는 이상적인 보온 수준입니다!',
        textColor: 'text-emerald-700',
        progressColor: 'bg-emerald-500',
      };
  }
}
