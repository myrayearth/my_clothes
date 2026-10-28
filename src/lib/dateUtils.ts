/**
 * 날짜 계산 유틸리티
 * 
 * [새벽 02:00 롤오버 기준]
 * - 밤늦게 귀가하거나 자정 이후 새벽에 귀가하여 오늘의 복장 평가를 남길 수 있도록
 * - 하루의 기준을 00:00 ~ 23:59가 아닌 '당일 02:00 ~ 익일 01:59'로 판정합니다.
 * - 예: 10월 29일 새벽 01:30에 접속한 경우 -> 여전히 10월 28일(D-day)로 인식.
 * - 새벽 02:00:00가 되는 순간 비로소 새로운 날짜(10월 29일)로 전환됩니다.
 */

/**
 * 새벽 02:00 롤오버 기준 유효 날짜(Effective Date / D-day) 반환
 * @param date 기준 시각 (기본값: new Date())
 */
export function getEffectiveDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const hours = d.getHours();

  // 새벽 00:00:00 ~ 01:59:59 (새벽 2시 이전) -> 전날로 롤오버
  if (hours < 2) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/**
 * 새벽 02:00 롤오버 기준 유효 날짜의 일자(day, 예: 28) 반환
 */
export function getEffectiveDayNumber(date: Date = new Date()): number {
  return getEffectiveDate(date).getDate();
}

/**
 * 새벽 02:00 롤오버 기준 유효 날짜의 YYYY-MM-DD 문자열 반환 (로컬 타임존 기준)
 */
export function getEffectiveDateString(date: Date = new Date()): string {
  const d = getEffectiveDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 두 날짜가 동일한 날(YYYY-MM-DD)인지 비교
 */
export function isSameDate(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
