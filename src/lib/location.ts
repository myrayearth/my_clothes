import { LocationInfo, GeocodingApiResponse } from '@/types/location';

export const DEFAULT_LOCATION: LocationInfo = {
  name: '서울특별시, 대한민국',
  latitude: 37.5665,
  longitude: 126.978,
  country: '대한민국',
  admin1: '서울특별시',
  isCurrentLocation: false,
};

const STORAGE_KEY = 'weather_outfit_selected_location';

/**
 * 한국 주요 도시 및 행정구역 한글 <-> 영문 변환 사전
 * Open-Meteo Geocoding이 영문 색인 위주로 동작하므로 한글 검색 편의성을 극대화합니다.
 */
const KOREAN_CITY_MAP: Record<string, string> = {
  서울: 'Seoul',
  서울특별시: 'Seoul',
  부산: 'Busan',
  부산광역시: 'Busan',
  대구: 'Daegu',
  대구광역시: 'Daegu',
  인천: 'Incheon',
  인천광역시: 'Incheon',
  광주: 'Gwangju',
  광주광역시: 'Gwangju',
  대전: 'Daejeon',
  대전광역시: 'Daejeon',
  울산: 'Ulsan',
  울산광역시: 'Ulsan',
  세종: 'Sejong',
  세종특별자치시: 'Sejong',
  제주: 'Jeju',
  제주시: 'Jeju',
  서귀포: 'Seogwipo',
  수원: 'Suwon',
  수원시: 'Suwon',
  성남: 'Seongnam',
  고양: 'Goyang',
  용인: 'Yongin',
  부천: 'Bucheon',
  안산: 'Ansan',
  안양: 'Anyang',
  평택: 'Pyeongtaek',
  시흥: 'Siheung',
  김포: 'Gimpo',
  파주: 'Paju',
  의정부: 'Uijeongbu',
  화성: 'Hwaseong',
  남양주: 'Namyangju',
  원주: 'Wonju',
  춘천: 'Chuncheon',
  강릉: 'Gangneung',
  속초: 'Sokcho',
  청주: 'Cheongju',
  천안: 'Cheonan',
  전주: 'Jeonju',
  익산: 'Iksan',
  군산: 'Gunsan',
  여수: 'Yeosu',
  순천: 'Suncheon',
  목포: 'Mokpo',
  포항: 'Pohang',
  창원: 'Changwon',
  진주: 'Jinju',
  구미: 'Gumi',
  안동: 'Andong',
  경주: 'Gyeongju',
  강남: 'Gangnam',
  강남구: 'Gangnam-gu',
  서초: 'Seocho',
  서초구: 'Seocho-gu',
  송파: 'Songpa',
  송파구: 'Songpa-gu',
  마포: 'Mapo',
  마포구: 'Mapo-gu',
  영등포: 'Yeongdeungpo',
  용산: 'Yongsan',
  종로: 'Jongno',
  중구: 'Jung-gu',
};

/**
 * 브라우저 Geolocation API를 통해 사용자의 현재 위/경도를 획득합니다.
 */
export async function getCurrentLocation(): Promise<LocationInfo> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          name: '내 현재 위치',
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
          isCurrentLocation: true,
        });
      },
      (error) => {
        let msg = '위치 정보를 가져올 수 없습니다.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = '위치 권한이 거부되었습니다.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = '위치 정보를 사용할 수 없습니다.';
        } else if (error.code === error.TIMEOUT) {
          msg = '위치 요청 시간이 초과되었습니다.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Open-Meteo Geocoding API를 호출하여 도시명 검색 및 위경도를 추출합니다.
 * 한글 검색어 입력 시 사전 매핑을 통해 자동으로 영문 질의를 병행합니다.
 */
export async function searchCities(query: string): Promise<LocationInfo[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 1) {
    return [];
  }

  // 한글 사전 매핑 검색어 확인
  const mappedQuery = KOREAN_CITY_MAP[trimmed] || trimmed;

  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    mappedQuery
  )}&count=6&language=ko&format=json`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`도시 검색 실패 (HTTP ${res.status})`);
    }

    const data: GeocodingApiResponse = await res.json();
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((item) => {
      // 표시명 구성
      const countryLabel = item.country === 'South Korea' ? '대한민국' : item.country;
      const parts = [item.name, item.admin1, countryLabel].filter(Boolean);
      return {
        name: parts.join(', '),
        latitude: item.latitude,
        longitude: item.longitude,
        country: countryLabel,
        admin1: item.admin1,
        isCurrentLocation: false,
      };
    });
  } catch (error) {
    console.error('Failed to search cities:', error);
    return [];
  }
}

/**
 * 로컬스토리지에 저장된 마지막 위치 조회
 */
export function getSavedLocation(): LocationInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 로컬스토리지에 위치 저장
 */
export function saveLocation(loc: LocationInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch (e) {
    console.warn('Failed to save location to localStorage', e);
  }
}
