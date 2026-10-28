import { OutfitSelection, OutfitCategory } from '@/types/outfit';
import { OutfitLog, TemperatureEvaluation } from '@/types/database';
import { STANDARD_ITEMS, ITEM_SCORES, STANDARD_ITEM_SET } from '@/data/itemScores';

/**
 * [레거시 ➔ 신규 표준 아이템 일괄 치환 맵 (LEGACY_TO_NEW_MAP)]
 * 과거에 축적된 상세 명칭 및 구버전 복장명을 48종 신규 압축 표준 명칭으로 치환
 */
export const LEGACY_TO_NEW_MAP: Record<string, string> = {
  // =========================================================================
  // 1. 하의 (Bottom) 치환 규칙
  // =========================================================================
  '린넨 밴딩 쇼츠': '반바지',
  '숏스커트': '반바지',
  '얇은 반바지': '반바지',
  '5부 반바지': '반바지',
  '7부 팬츠': '7부 바지',
  '린넨 팬츠': '얇은 긴바지',
  '냉감 슬랙스': '얇은 긴바지',
  '얇은 코튼 팬츠': '간절기 얇은 바지',
  '린넨 혼방 바지': '간절기 얇은 바지',
  '얇은 슬랙스': '간절기 얇은 바지',
  '롱스커트': '간절기 얇은 바지',
  '기본 데님': '기본 긴바지',
  '기본 슬랙스': '기본 긴바지',
  '면바지 / 치노 팬츠': '기본 긴바지',
  '트레이닝 팬츠': '기본 긴바지',
  '카고 팬츠': '기본 긴바지',
  '두꺼운 데님': '두꺼운 긴바지',
  '두꺼운 울 슬랙스': '두꺼운 긴바지',
  '코듀로이 팬츠': '두꺼운 긴바지',
  '코듀로이 팬츠 (골덴 바지)': '두꺼운 긴바지',
  '기모 슬랙스': '기모 긴바지',
  '기모 청바지': '기모 긴바지',
  '기모 트레이닝(조거 등)': '기모 긴바지',
  '기모 트레이닝 팬츠': '기모 긴바지',
  '하의 기본 발열내의': '하의 얇은 이너',
  '하의 히트텍/타이즈': '하의 얇은 이너',
  '하의 발열내의': '하의 얇은 이너',
  '방한 타이즈': '하의 얇은 이너',
  '하의 특수 방한내의': '하의 기모 이너',
  '하의 방한 히트텍/타이즈': '하의 기모 이너',
  '특수 방한내의 (하의)': '하의 기모 이너',
  '특수 방한 타이즈': '하의 기모 이너',
  '기모 방풍 팬츠': '패딩/방풍 바지',
  '패딩 팬츠': '패딩/방풍 바지',
  '아웃도어 방한 바지': '헤비 방한바지',
  '골덴 바지': '두꺼운 긴바지',
  '골덴 팬츠': '두꺼운 긴바지',
  '청바지': '기본 긴바지',
  '슬랙스': '기본 긴바지',
  '면바지': '기본 긴바지',
  '레귤러 데님': '기본 긴바지',
  '스트레이트 데님': '기본 긴바지',
  '스탠다드 슬랙스': '기본 긴바지',
  '와이드 슬랙스': '기본 긴바지',
  '린넨 와이드 팬츠': '얇은 긴바지',
  '데님 팬츠': '기본 긴바지',
  '치노 팬츠': '기본 긴바지',
  '울 슬랙스': '두꺼운 긴바지',
  '기모 조거팬츠': '기모 긴바지',
  '본딩 진': '기모 긴바지',
  '기모 안감 슬랙스': '기모 긴바지',
  '본딩 기모 방한바지': '융기모 방한바지',
  '융기모 바지': '융기모 방한바지',
  '방풍 팬츠': '패딩/방풍 바지',
  '헤비 패딩 팬츠': '패딩/방풍 바지',
  '방한 바지': '헤비 방한바지',

  // =========================================================================
  // 2. 상의 (Top) 치환 규칙
  // =========================================================================
  '반팔 티셔츠': '기본 반팔',
  '쿨맥스 기능성 티': '기본 반팔',
  '린넨 반팔 셔츠': '기본 반팔',
  '피케 셔츠': '기본 반팔',
  '오버핏 반팔 티셔츠': '기본 반팔',
  '코튼 반팔 티셔츠': '기본 반팔',
  '반팔': '기본 반팔',
  '카라 티셔츠': '기본 반팔',
  '얇은 7부 티': '7부/니트반팔',
  '7부 티셔츠': '7부/니트반팔',
  '반팔 니트': '7부/니트반팔',
  '긴팔 티셔츠 (롱슬리브)': '기본 긴팔',
  '긴팔 티셔츠': '기본 긴팔',
  '긴팔티': '기본 긴팔',
  '롱슬리브': '기본 긴팔',
  '옥스포드 셔츠': '기본 긴팔',
  '기본 발열내의 (히트텍)': '얇은 이너',
  '기본 발열내의': '얇은 이너',
  '히트텍/내의': '얇은 이너',
  '히트텍': '얇은 이너',
  '발열내의': '얇은 이너',
  '일반 셔츠': '얇은 셔츠/가디건',
  '셔츠': '얇은 셔츠/가디건',
  '기본 스웨터': '가벼운 스웨터/조끼',
  '스웨터': '가벼운 스웨터/조끼',
  '얇은 니트': '가벼운 스웨터/조끼',
  '니트조끼': '가벼운 스웨터/조끼',
  '맨투맨': '맨투맨/후드티',
  '후드티': '맨투맨/후드티',
  '특수 방한내의': '기모 이너',
  '최고등급 발열내의': '기모 이너',
  '방한 히트텍/내의': '기모 이너',
  '특수 방한 발열내의': '기모 이너',
  '방한내의': '기모 이너',
  '목폴라 티': '목폴라/도톰 셔츠',
  '모크넥 스웨터': '목폴라/도톰 셔츠',
  '모크넥 니트': '목폴라/도톰 셔츠',
  '기모 셔츠': '목폴라/도톰 셔츠',
  '도톰한 울 스웨터': '목폴라/도톰 셔츠',
  '도톰한 울 니트': '목폴라/도톰 셔츠',
  '기모 맨투맨': '기모 맨투맨/후드',
  '기모 후드티': '기모 맨투맨/후드',
  '기모 후드': '기모 맨투맨/후드',
  '기모 집업 / 스웨터 집업': '기모 맨투맨/후드',
  '기모 집업': '기모 맨투맨/후드',
  '니트 집업': '기모 맨투맨/후드',
  '기모 터틀넥': '기모 터틀넥/기모티',
  '두꺼운 기모티': '기모 터틀넥/기모티',
  '두꺼운 터틀넥': '기모 터틀넥/기모티',
  '두꺼운 울 니트': '헤비 울 스웨터',
  '울 니트': '헤비 울 스웨터',
  '헤비 니트': '헤비 울 스웨터',

  // =========================================================================
  // 3. 외투 (Outer) 치환 규칙
  // =========================================================================
  '자켓': '트렌치/야상/자켓',
  '트렌치코트': '트렌치/야상/자켓',
  '야상 점퍼': '트렌치/야상/자켓',
  '바람막이 / 윈드브레이커': '간절기 자켓/점퍼',
  '바람막이': '간절기 자켓/점퍼',
  '윈드브레이커': '간절기 자켓/점퍼',
  '나일론 바람막이': '홑겹 바람막이/자켓',
  '홑겹 바람막이': '홑겹 바람막이/자켓',
  '니트 가디건': '간절기 자켓/점퍼',
  '가디건': '얇은 셔츠/가디건',
  '얇은 가디건': '얇은 셔츠/가디건',
  '여름 얇은 가디건': '얇은 셔츠/가디건',
  '린넨 셔츠': '얇은 셔츠/가디건',
  '얇은 로브': '얇은 셔츠/가디건',
  '셔츠 자켓': '얇은 셔츠/가디건',
  '청자켓 / 블루종': '간절기 자켓/점퍼',
  '청자켓': '간절기 자켓/점퍼',
  '데님자켓': '간절기 자켓/점퍼',
  '블루종': '간절기 자켓/점퍼',
  '트위드 자켓': '간절기 자켓/점퍼',
  '경량 패딩조끼': '경량 패딩 조끼',
  '경량 조끼 패딩': '경량 패딩 조끼',
  '경량 패딩 점퍼': '경량 패딩',
  '플리스(후리스) 자켓': '가죽/플리스 자켓',
  '플리스 자켓': '가죽/플리스 자켓',
  '플리스': '가죽/플리스 자켓',
  '후리스': '가죽/플리스 자켓',
  '라이더 자켓 / 가죽 자켓': '가죽/플리스 자켓',
  '라이더 자켓': '가죽/플리스 자켓',
  '가죽 자켓': '가죽/플리스 자켓',
  '울 코트': '겨울 코트',
  '무스탕': '겨울 코트',
  '모직 피코트': '겨울 코트',
  '모직 하프코트': '겨울 코트',
  '두꺼운 롱코트': '겨울 코트',
  '울 롱코트': '겨울 코트',
  '누빔 코트': '겨울 코트',
  '헤비 플리스': '가죽/플리스 자켓',
  '미들 다운': '숏패딩',
  '미들 다운 패딩': '숏패딩',
  '방풍 파카 (헤비 다운)': '헤비 다운 패딩',
  '방풍 파카': '헤비 다운 패딩',
  '방한 헤비 파카': '헤비 다운 패딩',
  '방풍 헤비 다운': '헤비 다운 패딩',
  '헤비 구스다운 롱패딩': '헤비 다운 패딩',
  '대장급 헤비 다운 롱패딩': '헤비 다운 패딩',
  '익스트림 벤치 롱패딩': '헤비 다운 패딩',

  // =========================================================================
  // 4. 소품 (Items) 치환 규칙
  // =========================================================================
  '휴대용 손풍기': '냉각 소품',
  '부채': '냉각 소품',
  '쿨링 스프레이': '냉각 소품',
  '양산': '자외선 차단',
  '쿨토시': '자외선 차단',
  '캡모자 / 볼캡': '자외선 차단',
  '땀 흡수 손수건': '위생/날씨',
  '선글라스': '위생/날씨',
  '우산': '위생/날씨',
  '얇은 스카프': '가벼운 스카프/숄',
  '가벼운 숄': '가벼운 스카프/숄',
  '도톰한 양말': '기본 양말/스타킹',
  '스타킹': '기본 양말/스타킹',
  '울 머플러': '비니/가벼운 장갑',
  '가죽 / 니트 장갑': '비니/가벼운 장갑',
  '니트 비니': '비니/가벼운 장갑',
  '털장갑': '방한 신발/귀마개',
  '방한 귀마개': '방한 신발/귀마개',
  '방한화 / 어그부츠': '방한 신발/귀마개',
  '두꺼운 목도리': '두꺼운 목도리/넥워머',
  '방한 넥워머': '두꺼운 목도리/넥워머',
  '발열 양말': '두꺼운 목도리/넥워머',
  '휴대용 손난로 핫팩': '핫팩류',
  '붙이는 핫팩 (신체/발)': '핫팩류',
  '방풍 마스크': '방풍 마스크/바라클라바',
  '바라클라바 (방한모)': '방풍 마스크/바라클라바',
  '방풍 글러브': '방풍 마스크/바라클라바',
};

/**
 * 단일 아이템 이름 치환 함수
 */
export function migrateItemName(item: string): string {
  if (!item || item === '없음' || item === '미착용' || item.trim() === '') {
    return item;
  }
  const trimmed = item.trim();
  if (LEGACY_TO_NEW_MAP[trimmed]) {
    return LEGACY_TO_NEW_MAP[trimmed];
  }
  return trimmed;
}

/**
 * 아이템 배열 치환 함수 (중복 제거 포함)
 */
export function migrateItemList(items: string[]): string[] {
  if (!Array.isArray(items)) return [];
  const migrated = items
    .map(migrateItemName)
    .filter((name) => name && name !== '없음');
  return Array.from(new Set(migrated));
}

/**
 * 복장 선택 객체 치환 함수
 */
export function migrateOutfitSelection(selection: OutfitSelection): OutfitSelection {
  return {
    outer: selection.outer ? migrateItemName(selection.outer) : '없음',
    top: migrateItemList(selection.top),
    bottom: migrateItemList(selection.bottom),
    items: migrateItemList(selection.items),
  };
}

/**
 * 복장 로그(OutfitLog 또는 TemperatureEvaluation) 레코드 치환 함수
 */
export function migrateOutfitLog<T extends OutfitLog | TemperatureEvaluation>(log: T): T {
  const topList = Array.isArray(log.selected_top) ? log.selected_top : (log.selected_top ? [log.selected_top] : []);
  const bottomList = Array.isArray(log.selected_bottom) ? log.selected_bottom : (log.selected_bottom ? [log.selected_bottom] : []);
  const itemsList = Array.isArray(log.selected_items) ? log.selected_items : [];

  return {
    ...log,
    selected_outer: log.selected_outer ? migrateItemName(log.selected_outer) : '없음',
    selected_top: migrateItemList(topList),
    selected_bottom: migrateItemList(bottomList),
    selected_items: migrateItemList(itemsList),
  } as T;
}

/**
 * 아이템이 신규 표준 48종에 속하지 않는 구버전/단종 항목인지 판별
 */
export function isDiscontinuedItem(item: string): boolean {
  if (!item || item === '없음' || item === '미착용' || item.trim() === '') return false;
  const trimmed = item.trim();
  return !STANDARD_ITEM_SET.has(trimmed);
}

/**
 * 구버전/단종 아이템에 대해 최적의 신규 표준 아이템 대체 제안 반환
 */
export function findBestReplacementItem(
  discontinuedItem: string,
  category: OutfitCategory
): string {
  if (!discontinuedItem) return '';
  const trimmed = discontinuedItem.trim();
  // 1. 치환 테이블 우선 매핑
  if (LEGACY_TO_NEW_MAP[trimmed]) {
    return LEGACY_TO_NEW_MAP[trimmed];
  }

  // 2. 가장 유사한 보온 점수 후보 매핑
  const defaultCategoryScore: Record<OutfitCategory, number> = {
    outer: 35,
    top: 18,
    bottom: 20,
    items: 10,
  };
  const itemScore =
    ITEM_SCORES[trimmed] ?? defaultCategoryScore[category] ?? 20;

  const candidates = STANDARD_ITEMS.filter((it) => it.category === category);
  if (candidates.length === 0) return discontinuedItem;

  let best = candidates[0];
  let minDiff = Math.abs(itemScore - best.score);

  for (const cand of candidates) {
    const diff = Math.abs(itemScore - cand.score);
    if (diff < minDiff) {
      minDiff = diff;
      best = cand;
    }
  }
  return best.name;
}

/**
 * 로그 데이터 내에 존재하는 단종/구버전 아이템 목록 및 최적 대체 제안 추출
 */
export function getDiscontinuedItemsInLog(log: OutfitLog | TemperatureEvaluation): {
  category: OutfitCategory;
  oldItem: string;
  replacement: string;
}[] {
  const result: { category: OutfitCategory; oldItem: string; replacement: string }[] = [];

  if (log.selected_outer && isDiscontinuedItem(log.selected_outer)) {
    result.push({
      category: 'outer',
      oldItem: log.selected_outer,
      replacement: findBestReplacementItem(log.selected_outer, 'outer'),
    });
  }

  const topList = Array.isArray(log.selected_top) ? log.selected_top : [log.selected_top];
  for (const t of topList) {
    if (t && isDiscontinuedItem(t)) {
      result.push({
        category: 'top',
        oldItem: t,
        replacement: findBestReplacementItem(t, 'top'),
      });
    }
  }

  const bottomList = Array.isArray(log.selected_bottom)
    ? log.selected_bottom
    : [log.selected_bottom];
  for (const b of bottomList) {
    if (b && isDiscontinuedItem(b)) {
      result.push({
        category: 'bottom',
        oldItem: b,
        replacement: findBestReplacementItem(b, 'bottom'),
      });
    }
  }

  const itemsList = Array.isArray(log.selected_items) ? log.selected_items : [];
  for (const it of itemsList) {
    if (it && isDiscontinuedItem(it)) {
      result.push({
        category: 'items',
        oldItem: it,
        replacement: findBestReplacementItem(it, 'items'),
      });
    }
  }

  return result;
}

/**
 * 하위 호환 migrateItem (배열 반환)
 */
export function migrateItem(item: string): string[] {
  const converted = migrateItemName(item);
  return converted ? [converted] : [];
}

/**
 * Supabase DB용 SQL 마이그레이션 스크립트 생성기
 */
export function generateMigrationSql(): string {
  const queries: string[] = [
    '-- =========================================================================',
    '-- Ondo Fit outfit_logs 신규 표준 명칭 데이터 마이그레이션 스크립트',
    '-- =========================================================================',
    'BEGIN;',
  ];

  for (const [legacy, next] of Object.entries(LEGACY_TO_NEW_MAP)) {
    const escapedLegacy = legacy.replace(/'/g, "''");
    const escapedNext = next.replace(/'/g, "''");

    // Outer 업데이트
    queries.push(
      `UPDATE outfit_logs SET selected_outer = '${escapedNext}' WHERE selected_outer = '${escapedLegacy}';`
    );
    // Top, Bottom, Items JSONB/Array 업데이트
    queries.push(
      `UPDATE outfit_logs SET selected_top = array_replace(selected_top, '${escapedLegacy}', '${escapedNext}') WHERE '${escapedLegacy}' = ANY(selected_top);`
    );
    queries.push(
      `UPDATE outfit_logs SET selected_bottom = array_replace(selected_bottom, '${escapedLegacy}', '${escapedNext}') WHERE '${escapedLegacy}' = ANY(selected_bottom);`
    );
    queries.push(
      `UPDATE outfit_logs SET selected_items = array_replace(selected_items, '${escapedLegacy}', '${escapedNext}') WHERE '${escapedLegacy}' = ANY(selected_items);`
    );
  }

  queries.push('COMMIT;');
  return queries.join('\n');
}
