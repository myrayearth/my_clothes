/**
 * 의류 아이템별 보온 수치 점수 (Insulation Score) 및 기온별 권장 범위 정의
 */

export const ITEM_SCORES: Record<string, number> = {
  // ==========================================
  // Outer (0 ~ 100점)
  // ==========================================
  없음: 0,
  '여름 얇은 가디건': 8,
  '얇은 로브': 8,
  '얇은 반팔 셔츠': 8,
  '린넨 셔츠': 14,
  '얇은 가디건': 14,
  가디건: 14,
  '셔츠 자켓': 18,
  '나일론 바람막이': 18,
  윈드브레이커: 24,
  바람막이: 24,
  '니트 가디건': 24,
  '봄 자켓': 24,
  '트위드 자켓': 24,
  청자켓: 28,
  데님자켓: 28,
  블루종: 28,
  '경량 패딩 조끼': 32,
  '경량 패딩조끼': 32,
  '경량 조끼 패딩': 32,
  트렌치코트: 35,
  자켓: 35,
  '야상 점퍼': 35,
  '라이더 자켓': 42,
  '가죽 자켓': 42,
  '플리스(후리스)': 42,
  플리스: 42,
  후리스: 42,
  '플리스 자켓': 42,
  '경량 패딩': 48,
  '경량 패딩 점퍼': 48,
  '울 코트': 55,
  무스탕: 55,
  '모직 하프코트': 62,
  '모직 피코트': 62,
  '헤비 플리스': 62,
  '두꺼운 롱코트': 62,
  '울 롱코트': 62,
  숏패딩: 70,
  '미들 다운': 70,
  '미들 다운 패딩': 70,
  롱패딩: 82,
  '누빔 코트': 82,
  '헤비 구스다운 롱패딩': 92,
  '방풍 파카': 92,
  '방한 헤비 파카': 92,
  '방풍 헤비 다운': 92,
  '대장급 헤비 다운 롱패딩': 100,
  '익스트림 벤치 롱패딩': 100,

  // ==========================================
  // Top (2 ~ 35점)
  // ==========================================
  민소매: 2,
  '쿨맥스 기능성 티': 4,
  '린넨 반팔 셔츠': 4,
  '코튼 반팔 티셔츠': 5,
  '오버핏 반팔 티셔츠': 5,
  '카라 티셔츠': 5,
  '피케 셔츠': 5,
  '반팔 티셔츠': 5,
  '반팔 셔츠': 5,
  '얇은 7부 티': 8,
  '7부 티셔츠': 8,
  '긴팔 티셔츠': 11,
  '옥스포드 셔츠': 11,
  긴팔티: 11,
  롱슬리브: 11,
  '히트텍/내의': 12,
  '기본 발열내의': 12,
  히트텍: 12,
  발열내의: 12,
  '얇은 니트': 14,
  니트조끼: 14,
  맨투맨: 18,
  후드티: 18,
  '방한 히트텍/내의': 20,
  '기모 이너': 20,
  '특수 방한내의': 20,
  '특수 방한 발열내의': 20,
  방한내의: 20,
  '방한 내의': 20,
  '최고등급 발열내의': 20,
  '목폴라 티': 23,
  '모크넥 니트': 23,
  '도톰한 울 니트': 26,
  셔츠: 26,
  '기모 맨투맨': 30,
  '기모 후드': 30,
  '기모 후드티': 30,
  '두꺼운 울 니트': 30,
  '기모 집업': 30,
  '니트 집업': 30,
  '기모 터틀넥': 35,
  '헤비 울 스웨터': 35,
  '두꺼운 기모티': 35,
  '두꺼운 터틀넥': 35,
  '울 니트': 35,
  '헤비 니트': 35,

  // ==========================================
  // Bottom (2 ~ 45점)
  // ==========================================
  '린넨 밴딩 쇼츠': 2,
  숏스커트: 2,
  '얇은 반바지': 4,
  반바지: 4,
  '린넨 와이드 팬츠': 7,
  '냉감 슬랙스': 7,
  '얇은 코튼 팬츠': 12,
  '린넨 혼방 바지': 12,
  '하의 히트텍/타이즈': 14,
  '하의 기본 발열내의': 14,
  '하의 발열내의': 14,
  '방한 타이즈': 14,
  롱스커트: 15,
  '얇은 슬랙스': 15,
  '레귤러 데님': 18,
  면바지: 18,
  '치노 팬츠': 18,
  '카고 팬츠': 18,
  '하의 방한 히트텍/타이즈': 22,
  '하의 특수 방한내의': 22,
  '특수 방한내의 (하의)': 22,
  '특수 방한 타이즈': 22,
  '스트레이트 데님': 22,
  '와이드 슬랙스': 22,
  '스탠다드 슬랙스': 22,
  슬랙스: 22,
  '데님 팬츠': 22,
  청바지: 22,
  '두꺼운 울 슬랙스': 26,
  '코듀로이 팬츠': 26,
  '골덴 팬츠': 26,
  '두꺼운 데님': 24,
  '울 슬랙스': 26,
  '내의 + 두꺼운 데님': 28,
  '기모 슬랙스': 32,
  '기모 청바지': 32,
  '기모 조거팬츠': 32,
  '기모 안감 슬랙스': 32,
  '본딩 기모 방한바지': 36,
  '융기모 바지': 36,
  '기모 트레이닝 팬츠': 36,
  '본딩 진': 36,
  '기모 방풍 팬츠': 40,
  '패딩 팬츠': 40,
  '방풍 팬츠': 40,
  '헤비 패딩 팬츠': 45,
  '아웃도어 방한 바지': 45,
  '방한 바지': 45,

  // ==========================================
  // Item (-10 ~ 15점)
  // ==========================================
  '휴대용 손풍기': -3,
  손풍기: -3,
  '쿨링 스프레이': -2,
  양산: -2,
  부채: -2,
  쿨토시: -2,
  캡모자: -2,
  '볼캡 모자': -2,
  선글라스: 0,
  손수건: 0,
  '땀 흡수 손수건': 0,
  '얇은 면스카프': 3,
  '쁘띠 스카프': 3,
  '가벼운 숄': 5,
  '두께감 있는 양말': 5,
  '도톰한 양말': 5,
  스타킹: 5,
  '울 머플러': 7,
  '가죽 장갑': 7,
  '니트 비니': 7,
  장갑: 7,
  '보온 귀마개': 9,
  '방한 귀마개': 9,
  귀마개: 9,
  털장갑: 9,
  어그부츠: 9,
  '방한화/어그부츠': 9,
  '신발용 핫팩': 9,
  '기모 스노우 부츠': 9,
  '두꺼운 목도리': 11,
  '붙이는 핫팩': 11,
  '발열 양말': 11,
  '발바닥 핫팩': 11,
  넥워머: 11,
  '방한 넥워머': 11,
  '손난로 핫팩': 13,
  '방풍 글러브': 13,
  바라클라바: 15,
  안면마스크: 15,
  '방풍 마스크': 15,
  '전신 핫팩 세트': 15,
  '방풍 후드': 15,
  방한모자: 15,
};

/**
 * 단일 아이템의 보온 수치 점수 조회
 */
export function getItemInsulationScore(item: string): number {
  if (!item || item === '없음') return 0;
  if (ITEM_SCORES[item] !== undefined) {
    return ITEM_SCORES[item];
  }
  // 사전 미등록 아이템 키워드 휴리스틱 매핑
  if (item.includes('패딩조끼') || item.includes('패딩 조끼')) return 32;
  if (item.includes('패딩') || item.includes('다운')) return 50;
  if (item.includes('코트') || item.includes('자켓')) return 35;
  if (item.includes('기모')) return 30;
  if (item.includes('발열내의') || item.includes('히트텍') || item.includes('타이즈')) return 14;
  if (item.includes('니트') || item.includes('맨투맨') || item.includes('후드')) return 20;
  if (item.includes('핫팩') || item.includes('목도리') || item.includes('워머')) return 10;
  if (item.includes('손풍기')) return -3;
  if (item.includes('양산') || item.includes('부채') || item.includes('쿨') || item.includes('모자')) return -2;
  return 10;
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
