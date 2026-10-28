import { OutfitLog, UserCondition, MatchedRecallRecord, RecallCategory } from '@/types/database';

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

export function formatScoreTemp(score: number): string {
  if (score > 0) return `+${score}°C`;
  return `${score}°C`;
}

/**
 * 과거 로그 중 현재 선택된 사용자의 기록만 필터링하고,
 * 현재 기온(±2°C) 및 컨디션 보정이 적용된 유사 기록들을 분류합니다.
 */
export function findMatchingRecallLogs(
  logs: OutfitLog[],
  currentTemp: number,
  condition: UserCondition,
  userName: string
): MatchedRecallRecord[] {
  const offset = getConditionOffset(condition);
  const effectiveTemp = currentTemp + offset;
  const TEMP_TOLERANCE = 2.0;

  const minTemp = effectiveTemp - TEMP_TOLERANCE;
  const maxTemp = effectiveTemp + TEMP_TOLERANCE;

  // 1. 현재 사용자 필터링 및 기온 윈도우 필터링
  const filtered = logs.filter((log) => {
    const isUserMatch = !userName || log.user_name === userName;
    return isUserMatch && log.target_temp >= minTemp && log.target_temp <= maxTemp;
  });

  // 2. 체감 편차(-5 ~ +5)별 카테고리 매핑 및 사용자 맥락 안내 메시지 생성
  const matchedRecords: MatchedRecallRecord[] = filtered.map((log) => {
    const formattedDev = formatScoreTemp(log.score);
    let category: RecallCategory = 'recommended';
    let categoryTitle = '추천 조합';
    let categoryBadge = `체감 ${formattedDev} (적정)`;
    let guidanceMessage = `${userName}님이 지난번 비슷한 날씨(${log.target_temp}°C)에 입었을 때 가장 만족스러웠던 복장입니다! ✨`;

    if (log.score <= -3) {
      category = 'cold_warning';
      categoryTitle = '추위 주의';
      categoryBadge = `체감 ${formattedDev} (매우 추움)`;
      guidanceMessage = `${userName}님이 지난번 이 기온에서 체감이 ${formattedDev}로 매우 춥다고 느꼈습니다. 외투를 한 겹 더 챙기세요! 🥶`;
    } else if (log.score >= 3) {
      category = 'warm_warning';
      categoryTitle = '더위 주의';
      categoryBadge = `체감 ${formattedDev} (매우 더움)`;
      guidanceMessage = `${userName}님이 지난번 이 기온에서 체감이 ${formattedDev}로 너무 덥다고 느꼈습니다. 가벼운 옷차림을 추천합니다! 🥵`;
    } else if (log.score <= -1) {
      category = 'cold_warning';
      categoryTitle = '다소 쌀쌀함';
      categoryBadge = `체감 ${formattedDev} (약간 추움)`;
      guidanceMessage = `${userName}님이 약간 쌀쌀하다고 느꼈던 기록(${formattedDev})입니다. 얇은 스카프나 가디건을 챙기면 좋습니다.`;
    } else if (log.score >= 1) {
      category = 'warm_warning';
      categoryTitle = '다소 더움';
      categoryBadge = `체감 ${formattedDev} (약간 더움)`;
      guidanceMessage = `${userName}님이 약간 더웠다고 느꼈던 기록(${formattedDev})입니다. 이너를 가볍게 입는 것을 권장합니다.`;
    } else {
      category = 'recommended';
      categoryTitle = '추천 조합';
      categoryBadge = '체감 0°C (딱 맞음)';
      guidanceMessage = `${userName}님이 비슷한 날씨(${log.target_temp}°C)에 체감이 딱 적정(0°C)했던 이상적인 조합입니다! 👍`;
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

  return matchedRecords.sort((a, b) => {
    return new Date(b.log.created_at).getTime() - new Date(a.log.created_at).getTime();
  });
}
