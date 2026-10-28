import { OutfitLog, UserCondition, MatchedRecallRecord, RecallCategory } from '@/types/database';

/**
 * 컨디션에 따른 가상 체감 기온 오프셋 계산
 * - 감기: -2.5°C
 * - 피곤: -1.0°C
 * - 활동량많음: +1.5°C
 * - 정상: 0°C
 */
export function getConditionOffset(condition: UserCondition): number {
  switch (condition) {
    case '감기':
      return -2.5;
    case '피곤':
      return -1.0;
    case '활동량많음':
      return 1.5;
    case '정상':
    default:
      return 0.0;
  }
}

/**
 * 체감 온도 편차(-5 ~ +5)를 부호가 포함된 문자열(예: +2°C, 0°C, -3°C)로 변환
 */
export function formatScoreTemp(score: number): string {
  if (score > 0) return `+${score}°C`;
  return `${score}°C`;
}

/**
 * 과거 로그 중 현재 기온(±2°C) 및 컨디션 보정이 적용된 유사 기록들을 필터링하고 분류합니다.
 * score는 체감 온도 편차입니다:
 * - -5°C ~ -3°C: 매우 추움 (보온 부족 -> 추위 주의)
 * - -2°C ~ -1°C: 약간 쌀쌀함
 * - 0°C (또는 ±1°C): 적정 (추천 조합)
 * - +1°C ~ +2°C: 약간 더움
 * - +3°C ~ +5°C: 매우 더움 (과보온 -> 더위 주의)
 */
export function findMatchingRecallLogs(
  logs: OutfitLog[],
  currentTemp: number,
  condition: UserCondition
): MatchedRecallRecord[] {
  const offset = getConditionOffset(condition);
  const effectiveTemp = currentTemp + offset;
  const TEMP_TOLERANCE = 2.0;

  const minTemp = effectiveTemp - TEMP_TOLERANCE;
  const maxTemp = effectiveTemp + TEMP_TOLERANCE;

  // 1. 기온 윈도우 필터링
  const filtered = logs.filter((log) => {
    return log.target_temp >= minTemp && log.target_temp <= maxTemp;
  });

  // 2. 체감 편차(-5 ~ +5)별 카테고리 매핑 및 안내 메시지 생성
  const matchedRecords: MatchedRecallRecord[] = filtered.map((log) => {
    const formattedDev = formatScoreTemp(log.score);
    let category: RecallCategory = 'recommended';
    let categoryTitle = '추천 조합';
    let categoryBadge = `체감 ${formattedDev} (적정)`;
    let guidanceMessage = `비슷한 날씨(${log.target_temp}°C)에 가장 만족스러웠던 복장입니다! ✨`;

    if (log.score <= -3) {
      category = 'cold_warning';
      categoryTitle = '추위 주의';
      categoryBadge = `체감 ${formattedDev} (매우 추움)`;
      guidanceMessage = `지난번 이 기온에서는 체감이 ${formattedDev}로 매우 추웠습니다. 외투를 한 겹 더 챙기세요! 🥶`;
    } else if (log.score >= 3) {
      category = 'warm_warning';
      categoryTitle = '더위 주의';
      categoryBadge = `체감 ${formattedDev} (매우 더움)`;
      guidanceMessage = `지난번 이 기온에서는 체감이 ${formattedDev}로 너무 더웠습니다. 가벼운 옷차림을 추천합니다! 🥵`;
    } else if (log.score <= -1) {
      category = 'cold_warning';
      categoryTitle = '다소 쌀쌀함';
      categoryBadge = `체감 ${formattedDev} (약간 추움)`;
      guidanceMessage = `약간 쌀쌀하다고 느꼈던 기록(${formattedDev})입니다. 얇은 스카프나 가디건을 챙기면 좋습니다.`;
    } else if (log.score >= 1) {
      category = 'warm_warning';
      categoryTitle = '다소 더움';
      categoryBadge = `체감 ${formattedDev} (약간 더움)`;
      guidanceMessage = `약간 더웠던 기록(${formattedDev})입니다. 이너를 가볍게 입는 것을 권장합니다.`;
    } else {
      // log.score === 0 (체감 편차 0°C, 이상적인 적정)
      category = 'recommended';
      categoryTitle = '추천 조합';
      categoryBadge = '체감 0°C (딱 맞음)';
      guidanceMessage = `비슷한 날씨(${log.target_temp}°C)에 체감이 딱 적정(0°C)했던 이상적인 조합입니다! 👍`;
    }

    const tempDiff = Number((log.target_temp - currentTemp).toFixed(1));

    return {
      log,
      category,
      categoryTitle,
      categoryBadge,
      guidanceMessage,
      tempDiff,
    };
  });

  // 3. 최신 기록 우선 정렬
  return matchedRecords.sort((a, b) => {
    return new Date(b.log.created_at).getTime() - new Date(a.log.created_at).getTime();
  });
}
