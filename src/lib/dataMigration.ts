import { STANDARD_ITEMS, ITEM_SCORES } from '@/data/itemScores';
import { OutfitSelection, OutfitCategory } from '@/types/outfit';
import { OutfitLog, TemperatureEvaluation } from '@/types/database';

/**
 * 1. 레거시 아이템 ➔ 신규 표준 아이템 치환 매핑 테이블
 * (복합 항목의 경우 문자열 배열로 1:N 분리 매핑)
 */
export const LEGACY_REPLACEMENTS: Record<string, string | string[]> = {
  // Outer 치환 규칙
  '나일론 바람막이': '홑겹 바람막이',
  없음: '',
  가디건: '얇은 가디건',
  '여름 얇은 가디건': '얇은 가디건',
  바람막이: '바람막이 / 윈드브레이커',
  윈드브레이커: '바람막이 / 윈드브레이커',
  청자켓: '청자켓 / 블루종',
  데님자켓: '청자켓 / 블루종',
  블루종: '청자켓 / 블루종',
  '경량 패딩조끼': '경량 패딩 조끼',
  '경량 조끼 패딩': '경량 패딩 조끼',
  '경량 패딩': '경량 패딩 점퍼',
  '플리스 자켓': '플리스(후리스) 자켓',
  '플리스(후리스)': '플리스(후리스) 자켓',
  플리스: '플리스(후리스) 자켓',
  후리스: '플리스(후리스) 자켓',
  '라이더 자켓': '라이더 자켓 / 가죽 자켓',
  '가죽 자켓': '라이더 자켓 / 가죽 자켓',
  '모직 하프코트': '모직 피코트',
  '울 롱코트': '두꺼운 롱코트',
  '미들 다운': '숏패딩',
  '미들 다운 패딩': '숏패딩',
  '방풍 파카': '방풍 파카 (헤비 다운)',
  '방한 헤비 파카': '방풍 파카 (헤비 다운)',
  '방풍 헤비 다운': '방풍 파카 (헤비 다운)',
  '익스트림 벤치 롱패딩': '대장급 헤비 다운 롱패딩',

  // Top 치환 규칙
  셔츠: '일반 셔츠',
  스웨터: '기본 스웨터',
  '도톰한 울 니트': '도톰한 울 스웨터',
  '두꺼운 울 니트': '헤비 울 스웨터',
  '모크넥 니트': '모크넥 스웨터',
  '오버핏 반팔 티셔츠': '반팔 티셔츠',
  '코튼 반팔 티셔츠': '반팔 티셔츠',
  '반팔 셔츠': '린넨 반팔 셔츠',
  '카라 티셔츠': '피케 셔츠',
  '7부 티셔츠': '얇은 7부 티',
  긴팔티: '긴팔 티셔츠 (롱슬리브)',
  롱슬리브: '긴팔 티셔츠 (롱슬리브)',
  '긴팔 티셔츠': '긴팔 티셔츠 (롱슬리브)',
  '히트텍/내의': '기본 발열내의 (히트텍)',
  '기본 발열내의': '기본 발열내의 (히트텍)',
  히트텍: '기본 발열내의 (히트텍)',
  발열내의: '기본 발열내의 (히트텍)',
  '얇은 니트': '기본 스웨터',
  '방한 히트텍/내의': '특수 방한내의',
  '특수 방한 발열내의': '특수 방한내의',
  방한내의: '특수 방한내의',
  '방한 내의': '특수 방한내의',
  '기모 후드': '기모 후드티',
  '기모 집업': '기모 집업 / 스웨터 집업',
  '니트 집업': '기모 집업 / 스웨터 집업',
  '두꺼운 터틀넥': '기모 터틀넥',
  '울 니트': '헤비 울 스웨터',
  '헤비 니트': '헤비 울 스웨터',

  // Bottom 치환 규칙
  '레귤러 데님': '기본 데님',
  '스트레이트 데님': '기본 데님',
  '스탠다드 슬랙스': '기본 슬랙스',
  '와이드 슬랙스': '기본 슬랙스',
  슬랙스: '기본 슬랙스',
  '기모 트레이닝 팬츠': '기모 트레이닝(조거 등)',
  '기모 조거팬츠': '기모 트레이닝(조거 등)',
  '본딩 진': '기모 트레이닝(조거 등)',
  // 복합 항목 1:N 분리 매핑
  '내의 + 두꺼운 데님': ['하의 기본 발열내의', '두꺼운 데님'],
  반바지: '얇은 반바지',
  '린넨 와이드 팬츠': '린넨 팬츠',
  '데님 팬츠': '기본 데님',
  청바지: '기본 데님',
  면바지: '면바지 / 치노 팬츠',
  '치노 팬츠': '면바지 / 치노 팬츠',
  '골덴 팬츠': '코듀로이 팬츠 (골덴 바지)',
  '코듀로이 팬츠': '코듀로이 팬츠 (골덴 바지)',
  '울 슬랙스': '두꺼운 울 슬랙스',
  '하의 히트텍/타이즈': '하의 기본 발열내의',
  '하의 발열내의': '하의 기본 발열내의',
  '방한 타이즈': '하의 기본 발열내의',
  '하의 방한 히트텍/타이즈': '하의 특수 방한내의',
  '특수 방한내의 (하의)': '하의 특수 방한내의',
  '특수 방한 타이즈': '하의 특수 방한내의',
  '기모 안감 슬랙스': '기모 슬랙스',
  '본딩 기모 방한바지': '융기모 방한바지',
  '융기모 바지': '융기모 방한바지',
  '방풍 팬츠': '기모 방풍 팬츠',
  '헤비 패딩 팬츠': '패딩 팬츠',
  '방한 바지': '아웃도어 방한 바지',

  // Item 치환 규칙
  '신발용 핫팩': '붙이는 핫팩 (신체/발)',
  '발바닥 핫팩': '붙이는 핫팩 (신체/발)',
  '손난로 핫팩': '휴대용 손난로 핫팩',
  바라클라바: '바라클라바 (방한모)',
  '가죽 장갑': '가죽 / 니트 장갑',
  손풍기: '휴대용 손풍기',
  캡모자: '캡모자 / 볼캡',
  '볼캡 모자': '캡모자 / 볼캡',
  손수건: '땀 흡수 손수건',
  '얇은 면스카프': '얇은 스카프',
  '쁘띠 스카프': '얇은 스카프',
  '두께감 있는 양말': '도톰한 양말',
  장갑: '가죽 / 니트 장갑',
  '보온 귀마개': '방한 귀마개',
  귀마개: '방한 귀마개',
  어그부츠: '방한화 / 어그부츠',
  '방한화/어그부츠': '방한화 / 어그부츠',
  '기모 스노우 부츠': '방한화 / 어그부츠',
  '붙이는 핫팩': '붙이는 핫팩 (신체/발)',
  넥워머: '방한 넥워머',
  안면마스크: '방풍 마스크',
  '전신 핫팩 세트': '붙이는 핫팩 (신체/발)',
  '방풍 후드': '바라클라바 (방한모)',
  방한모자: '바라클라바 (방한모)',
};

/**
 * 신규 표준 아이템 Set (빠른 조회용)
 */
const STANDARD_ITEM_SET = new Set<string>(STANDARD_ITEMS.map((i) => i.name));

/**
 * 단일 아이템명 신규 표준 변환 유틸리티
 */
export function migrateItem(item: string): string[] {
  if (!item || item.trim() === '' || item === '없음' || item === '미착용') {
    return [];
  }
  const trimmed = item.trim();

  // 이미 표준 아이템인 경우 그대로 반환
  if (STANDARD_ITEM_SET.has(trimmed)) {
    return [trimmed];
  }

  // 레거시 매핑 테이블 확인
  if (LEGACY_REPLACEMENTS[trimmed] !== undefined) {
    const rep = LEGACY_REPLACEMENTS[trimmed];
    if (Array.isArray(rep)) {
      return rep;
    }
    return rep === '' ? [] : [rep];
  }

  // 매핑 없는 아이템은 원본 유지 (런타임 fallback 및 단종 뱃지 처리 대상)
  return [trimmed];
}

/**
 * 외투 단일값 변환 유틸리티 (없음/빈문자열은 '' 처리)
 */
export function migrateOuterItem(outer: string): string {
  if (!outer || outer === '없음' || outer === '미착용') return '';
  const migrated = migrateItem(outer);
  return migrated.length > 0 ? migrated[0] : '';
}

/**
 * 아이템 배열 일괄 변환 유틸리티 (1:N 분리 매핑 평탄화)
 */
export function migrateItemList(items: string[] | undefined | null): string[] {
  if (!items || !Array.isArray(items)) return [];
  const result: string[] = [];
  for (const item of items) {
    const migrated = migrateItem(item);
    result.push(...migrated);
  }
  return Array.from(new Set(result));
}

/**
 * 아이템이 신규 표준에 없거나 레거시 치환도 불가능한 단종/구버전 항목인지 판별
 */
export function isDiscontinuedItem(item: string): boolean {
  if (!item || item === '없음' || item === '미착용') return false;
  const trimmed = item.trim();
  if (STANDARD_ITEM_SET.has(trimmed)) return false;
  if (LEGACY_REPLACEMENTS[trimmed] !== undefined) return false;
  return true;
}

/**
 * 단종/구버전 아이템에 대해 동일 카테고리 내 보온 수치가 가장 유사한 최신 표준 아이템 추천
 */
export function findBestReplacementItem(
  discontinuedItem: string,
  category: OutfitCategory
): string {
  const defaultCategoryScore: Record<OutfitCategory, number> = {
    outer: 35,
    top: 18,
    bottom: 20,
    items: 10,
  };
  const itemScore =
    ITEM_SCORES[discontinuedItem] ?? defaultCategoryScore[category] ?? 20;

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
 * 로그 데이터 내에 존재하는 단종 아이템 목록 및 최적 대체 제안 추출
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
 * 코디 선택 객체(OutfitSelection) 자동 마이그레이션
 */
export function migrateOutfitSelection(outfit: OutfitSelection): OutfitSelection {
  return {
    outer: migrateOuterItem(outfit.outer),
    top: migrateItemList(outfit.top),
    bottom: migrateItemList(outfit.bottom),
    items: migrateItemList(outfit.items),
  };
}

/**
 * 데이터베이스 또는 로컬스토리지 복장 로그 객체 마이그레이션
 */
export function migrateOutfitLog<T extends OutfitLog | TemperatureEvaluation>(log: T): T {
  const topList = Array.isArray(log.selected_top) ? log.selected_top : [log.selected_top];
  const bottomList = Array.isArray(log.selected_bottom)
    ? log.selected_bottom
    : [log.selected_bottom];
  const itemsList = Array.isArray(log.selected_items) ? log.selected_items : [];

  return {
    ...log,
    selected_outer: migrateOuterItem(log.selected_outer),
    selected_top: migrateItemList(topList),
    selected_bottom: migrateItemList(bottomList),
    selected_items: migrateItemList(itemsList),
  };
}
