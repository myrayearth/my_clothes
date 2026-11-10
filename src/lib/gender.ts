import { UserGender } from '@/types/database';

export const FEMALE_ONLY_KEYWORDS = [
  '블라우스',
  '원피스',
  '스커트',
  '치마',
  '로브',
  '스타킹',
];

/**
 * 여성 전용 의류 여부 판별
 */
export function isFemaleOnlyItem(item: string): boolean {
  if (!item) return false;
  return FEMALE_ONLY_KEYWORDS.some((kw) => item.includes(kw));
}

/**
 * 성별에 따른 의류 목록 필터링
 * - 남성('male'): 여성 전용 복장(블라우스, 원피스, 스커트, 치마, 로브, 스타킹 등) 제외
 * - 여성('female'): 모든 항목 허용
 */
export function filterItemsByGender(items: string[], gender: UserGender): string[] {
  if (gender === 'female') return items;
  return items.filter((item) => !isFemaleOnlyItem(item));
}
