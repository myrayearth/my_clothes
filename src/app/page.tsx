'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LocationInfo } from '@/types/location';
import { ProcessedWeatherData, TargetTimeSlot } from '@/types/weather';
import { OutfitSelection } from '@/types/outfit';
import { OutfitLog, UserCondition, UserProfile } from '@/types/database';
import { DEFAULT_LOCATION, getSavedLocation, getCurrentLocation, saveLocation } from '@/lib/location';
import { fetchWeatherData } from '@/lib/weather';
import { getOutfitRuleByTemperature, getDefaultOutfitSelection } from '@/lib/outfit';
import {
  fetchAllOutfitLogs,
  fetchProfiles,
  getSavedActiveUser,
  getSavedActiveUserId,
  saveActiveUser,
  supabase,
} from '@/lib/storage';
import { syncKakaoUserProfile, signInWithKakao } from '@/lib/auth';
import { findMatchingRecallLogs } from '@/lib/matcher';
import { LocationBar } from '@/components/layout/LocationBar';
import { WeatherOverview } from '@/components/weather/WeatherOverview';
import { TimeSlotTabs } from '@/components/weather/TimeSlotTabs';
import { OutfitSelector } from '@/components/OutfitSelector';
import { HistoryRecallCard } from '@/components/HistoryRecallCard';
import { FeedbackForm } from '@/components/FeedbackForm';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { UserProfileSelector } from '@/components/profile/UserProfileSelector';
import { UserManagementModal } from '@/components/profile/UserManagementModal';
import { KakaoAuthBar } from '@/components/auth/KakaoAuthBar';
import { RefreshCw, Shirt, AlertCircle, Settings } from 'lucide-react';

export default function Home() {
  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<ProcessedWeatherData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TargetTimeSlot>('08:00');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 프로필 및 카카오 인증 상태
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeUser, setActiveUser] = useState<string>('기본 사용자');
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);

  // 과거 복장 로그 데이터베이스 목록
  const [outfitLogs, setOutfitLogs] = useState<OutfitLog[]>([]);

  // 사용자 현재 컨디션 상태 ('정상', '피곤', '감기', '활동량많음')
  const [userCondition, setUserCondition] = useState<UserCondition>('정상');

  // 시간대별 사용자의 복장 선택 상태 (08:00, 13:00, 19:00)
  const [outfitSelections, setOutfitSelections] = useState<Record<TargetTimeSlot, OutfitSelection>>({
    '08:00': { outer: '자켓', top: ['니트'], bottom: ['청바지'], items: [] },
    '13:00': { outer: '없음', top: ['반팔 티셔츠'], bottom: ['면바지'], items: [] },
    '19:00': { outer: '트렌치코트', top: ['도톰한 니트'], bottom: ['기모바지'], items: [] },
  });

  // 현재 시간에 따라 초기 타겟 시간대 결정
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 11) {
      setSelectedSlot('08:00');
    } else if (currentHour < 16) {
      setSelectedSlot('13:00');
    } else {
      setSelectedSlot('19:00');
    }
  }, []);

  // 프로필 로드 함수 (Supabase DB 최우선 + LocalStorage 활성 사용자 ID 매칭)
  const loadProfiles = useCallback(async () => {
    try {
      const pList = await fetchProfiles();
      setProfiles(pList);

      if (isAuthenticated && authProfile) {
        setActiveUser(authProfile.name);
        return;
      }

      const savedId = getSavedActiveUserId();
      const savedUser = getSavedActiveUser();

      // 1. 활성화된 사용자 ID로 먼저 매칭 시도
      const matchedById = savedId ? pList.find((p) => p.id === savedId) : null;
      // 2. 사용자 이름으로 매칭 시도
      const matchedByName = pList.find((p) => p.name === savedUser);

      const target = matchedById || matchedByName;

      if (target) {
        setActiveUser(target.name);
        saveActiveUser({ id: target.id, name: target.name });
      } else if (pList.length > 0) {
        setActiveUser(pList[0].name);
        saveActiveUser({ id: pList[0].id, name: pList[0].name });
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err);
    }
  }, [isAuthenticated, authProfile]);

  // 과거 로그 데이터 로드 함수 (현재 선택된 사용자 전용)
  const loadLogs = useCallback(async (userName?: string) => {
    const target = userName || activeUser;
    try {
      const logs = await fetchAllOutfitLogs(target);
      setOutfitLogs(logs);
    } catch (err) {
      console.error('과거 로그 불러오기 실패:', err);
    }
  }, [activeUser]);

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
        // 비로그인 상태: 기본 사용자 및 기본 추천 데이터
        setIsAuthenticated(false);
        setAuthProfile(null);
        setActiveUser('기본 사용자');
        saveActiveUser('기본 사용자');
        await loadLogs('기본 사용자');
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
          await loadProfiles();
          await loadLogs(profile.name);
        } catch (e) {
          console.error('카카오 프로필 갱신 에러:', e);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAuthProfile(null);
        setActiveUser('기본 사용자');
        saveActiveUser('기본 사용자');
        await loadLogs('기본 사용자');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadLogs, loadProfiles]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (activeUser) {
      loadLogs(activeUser);
    }
  }, [activeUser, loadLogs]);

  // 사용자 전환 핸들러
  const handleSelectUser = (userName: string, userId?: string) => {
    setActiveUser(userName);
    saveActiveUser({ id: userId, name: userName });
    loadLogs(userName);
  };

  // 날씨 데이터가 로드되면 각 시간대 기온에 맞는 8단계 추천 기본값 자동 세팅
  const initOutfitSelectionsForWeather = useCallback((data: ProcessedWeatherData) => {
    const slots: TargetTimeSlot[] = ['08:00', '13:00', '19:00'];
    const newSelections: Partial<Record<TargetTimeSlot, OutfitSelection>> = {};

    slots.forEach((slot) => {
      const slotTemp = data.timeSlots[slot].temperature;
      const rule = getOutfitRuleByTemperature(slotTemp);
      newSelections[slot] = getDefaultOutfitSelection(rule);
    });

    setOutfitSelections(newSelections as Record<TargetTimeSlot, OutfitSelection>);
  }, []);

  // 날씨 데이터 로드 함수
  const loadWeather = useCallback(
    async (loc: LocationInfo) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherData(loc.latitude, loc.longitude);
        setWeather(data);
        initOutfitSelectionsForWeather(data);
      } catch (err: any) {
        console.error('날씨 데이터 로드 실패:', err);
        setError(err.message || '날씨 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [initOutfitSelectionsForWeather]
  );

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

  // 현재 선택된 시간대의 복장 선택 변경 핸들러
  const handleCurrentOutfitChange = (newSelection: OutfitSelection) => {
    setOutfitSelections((prev) => ({
      ...prev,
      [selectedSlot]: newSelection,
    }));
  };

  const currentSlotWeather = weather ? weather.timeSlots[selectedSlot] : null;
  const currentSlotSelection = outfitSelections[selectedSlot];

  // 지능형 리콜: 현재 선택된 사용자의 기록만 필터링하여 매칭 계산
  const matchedRecalls = useMemo(() => {
    if (!currentSlotWeather) return [];
    return findMatchingRecallLogs(
      outfitLogs,
      currentSlotWeather.temperature,
      userCondition,
      activeUser
    );
  }, [outfitLogs, currentSlotWeather, userCondition, activeUser]);

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
        {/* 서비스 타이틀, 사용자 프로필 셀렉터 & 새로고침 */}
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
                  v0.8.1
                </span>
              </div>
              <p className="text-xs text-slate-500">
                기온 기반 맞춤 복장 추천 및 체감 피드백
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center flex-wrap justify-end">
            {/* 카카오 로그인 / 프로필 바 */}
            <KakaoAuthBar
              currentProfile={authProfile}
              isAuthenticated={isAuthenticated}
              onAuthChange={() => {
                loadProfiles();
                loadLogs(activeUser);
              }}
            />

            {/* 비로그인 상태 게스트 프로필 전환 드롭다운 및 관리 */}
            {!isAuthenticated && (
              <>
                <UserProfileSelector
                  currentUserName={activeUser}
                  profiles={profiles}
                  onSelectUser={handleSelectUser}
                  onProfileCreated={loadProfiles}
                  onOpenManageModal={() => setIsManageModalOpen(true)}
                />

                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 touch-manipulation shadow-2xs hover:border-slate-300"
                  title="사용자 관리 (수정 / 삭제)"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">사용자 관리</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                loadWeather(location);
                loadLogs(activeUser);
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

        {/* 2. 오늘 날씨 요약 카드 */}
        {weather && <WeatherOverview weather={weather} isLoading={isLoading} />}

        {/* 3. 08시 / 13시 / 19시 타겟 시간대 탭 */}
        {weather && (
          <TimeSlotTabs
            timeSlots={weather.timeSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />
        )}

        {/* 4. 지능형 리콜 카드 (현재 선택된 사용자 전용) */}
        {matchedRecalls.length > 0 && (
          <HistoryRecallCard
            recalls={matchedRecalls}
            onApplyOutfit={handleCurrentOutfitChange}
            currentUserName={activeUser}
          />
        )}

        {/* 5. 복장 추천 및 칩 커스터마이징 컴포넌트 (다중 선택 & 모든 항목 보기 지원) */}
        {currentSlotWeather && currentSlotSelection && (
          <OutfitSelector
            temperature={currentSlotWeather.temperature}
            timeSlotLabel={
              selectedSlot === '08:00'
                ? '08시 (아침)'
                : selectedSlot === '13:00'
                ? '13시 (낮)'
                : '19시 (저녁)'
            }
            selection={currentSlotSelection}
            onChangeSelection={handleCurrentOutfitChange}
          />
        )}

        {/* 6. 오늘의 복장 체감 평가 & 피드백 폼 */}
        {currentSlotWeather && currentSlotSelection && (
          <FeedbackForm
            userName={activeUser}
            currentTemp={currentSlotWeather.temperature}
            apparentTemp={currentSlotWeather.apparentTemperature}
            timeSlot={selectedSlot}
            locationName={location.name}
            currentOutfit={currentSlotSelection}
            onLogSaved={() => loadLogs(activeUser)}
            userCondition={userCondition}
            onChangeUserCondition={setUserCondition}
            onRequireUserChange={() => setIsManageModalOpen(true)}
            onKakaoLogin={() => signInWithKakao()}
          />
        )}

        {/* 7. 7일간의 주간 예보 */}
        {weather && <DailyForecast forecasts={weather.dailyForecast} />}
      </main>

      {/* 푸터 */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-10">
        <p>Weather data provided by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Open-Meteo</a> (Free & Keyless)</p>
        <p className="mt-1">Next.js 14 App Router • Tailwind CSS • Supabase PostgreSQL • <strong>v0.8.1</strong></p>
      </footer>
      {/* 8. 사용자 관리 (편집 / 삭제) 모달 */}
      <UserManagementModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        currentUserName={activeUser}
        profiles={profiles}
        onSelectUser={handleSelectUser}
        onProfilesChanged={loadProfiles}
      />
    </div>
  );
}
