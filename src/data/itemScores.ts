export type OutfitCategory = 'outer' | 'top' | 'bottom' | 'items';
export type SeasonTab = 'summer' | 'spring_autumn' | 'winter';

export interface StandardItem {
  name: string;
  category: OutfitCategory;
  season: SeasonTab;
  score: number;
}

/**
 * 전면 압축 개편된 신규 표준 의류 및 소품 데이터셋 (총 48종)
 * - 외투(Outer): 12종
 * - 상의(Top): 14종
 * - 하의(Bottom): 12종
 * - 소품(Item): 10종
 */
export const STANDARD_ITEMS: StandardItem[] = [
  // =========================================================================
  // 1. 외투 (Outer - 12종)
  // =========================================================================
  { name: '얇은 셔츠/가디건', category: 'outer', season: 'spring_autumn', score: 14 },
  { name: '홑겹 바람막이/자켓', category: 'outer', season: 'spring_autumn', score: 18 },
  { name: '간절기 자켓/점퍼', category: 'outer', season: 'spring_autumn', score: 25 },
  { name: '경량 패딩 조끼', category: 'outer', season: 'spring_autumn', score: 32 },
  { name: '트렌치/야상/자켓', category: 'outer', season: 'spring_autumn', score: 35 },
  { name: '패딩 조끼', category: 'outer', season: 'spring_autumn', score: 40 },
  { name: '가죽/플리스 자켓', category: 'outer', season: 'winter', score: 42 },
  { name: '경량 패딩', category: 'outer', season: 'winter', score: 48 },
  { name: '겨울 코트', category: 'outer', season: 'winter', score: 58 },
  { name: '숏패딩', category: 'outer', season: 'winter', score: 70 },
  { name: '롱패딩', category: 'outer', season: 'winter', score: 82 },
  { name: '헤비 다운 패딩', category: 'outer', season: 'winter', score: 95 },

  // =========================================================================
  // 2. 상의 (Top - 14종)
  // =========================================================================
  { name: '민소매', category: 'top', season: 'summer', score: 2 },
  { name: '기본 반팔', category: 'top', season: 'summer', score: 5 },
  { name: '7부/니트반팔', category: 'top', season: 'summer', score: 7 },
  { name: '얇은 긴팔', category: 'top', season: 'summer', score: 8 },
  { name: '기본 긴팔', category: 'top', season: 'spring_autumn', score: 11 },
  { name: '얇은 이너', category: 'top', season: 'winter', score: 12 },
  { name: '얇은 셔츠/가디건', category: 'top', season: 'spring_autumn', score: 13 },
  { name: '가벼운 스웨터/조끼', category: 'top', season: 'spring_autumn', score: 15 },
  { name: '맨투맨/후드티', category: 'top', season: 'spring_autumn', score: 18 },
  { name: '기모 이너', category: 'top', season: 'winter', score: 20 },
  { name: '목폴라/도톰 셔츠', category: 'top', season: 'spring_autumn', score: 24 },
  { name: '기모 맨투맨/후드', category: 'top', season: 'winter', score: 30 },
  { name: '기모 터틀넥/기모티', category: 'top', season: 'winter', score: 35 },
  { name: '헤비 울 스웨터', category: 'top', season: 'winter', score: 35 },

  // =========================================================================
  // 3. 하의 (Bottom - 12종)
  // =========================================================================
  { name: '반바지', category: 'bottom', season: 'summer', score: 3 },
  { name: '7부 바지', category: 'bottom', season: 'summer', score: 5 },
  { name: '얇은 긴바지', category: 'bottom', season: 'summer', score: 7 },
  { name: '간절기 얇은 바지', category: 'bottom', season: 'spring_autumn', score: 13 },
  { name: '하의 얇은 이너', category: 'bottom', season: 'winter', score: 14 },
  { name: '기본 긴바지', category: 'bottom', season: 'spring_autumn', score: 18 },
  { name: '하의 기모 이너', category: 'bottom', season: 'winter', score: 22 },
  { name: '두꺼운 긴바지', category: 'bottom', season: 'spring_autumn', score: 26 },
  { name: '기모 긴바지', category: 'bottom', season: 'winter', score: 32 },
  { name: '융기모 방한바지', category: 'bottom', season: 'winter', score: 36 },
  { name: '패딩/방풍 바지', category: 'bottom', season: 'winter', score: 41 },
  { name: '헤비 방한바지', category: 'bottom', season: 'winter', score: 45 },

  // =========================================================================
  // 4. 소품 (Item - 11종, 합산 -10~+30점 캡 적용)
  // =========================================================================
  { name: '손풍기', category: 'items', season: 'summer', score: -3 },
  { name: '모자/썬캡', category: 'items', season: 'summer', score: -3 },
  { name: '양산', category: 'items', season: 'summer', score: -3 },
  { name: '자외선 차단', category: 'items', season: 'summer', score: -2 },
  { name: '가벼운 스카프/숄', category: 'items', season: 'spring_autumn', score: 4 },
  { name: '기본 양말/스타킹', category: 'items', season: 'spring_autumn', score: 5 },
  { name: '비니/가벼운 장갑', category: 'items', season: 'winter', score: 7 },
  { name: '방한 신발/귀마개', category: 'items', season: 'winter', score: 9 },
  { name: '두꺼운 목도리/넥워머', category: 'items', season: 'winter', score: 11 },
  { name: '핫팩류', category: 'items', season: 'winter', score: 12 },
  { name: '방풍 마스크/바라클라바', category: 'items', season: 'winter', score: 14 },
];

/**
 * 카테고리별 표준 아이템 목록
 */
export const STANDARD_ITEMS_BY_CATEGORY: Record<OutfitCategory, StandardItem[]> = {
  outer: STANDARD_ITEMS.filter((i) => i.category === 'outer'),
  top: STANDARD_ITEMS.filter((i) => i.category === 'top'),
  bottom: STANDARD_ITEMS.filter((i) => i.category === 'bottom'),
  items: STANDARD_ITEMS.filter((i) => i.category === 'items'),
};

export const STANDARD_ITEM_SET = new Set<string>(STANDARD_ITEMS.map((i) => i.name));

/**
 * 신규 표준 아이템별 계절 맵
 */
export const ITEM_SEASONS: Record<string, SeasonTab> = STANDARD_ITEMS.reduce(
  (acc, item) => {
    acc[item.name] = item.season;
    return acc;
  },
  {} as Record<string, SeasonTab>
);

/**
 * 표준 보온 점수 매핑 딕셔너리 (신규 표준 및 레거시 치환 맵 포함)
 */
export const ITEM_SCORES: Record<string, number> = {
  // 미선택 기본
  '': 0,
  없음: 0,
  미착용: 0,

  // 1. 신규 표준 아이템 점수 등록
  ...STANDARD_ITEMS.reduce((acc, item) => {
    acc[item.name] = item.score;
    return acc;
  }, {} as Record<string, number>),

  // 2. 레거시 및 동의어 fallback 매핑 (조회 안전장치)
  // Outer
  '나일론 바람막이': 18,
  홑겹바람막이: 18,
  '홑겹 바람막이': 18,
  바람막이: 18,
  윈드브레이커: 18,
  '바람막이 / 윈드브레이커': 25,
  가디건: 14,
  '얇은 가디건': 14,
  '린넨 셔츠': 14,
  '얇은 로브': 14,
  '셔츠 자켓': 14,
  청자켓: 25,
  '청자켓 / 블루종': 25,
  데님자켓: 25,
  블루종: 25,
  '트위드 자켓': 25,
  '경량 패딩조끼': 32,
  '경량 조끼 패딩': 32,
  '경량 패딩 점퍼': 48,
  '경량 패딩': 48,
  자켓: 35,
  트렌치코트: 35,
  '야상 점퍼': 35,
  '플리스(후리스) 자켓': 42,
  '플리스 자켓': 42,
  플리스: 42,
  후리스: 42,
  '라이더 자켓 / 가죽 자켓': 42,
  '라이더 자켓': 42,
  '가죽 자켓': 42,
  '울 코트': 58,
  무스탕: 58,
  '모직 피코트': 58,
  '두꺼운 롱코트': 58,
  '누빔 코트': 58,
  '모직 하프코트': 58,
  '헤비 플리스': 42,
  '미들 다운': 70,
  '방풍 파카 (헤비 다운)': 95,
  '방풍 파카': 95,
  '방한 헤비 파카': 95,
  '헤비 구스다운 롱패딩': 95,
  '대장급 헤비 다운 롱패딩': 95,

  // Top
  '반팔 티셔츠': 5,
  '쿨맥스 기능성 티': 5,
  '린넨 반팔 셔츠': 5,
  '피케 셔츠': 5,
  '오버핏 반팔 티셔츠': 5,
  '코튼 반팔 티셔츠': 5,
  '반팔 니트': 7,
  '얇은 7부 티': 7,
  '7부 티셔츠': 7,
  '긴팔 티셔츠 (롱슬리브)': 11,
  '옥스포드 셔츠': 11,
  '긴팔 티셔츠': 11,
  긴팔티: 11,
  롱슬리브: 11,
  '기본 발열내의 (히트텍)': 12,
  '히트텍/내의': 12,
  히트텍: 12,
  발열내의: 12,
  '기본 발열내의': 12,
  '일반 셔츠': 13,
  셔츠: 13,
  '기본 스웨터': 15,
  니트조끼: 15,
  스웨터: 15,
  맨투맨: 18,
  후드티: 18,
  특수방한내의: 20,
  '특수 방한내의': 20,
  '최고등급 발열내의': 20,
  '방한 히트텍/내의': 20,
  '특수 방한 발열내의': 20,
  방한내의: 20,
  '목폴라 티': 24,
  '모크넥 스웨터': 24,
  '기모 셔츠': 24,
  '도톰한 울 스웨터': 24,
  '도톰한 울 니트': 24,
  '기모 맨투맨': 30,
  '기모 후드티': 30,
  '기모 집업 / 스웨터 집업': 30,
  '기모 집업': 30,
  '기모 터틀넥': 35,
  '두꺼운 기모티': 35,
  '두꺼운 터틀넥': 35,
  '두꺼운 울 니트': 35,
  '울 니트': 35,
  '헤비 니트': 35,

  // Bottom
  '린넨 밴딩 쇼츠': 3,
  숏스커트: 3,
  '얇은 반바지': 3,
  '5부 반바지': 3,
  '7부 팬츠': 5,
  '린넨 팬츠': 7,
  '냉감 슬랙스': 7,
  '얇은 코튼 팬츠': 13,
  '린넨 혼방 바지': 13,
  '얇은 슬랙스': 13,
  롱스커트: 13,
  '기본 데님': 18,
  '기본 슬랙스': 18,
  '면바지 / 치노 팬츠': 18,
  '트레이닝 팬츠': 18,
  '카고 팬츠': 18,
  청바지: 18,
  슬랙스: 18,
  면바지: 18,
  '하의 기본 발열내의': 14,
  '하의 히트텍/타이즈': 14,
  '하의 발열내의': 14,
  '방한 타이즈': 14,
  '하의 특수 방한내의': 22,
  '하의 방한 히트텍/타이즈': 22,
  '특수 방한내의 (하의)': 22,
  '특수 방한 타이즈': 22,
  '두꺼운 데님': 26,
  '두꺼운 울 슬랙스': 26,
  '코듀로이 팬츠': 26,
  '코듀로이 팬츠 (골덴 바지)': 26,
  '골덴 팬츠': 26,
  '기모 슬랙스': 32,
  '기모 청바지': 32,
  '기모 트레이닝(조거 등)': 32,
  '기모 트레이닝 팬츠': 32,
  '기모 방풍 팬츠': 41,
  '패딩 팬츠': 41,
  '아웃도어 방한 바지': 45,

  // Items
  '손풍기': -3,
  '모자/썬캡': -3,
  '양산': -3,
  '휴대용 손풍기': -3,
  '냉각 소품': -3,
  '위생/날씨': -3,
  부채: -3,
  '쿨링 스프레이': -3,
  '자외선 차단': -2,
  쿨토시: -2,
  '캡모자 / 볼캡': -3,
  '모자': -3,
  '썬캡': -3,
  '캡모자': -3,
  '볼캡': -3,
  '땀 흡수 손수건': 0,
  선글라스: -2,
  우산: 0,
  '얇은 스카프': 4,
  '가벼운 숄': 4,
  '도톰한 양말': 5,
  스타킹: 5,
  '울 머플러': 7,
  '가죽 / 니트 장갑': 7,
  '니트 비니': 7,
  털장갑: 9,
  '방한 귀마개': 9,
  '방한화 / 어그부츠': 9,
  '두꺼운 목도리': 11,
  '방한 넥워머': 11,
  '발열 양말': 11,
  '휴대용 손난로 핫팩': 12,
  '붙이는 핫팩 (신체/발)': 12,
  '방풍 마스크': 14,
  '바라클라바 (방한모)': 14,
  '방풍 글러브': 14,
};
