import outfitRulesData from '@/data/outfitRules.json';
import { STANDARD_ITEMS_BY_CATEGORY, STANDARD_ITEM_SET } from '@/data/itemScores';
import { OutfitRuleStep, OutfitSelection } from '@/types/outfit';
import { isInnerClothingItem } from '@/lib/itemPicker';
import { filterItemsByGender } from '@/lib/gender';
import { UserGender } from '@/types/database';

const outfitRules: OutfitRuleStep[] = outfitRulesData as OutfitRuleStep[];

/**
 * 원피스 의류 아이템 여부 판별
 */
export function isOnePieceItem(item: string): boolean {
  if (!item) return false;
  return item.includes('원피스');
}

/**
 * 상의-하의 원피스 일체형 동기화 엔진
 * - 상의/하의 모달 및 메인 칩에서 원피스 간 전환(반팔 ↔ 긴팔) 시 양쪽 모두 즉시 교체
 * - 상의에서 원피스 선택 시 하의도 동일한 원피스로 동기화 (스타킹/이너 레이어드 보존)
 * - 하의에서 원피스가 선택되어 있는 상태에서 다른 일반 하의(스커트/바지) 선택 시 상의 원피스도 함께 해제
 * - 상의에서 원피스를 해제하고 일반 상의 선택 시 하의 원피스도 함께 해제
 * - 남성인 경우: 여성 전용 아이템 완전 필터링
 */
export function syncOnePieceSelection(
  nextSelection: OutfitSelection,
  prevSelection?: OutfitSelection,
  targetTemp: number = 15,
  gender: UserGender = 'female'
): OutfitSelection {
  if (gender !== 'female') {
    const cleanedTop = filterItemsByGender(nextSelection.top, 'male');
    const cleanedBottom = filterItemsByGender(nextSelection.bottom, 'male');
    return {
      outer: filterItemsByGender(nextSelection.outer, 'male'),
      top: cleanedTop.length > 0 ? cleanedTop : ['기본 긴팔'],
      bottom: cleanedBottom.length > 0 ? cleanedBottom : ['기본 긴바지'],
      items: filterItemsByGender(nextSelection.items, 'male'),
    };
  }

  const defaultTop = targetTemp >= 25 ? '반팔 블라우스' : targetTemp >= 15 ? '긴팔 블라우스' : '기본 긴팔';
  const defaultBottom = targetTemp >= 25 ? '숏 스커트' : targetTemp >= 15 ? '롱스커트' : '기본 긴바지';

  const prevTopOnePiece = prevSelection?.top.find(isOnePieceItem);
  const prevBottomOnePiece = prevSelection?.bottom.find(isOnePieceItem);

  // 새로 추가/선택된 원피스 탐색 (이전 상태에 없던 원피스 우선)
  const nextTopOnePieces = nextSelection.top.filter(isOnePieceItem);
  const nextBottomOnePieces = nextSelection.bottom.filter(isOnePieceItem);

  const newlyAddedTopOnePiece = nextTopOnePieces.find((i) => i !== prevTopOnePiece) || nextTopOnePieces[nextTopOnePieces.length - 1];
  const newlyAddedBottomOnePiece = nextBottomOnePieces.find((i) => i !== prevBottomOnePiece) || nextBottomOnePieces[nextBottomOnePieces.length - 1];

  const wasBottomChanged = Boolean(prevSelection && JSON.stringify(prevSelection.bottom) !== JSON.stringify(nextSelection.bottom));
  const wasTopChanged = Boolean(prevSelection && JSON.stringify(prevSelection.top) !== JSON.stringify(nextSelection.top));

  // =========================================================================
  // 1. 하의가 명시적으로 변경된 경우 (사용자가 하의 칩이나 하의 모달을 조작함)
  // =========================================================================
  if (wasBottomChanged && !wasTopChanged) {
    // 1-A. 하의에서 새로 원피스가 선택되었거나 다른 원피스로 교체된 경우 (예: 반팔 원피스 -> 긴팔 원피스)
    if (newlyAddedBottomOnePiece) {
      const topInners = nextSelection.top.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
      const bottomInners = nextSelection.bottom.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
      return {
        ...nextSelection,
        top: [...topInners, newlyAddedBottomOnePiece],
        bottom: [...bottomInners, newlyAddedBottomOnePiece],
      };
    }

    // 1-B. 하의에 원피스가 있었는데, 사용자가 일반 하의(스커트/바지 등)를 선택하여 원피스가 사라진 경우
    if (prevBottomOnePiece && nextBottomOnePieces.length === 0) {
      // 상의의 원피스도 함께 해제하고 기본 상의(블라우스/긴팔)로 변경!
      const topInners = nextSelection.top.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
      return {
        ...nextSelection,
        top: topInners.length > 0 ? [...topInners, defaultTop] : [defaultTop],
        bottom: nextSelection.bottom,
      };
    }
  }

  // =========================================================================
  // 2. 상의가 명시적으로 변경된 경우 (사용자가 상의 칩이나 상의 모달을 조작함)
  // =========================================================================
  if (wasTopChanged && !wasBottomChanged) {
    // 2-A. 상의에서 새로 원피스가 선택되었거나 다른 원피스로 교체된 경우 (예: 반팔 원피스 -> 긴팔 원피스)
    if (newlyAddedTopOnePiece) {
      const topInners = nextSelection.top.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
      const bottomInners = nextSelection.bottom.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
      return {
        ...nextSelection,
        top: [...topInners, newlyAddedTopOnePiece],
        bottom: [...bottomInners, newlyAddedTopOnePiece],
      };
    }

    // 2-B. 상의에 원피스가 있었는데, 사용자가 일반 상의를 선택하여 원피스가 사라진 경우
    if (prevTopOnePiece && nextTopOnePieces.length === 0) {
      // 하의의 원피스도 함께 해제하고 기본 하의(스커트/바지)로 변경!
      const bottomInners = nextSelection.bottom.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
      return {
        ...nextSelection,
        bottom: bottomInners.length > 0 ? [...bottomInners, defaultBottom] : [defaultBottom],
      };
    }
  }

  // =========================================================================
  // 3. 상·하의가 동시에 전달되었거나 prevSelection이 없는 경우 (초기화 or 전역 동기화)
  // =========================================================================
  // 새로 선택된 원피스가 상의에 있으면 하의로 전파
  const effectiveOnePiece = newlyAddedTopOnePiece || newlyAddedBottomOnePiece;

  if (effectiveOnePiece) {
    const topInners = nextSelection.top.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
    const bottomInners = nextSelection.bottom.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
    return {
      ...nextSelection,
      top: [...topInners, effectiveOnePiece],
      bottom: [...bottomInners, effectiveOnePiece],
    };
  }

  // 상의에는 원피스가 없는데 하의에만 원피스가 남아있는 경우 -> 하의 원피스 해제
  if (nextTopOnePieces.length === 0 && nextBottomOnePieces.length > 0) {
    const bottomInners = nextSelection.bottom.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
    return {
      ...nextSelection,
      bottom: bottomInners.length > 0 ? [...bottomInners, defaultBottom] : [defaultBottom],
    };
  }

  // 하의에는 원피스가 없는데 상의에만 원피스가 남아있는 경우 -> 상의 원피스 해제
  if (nextBottomOnePieces.length === 0 && nextTopOnePieces.length > 0) {
    const topInners = nextSelection.top.filter((i) => isInnerClothingItem(i) && !isOnePieceItem(i));
    return {
      ...nextSelection,
      top: topInners.length > 0 ? [...topInners, defaultTop] : [defaultTop],
    };
  }

  return nextSelection;
}

/**
 * 기온(섭씨)에 따라 11단계 5°C 단위 기온 룰셋 중 일치하는 단계를 반환합니다.
 * min_temp <= 기온 && 기온 <= max_temp
 */
export function getOutfitRuleByTemperature(temp: number): OutfitRuleStep {
  const roundedTemp = Math.round(temp);
  const matched = outfitRules.find(
    (rule) => roundedTemp >= rule.min_temp && roundedTemp <= rule.max_temp
  );

  if (!matched) {
    if (roundedTemp >= 30) return outfitRules[0];
    return outfitRules[outfitRules.length - 1];
  }

  return matched;
}

/**
 * 룰셋 단계의 대표 추천 의류 선택 객체를 복제하여 반환합니다.
 * - 5°C 미만 (겨울 추위/한파): 상/하의 보온 확보를 위해 이너 + 본의류 중복 기본 선택
 * - 5°C 이상 (초겨울/환절기/여름): 이너는 기본 선택에서 제외하고 본의류만 단독 선택
 */
export function getDefaultOutfitSelection(rule: OutfitRuleStep, targetTemp?: number): OutfitSelection {
  const effectiveTemp = typeof targetTemp === 'number' ? targetTemp : (rule.min_temp + rule.max_temp) / 2;
  const isColdWeather = effectiveTemp < 5;

  let selectedTop: string[];
  let selectedBottom: string[];

  if (isColdWeather) {
    // 5°C 미만: 룰셋의 대표 추천(이너 + 본의류)을 그대로 복수 선택
    selectedTop = [...rule.recommend.top];
    selectedBottom = [...rule.recommend.bottom];

    // 만약 룰셋에 이너가 누락되어 있다면 자동 보강
    const hasInnerTop = selectedTop.some(isInnerClothingItem);
    if (!hasInnerTop) {
      const defaultInnerTop = effectiveTemp < 0 ? '기모 내의/히트텍' : '얇은 내의/히트텍';
      selectedTop = [defaultInnerTop, ...selectedTop];
    }
    const hasInnerBottom = selectedBottom.some(isInnerClothingItem);
    if (!hasInnerBottom) {
      const defaultInnerBottom = effectiveTemp < 0 ? '기모 하의 내의' : '얇은 하의 내의';
      selectedBottom = [defaultInnerBottom, ...selectedBottom];
    }
  } else {
    // 5°C 이상: 이너는 기본 선택에서 제외하고 본의류만 단독 선택
    const nonInnerTop = rule.recommend.top.filter((i) => !isInnerClothingItem(i));
    const nonInnerBottom = rule.recommend.bottom.filter((i) => !isInnerClothingItem(i));
    selectedTop = nonInnerTop.length > 0 ? nonInnerTop : [rule.recommend.top[rule.recommend.top.length - 1] || '기본 반팔'];
    selectedBottom = nonInnerBottom.length > 0 ? nonInnerBottom : [rule.recommend.bottom[rule.recommend.bottom.length - 1] || '기본 긴바지'];
  }

  return {
    outer: rule.recommend.outer && rule.recommend.outer !== '없음' ? [rule.recommend.outer] : [],
    top: selectedTop,
    bottom: selectedBottom,
    items: [...rule.recommend.item],
  };
}

/**
 * 표준 카탈로그(52종)에 존재하는 모든 카테고리별 의류 아이템 목록을 중복 없이 추출합니다.
 * (outfitRules.json에 레거시 명칭이 남아있더라도 UI 목록이 오염되지 않도록 방어)
 */
export function getAllUniqueCategoryItems(): {
  outer: string[];
  top: string[];
  bottom: string[];
  items: string[];
} {
  const outerSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.outer.map((i) => i.name));
  const topSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.top.map((i) => i.name));
  const bottomSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.bottom.map((i) => i.name));
  const itemsSet = new Set<string>(STANDARD_ITEMS_BY_CATEGORY.items.map((i) => i.name));

  outfitRules.forEach((rule) => {
    rule.outer.forEach((i) => {
      if (i && i !== '없음' && STANDARD_ITEM_SET.has(i)) outerSet.add(i);
    });
    rule.top.forEach((i) => {
      if (STANDARD_ITEM_SET.has(i)) topSet.add(i);
    });
    rule.bottom.forEach((i) => {
      if (STANDARD_ITEM_SET.has(i)) bottomSet.add(i);
    });
    rule.item.forEach((i) => {
      if (STANDARD_ITEM_SET.has(i)) itemsSet.add(i);
    });
  });

  return {
    outer: Array.from(outerSet),
    top: Array.from(topSet),
    bottom: Array.from(bottomSet),
    items: Array.from(itemsSet),
  };
}
