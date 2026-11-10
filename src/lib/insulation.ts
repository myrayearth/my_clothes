import { ITEM_SCORES as RAW_ITEM_SCORES, STANDARD_ITEMS } from '@/data/itemScores';
import { migrateItem } from '@/lib/dataMigration';

/**
 * 의류 아이템별 보온 수치 점수 (Insulation Score) 및 기온별 권장 범위 정의
 */

export const ITEM_SCORES: Record<string, number> = RAW_ITEM_SCORES;

/**
 * 단일 아이템의 보온 수치 점수 조회 (카테고리별 차등 점수 지원)
 */
export function getItemInsulationScore(item: string, category?: string): number {
  if (!item || item === '없음' || item === '미착용' || item.trim() === '') return 0;
  const trimmed = item.trim();

  // 카테고리가 지정된 경우 해당 카테고리 표준 점수 우선 조회 (예: 원피스 상의 5점, 하의 4점)
  if (category) {
    const matched = STANDARD_ITEMS.find((i) => i.category === category && i.name === trimmed);
    if (matched) {
      return matched.score;
    }
  }

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
  if (trimmed.includes('기모 이너')) return 20;
  if (trimmed.includes('얇은 이너')) return 12;
  if (trimmed.includes('기모')) return 30;
  if (trimmed.includes('발열내의') || trimmed.includes('히트텍') || trimmed.includes('타이즈') || trimmed.includes('이너')) return 14;
  if (trimmed.includes('스타킹')) return 4;
  if (trimmed.includes('블라우스')) return 12;
  if (trimmed.includes('원피스')) return 4.5;
  if (trimmed.includes('스커트') || trimmed.includes('치마')) return trimmed.includes('롱') ? 14 : 4;
  if (
    trimmed.includes('니트') ||
    trimmed.includes('맨투맨') ||
    trimmed.includes('후드') ||
    trimmed.includes('스웨터')
  )
    return 20;
  if (trimmed.includes('보온 양말') || trimmed.includes('보온양말') || trimmed.includes('양말')) return 8;
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
  outer: string | string[];
  top: string[];
  bottom: string[];
  items?: string[];
  item?: string[];
}): number {
  let outerScore = 0;
  if (Array.isArray(selected.outer)) {
    outerScore = selected.outer.reduce((sum, item) => sum + getItemInsulationScore(item, 'outer'), 0);
  } else if (selected.outer) {
    outerScore = getItemInsulationScore(selected.outer, 'outer');
  }

  const topArr = selected.top || [];
  const topScore = topArr.reduce((sum, item) => sum + getItemInsulationScore(item, 'top'), 0);

  const btmArr = selected.bottom || [];
  const bottomScore = btmArr.reduce((sum, item) => sum + getItemInsulationScore(item, 'bottom'), 0);

  const itemsArr = selected.items || selected.item || [];
  const rawItemScore = itemsArr.reduce((sum, item) => sum + getItemInsulationScore(item, 'items'), 0);

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
 * - 30°C 이상: 0 ~ 9점 (기준 5점)
 * - 25°C ~ 29°C: 8 ~ 24점 (기준 12점)
 * - 20°C ~ 24°C: 28 ~ 48점 (기준 38점)
 * - 15°C ~ 19°C: 50 ~ 72점 (기준 61점)
 * - 10°C ~ 14°C: 74 ~ 96점 (기준 85점)
 * - 5°C ~ 9°C: 98 ~ 135점 (기준 110점)
 * - 0°C ~ 4°C: 150 ~ 190점 (기준 174점)
 * - -5°C ~ -1°C: 192 ~ 220점 (기준 207점)
 * - -10°C ~ -6°C: 222 ~ 242점 (기준 236점)
 * - -15°C ~ -11°C: 243 ~ 254점 (기준 247점)
 * - -15°C 이하: 255점 이상 (기준 259점, 상한선 없음)
 */
export function getInsulationTargetRange(temp: number, userOffset: number = 0): InsulationTargetRange {
  const roundedTemp = Math.round(temp);
  const clampedOffset = clampUserOffset(userOffset);

  let baseMin = 0;
  let baseMax = 0;
  let hasNoUpperBound = false;

  if (roundedTemp >= 30) {
    baseMin = 0;
    baseMax = 9;
  } else if (roundedTemp >= 25) {
    baseMin = 8;
    baseMax = 24;
  } else if (roundedTemp >= 20) {
    baseMin = 28;
    baseMax = 48;
  } else if (roundedTemp >= 15) {
    baseMin = 50;
    baseMax = 72;
  } else if (roundedTemp >= 10) {
    baseMin = 74;
    baseMax = 96;
  } else if (roundedTemp >= 5) {
    baseMin = 98;
    baseMax = 135;
  } else if (roundedTemp >= 0) {
    baseMin = 150;
    baseMax = 190;
  } else if (roundedTemp >= -5) {
    baseMin = 192;
    baseMax = 220;
  } else if (roundedTemp >= -10) {
    baseMin = 222;
    baseMax = 242;
  } else if (roundedTemp >= -15) {
    baseMin = 243;
    baseMax = 254;
  } else {
    baseMin = 255;
    baseMax = 300;
    hasNoUpperBound = true;
  }

  const finalMin = Math.max(0, baseMin + clampedOffset);
  const finalMax = hasNoUpperBound
    ? Math.max(finalMin + 45, baseMax + clampedOffset)
    : Math.max(finalMin, baseMax + clampedOffset);

  const label = hasNoUpperBound ? `${finalMin}점 이상` : `${finalMin} ~ ${finalMax}점`;

  return { min: finalMin, max: finalMax, label, hasNoUpperBound };
}

export type InsulationStatus = 'COLD' | 'OPTIMAL' | 'HOT';

/**
 * 룰셋 기준 점수-기온 매핑 테이블 (점수 오름차순, 구간 선형 보간용)
 * 한국 기상청 및 한국인 표준 11단계 기온 구간의 대표 추천 복장 점수를 각 구간 중간 온도와 1:1 정밀 매핑
 */
export const ANCHOR_POINTS = [
  { score: 0, temp: 35 },
  { score: 5, temp: 32 },     // 30°C 이상 기본 추천 (반팔 5 + 반바지 3 + 손풍기 -3 = 5점)
  { score: 12, temp: 27 },    // 25~29°C 기본 추천 (반팔 5 + 얇은 긴바지 7 = 12점)
  { score: 37, temp: 22 },    // 20~24°C 기본 추천 (얇은 가디건 13 + 기본 긴팔 11 + 얇은 면바지/슬랙스 13 = 37점)
  { score: 61, temp: 17 },    // 15~19°C 기본 추천 (간절기 자켓 25 + 맨투맨 18 + 기본 긴바지 18 = 61점)
  { score: 85, temp: 12 },    // 10~14°C 기본 추천 (트렌치/자켓 35 + 두꺼운 셔츠 24 + 두꺼운 바지 26 = 85점)
  { score: 110, temp: 7 },    // 5~9°C 기본 추천 (경량 패딩 48 + 기모 맨투맨 30 + 기모 바지 32 = 110점)
  { score: 174, temp: 2 },    // 0~4°C 기본 추천 (숏패딩 70 + 얇은내의 12 + 기모터틀넥 35 + 하의내의 14 + 기모바지 32 + 목도리 11 = 174점)
  { score: 207, temp: -3 },   // -5~-1°C 기본 추천 (롱패딩 82 + 기모내의 20 + 기모터틀넥 35 + 하의기모내의 22 + 두꺼운기모바지 36 + 핫팩 12 = 207점)
  { score: 236, temp: -8 },   // -10~-6°C 기본 추천 (두꺼운다운 95 + 기모내의 20 + 두꺼운울니트 35 + 하의기모내의 22 + 패딩바지 41 + 목도리 11 + 핫팩 12 = 236점)
  { score: 247, temp: -13 },  // -15~-11°C 기본 추천 (두꺼운다운 95 + 기모내의 20 + 두꺼운울니트 35 + 하의기모내의 22 + 두꺼운방한바지 45 + 방한소품캡 30 = 247점)
  { score: 259, temp: -18 },  // -15°C 이하 기본 추천 (두꺼운다운 95 + 얇은내의 12 + 기모내의 20 + 두꺼운울니트 35 + 하의기모내의 22 + 두꺼운방한바지 45 + 방한소품캡 30 = 259점)
  { score: 280, temp: -20 },
];

/**
 * 보온 점수 -> 복장 적정 커버 기온(-20°C ~ +35°C) 역산 함수
 * - 단순 1차 선형 비례식의 왜곡을 방지하기 위해 '구간 선형 보간(Piecewise Linear Interpolation)' 적용
 * - 입력 점수 정수 클램핑, 분모 0 방지, 출력 기온(-20°C ~ +35°C) 절대 범위 클램프로 수식 예외 원천 차단
 */
export function scoreToCoverTemperature(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) {
    return 20.0;
  }

  const maxAnchorScore = ANCHOR_POINTS[ANCHOR_POINTS.length - 1].score; // 320
  // 입력 점수 정수 클램프 (0점 미만 음수 및 과도한 점수 방어)
  const s = Math.max(0, Math.min(maxAnchorScore, Math.round(score)));

  if (s <= ANCHOR_POINTS[0].score) {
    return ANCHOR_POINTS[0].temp;
  }
  if (s >= maxAnchorScore) {
    return ANCHOR_POINTS[ANCHOR_POINTS.length - 1].temp;
  }

  // 구간 탐색 및 선형 보간
  for (let i = 0; i < ANCHOR_POINTS.length - 1; i++) {
    const p1 = ANCHOR_POINTS[i];
    const p2 = ANCHOR_POINTS[i + 1];

    if (s >= p1.score && s <= p2.score) {
      const scoreDiff = p2.score - p1.score;
      // 분모가 0인 극단 케이스 예외 방어
      if (scoreDiff === 0) {
        return Math.max(-20, Math.min(35, Math.round(p1.temp * 10) / 10));
      }
      const ratio = (s - p1.score) / scoreDiff;
      const rawTemp = p1.temp + ratio * (p2.temp - p1.temp);
      // 결과 기온이 -20°C ~ +35°C 범위를 절대 벗어나지 않도록 클램프
      const clampedTemp = Math.max(-20, Math.min(35, rawTemp));
      return Math.round(clampedTemp * 10) / 10;
    }
  }

  const fallbackTemp = s <= 0 ? 35 : -20;
  return Math.max(-20, Math.min(35, fallbackTemp));
}

export type RelativeCoverStatus = 'OPTIMAL' | 'OVERHEATED' | 'COLD_NEED_WARMTH';

/**
 * 현재 기준 기온(targetTemp) 대비 복장 적정 기온(coverTemp)의 상대적 상태 산출
 * - 사용자 직관적 편차: warmthDiff = targetTemp - coverTemp
 *   - 두꺼움 (빨간색, + 방향): warmthDiff > 2.5°C (더 추운 날씨용 옷을 입어 더움, + 수치로 더움 강조)
 *   - 얇음 (파란색, - 방향): warmthDiff < -2.5°C (더 따뜻한 날씨용 옷을 입어 쌀쌀함, - 수치로 추움 강조)
 *   - 적당함 (초록색): |warmthDiff| <= 2.5°C
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
  markerPinClass: string;
  diff: number;
} {
  // 사용자 관점 체감 보온 편차 (targetTemp - coverTemp):
  // 얇을수록 음수(-)로 추움 강조, 두꺼울수록 양수(+)로 더움 강조
  const diff = Math.round((targetTemp - coverTemp) * 10) / 10;

  // 1. 적당함 (초록색)
  if (Math.abs(diff) <= 2.5) {
    return {
      status: 'OPTIMAL',
      badgeText: '적당함',
      badgeStyle:
        'bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-400 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2 shadow-sm',
      description: `현재 날씨(약 ${targetTemp}°C)에 잘 어울리는 알맞은 옷차림입니다.`,
      textColor: 'text-emerald-700 dark:text-emerald-300',
      markerColor: 'bg-emerald-600 dark:bg-emerald-500',
      markerPinClass:
        'bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] ring-2 ring-white dark:ring-slate-950',
      diff,
    };
  }

  // 2. 두꺼움 상태 (빨간색, + 수치로 더움 강조)
  if (diff > 2.5) {
    return {
      status: 'OVERHEATED',
      badgeText: '두꺼움',
      badgeStyle:
        'bg-rose-50 text-rose-800 border-rose-500 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-400 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2 shadow-sm',
      description: '현재 날씨보다 옷이 두껍습니다. 땀이 나거나 더울 수 있으니 겉옷을 가볍게 조절해 보세요.',
      textColor: 'text-rose-700 dark:text-rose-300',
      markerColor: 'bg-rose-500',
      markerPinClass:
        'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] ring-2 ring-white dark:ring-slate-950',
      diff,
    };
  }

  // 3. 얇음 상태 (파란색, - 수치로 추움 강조)
  return {
    status: 'COLD_NEED_WARMTH',
    badgeText: '얇음',
    badgeStyle:
      'bg-sky-50 text-sky-800 border-sky-500 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-400 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2 shadow-sm',
    description: '현재 날씨보다 옷이 얇습니다. 쌀쌀할 수 있으니 겉옷이나 따뜻한 옷을 챙기세요.',
    textColor: 'text-sky-700 dark:text-sky-300',
    markerColor: 'bg-sky-600 dark:bg-sky-500',
    markerPinClass:
      'bg-sky-600 dark:bg-sky-500 shadow-[0_0_12px_rgba(2,132,199,0.9)] ring-2 ring-white dark:ring-slate-950',
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
        badgeText: '얇음',
        badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300',
        description: '춥거나 쌀쌀할 수 있어요. 겉옷이나 따뜻한 옷을 챙기세요!',
        textColor: 'text-sky-700',
        progressColor: 'bg-sky-500',
      };
    case 'HOT':
      return {
        badgeText: '두꺼움',
        badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
        description: '땀이 나거나 더울 수 있어요. 한 겹 가볍게 입는 것을 추천해요!',
        textColor: 'text-rose-700',
        progressColor: 'bg-rose-500',
      };
    case 'OPTIMAL':
    default:
      return {
        badgeText: '적당함',
        badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        description: '현재 날씨에 딱 어울리는 이상적인 옷차림입니다!',
        textColor: 'text-emerald-700',
        progressColor: 'bg-emerald-500',
      };
  }
}

/**
 * 복장 아이템 보온 점수 기반 칩 배경 틴트 및 텍스트 스타일 산출
 * - 규칙:
 *   1) 선택된 항목: 옅은 노란색(bg-amber-100, border-amber-300, text-amber-950, font-bold)으로 카드 크기 변화 없이 명확한 시각적 구별 제공
 *   2) 외투/상의/하의: 보온 점수가 높을수록 빨간색(진한 빨강), 낮을수록 파란색(진한 파랑)으로 점진적 그라데이션
 *   3) 소품(items): 보온 점수 색상을 적용하지 않고 깔끔한 뉴트럴 톤 유지
 *   4) 텍스트 색상:
 *      - 선택 가능한 항목 (미선택): '검은색에 가까운 네이비색' (text-[#0b192c])
 *      - 선택된 항목: 옅은 노란색 배경에 시인성이 뛰어난 '진한 브라운 네이비' (text-amber-950)
 */
export function getItemChipWarmthClasses(
  item: string,
  category: 'outer' | 'top' | 'bottom' | 'items',
  isSelected: boolean,
  isRecommended: boolean = false
): string {
  // 1. 선택된 항목: 옅은 노란색(amber-100) 배경 + 진한 텍스트(amber-950) 볼드 + 내부 3px 외곽선(ring-inset ring-[3px] ring-amber-400)으로 크기 변화 없이 강력한 선택 강조
  if (isSelected) {
    return 'bg-amber-100 text-amber-950 border-amber-400 ring-inset ring-[3px] ring-amber-400 font-bold';
  }

  // 2. 추천 항목 (미선택 상태, 이너 추천 포함): 그래프 '적정' 영역과 일관된 연두색(emerald-50 / border-emerald-300) 적용
  if (isRecommended) {
    return 'bg-emerald-50 hover:bg-emerald-100/80 text-[#0b192c] border-emerald-300 font-semibold';
  }

  // 3. 소품(items) 카테고리: 보온 색상 적용 제외 (뉴트럴 스타일 유지, 글자색: 검은색에 가까운 네이비)
  if (category === 'items') {
    return 'bg-slate-50 hover:bg-slate-100 text-[#0b192c] border-slate-200 font-semibold';
  }

  const score = getItemInsulationScore(item);

  // 3. 외투(Outer) 보온 스펙트럼 (14 ~ 95점, 글자색: 검은색에 가까운 네이비)
  if (category === 'outer') {
    if (score >= 70) {
      // 숏패딩(70), 롱패딩(82), 두꺼운 다운 패딩(95)
      return 'bg-rose-100 hover:bg-rose-200/80 text-[#0b192c] border-rose-300 font-semibold shadow-2xs';
    }
    if (score >= 45) {
      // 경량 패딩(48), 겨울 코트(58)
      return 'bg-rose-50 hover:bg-rose-100 text-[#0b192c] border-rose-200 font-semibold';
    }
    if (score >= 36) {
      // 패딩 조끼(36), 가죽/플리스 자켓(42)
      return 'bg-rose-50/60 hover:bg-rose-100/80 text-[#0b192c] border-rose-200/80 font-semibold';
    }
    if (score >= 30) {
      // 트렌치/야상/자켓(35) - 환절기 기준 뉴트럴
      return 'bg-slate-50 hover:bg-slate-100 text-[#0b192c] border-slate-200 font-semibold';
    }
    if (score >= 20) {
      // 간절기 자켓/점퍼(25)
      return 'bg-blue-50/60 hover:bg-blue-100/80 text-[#0b192c] border-blue-200/80 font-semibold';
    }
    if (score >= 16) {
      // 얇은 바람막이/자켓(18)
      return 'bg-blue-50 hover:bg-blue-100 text-[#0b192c] border-blue-200 font-semibold';
    }
    // 얇은 가디건(14)
    return 'bg-blue-100 hover:bg-blue-200/80 text-[#0b192c] border-blue-300 font-semibold shadow-2xs';
  }

  // 4. 상의(Top) 보온 스펙트럼 (2 ~ 35점, 글자색: 검은색에 가까운 네이비)
  if (category === 'top') {
    if (score >= 30) {
      // 기모 맨투맨/후드(30), 두꺼운 니트/기모 폴라(35)
      return 'bg-rose-100 hover:bg-rose-200/80 text-[#0b192c] border-rose-300 font-semibold shadow-2xs';
    }
    if (score >= 20) {
      // 기모 내의(20), 목폴라/두꺼운 셔츠(24)
      return 'bg-rose-50 hover:bg-rose-100 text-[#0b192c] border-rose-200 font-semibold';
    }
    if (score >= 15) {
      // 맨투맨/후드/니트(17)
      return 'bg-rose-50/60 hover:bg-rose-100/80 text-[#0b192c] border-rose-200/80 font-semibold';
    }
    if (score >= 10) {
      // 기본 긴팔(11), 얇은 내의/히트텍(12), 얇은 셔츠(13) - 기준 뉴트럴
      return 'bg-slate-50 hover:bg-slate-100 text-[#0b192c] border-slate-200 font-semibold';
    }
    if (score >= 7) {
      // 7부/니트반팔(7), 얇은 긴팔(8)
      return 'bg-blue-50/60 hover:bg-blue-100/80 text-[#0b192c] border-blue-200/80 font-semibold';
    }
    if (score >= 4) {
      // 기본 반팔(5)
      return 'bg-blue-50 hover:bg-blue-100 text-[#0b192c] border-blue-200 font-semibold';
    }
    // 민소매(2)
    return 'bg-blue-100 hover:bg-blue-200/80 text-[#0b192c] border-blue-300 font-semibold shadow-2xs';
  }

  // 5. 하의(Bottom) 보온 스펙트럼 (3 ~ 45점, 글자색: 검은색에 가까운 네이비)
  if (category === 'bottom') {
    if (score >= 34) {
      // 기모 바지(34), 패딩/방한 바지(43)
      return 'bg-rose-100 hover:bg-rose-200/80 text-[#0b192c] border-rose-300 font-semibold shadow-2xs';
    }
    if (score >= 26) {
      // 두꺼운 긴바지(26)
      return 'bg-rose-50 hover:bg-rose-100 text-[#0b192c] border-rose-200 font-semibold';
    }
    if (score >= 20) {
      // 기모 하의 내의(22)
      return 'bg-rose-50/60 hover:bg-rose-100/80 text-[#0b192c] border-rose-200/80 font-semibold';
    }
    if (score >= 16) {
      // 기본 긴바지(18) - 기준 뉴트럴
      return 'bg-slate-50 hover:bg-slate-100 text-[#0b192c] border-slate-200 font-semibold';
    }
    if (score >= 10) {
      // 얇은 면바지/슬랙스(13), 얇은 하의 내의(14)
      return 'bg-blue-50/60 hover:bg-blue-100/80 text-[#0b192c] border-blue-200/80 font-semibold';
    }
    if (score >= 5) {
      // 7부 바지(5), 얇은 긴바지(7)
      return 'bg-blue-50 hover:bg-blue-100 text-[#0b192c] border-blue-200 font-semibold';
    }
    // 반바지(3)
    return 'bg-blue-100 hover:bg-blue-200/80 text-[#0b192c] border-blue-300 font-semibold shadow-2xs';
  }

  return 'bg-slate-50 hover:bg-slate-100 text-[#0b192c] border-slate-200 font-semibold';
}
