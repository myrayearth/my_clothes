import {
  ForecastApiResponse,
  ProcessedWeatherData,
  TargetTimeSlot,
  TimeSlotWeatherItem,
  DailyForecastItem,
} from '@/types/weather';

/**
 * WMO Weather Code 한국어 명칭 및 아이콘 타입 매핑
 */
export function getWeatherInterpretation(code: number): {
  label: string;
  iconName: 'sun' | 'cloud' | 'cloud-sun' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning' | 'cloud-fog';
} {
  switch (code) {
    case 0:
      return { label: '맑음', iconName: 'sun' };
    case 1:
      return { label: '대체로 맑음', iconName: 'cloud-sun' };
    case 2:
      return { label: '구름 조금', iconName: 'cloud-sun' };
    case 3:
      return { label: '흐림', iconName: 'cloud' };
    case 45:
    case 48:
      return { label: '안개', iconName: 'cloud-fog' };
    case 51:
    case 53:
    case 55:
      return { label: '이슬비', iconName: 'cloud-rain' };
    case 61:
    case 63:
    case 65:
      return { label: '비', iconName: 'cloud-rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: '눈', iconName: 'cloud-snow' };
    case 80:
    case 81:
    case 82:
      return { label: '소나기', iconName: 'cloud-rain' };
    case 85:
    case 86:
      return { label: '눈보라/소낙눈', iconName: 'cloud-snow' };
    case 95:
    case 96:
    case 99:
      return { label: '뇌우', iconName: 'cloud-lightning' };
    default:
      return { label: '구름', iconName: 'cloud' };
  }
}

/**
 * Open-Meteo Forecast API 호출 및 데이터 가공
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<ProcessedWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // 30분 단위 클라이언트/서버 캐시
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`날씨 데이터를 불러오는데 실패했습니다. (HTTP ${res.status})`);
  }

  const raw: ForecastApiResponse = await res.json();
  return processWeatherData(raw);
}

/**
 * Open-Meteo Raw 응답에서 오늘 08시, 13시, 19시 및 7일 일별 예보를 추출/가공
 */
export function processWeatherData(raw: ForecastApiResponse): ProcessedWeatherData {
  const { hourly, daily } = raw;

  // 당일 기준 날짜 문자열 (YYYY-MM-DD)
  const todayStr = daily.time[0] || new Date().toISOString().split('T')[0];

  // 08:00, 13:00, 19:00 추출
  const targetSlots: TargetTimeSlot[] = ['08:00', '13:00', '19:00'];
  const timeSlotsResult: Partial<Record<TargetTimeSlot, TimeSlotWeatherItem>> = {};

  targetSlots.forEach((slot) => {
    const targetISO = `${todayStr}T${slot}`;
    let matchedIndex = hourly.time.findIndex((t) => t.startsWith(targetISO));

    // 혹시 정확한 매칭이 없으면 가장 가까운 인덱스 탐색
    if (matchedIndex === -1) {
      const hourNumber = parseInt(slot.split(':')[0], 10);
      matchedIndex = Math.min(hourNumber, hourly.time.length - 1);
    }

    const temp = Math.round(hourly.temperature_2m[matchedIndex] ?? 15);
    const appTemp = Math.round(hourly.apparent_temperature[matchedIndex] ?? temp);
    const code = hourly.weather_code[matchedIndex] ?? 0;

    timeSlotsResult[slot] = {
      slot,
      timeString: slot,
      temperature: temp,
      apparentTemperature: appTemp,
      weatherCode: code,
      weatherLabel: getWeatherInterpretation(code).label,
    };
  });

  // 현재 시간과 가장 가까운 기온 계산
  const now = new Date();
  const currentHour = now.getHours();
  const currentHourlyIndex = Math.min(
    Math.max(0, currentHour),
    hourly.time.length - 1
  );

  const currentTemp = Math.round(hourly.temperature_2m[currentHourlyIndex] ?? 16);
  const currentApparentTemp = Math.round(
    hourly.apparent_temperature[currentHourlyIndex] ?? currentTemp
  );
  const currentWeatherCode = hourly.weather_code[currentHourlyIndex] ?? 0;

  // 7일 일간 예보 생성
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dailyForecast: DailyForecastItem[] = daily.time.map((dateStr, idx) => {
    const d = new Date(dateStr);
    const dayName = idx === 0 ? '오늘' : `${dayNames[d.getDay()]}요일`;
    const code = daily.weather_code[idx] ?? 0;
    return {
      date: dateStr,
      dayName,
      weatherCode: code,
      weatherLabel: getWeatherInterpretation(code).label,
      tempMax: Math.round(daily.temperature_2m_max[idx] ?? 20),
      tempMin: Math.round(daily.temperature_2m_min[idx] ?? 10),
    };
  });

  return {
    currentTemp,
    currentApparentTemp,
    currentWeatherCode,
    currentWeatherLabel: getWeatherInterpretation(currentWeatherCode).label,
    todayMax: Math.round(daily.temperature_2m_max[0] ?? currentTemp),
    todayMin: Math.round(daily.temperature_2m_min[0] ?? currentTemp),
    timeSlots: timeSlotsResult as Record<TargetTimeSlot, TimeSlotWeatherItem>,
    dailyForecast,
  };
}
