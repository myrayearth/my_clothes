'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProcessedWeatherData, TargetTimeSlot, DailyForecastItem } from '@/types/weather';
import { OutfitSelection } from '@/types/outfit';
import { OutfitLog, UserCondition, UserProfile, UserGender } from '@/types/database';
import { LocationInfo } from '@/types/location';
import { fetchWeatherData } from '@/lib/weather';
import { getOutfitRuleByTemperature } from '@/lib/outfit';
import { calculateWeightedRecommendations } from '@/lib/recommendation';
import {
  fetchAllOutfitLogs,
  saveActiveUser,
  supabase,
} from '@/lib/storage';
import { getSavedLocation, saveLocation, getCurrentLocation, DEFAULT_LOCATION } from '@/lib/location';
import { syncKakaoUserProfile, signInWithKakao } from '@/lib/auth';
import { findMatchingRecallLogs } from '@/lib/matcher';

import { LocationBar } from '@/components/layout/LocationBar';
import { WeatherOverview } from '@/components/weather/WeatherOverview';
import { ManualTempChecker } from '@/components/weather/ManualTempChecker';
import { TimeSlotTabs } from '@/components/weather/TimeSlotTabs';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { OutfitSelector } from '@/components/OutfitSelector';
import { FeedbackForm } from '@/components/FeedbackForm';
import { HistoryRecallCard } from '@/components/HistoryRecallCard';
import { KakaoAuthBar } from '@/components/auth/KakaoAuthBar';

import { Shirt, RefreshCw, AlertCircle, Users, Sliders } from 'lucide-react';

export type RecommendationMode = 'LIVE_MODE' | 'DAILY_FORECAST_MODE' | 'MANUAL_MODE';

export default function HomePage() {
  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<ProcessedWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 추천 기준 모드 ('LIVE_MODE' | 'DAILY_FORECAST_MODE' | 'MANUAL_MODE')
  const [recommendationMode, setRecommendationMode] = useState<RecommendationMode>('LIVE_MODE');

  // 성별 선택 ('male' | 'female', 기본값: 남성)
  const [selectedGender, setSelectedGender] = useState<UserGender>('male');

  // 현재 선택된 시간대 탭 ('current' | '08:00' | '13:00' | '19:00')
  const [selectedSlot, setSelectedSlot] = useState<TargetTimeSlot>('current');

  // 수동 입력 기온 상태 (기본값: 15°C)
  const [manualTemp, setManualTemp] = useState<number>(15);

  // 주간 예보 선택된 날짜 및 항목
  const [selectedForecastItem, setSelectedForecastItem] = useState<DailyForecastItem | null>(null);

  // 사용자 프로필 및 카카오 인증 상태
  const [activeUser, setActiveUser] = useState<string>('게스트');
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 과거 복장 로그 데이터베이스 목록
  const [outfitLogs, setOutfitLogs] = useState<OutfitLog[]>([]);

  // 사용자 현재 컨디션 상태 ('정상', '피곤', '감기', '활동량많음')
  const [userCondition, setUserCondition] = useState<UserCondition>('정상');

  // 시간대별 사용자의 복장 선택 상태 ('current', '08:00', '13:00', '19:00')
  const [outfitSelections, setOutfitSelections] = useState<Record<TargetTimeSlot, OutfitSelection>>({
    'current': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
    '08:00': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
    '13:00': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
    '19:00': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
  });

  // 수동 점검 복장 선택 상태
  const [manualSelection, setManualSelection] = useState<OutfitSelection>({
    outer: '없음',
    top: ['티셔츠'],
    bottom: ['바지'],
    items: [],
  });

  // 예보 복장 선택 상태 (08:00, 13:00, 19:00)
  const [forecastSelections, setForecastSelections] = useState<Record<string, OutfitSelection>>({
    '08:00': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
    '13:00': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
    '19:00': { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
  });

  // 로컬 성별 설정 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGender = localStorage.getItem('weather_outfit_user_gender') as UserGender | null;
      if (savedGender === 'male' || savedGender === 'female') {
        setSelectedGender(savedGender);
      }
    }
  }, []);

  const handleGenderChange = (gender: UserGender) => {
    setSelectedGender(gender);
    if (typeof window !== 'undefined') {
      localStorage.setItem('weather_outfit_user_gender', gender);
    }
  };

  // 과거 로그 데이터 로드 함수 (전체 로그 로드 후 메모리에서 개인화/게스트 분리 계산)
  const loadLogs = useCallback(async (_userName?: string) => {
    try {
      const logs = await fetchAllOutfitLogs();
      setOutfitLogs(logs);
    } catch (err) {
      console.error('과거 로그 불러오기 실패:', err);
    }
  }, []);

  // 기온별 커뮤니티 누적 집계 데이터 로드 및 추천값 동적 반영
  const loadAggregatedData = useCallback(
    async (weatherData: ProcessedWeatherData, currentLogs: OutfitLog[] = outfitLogs) => {
      const slots: TargetTimeSlot[] = ['current', '08:00', '13:00', '19:00'];
      const newSelections: Partial<Record<TargetTimeSlot, OutfitSelection>> = {};

      slots.forEach((slot) => {
        const slotItem = weatherData.timeSlots[slot];
        if (!slotItem) return;
        const slotTemp = slotItem.temperature;
        const rule = getOutfitRuleByTemperature(slotTemp);

        // 개인화 및 오염 방지 가중치 추천 산출
        const result = calculateWeightedRecommendations(
          rule,
          currentLogs,
          slotTemp,
          activeUser,
          isAuthenticated,
          selectedGender
        );
        newSelections[slot] = result.defaults;
      });

      setOutfitSelections(newSelections as Record<TargetTimeSlot, OutfitSelection>);
    },
    [activeUser, isAuthenticated, selectedGender, outfitLogs]
  );

  // 수동 온도 변경 핸들러 (1°C 변경 시 실시간 복장 추천 및 보온 범위 재계산)
  const handleManualTempChange = useCallback(
    (temp: number) => {
      setManualTemp(temp);
      const rule = getOutfitRuleByTemperature(temp);
      const rec = calculateWeightedRecommendations(
        rule,
        outfitLogs,
        temp,
        activeUser,
        isAuthenticated,
        selectedGender
      );
      setManualSelection(rec.defaults);
    },
    [outfitLogs, activeUser, isAuthenticated, selectedGender]
  );

  // 날씨 데이터 가져오기 함수
  const loadWeather = useCallback(
    async (loc: LocationInfo) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherData(loc.latitude, loc.longitude);
        setWeather(data);
        await loadAggregatedData(data);

        // 수동 점검 기본값도 현재 기온으로 초기 동기화
        const curTemp = Math.round(data.currentTemp);
        setManualTemp(curTemp);
        const rule = getOutfitRuleByTemperature(curTemp);
        const rec = calculateWeightedRecommendations(
          rule,
          outfitLogs,
          curTemp,
          activeUser,
          isAuthenticated,
          selectedGender
        );
        setManualSelection(rec.defaults);
      } catch (err: any) {
        console.error('날씨 데이터 로드 실패:', err);
        setError(err.message || '날씨 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [loadAggregatedData, outfitLogs, activeUser, isAuthenticated, selectedGender]
  );

  // 성별 변경 시 추천 복장 즉시 재계산
  useEffect(() => {
    if (weather) {
      loadAggregatedData(weather, outfitLogs);
      handleManualTempChange(manualTemp);
    }
  }, [selectedGender]);

  // 주간 예보 미래 일자(D+1 ~ D+6) 클릭 핸들러 (최저/최고 기온 추천 갱신)
  const handleSelectForecastDate = useCallback(
    (date: string, day: DailyForecastItem) => {
      setRecommendationMode('DAILY_FORECAST_MODE');
      setSelectedForecastItem(day);
      if (selectedSlot === 'current') {
        setSelectedSlot('13:00'); // 예보 선택 시 기본 낮(최고 기온)으로 포커스
      }

      // 해당 날짜의 최저 기온(08시 아침), 최고 기온(13시 낮), 저녁(19시) 추천 조합 산출
      const morningTemp = day.tempMin;
      const dayTemp = day.tempMax;
      const eveningTemp = Math.round((day.tempMin + day.tempMax) / 2);

      const morningRec = calculateWeightedRecommendations(
        getOutfitRuleByTemperature(morningTemp),
        outfitLogs,
        morningTemp,
        activeUser,
        isAuthenticated,
        selectedGender
      );
      const dayRec = calculateWeightedRecommendations(
        getOutfitRuleByTemperature(dayTemp),
        outfitLogs,
        dayTemp,
        activeUser,
        isAuthenticated,
        selectedGender
      );
      const eveningRec = calculateWeightedRecommendations(
        getOutfitRuleByTemperature(eveningTemp),
        outfitLogs,
        eveningTemp,
        activeUser,
        isAuthenticated,
        selectedGender
      );

      setForecastSelections({
        '08:00': morningRec.defaults,
        '13:00': dayRec.defaults,
        '19:00': eveningRec.defaults,
      });
    },
    [outfitLogs, activeUser, isAuthenticated, selectedGender, selectedSlot]
  );

  // 실시간 오늘 날씨 모드로 복귀 핸들러
  const handleSwitchLive = useCallback((slot: TargetTimeSlot = 'current') => {
    setRecommendationMode('LIVE_MODE');
    setSelectedForecastItem(null);
    setSelectedSlot(slot);
  }, []);

  // 수동 점검 모드로 전환 핸들러
  const handleSwitchManual = useCallback(() => {
    setRecommendationMode('MANUAL_MODE');
    setSelectedForecastItem(null);
    handleManualTempChange(manualTemp);
  }, [handleManualTempChange, manualTemp]);

  // Supabase Auth 세션 및 상태 변화 리스너 (카카오 로그인 연동)
  useEffect(() => {
    if (!supabase) return;

    // 1. 기존 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await syncKakaoUserProfile(session.user);
          setAuthProfile(profile);
          setIsAuthenticated(true);
          setActiveUser(profile.name);
          saveActiveUser({ id: profile.id, name: profile.name });
          await loadLogs(profile.name);
        } catch (e) {
          console.error('카카오 프로필 동기화 에러:', e);
        }
      } else {
        // 비로그인 상태: 게스트 모드
        setIsAuthenticated(false);
        setAuthProfile(null);
        setActiveUser('게스트');
        saveActiveUser('게스트');
        await loadLogs('게스트');
      }
    });

    // 2. Auth 상태 변화 리스너 (로그인 완료, 로그아웃 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        try {
          const profile = await syncKakaoUserProfile(session.user);
          setAuthProfile(profile);
          setIsAuthenticated(true);
          setActiveUser(profile.name);
          saveActiveUser({ id: profile.id, name: profile.name });
          await loadLogs(profile.name);
        } catch (e) {
          console.error('카카오 프로필 갱신 에러:', e);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAuthProfile(null);
        setActiveUser('게스트');
        saveActiveUser('게스트');
        await loadLogs('게스트');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadLogs]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // 관리자 페이지 등에서 평가 수정/삭제 시 동기화 리스너
  useEffect(() => {
    const handleLogsChanged = () => {
      loadLogs();
      if (weather) {
        loadAggregatedData(weather);
      }
    };

    window.addEventListener('weather_outfit_logs_changed', handleLogsChanged);
    window.addEventListener('storage', handleLogsChanged);
    window.addEventListener('focus', handleLogsChanged);

    return () => {
      window.removeEventListener('weather_outfit_logs_changed', handleLogsChanged);
      window.removeEventListener('storage', handleLogsChanged);
      window.removeEventListener('focus', handleLogsChanged);
    };
  }, [loadLogs, loadAggregatedData, weather]);

  // 초기 위치 설정 및 자동 Geolocation 감지
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setLocation(saved);
      loadWeather(saved);
    } else {
      getCurrentLocation()
        .then((cur) => {
          saveLocation(cur);
          setLocation(cur);
          loadWeather(cur);
        })
        .catch((err) => {
          console.log('GPS 자동 감지 생략 (서울 기본 적용):', err.message);
          setLocation(DEFAULT_LOCATION);
          loadWeather(DEFAULT_LOCATION);
        });
    }
  }, [loadWeather]);

  // 위치 변경 핸들러
  const handleLocationChange = (newLoc: LocationInfo) => {
    setLocation(newLoc);
    loadWeather(newLoc);
  };

  // 모드별 복장 선택 변경 핸들러
  const handleCurrentOutfitChange = (newSelection: OutfitSelection) => {
    if (recommendationMode === 'MANUAL_MODE') {
      setManualSelection(newSelection);
    } else if (recommendationMode === 'DAILY_FORECAST_MODE') {
      const slot = selectedSlot === 'current' ? '13:00' : selectedSlot;
      setForecastSelections((prev) => ({
        ...prev,
        [slot]: newSelection,
      }));
    } else {
      setOutfitSelections((prev) => ({
        ...prev,
        [selectedSlot]: newSelection,
      }));
    }
  };

  // 모드별 활성화된 기준 기온, 시간대 라벨, 코디 선택 계산
  const effectiveData = useMemo(() => {
    if (recommendationMode === 'MANUAL_MODE') {
      return {
        temperature: manualTemp,
        apparentTemperature: manualTemp,
        timeSlotLabel: `수동 설정 (${manualTemp}°C)`,
        slotKey: 'manual',
        selection: manualSelection,
      };
    }

    if (recommendationMode === 'DAILY_FORECAST_MODE' && selectedForecastItem) {
      const slot = selectedSlot === 'current' ? '13:00' : selectedSlot;
      const morningTemp = selectedForecastItem.tempMin;
      const dayTemp = selectedForecastItem.tempMax;
      const eveningTemp = Math.round((selectedForecastItem.tempMin + selectedForecastItem.tempMax) / 2);

      const temp = slot === '08:00' ? morningTemp : slot === '13:00' ? dayTemp : eveningTemp;
      const subLabel = slot === '08:00' ? '아침(최저)' : slot === '13:00' ? '낮(최고)' : '저녁';

      return {
        temperature: temp,
        apparentTemperature: temp,
        timeSlotLabel: `${selectedForecastItem.dayName} ${subLabel}`,
        slotKey: slot,
        selection:
          forecastSelections[slot] || { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
      };
    }

    // LIVE_MODE
    const currentSlotWeather = weather ? weather.timeSlots[selectedSlot] : null;
    const temp = currentSlotWeather ? currentSlotWeather.temperature : 15;
    const apparent = currentSlotWeather ? currentSlotWeather.apparentTemperature : 15;
    const label =
      selectedSlot === 'current'
        ? '실시간 현재'
        : selectedSlot === '08:00'
        ? '08시 (아침)'
        : selectedSlot === '13:00'
        ? '13시 (낮)'
        : '19시 (저녁)';

    return {
      temperature: temp,
      apparentTemperature: apparent,
      timeSlotLabel: label,
      slotKey: selectedSlot,
      selection:
        outfitSelections[selectedSlot] || { outer: '없음', top: ['티셔츠'], bottom: ['바지'], items: [] },
    };
  }, [
    recommendationMode,
    manualTemp,
    manualSelection,
    selectedForecastItem,
    selectedSlot,
    forecastSelections,
    weather,
    outfitSelections,
  ]);

  // 지능형 리콜: 현재 모드의 기준 기온을 바탕으로 매칭 계산
  const matchedRecalls = useMemo(() => {
    return findMatchingRecallLogs(
      outfitLogs,
      effectiveData.temperature,
      userCondition,
      activeUser
    );
  }, [outfitLogs, effectiveData.temperature, userCondition, activeUser]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. 상단 위치 바 및 검색 */}
      <LocationBar
        currentLocation={location}
        onLocationChange={handleLocationChange}
        isLoadingWeather={isLoading}
      />

      {/* 메인 콘텐츠 컨테이너 */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-5">
        {/* 서비스 타이틀, 성별 선택, 카카오 인증 바 & 새로고침 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Weather Outfit
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  v0.18.0
                </span>
              </div>
              {/* 요구사항: 제목 부제 '온도 기반 복장 추천 및 피드백' */}
              <p className="text-xs text-slate-500">
                온도 기반 복장 추천 및 피드백
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
            {/* 요구사항: 남성 / 여성 성별 선택 토글 */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/80 shadow-2xs">
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation ${
                  selectedGender === 'male'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="남성 전용 추천 (여성 전용 복장 제외)"
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation ${
                  selectedGender === 'female'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="여성 추천 (모든 복장 허용)"
              >
                여성
              </button>
            </div>

            {/* 카카오 로그인 / 프로필 바 (단일화된 사용자 인증) */}
            <KakaoAuthBar
              currentProfile={authProfile}
              isAuthenticated={isAuthenticated}
              onAuthChange={() => {
                loadLogs();
                if (weather) loadAggregatedData(weather);
              }}
            />

            <button
              onClick={() => {
                loadWeather(location);
                loadLogs();
              }}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all disabled:opacity-50"
              title="날씨 및 기록 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 에러 상태 안내 */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">날씨 정보를 가져오지 못했습니다.</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              <button
                onClick={() => loadWeather(location)}
                className="mt-2 text-xs font-semibold text-rose-700 underline underline-offset-2"
              >
                다시 시도하기
              </button>
            </div>
          </div>
        )}

        {/* 2. 상단 2분할 날씨 카드 (좌측: 실시간 현재 날씨 / 우측: 수동 복장 점검) */}
        {weather && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 좌측: 실시간 현재 날씨 카드 (미래 날짜 또는 수동 모드 시 클릭하면 오늘 날씨로 복귀) */}
            <WeatherOverview
              weather={weather}
              isLoading={isLoading}
              selectedSlot={selectedSlot}
              isActive={recommendationMode === 'LIVE_MODE' && selectedSlot === 'current'}
              isReturnMode={recommendationMode !== 'LIVE_MODE' || selectedSlot !== 'current'}
              onSelectCurrent={() => handleSwitchLive('current')}
            />

            {/* 우측: 수동 복장 점검 카드 */}
            <ManualTempChecker
              temperature={manualTemp}
              onChangeTemp={handleManualTempChange}
              isActive={recommendationMode === 'MANUAL_MODE'}
              onActivate={handleSwitchManual}
              defaultTemp={weather.currentTemp}
            />
          </div>
        )}

        {/* 3. 주간 예보 (내일부터 6일간 D+1 ~ D+6, 타이틀 없이 현재 날씨 바로 아래 일체화 가로 스크롤 카드) */}
        {weather && (
          <DailyForecast
            forecasts={weather.dailyForecast}
            selectedDate={recommendationMode === 'DAILY_FORECAST_MODE' ? selectedForecastItem?.date : null}
            onSelectDate={handleSelectForecastDate}
          />
        )}

        {/* 4. 시간대별 탭 (실시간/예보 모드) 또는 수동 모드 안내 바 */}
        {weather && (
          recommendationMode === 'MANUAL_MODE' ? (
            <div className="p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/70 border border-indigo-200/90 rounded-2xl flex items-center justify-between text-xs text-indigo-950 flex-wrap gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-indigo-900">
                    수동 기온 점검 모드 ({manualTemp}°C)
                  </span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    설정한 온도에 맞춰 대표 추천 복장 및 보온 지수(Insulation Score)가 분석됩니다. (상단 좌측 '현재 기온' 클릭 시 오늘 복귀)
                  </p>
                </div>
              </div>
            </div>
          ) : recommendationMode === 'DAILY_FORECAST_MODE' && selectedForecastItem ? (
            <TimeSlotTabs
              timeSlots={{
                'current': {
                  slot: 'current',
                  timeString: '13:00',
                  temperature: selectedForecastItem.tempMax,
                  apparentTemperature: selectedForecastItem.tempMax,
                  weatherCode: selectedForecastItem.weatherCode,
                  weatherLabel: selectedForecastItem.weatherLabel,
                },
                '08:00': {
                  slot: '08:00',
                  timeString: '08:00',
                  temperature: selectedForecastItem.tempMin,
                  apparentTemperature: selectedForecastItem.tempMin,
                  weatherCode: selectedForecastItem.weatherCode,
                  weatherLabel: selectedForecastItem.weatherLabel,
                },
                '13:00': {
                  slot: '13:00',
                  timeString: '13:00',
                  temperature: selectedForecastItem.tempMax,
                  apparentTemperature: selectedForecastItem.tempMax,
                  weatherCode: selectedForecastItem.weatherCode,
                  weatherLabel: selectedForecastItem.weatherLabel,
                },
                '19:00': {
                  slot: '19:00',
                  timeString: '19:00',
                  temperature: Math.round((selectedForecastItem.tempMin + selectedForecastItem.tempMax) / 2),
                  apparentTemperature: Math.round((selectedForecastItem.tempMin + selectedForecastItem.tempMax) / 2),
                  weatherCode: selectedForecastItem.weatherCode,
                  weatherLabel: selectedForecastItem.weatherLabel,
                },
              }}
              selectedSlot={selectedSlot === 'current' ? '13:00' : selectedSlot}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              title={`${selectedForecastItem.dayName} 예보 시간대별 복장 기준`}
              visibleSlots={['08:00', '13:00', '19:00']}
            />
          ) : (
            <TimeSlotTabs
              timeSlots={weather.timeSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => {
                setSelectedSlot(slot);
                setRecommendationMode('LIVE_MODE');
                setSelectedForecastItem(null);
              }}
              title="시간대별 예보 및 복장 기준"
              visibleSlots={['current', '08:00', '13:00', '19:00']}
            />
          )
        )}

        {/* 5. 지능형 리콜 카드 (현재 모드 기준 기온 기반) */}
        {matchedRecalls.length > 0 && (
          <HistoryRecallCard
            recalls={matchedRecalls}
            onApplyOutfit={handleCurrentOutfitChange}
            currentUserName={activeUser}
          />
        )}

        {/* 6. 복장 추천 및 칩 커스터마이징 컴포넌트 */}
        <OutfitSelector
          temperature={effectiveData.temperature}
          timeSlotLabel={effectiveData.timeSlotLabel}
          selection={effectiveData.selection}
          onChangeSelection={handleCurrentOutfitChange}
          allLogs={outfitLogs}
          currentUser={activeUser}
          isLoggedIn={isAuthenticated}
          gender={selectedGender}
        />

        {/* 7. 오늘의 복장 체감 평가 & 피드백 폼 (미래 날짜 D+1 ~ D+6 예보 조회 시 숨김) */}
        {recommendationMode !== 'DAILY_FORECAST_MODE' && (
          <FeedbackForm
            userName={isAuthenticated && authProfile ? authProfile.name : '게스트'}
            currentTemp={effectiveData.temperature}
            apparentTemp={effectiveData.apparentTemperature}
            timeSlot={effectiveData.slotKey}
            locationName={location.name}
            currentOutfit={effectiveData.selection}
            onLogSaved={() => {
              loadLogs();
              if (weather) {
                loadAggregatedData(weather);
              }
            }}
            userCondition={userCondition}
            onChangeUserCondition={setUserCondition}
            onKakaoLogin={() => signInWithKakao()}
            gender={selectedGender}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-10">
        <p>Weather data provided by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Open-Meteo</a> (Free & Keyless)</p>
        <p className="mt-1">Next.js 14 App Router • Tailwind CSS • Supabase PostgreSQL • <strong>v0.18.0</strong></p>
      </footer>
    </div>
  );
}
