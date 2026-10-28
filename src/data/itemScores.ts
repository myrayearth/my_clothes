export type OutfitCategory = 'outer' | 'top' | 'bottom' | 'items';
export type SeasonTab = 'summer' | 'spring_autumn' | 'winter';

export interface StandardItem {
  name: string;
  category: OutfitCategory;
  season: SeasonTab;
  score: number;
}

/**
 * 전면 개편된 신규 표준 의류 아이템 데이터셋 (112종)
 */
export const STANDARD_ITEMS: StandardItem[] = [
  // =========================================================================
  // 1. 외투 (Outer - 28종 + 미착용 0점)
  // =========================================================================
  // [봄·가을] (14종)
  { name: '얇은 로브', category: 'outer', season: 'spring_autumn', score: 8 },
  { name: '린넨 셔츠', category: 'outer', season: 'spring_autumn', score: 14 },
  { name: '얇은 가디건', category: 'outer', season: 'spring_autumn', score: 14 },
  { name: '셔츠 자켓', category: 'outer', season: 'spring_autumn', score: 18 },
  { name: '홑겹 바람막이', category: 'outer', season: 'spring_autumn', score: 18 },
  { name: '바람막이 / 윈드브레이커', category: 'outer', season: 'spring_autumn', score: 24 },
  { name: '니트 가디건', category: 'outer', season: 'spring_autumn', score: 24 },
  { name: '트위드 자켓', category: 'outer', season: 'spring_autumn', score: 24 },
  { name: '청자켓 / 블루종', category: 'outer', season: 'spring_autumn', score: 28 },
  { name: '경량 패딩 조끼', category: 'outer', season: 'spring_autumn', score: 32 },
  { name: '자켓', category: 'outer', season: 'spring_autumn', score: 35 },
  { name: '트렌치코트', category: 'outer', season: 'spring_autumn', score: 35 },
  { name: '야상 점퍼', category: 'outer', season: 'spring_autumn', score: 35 },
  { name: '패딩 조끼', category: 'outer', season: 'spring_autumn', score: 40 },

  // [겨울] (14종)
  { name: '플리스(후리스) 자켓', category: 'outer', season: 'winter', score: 42 },
  { name: '라이더 자켓 / 가죽 자켓', category: 'outer', season: 'winter', score: 42 },
  { name: '경량 패딩 점퍼', category: 'outer', season: 'winter', score: 48 },
  { name: '울 코트', category: 'outer', season: 'winter', score: 55 },
  { name: '무스탕', category: 'outer', season: 'winter', score: 55 },
  { name: '모직 피코트', category: 'outer', season: 'winter', score: 62 },
  { name: '두꺼운 롱코트', category: 'outer', season: 'winter', score: 62 },
  { name: '헤비 플리스', category: 'outer', season: 'winter', score: 62 },
  { name: '숏패딩', category: 'outer', season: 'winter', score: 70 },
  { name: '롱패딩', category: 'outer', season: 'winter', score: 82 },
  { name: '누빔 코트', category: 'outer', season: 'winter', score: 82 },
  { name: '방풍 파카 (헤비 다운)', category: 'outer', season: 'winter', score: 92 },
  { name: '헤비 구스다운 롱패딩', category: 'outer', season: 'winter', score: 92 },
  { name: '대장급 헤비 다운 롱패딩', category: 'outer', season: 'winter', score: 100 },

  // =========================================================================
  // 2. 상의 (Top - 29종)
  // =========================================================================
  // [여름] (7종)
  { name: '민소매', category: 'top', season: 'summer', score: 2 },
  { name: '쿨맥스 기능성 티', category: 'top', season: 'summer', score: 4 },
  { name: '린넨 반팔 셔츠', category: 'top', season: 'summer', score: 4 },
  { name: '반팔 티셔츠', category: 'top', season: 'summer', score: 5 },
  { name: '피케 셔츠', category: 'top', season: 'summer', score: 5 },
  { name: '반팔 니트', category: 'top', season: 'summer', score: 7 },
  { name: '얇은 7부 티', category: 'top', season: 'summer', score: 8 },

  // [봄·가을] (11종)
  { name: '긴팔 티셔츠 (롱슬리브)', category: 'top', season: 'spring_autumn', score: 11 },
  { name: '옥스포드 셔츠', category: 'top', season: 'spring_autumn', score: 11 },
  { name: '일반 셔츠', category: 'top', season: 'spring_autumn', score: 13 },
  { name: '니트조끼', category: 'top', season: 'spring_autumn', score: 14 },
  { name: '기본 스웨터', category: 'top', season: 'spring_autumn', score: 15 },
  { name: '맨투맨', category: 'top', season: 'spring_autumn', score: 18 },
  { name: '후드티', category: 'top', season: 'spring_autumn', score: 18 },
  { name: '목폴라 티', category: 'top', season: 'spring_autumn', score: 23 },
  { name: '모크넥 스웨터', category: 'top', season: 'spring_autumn', score: 23 },
  { name: '기모 셔츠', category: 'top', season: 'spring_autumn', score: 26 },
  { name: '도톰한 울 스웨터', category: 'top', season: 'spring_autumn', score: 26 },

  // [겨울] (11종)
  { name: '기본 발열내의 (히트텍)', category: 'top', season: 'winter', score: 12 },
  { name: '기모 이너', category: 'top', season: 'winter', score: 20 },
  { name: '특수 방한내의', category: 'top', season: 'winter', score: 20 },
  { name: '최고등급 발열내의', category: 'top', season: 'winter', score: 20 },
  { name: '기모 맨투맨', category: 'top', season: 'winter', score: 30 },
  { name: '기모 후드티', category: 'top', season: 'winter', score: 30 },
  { name: '기모 집업 / 스웨터 집업', category: 'top', season: 'winter', score: 30 },
  { name: '기모 터틀넥', category: 'top', season: 'winter', score: 35 },
  { name: '두꺼운 기모티', category: 'top', season: 'winter', score: 35 },
  { name: '헤비 울 스웨터', category: 'top', season: 'winter', score: 35 },
  { name: '두꺼운 터틀넥', category: 'top', season: 'winter', score: 35 },

  // =========================================================================
  // 3. 하의 (Bottom - 28종)
  // =========================================================================
  // [여름] (7종)
  { name: '린넨 밴딩 쇼츠', category: 'bottom', season: 'summer', score: 2 },
  { name: '숏스커트', category: 'bottom', season: 'summer', score: 2 },
  { name: '5부 반바지', category: 'bottom', season: 'summer', score: 4 },
  { name: '얇은 반바지', category: 'bottom', season: 'summer', score: 4 },
  { name: '냉감 슬랙스', category: 'bottom', season: 'summer', score: 7 },
  { name: '린넨 팬츠', category: 'bottom', season: 'summer', score: 7 },
  { name: '7부 팬츠', category: 'bottom', season: 'summer', score: 9 },

  // [봄·가을] (12종)
  { name: '얇은 코튼 팬츠', category: 'bottom', season: 'spring_autumn', score: 12 },
  { name: '린넨 혼방 바지', category: 'bottom', season: 'spring_autumn', score: 12 },
  { name: '롱스커트', category: 'bottom', season: 'spring_autumn', score: 15 },
  { name: '얇은 슬랙스', category: 'bottom', season: 'spring_autumn', score: 15 },
  { name: '트레이닝 팬츠', category: 'bottom', season: 'spring_autumn', score: 16 },
  { name: '기본 데님', category: 'bottom', season: 'spring_autumn', score: 18 },
  { name: '면바지 / 치노 팬츠', category: 'bottom', season: 'spring_autumn', score: 18 },
  { name: '카고 팬츠', category: 'bottom', season: 'spring_autumn', score: 18 },
  { name: '기본 슬랙스', category: 'bottom', season: 'spring_autumn', score: 18 },
  { name: '두꺼운 울 슬랙스', category: 'bottom', season: 'spring_autumn', score: 26 },
  { name: '코듀로이 팬츠 (골덴 바지)', category: 'bottom', season: 'spring_autumn', score: 26 },
  { name: '두꺼운 데님', category: 'bottom', season: 'spring_autumn', score: 26 },

  // [겨울] (9종)
  { name: '하의 기본 발열내의', category: 'bottom', season: 'winter', score: 14 },
  { name: '하의 특수 방한내의', category: 'bottom', season: 'winter', score: 22 },
  { name: '기모 슬랙스', category: 'bottom', season: 'winter', score: 32 },
  { name: '기모 청바지', category: 'bottom', season: 'winter', score: 32 },
  { name: '기모 트레이닝(조거 등)', category: 'bottom', season: 'winter', score: 34 },
  { name: '융기모 방한바지', category: 'bottom', season: 'winter', score: 36 },
  { name: '기모 방풍 팬츠', category: 'bottom', season: 'winter', score: 40 },
  { name: '패딩 팬츠', category: 'bottom', season: 'winter', score: 42 },
  { name: '아웃도어 방한 바지', category: 'bottom', season: 'winter', score: 45 },

  // =========================================================================
  // 4. 소품 (Item - 27종, 합산 -10~+30점 캡 적용)
  // =========================================================================
  // [여름] (9종)
  { name: '휴대용 손풍기', category: 'items', season: 'summer', score: -3 },
  { name: '양산', category: 'items', season: 'summer', score: -2 },
  { name: '쿨링 스프레이', category: 'items', season: 'summer', score: -2 },
  { name: '쿨토시', category: 'items', season: 'summer', score: -2 },
  { name: '캡모자 / 볼캡', category: 'items', season: 'summer', score: -2 },
  { name: '부채', category: 'items', season: 'summer', score: -2 },
  { name: '땀 흡수 손수건', category: 'items', season: 'summer', score: 0 },
  { name: '선글라스', category: 'items', season: 'summer', score: 0 },
  { name: '우산', category: 'items', season: 'summer', score: 0 },

  // [봄·가을] (4종)
  { name: '얇은 스카프', category: 'items', season: 'spring_autumn', score: 3 },
  { name: '가벼운 숄', category: 'items', season: 'spring_autumn', score: 5 },
  { name: '도톰한 양말', category: 'items', season: 'spring_autumn', score: 5 },
  { name: '스타킹', category: 'items', season: 'spring_autumn', score: 5 },

  // [겨울] (14종)
  { name: '울 머플러', category: 'items', season: 'winter', score: 7 },
  { name: '가죽 / 니트 장갑', category: 'items', season: 'winter', score: 7 },
  { name: '니트 비니', category: 'items', season: 'winter', score: 7 },
  { name: '털장갑', category: 'items', season: 'winter', score: 9 },
  { name: '방한 귀마개', category: 'items', season: 'winter', score: 9 },
  { name: '방한화 / 어그부츠', category: 'items', season: 'winter', score: 9 },
  { name: '두꺼운 목도리', category: 'items', season: 'winter', score: 11 },
  { name: '붙이는 핫팩 (신체/발)', category: 'items', season: 'winter', score: 11 },
  { name: '발열 양말', category: 'items', season: 'winter', score: 11 },
  { name: '방한 넥워머', category: 'items', season: 'winter', score: 11 },
  { name: '휴대용 손난로 핫팩', category: 'items', season: 'winter', score: 13 },
  { name: '방풍 글러브', category: 'items', season: 'winter', score: 13 },
  { name: '방풍 마스크', category: 'items', season: 'winter', score: 15 },
  { name: '바라클라바 (방한모)', category: 'items', season: 'winter', score: 15 },
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
 * 표준 보온 점수 매핑 딕셔너리 (레거시 및 동의어 호환 포함)
 */
export const ITEM_SCORES: Record<string, number> = {
  // 미선택 기본
  '': 0,
  없음: 0,
  미착용: 0,

  // 1. 신규 표준 아이템 등록
  ...STANDARD_ITEMS.reduce((acc, item) => {
    acc[item.name] = item.score;
    return acc;
  }, {} as Record<string, number>),

  // 2. 레거시 및 동의어 fallback 매핑 (조회 안전장치)
  // Outer
  '나일론 바람막이': 18,
  바람막이: 24,
  윈드브레이커: 24,
  청자켓: 28,
  데님자켓: 28,
  블루종: 28,
  '경량 패딩조끼': 32,
  '경량 패딩': 48,
  '플리스 자켓': 42,
  '플리스(후리스)': 42,
  플리스: 42,
  후리스: 42,
  '라이더 자켓': 42,
  '가죽 자켓': 42,
  '모직 하프코트': 62,
  '울 롱코트': 62,
  '미들 다운': 70,
  '미들 다운 패딩': 70,
  '방풍 파카': 92,
  '방한 헤비 파카': 92,
  '방풍 헤비 다운': 92,
  '익스트림 벤치 롱패딩': 100,

  // Top
  '오버핏 반팔 티셔츠': 5,
  '코튼 반팔 티셔츠': 5,
  '반팔 셔츠': 5,
  '카라 티셔츠': 5,
  '7부 티셔츠': 8,
  긴팔티: 11,
  롱슬리브: 11,
  '긴팔 티셔츠': 11,
  셔츠: 13,
  '히트텍/내의': 12,
  '기본 발열내의': 12,
  히트텍: 12,
  발열내의: 12,
  스웨터: 15,
  '얇은 니트': 14,
  '방한 히트텍/내의': 20,
  '특수 방한 발열내의': 20,
  방한내의: 20,
  '방한 내의': 20,
  '모크넥 니트': 23,
  '도톰한 울 니트': 26,
  '기모 후드': 30,
  '기모 집업': 30,
  '니트 집업': 30,
  '두꺼운 울 니트': 35,
  '울 니트': 35,
  '헤비 니트': 35,

  // Bottom
  반바지: 4,
  '린넨 와이드 팬츠': 7,
  '하의 히트텍/타이즈': 14,
  '하의 발열내의': 14,
  '방한 타이즈': 14,
  '레귤러 데님': 18,
  '스트레이트 데님': 18,
  '스탠다드 슬랙스': 18,
  '와이드 슬랙스': 18,
  슬랙스: 18,
  '데님 팬츠': 18,
  청바지: 18,
  면바지: 18,
  '치노 팬츠': 18,
  '골덴 팬츠': 26,
  '코듀로이 팬츠': 26,
  '울 슬랙스': 26,
  '내의 + 두꺼운 데님': 40,
  '기모 조거팬츠': 34,
  '기모 트레이닝 팬츠': 34,
  '본딩 진': 34,
  '하의 방한 히트텍/타이즈': 22,
  '특수 방한내의 (하의)': 22,
  '특수 방한 타이즈': 22,
  '기모 안감 슬랙스': 32,
  '본딩 기모 방한바지': 36,
  '융기모 바지': 36,
  '방풍 팬츠': 40,
  '헤비 패딩 팬츠': 42,
  '방한 바지': 45,

  // Item
  손풍기: -3,
  캡모자: -2,
  '볼캡 모자': -2,
  손수건: 0,
  '얇은 면스카프': 3,
  '쁘띠 스카프': 3,
  '두께감 있는 양말': 5,
  '가죽 장갑': 7,
  장갑: 7,
  '보온 귀마개': 9,
  귀마개: 9,
  어그부츠: 9,
  '방한화/어그부츠': 9,
  '기모 스노우 부츠': 9,
  '신발용 핫팩': 11,
  '발바닥 핫팩': 11,
  '붙이는 핫팩': 11,
  넥워머: 11,
  '손난로 핫팩': 13,
  바라클라바: 15,
  안면마스크: 15,
  '전신 핫팩 세트': 15,
  '방풍 후드': 15,
  방한모자: 15,
};
