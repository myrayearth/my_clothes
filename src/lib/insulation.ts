/**
 * 의류 아이템별 보온 수치 점수 (Insulation Score) 및 기온별 권장 범위 정의
 */

export const ITEM_SCORES: Record<string, number> = {
  // ==========================================
  // Outer (0 ~ 100점)
  // ==========================================
  없음: 0,
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
  '트위드 자켓': 24,
  청자켓: 28,
  데님자켓: 28,
  블루종: 28,
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
  '경량 패딩조끼': 48,
  '경량 조끼 패딩': 48,
  '울 코트': 55,
  무스탕: 55,
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
  '피케 셔츠': 5,
  '반팔 티셔츠': 5,
  '반팔 셔츠': 5,
  '얇은 7부 티': 8,
  '7부 티셔츠': 8,
  '긴팔 티셔츠': 11,
  '옥스포드 셔츠': 11,
  긴팔티: 11,
  롱슬리브: 11,
  '얇은 니트': 14,
  니트조끼: 14,
  맨투맨: 18,
  후드티: 18,
  '기본 발열내의': 20,
  히트텍: 20,
  발열내의: 20,
  '목폴라 티': 23,
  '모크넥 니트': 23,
  '도톰한 울 니트': 26,
  셔츠: 26,
  '기모 맨투맨': 30,
  '기모 후드': 30,
  '기모 후드티': 30,
  '기모 이너': 30,
  '특수 방한내의': 30,
  '두꺼운 울 니트': 30,
  방한내의: 30,
  '방한 내의': 30,
  '기모 집업': 30,
  '니트 집업': 30,
  '기모 터틀넥': 35,
  '헤비 울 스웨터': 35,
  '두꺼운 기모티': 35,
  '최고등급 발열내의': 35,
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
  롱스커트: 15,
  '얇은 슬랙스': 15,
  '레귤러 데님': 18,
  면바지: 18,
  '치노 팬츠': 18,
  '카고 팬츠': 18,
  '하의 발열내의': 20,
  '방한 타이즈': 20,
  '스트레이트 데님': 22,
  '와이드 슬랙스': 22,
  '스탠다드 슬랙스': 22,
  슬랙스: 22,
  '데님 팬츠': 22,
  청바지: 22,
  '두꺼운 울 슬랙스': 26,
  '코듀로이 팬츠': 26,
  '골덴 팬츠': 26,
  '두꺼운 데님': 26,
  '울 슬랙스': 26,
  '기모 슬랙스': 32,
  '기모 청바지': 32,
  '기모 조거팬츠': 32,
  '기모 안감 슬랙스': 32,
  '본딩 기모 방한바지': 36,
  '융기모 바지': 36,
  '기모 트레이닝 팬츠': 36,
  '내의 + 두꺼운 데님': 36,
  '본딩 진': 36,
  '기모 방풍 팬츠': 40,
  '패딩 팬츠': 40,
  '방풍 팬츠': 40,
  '헤비 패딩 팬츠': 45,
  '아웃도어 방한 바지': 45,
  '방한 바지': 45,

  // ==========================================
  // Item (-5 ~ 15점)
  // ==========================================
  '휴대용 손풍기': -5,
  '쿨링 스프레이': -5,
  손풍기: -5,
  양산: -3,
  부채: -3,
  쿨토시: -3,
  캡모자: -3,
  '볼캡 모자': -3,
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
  if (item.includes('패딩') || item.includes('다운')) return 50;
  if (item.includes('코트') || item.includes('자켓')) return 35;
  if (item.includes('기모')) return 30;
  if (item.includes('니트') || item.includes('맨투맨') || item.includes('후드')) return 20;
  if (item.includes('핫팩') || item.includes('목도리') || item.includes('워머')) return 10;
  if (item.includes('손풍기') || item.includes('쿨')) return -4;
  return 10;
}

/**
 * 선택된 전체 복장의 총 보온 지수(점수) 계산
 * - Outer 단일 점수 + Top 배열 요소 합계 + Bottom 배열 요소 합계 + Item 배열 요소 합계
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
  const btmScore = btmArr.reduce((sum, item) => sum + getItemInsulationScore(item), 0);

  const itemsArr = selected.items || selected.item || [];
  const itemScore = itemsArr.reduce((sum, item) => sum + getItemInsulationScore(item), 0);

  return outerScore + topScore + btmScore + itemScore;
}

export interface InsulationTargetRange {
  min: number;
  max: number;
  label: string;
}

/**
 * 기온별 권장 보온 지수 합계 범위 반환
 */
export function getInsulationTargetRange(temp: number): InsulationTargetRange {
  const roundedTemp = Math.round(temp);

  if (roundedTemp >= 30) {
    return { min: 3, max: 10, label: '3 ~ 10점' };
  } else if (roundedTemp >= 25) {
    return { min: 12, max: 22, label: '12 ~ 22점' };
  } else if (roundedTemp >= 20) {
    return { min: 40, max: 55, label: '40 ~ 55점' };
  } else if (roundedTemp >= 15) {
    return { min: 58, max: 75, label: '58 ~ 75점' };
  } else if (roundedTemp >= 10) {
    return { min: 80, max: 100, label: '80 ~ 100점' };
  } else if (roundedTemp >= 5) {
    return { min: 110, max: 135, label: '110 ~ 135점' };
  } else if (roundedTemp >= 0) {
    return { min: 145, max: 175, label: '145 ~ 175점' };
  } else if (roundedTemp >= -5) {
    return { min: 180, max: 210, label: '180 ~ 210점' };
  } else if (roundedTemp >= -10) {
    return { min: 215, max: 250, label: '215 ~ 250점' };
  } else if (roundedTemp >= -15) {
    return { min: 255, max: 290, label: '255 ~ 290점' };
  } else {
    return { min: 295, max: 350, label: '295점 이상' };
  }
}

export type InsulationStatus = 'COLD' | 'OPTIMAL' | 'HOT';

/**
 * 현재 보온 지수와 권장 범위 비교 상태 산출
 */
export function getInsulationStatus(
  totalScore: number,
  minTarget: number,
  maxTarget: number
): InsulationStatus {
  if (totalScore < minTarget) return 'COLD';
  if (totalScore > maxTarget) return 'HOT';
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
