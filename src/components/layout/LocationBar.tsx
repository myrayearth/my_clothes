'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';
import { LocationInfo } from '@/types/location';
import { getCurrentLocation, searchCities, saveLocation } from '@/lib/location';

interface LocationBarProps {
  currentLocation: LocationInfo;
  onLocationChange: (loc: LocationInfo) => void;
  isLoadingWeather?: boolean;
}

export const LocationBar: React.FC<LocationBarProps> = ({
  currentLocation,
  onLocationChange,
  isLoadingWeather = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 바깥 클릭 시 자동완성 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색어 입력 시 디바운스 적용
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setErrorMessage(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(val);
        setSearchResults(results);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // 현재 위치 버튼 클릭
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    setErrorMessage(null);
    try {
      const loc = await getCurrentLocation();
      saveLocation(loc);
      onLocationChange(loc);
    } catch (err: any) {
      setErrorMessage(err.message || '현재 위치를 불러올 수 없습니다.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsLocating(false);
    }
  };

  // 검색 결과 도시 선택
  const handleSelectCity = (city: LocationInfo) => {
    saveLocation(city);
    onLocationChange(city);
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
        {/* 상단: 현재 선택된 위치 라벨 및 현재 위치 가져오기 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-sm min-w-0">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className={`truncate max-w-[230px] sm:max-w-sm ${isLocating ? 'text-slate-400 animate-pulse' : ''}`}>
              {isLocating ? '내 현재 위치 확인 중...' : currentLocation.name}
            </span>
            {currentLocation.isCurrentLocation && !currentLocation.name.startsWith('내 현재 위치') && (
              <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 font-medium px-1.5 py-0.5 rounded-full shrink-0">
                현재 위치
              </span>
            )}
          </div>

          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating || isLoadingWeather}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all px-2.5 py-1.5 rounded-lg font-medium disabled:opacity-50 shrink-0"
            title="GPS로 현재 위치 감지"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{isLocating ? '감지 중...' : '내 위치'}</span>
          </button>
        </div>

        {/* 하단: 도시/지역명 검색 인풋창 */}
        <div ref={containerRef} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              placeholder="도시나 지역명 검색 (예: 서울, 강남, 부산, Tokyo)..."
              className="w-full pl-9 pr-9 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3" />
            )}
            {!isSearching && searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 자동완성 드롭다운 */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {searchResults.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((city, idx) => (
                    <li key={`${city.name}-${idx}`}>
                      <button
                        onClick={() => handleSelectCity(city)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50/80 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-slate-700 group-hover:text-blue-900 font-medium">
                          {city.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  '{searchQuery}'에 대한 검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 에러 피드백 메시지 */}
        {errorMessage && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
