'use client';

import React from 'react';

export interface AnimatedWeatherIconProps {
  weatherCode: number;
  isDay?: boolean;
  className?: string;
  size?: number;
}

/**
 * Open-Meteo WMO 날씨 코드 및 주/야간(isDay) 플래그에 대응하는
 * 경량 모듈형 애니메이션 날씨 벡터 아이콘 컴포넌트 (Meteocons 모던 스타일)
 */
export const AnimatedWeatherIcon: React.FC<AnimatedWeatherIconProps> = ({
  weatherCode,
  isDay,
  className = '',
  size = 48,
}) => {
  // isDay가 지정되지 않은 경우 현재 클라이언트 시간 기준(06:00~19:00 주간) 산출
  const effectiveIsDay =
    isDay !== undefined
      ? isDay
      : typeof window !== 'undefined'
      ? (() => {
          const h = new Date().getHours();
          return h >= 6 && h < 19;
        })()
      : true;

  // WMO 날씨 코드 분류
  // 0: 맑음
  // 1, 2: 약간 흐림 / 구름 조금
  // 3: 흐림
  // 45, 48: 안개
  // 51~67, 80~82: 비 / 소나기
  // 71~77, 85~86: 눈 / 진눈깨비
  // 95~99: 뇌우
  const isClear = weatherCode === 0;
  const isPartlyCloudy = weatherCode === 1 || weatherCode === 2;
  const isOvercast = weatherCode === 3;
  const isFog = weatherCode === 45 || weatherCode === 48;
  const isRain =
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82);
  const isSnow =
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86);
  const isThunder = weatherCode >= 95;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`inline-block select-none overflow-visible ${className}`}
      aria-label={`날씨 코드 ${weatherCode}`}
    >
      <defs>
        {/* 태양 그라데이션 */}
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* 달 그라데이션 */}
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* 앞 구름 그라데이션 (밝은 볼륨감) */}
        <linearGradient id="cloudFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="85%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* 뒷 구름 그라데이션 (음영) */}
        <linearGradient id="cloudBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        {/* 비구름 그라데이션 (짙은 톤) */}
        <linearGradient id="cloudRainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* 빗방울 그라데이션 */}
        <linearGradient id="rainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* 번개 그라데이션 */}
        <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        {/* 부드러운 그림자 필터 */}
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>

        {/* 태양/번개 발광 필터 */}
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>{`
        /* 1. 태양 회전 & 은은한 맥박 */
        @keyframes sun-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        .anim-sun-rays {
          transform-origin: 32px 32px;
          animation: sun-spin 14s linear infinite;
        }
        .anim-sun-core {
          transform-origin: 32px 32px;
          animation: sun-pulse 3s ease-in-out infinite;
        }

        /* 2. 구름 속 태양 */
        .anim-sun-partly-rays {
          transform-origin: 24px 24px;
          animation: sun-spin 16s linear infinite;
        }
        .anim-sun-partly-core {
          transform-origin: 24px 24px;
          animation: sun-pulse 3.5s ease-in-out infinite;
        }

        /* 3. 달 부유 & 별 깜빡임 */
        @keyframes moon-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-2.5px) rotate(3deg); }
        }
        @keyframes star-twinkle {
          0%, 100% { transform: scale(0.5); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .anim-moon {
          transform-origin: 32px 32px;
          animation: moon-float 4s ease-in-out infinite;
        }
        .anim-star-1 {
          transform-origin: 46px 18px;
          animation: star-twinkle 2s ease-in-out infinite;
        }
        .anim-star-2 {
          transform-origin: 18px 42px;
          animation: star-twinkle 2.8s ease-in-out infinite 0.7s;
        }

        /* 4. 구름 둥실둥실 부유 (Floating Cloud) */
        @keyframes cloud-drift-front {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(3px) translateY(-1.5px); }
        }
        @keyframes cloud-drift-back {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-2.5px) translateY(-1px); }
        }
        .anim-cloud-front {
          animation: cloud-drift-front 3.6s ease-in-out infinite;
        }
        .anim-cloud-back {
          animation: cloud-drift-back 4.5s ease-in-out infinite;
        }

        /* 5. 안개 흐름 (Fog lines) */
        @keyframes fog-drift-right {
          0%, 100% { transform: translateX(-4px); opacity: 0.55; }
          50% { transform: translateX(4px); opacity: 0.9; }
        }
        @keyframes fog-drift-left {
          0%, 100% { transform: translateX(4px); opacity: 0.85; }
          50% { transform: translateX(-4px); opacity: 0.5; }
        }
        .anim-fog-1 { animation: fog-drift-right 3.2s ease-in-out infinite; }
        .anim-fog-2 { animation: fog-drift-left 2.6s ease-in-out infinite 0.3s; }
        .anim-fog-3 { animation: fog-drift-right 3.8s ease-in-out infinite 0.6s; }

        /* 6. 비 내림 (Rain drop fall) */
        @keyframes raindrop-fall {
          0% {
            transform: translateY(-8px) translateX(3px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(14px) translateX(-4px);
            opacity: 0;
          }
        }
        .anim-rain-1 { animation: raindrop-fall 1.05s cubic-bezier(0.4, 0, 0.8, 0.8) infinite; }
        .anim-rain-2 { animation: raindrop-fall 1.05s cubic-bezier(0.4, 0, 0.8, 0.8) infinite 0.35s; }
        .anim-rain-3 { animation: raindrop-fall 1.05s cubic-bezier(0.4, 0, 0.8, 0.8) infinite 0.7s; }

        /* 7. 눈 내림 & 회전 (Snow flake fall) */
        @keyframes snowflake-fall {
          0% {
            transform: translateY(-6px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          50% {
            transform: translateY(5px) translateX(2.5px) rotate(180deg);
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(15px) translateX(-2px) rotate(360deg);
            opacity: 0;
          }
        }
        .anim-snow-1 { animation: snowflake-fall 2.2s ease-in-out infinite; }
        .anim-snow-2 { animation: snowflake-fall 2.5s ease-in-out infinite 0.7s; }
        .anim-snow-3 { animation: snowflake-fall 2.3s ease-in-out infinite 1.4s; }

        /* 8. 번개 플래시 (Lightning Bolt Flash) */
        @keyframes bolt-flash {
          0%, 82%, 94%, 100% {
            opacity: 0;
            transform: scale(0.95);
          }
          83%, 89% {
            opacity: 1;
            transform: scale(1.05);
            filter: drop-shadow(0 0 6px #facc15);
          }
          86% {
            opacity: 0.2;
          }
          91% {
            opacity: 1;
            filter: drop-shadow(0 0 8px #fde047);
          }
        }
        .anim-lightning {
          transform-origin: 32px 38px;
          animation: bolt-flash 2.6s ease-in-out infinite;
        }
      `}</style>

      {/* =========================================================================
          1. 맑음 (Clear Sky - 0)
      ========================================================================= */}
      {isClear && effectiveIsDay && (
        <g id="clear-day" filter="url(#softShadow)">
          {/* 회전하는 태양 광선 8개 */}
          <g className="anim-sun-rays" stroke="url(#sunGrad)" strokeWidth="3" strokeLinecap="round">
            <line x1="32" y1="12" x2="32" y2="7" />
            <line x1="32" y1="52" x2="32" y2="57" />
            <line x1="12" y1="32" x2="7" y2="32" />
            <line x1="52" y1="32" x2="57" y2="32" />
            <line x1="17.86" y1="17.86" x2="14.32" y2="14.32" />
            <line x1="46.14" y1="46.14" x2="49.68" y2="49.68" />
            <line x1="17.86" y1="46.14" x2="14.32" y2="49.68" />
            <line x1="46.14" y1="17.86" x2="49.68" y2="14.32" />
          </g>
          {/* 펄스하는 태양 코어 */}
          <circle
            className="anim-sun-core"
            cx="32"
            cy="32"
            r="13.5"
            fill="url(#sunGrad)"
            filter="url(#glow)"
          />
        </g>
      )}

      {isClear && !effectiveIsDay && (
        <g id="clear-night" filter="url(#softShadow)">
          {/* 반짝이는 별 1 */}
          <g className="anim-star-1">
            <path
              d="M46 14 L47 17 L50 18 L47 19 L46 22 L45 19 L42 18 L45 17 Z"
              fill="#fef08a"
              filter="url(#glow)"
            />
          </g>
          {/* 반짝이는 별 2 */}
          <g className="anim-star-2">
            <path
              d="M18 39 L19 41 L21 42 L19 43 L18 45 L17 43 L15 42 L17 41 Z"
              fill="#fde047"
            />
          </g>
          {/* 부드럽게 흔들리는 초승달 */}
          <path
            className="anim-moon"
            d="M37.5 16 C30.5 17.5 25.5 24 25.5 32 C25.5 40.8 32.7 48 41.5 48 C44.5 48 47.3 47.1 49.6 45.6 C46.2 48.4 41.8 50 37 50 C26 50 17 41 17 30 C17 20.2 24.1 12.1 33.5 10.3 C34.9 12 36.3 14 37.5 16 Z"
            fill="url(#moonGrad)"
            filter="url(#glow)"
          />
        </g>
      )}

      {/* =========================================================================
          2. 약간 흐림 / 구름 조금 (Partly Cloudy - 1, 2)
      ========================================================================= */}
      {isPartlyCloudy && effectiveIsDay && (
        <g id="partly-cloudy-day" filter="url(#softShadow)">
          {/* 뒤쪽 회전 태양 */}
          <g className="anim-sun-partly-rays" stroke="url(#sunGrad)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="24" y1="10" x2="24" y2="6" />
            <line x1="24" y1="38" x2="24" y2="42" />
            <line x1="10" y1="24" x2="6" y2="24" />
            <line x1="38" y1="24" x2="42" y2="24" />
            <line x1="14.1" y1="14.1" x2="11.2" y2="11.2" />
            <line x1="33.9" y1="33.9" x2="36.8" y2="36.8" />
            <line x1="14.1" y1="33.9" x2="11.2" y2="36.8" />
            <line x1="33.9" y1="14.1" x2="36.8" y2="11.2" />
          </g>
          <circle
            className="anim-sun-partly-core"
            cx="24"
            cy="24"
            r="10"
            fill="url(#sunGrad)"
          />

          {/* 앞쪽 둥실둥실 구름 */}
          <g className="anim-cloud-front">
            <path
              d="M26 48 L44 48 C48.4 48 52 44.4 52 40 C52 35.8 48.8 32.4 44.6 32.1 C43.8 25.3 38 20 31 20 C24.6 20 19.2 24.5 17.7 30.6 C14.5 31.4 12 34.4 12 38 C12 42.4 15.6 46 20 46 L26 46 Z"
              fill="url(#cloudFrontGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          </g>
        </g>
      )}

      {isPartlyCloudy && !effectiveIsDay && (
        <g id="partly-cloudy-night" filter="url(#softShadow)">
          {/* 뒤쪽 달 */}
          <path
            className="anim-moon"
            d="M32 16 C27.5 17 24 21 24 26 C24 31.5 28.5 36 34 36 C36 36 37.8 35.4 39.3 34.4 C37 36.5 34 37.8 30.7 37.8 C23.5 37.8 17.6 32 17.6 24.8 C17.6 18.5 22.2 13.2 28.4 12 C29.7 13.3 30.9 14.6 32 16 Z"
            fill="url(#moonGrad)"
          />
          {/* 앞쪽 둥실둥실 구름 */}
          <g className="anim-cloud-front">
            <path
              d="M26 48 L44 48 C48.4 48 52 44.4 52 40 C52 35.8 48.8 32.4 44.6 32.1 C43.8 25.3 38 20 31 20 C24.6 20 19.2 24.5 17.7 30.6 C14.5 31.4 12 34.4 12 38 C12 42.4 15.6 46 20 46 L26 46 Z"
              fill="url(#cloudFrontGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          </g>
        </g>
      )}

      {/* =========================================================================
          3. 흐림 (Overcast - 3)
      ========================================================================= */}
      {isOvercast && (
        <g id="overcast" filter="url(#softShadow)">
          {/* 뒤쪽 어두운 구름 */}
          <g className="anim-cloud-back" opacity="0.85">
            <path
              d="M22 36 L36 36 C39.3 36 42 33.3 42 30 C42 26.8 39.6 24.3 36.5 24 C35.8 19 31.5 15 26.2 15 C21.4 15 17.3 18.4 16.2 23 C13.8 23.6 12 25.8 12 28.5 C12 31.8 14.7 34.5 18 34.5 L22 34.5 Z"
              fill="url(#cloudBackGrad)"
              stroke="#94a3b8"
              strokeWidth="0.6"
            />
          </g>
          {/* 앞쪽 둥실둥실 구름 */}
          <g className="anim-cloud-front">
            <path
              d="M26 49 L46 49 C50.4 49 54 45.4 54 41 C54 36.8 50.8 33.4 46.6 33.1 C45.8 26.3 40 21 33 21 C26.6 21 21.2 25.5 19.7 31.6 C16.5 32.4 14 35.4 14 39 C14 43.4 17.6 47 22 47 L26 47 Z"
              fill="url(#cloudFrontGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          </g>
        </g>
      )}

      {/* =========================================================================
          4. 안개 (Fog / Mist - 45, 48)
      ========================================================================= */}
      {isFog && (
        <g id="fog" filter="url(#softShadow)">
          {/* 상단 옅은 구름 */}
          <g className="anim-cloud-back" opacity="0.7">
            <path
              d="M24 30 L40 30 C43.3 30 46 27.5 46 24.5 C46 21.8 43.8 19.5 41 19.2 C40.3 15 36.5 12 32 12 C27.8 12 24.2 14.8 23.2 18.8 C21 19.3 19.5 21.2 19.5 23.5 C19.5 26.2 21.5 28.5 24 28.5 Z"
              fill="url(#cloudBackGrad)"
            />
          </g>
          {/* 좌우로 부드럽게 흐르는 3줄의 안개선 */}
          <line
            className="anim-fog-1"
            x1="12"
            y1="36"
            x2="52"
            y2="36"
            stroke="#94a3b8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <line
            className="anim-fog-2"
            x1="18"
            y1="43"
            x2="48"
            y2="43"
            stroke="#cbd5e1"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <line
            className="anim-fog-3"
            x1="14"
            y1="50"
            x2="50"
            y2="50"
            stroke="#94a3b8"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* =========================================================================
          5. 비 / 소나기 (Rain / Showers - 51~67, 80~82)
      ========================================================================= */}
      {isRain && (
        <g id="rain" filter="url(#softShadow)">
          {/* 상단 비구름 */}
          <g className="anim-cloud-front">
            <path
              d="M24 38 L44 38 C48.4 38 52 34.4 52 30 C52 25.8 48.8 22.4 44.6 22.1 C43.8 15.3 38 10 31 10 C24.6 10 19.2 14.5 17.7 20.6 C14.5 21.4 12 24.4 12 28 C12 32.4 15.6 36 20 36 L24 36 Z"
              fill="url(#cloudRainGrad)"
              stroke="#64748b"
              strokeWidth="0.8"
            />
          </g>
          {/* 떨어지는 사선 빗방울 3개 */}
          <g stroke="url(#rainGrad)" strokeWidth="2.6" strokeLinecap="round">
            <line className="anim-rain-1" x1="22" y1="41" x2="19" y2="48" />
            <line className="anim-rain-2" x1="32" y1="41" x2="29" y2="48" />
            <line className="anim-rain-3" x1="42" y1="41" x2="39" y2="48" />
          </g>
        </g>
      )}

      {/* =========================================================================
          6. 눈 / 진눈깨비 (Snow - 71~77, 85~86)
      ========================================================================= */}
      {isSnow && (
        <g id="snow" filter="url(#softShadow)">
          {/* 상단 겨울 구름 */}
          <g className="anim-cloud-front">
            <path
              d="M24 38 L44 38 C48.4 38 52 34.4 52 30 C52 25.8 48.8 22.4 44.6 22.1 C43.8 15.3 38 10 31 10 C24.6 10 19.2 14.5 17.7 20.6 C14.5 21.4 12 24.4 12 28 C12 32.4 15.6 36 20 36 L24 36 Z"
              fill="url(#cloudBackGrad)"
              stroke="#94a3b8"
              strokeWidth="0.8"
            />
          </g>
          {/* 회전하며 떨어지는 눈송이 3개 */}
          <g stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round">
            {/* 눈송이 1 */}
            <g className="anim-snow-1">
              <line x1="22" y1="43" x2="22" y2="49" />
              <line x1="19" y1="46" x2="25" y2="46" />
              <line x1="20" y1="44" x2="24" y2="48" />
              <line x1="20" y1="48" x2="24" y2="44" />
            </g>
            {/* 눈송이 2 */}
            <g className="anim-snow-2">
              <line x1="32" y1="44" x2="32" y2="50" />
              <line x1="29" y1="47" x2="35" y2="47" />
              <line x1="30" y1="45" x2="34" y2="49" />
              <line x1="30" y1="49" x2="34" y2="45" />
            </g>
            {/* 눈송이 3 */}
            <g className="anim-snow-3">
              <line x1="42" y1="43" x2="42" y2="49" />
              <line x1="39" y1="46" x2="45" y2="46" />
              <line x1="40" y1="44" x2="44" y2="48" />
              <line x1="40" y1="48" x2="44" y2="44" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          7. 뇌우 / 천둥번개 (Thunderstorm - 95~99)
      ========================================================================= */}
      {isThunder && (
        <g id="thunderstorm" filter="url(#softShadow)">
          {/* 어두운 뇌우 구름 */}
          <g className="anim-cloud-front">
            <path
              d="M24 37 L44 37 C48.4 37 52 33.4 52 29 C52 24.8 48.8 21.4 44.6 21.1 C43.8 14.3 38 9 31 9 C24.6 9 19.2 13.5 17.7 19.6 C14.5 20.4 12 23.4 12 27 C12 31.4 15.6 35 20 35 L24 35 Z"
              fill="url(#cloudRainGrad)"
              stroke="#475569"
              strokeWidth="0.8"
            />
          </g>
          {/* 번쩍이는 번개 화살표 */}
          <polygon
            className="anim-lightning"
            points="31,34 26,44 32,44 30,55 38,43 33,43 36,34"
            fill="url(#boltGrad)"
            stroke="#ca8a04"
            strokeWidth="0.8"
          />
          {/* 배경 비 */}
          <g stroke="url(#rainGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
            <line className="anim-rain-1" x1="19" y1="40" x2="16" y2="47" />
            <line className="anim-rain-3" x1="45" y1="40" x2="42" y2="47" />
          </g>
        </g>
      )}

      {/* =========================================================================
          기본 폴백 (Fallback - 기타 코드 구름)
      ========================================================================= */}
      {!isClear &&
        !isPartlyCloudy &&
        !isOvercast &&
        !isFog &&
        !isRain &&
        !isSnow &&
        !isThunder && (
          <g id="fallback-cloud" filter="url(#softShadow)">
            <g className="anim-cloud-front">
              <path
                d="M26 48 L44 48 C48.4 48 52 44.4 52 40 C52 35.8 48.8 32.4 44.6 32.1 C43.8 25.3 38 20 31 20 C24.6 20 19.2 24.5 17.7 30.6 C14.5 31.4 12 34.4 12 38 C12 42.4 15.6 46 20 46 L26 46 Z"
                fill="url(#cloudFrontGrad)"
                stroke="#cbd5e1"
                strokeWidth="0.8"
              />
            </g>
          </g>
        )}
    </svg>
  );
};
