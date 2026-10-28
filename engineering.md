# Engineering Specification: Weather Outfit (시스템 아키텍처, 데이터 스키마 및 구현 명세)

## 1. 시스템 아키텍처 개요

본 프로젝트는 Next.js 14+ (App Router) 기반의 풀스택 모던 웹 애플리케이션으로, Vercel에 배포되며 데이터 지속성을 위해 Supabase(PostgreSQL)와 연동됩니다.

```
+-----------------------------------------------------------------------------------+
|                                  Client Tier                                      |
|  - Next.js Client Components (React 18 / Lucide React / Tailwind CSS)             |
|  - Browser Geolocation API & LocalStorage Caching                                 |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
+------------------------------------+        +------------------------------------+
|       Next.js App Server Tier       |        |        External APIs Tier          |
|  - Server Actions / Route Handlers | ◀───── |  - Open-Meteo Geocoding API        |
|  - Intelligent Recall Engine       | ──────▶|  - Open-Meteo Weather Forecast API |
|  - Weather Transform Pipeline      |        |    (Free, Keyless, 30m Cache)      |
+------------------------------------+        +------------------------------------+
                 │
                 ▼
+-----------------------------------------------------------------------------------+
|                            Database Tier (Supabase)                               |
|  - PostgreSQL Database (outfit_logs table)                                        |
|  - Row Level Security (RLS) & Indexed temperature lookup                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. 데이터베이스 스키마 설계 (Supabase PostgreSQL)

### 2.1 `outfit_logs` 테이블 DDL
사용자의 당일 착용 복장, 날씨 조건, 컨디션, 만족도 지수를 저장하는 핵심 테이블입니다.

```sql
-- 확장 UUID 모듈 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- outfit_logs 테이블 정의
CREATE TABLE public.outfit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_session_id TEXT NOT NULL,                -- 비로그인 사용자를 위한 로컬 생성 고유 식별자(UUID)
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 기록 일자
    time_slot VARCHAR(10) NOT NULL,               -- '08:00' | '13:00' | '19:00' | 'current'
    location_name VARCHAR(100) NOT NULL,          -- 예: '서울시 중구', 'Seoul'
    latitude NUMERIC(8, 5) NOT NULL,              -- 위도 (예: 37.56650)
    longitude NUMERIC(8, 5) NOT NULL,             -- 경도 (예: 126.97800)
    
    -- 날씨 측정값
    temperature NUMERIC(4, 1) NOT NULL,           -- 실제 기온 (°C)
    apparent_temperature NUMERIC(4, 1) NOT NULL,  -- 체감 기온 (°C)
    weather_code INTEGER NOT NULL,                -- WMO Weather Code
    
    -- 착용 복장 (정규화 및 유연성을 위해 JSONB 또는 구체적 컬럼 활용)
    outer_item VARCHAR(100) DEFAULT '없음',
    top_item VARCHAR(100) NOT NULL,
    bottom_item VARCHAR(100) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,              -- 소품 배열 (예: ["목도리", "장갑"])
    
    -- 체감 평가 및 컨디션
    satisfaction_score INTEGER NOT NULL CHECK (satisfaction_score BETWEEN 0 AND 10), -- 0=매우추움, 5=적정, 10=매우더움
    condition VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (condition IN ('normal', 'tired', 'cold', 'active')),
    memo VARCHAR(200),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 설계: 지능형 리콜 검색의 핵심인 '기온 범위 조회' 성능 극대화
CREATE INDEX idx_outfit_logs_temp ON public.outfit_logs (temperature);
CREATE INDEX idx_outfit_logs_session_temp ON public.outfit_logs (user_session_id, temperature);
CREATE INDEX idx_outfit_logs_created_at ON public.outfit_logs (created_at DESC);
```

### 2.2 Row Level Security (RLS) 정책
비로그인 사용자도 자신의 브라우저 클라이언트 UUID(`user_session_id`)를 기준으로 본인의 데이터만 조회 및 기록할 수 있도록 설정합니다. (인증 시스템 도입 시 auth.uid()로 점진적 마이그레이션 가능)

```sql
-- RLS 활성화
ALTER TABLE public.outfit_logs ENABLE ROW LEVEL SECURITY;

-- 익명/세션 기반 SELECT 정책
CREATE POLICY "Allow select matching user session" 
ON public.outfit_logs FOR SELECT 
USING (true); -- 공유 데이터셋으로 학습된 공용 리콜 모드 또는 세션 필터링 적용 가능

-- 익명/세션 기반 INSERT 정책
CREATE POLICY "Allow insert for all with session" 
ON public.outfit_logs FOR INSERT 
WITH CHECK (true);
```

### 2.3 TypeScript Data Model Types
```typescript
export type ConditionType = 'normal' | 'tired' | 'cold' | 'active';

export interface OutfitLogRecord {
  id: string;
  user_session_id: string;
  logged_date: string;
  time_slot: '08:00' | '13:00' | '19:00' | 'current';
  location_name: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparent_temperature: number;
  weather_code: number;
  outer_item: string;
  top_item: string;
  bottom_item: string;
  items: string[];
  satisfaction_score: number; // 0 to 10
  condition: ConditionType;
  memo?: string;
  created_at: string;
}
```

---

## 3. 외부 API 연동 규격 & 데이터 파이프라인

### 3.1 Open-Meteo Geocoding API (`/v1/search`)
- **엔드포인트**: `https://geocoding-api.open-meteo.com/v1/search`
- **파라미터**:
  - `name`: 검색어 (UTF-8 인코딩, 예: "서울", "강남", "Tokyo")
  - `count`: 결과 수 (기본 `5`)
  - `language`: `ko` (한국어 지역명 우선 지원)
  - `format`: `json`
- **응답 변환 규칙**:
  `results` 배열에서 `name`, `latitude`, `longitude`, `country`, `admin1`(도/시)를 파싱하여 사용자 친화적인 텍스트(예: "서울, 대한민국", "Busan, South Korea")로 표시.

### 3.2 Open-Meteo Forecast API (`/v1/forecast`)
- **엔드포인트**: `https://api.open-meteo.com/v1/forecast`
- **요청 쿼리 파라미터**:
  ```http
  latitude={lat}&longitude={lon}
  &current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m
  &hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max
  &timezone=auto
  &forecast_days=7
  ```
- **시간대별(08:00, 13:00, 19:00) 파싱 로직**:
  - `hourly.time` 배열에서 오늘 날짜의 `T08:00`, `T13:00`, `T19:00`에 해당하는 인덱스를 추출.
  - 해당 인덱스의 `temperature_2m`, `apparent_temperature`, `weather_code`를 맵핑하여 `Record<'08:00' | '13:00' | '19:00', TimeSlotForecast>` 객체 생성.
  - 당일 과거 시간이 지나간 경우에도 당일 기준 데이터로 복장 피드백 작성이 가능하도록 일별 고정 인덱스 유지.

---

## 4. 비즈니스 로직 및 알고리즘 구현

### 4.1 8단계 기온 구간 추천 매핑 엔진
기온 $T$ (°C) 입력 시 표준 룰셋 카탈로그를 반환하는 순수 함수(Pure Function):

```typescript
export interface RuleStep {
  step: number;
  tempRange: string;
  description: string;
  defaults: {
    outer: string;
    top: string;
    bottom: string;
    items: string[];
  };
  options: {
    outer: string[];
    top: string[];
    bottom: string[];
    items: string[];
  };
}

export function getOutfitRuleByTemperature(temp: number): RuleStep {
  if (temp >= 28) {
    return {
      step: 1,
      tempRange: '28°C 이상',
      description: '한여름 무더위 날씨',
      defaults: { outer: '없음', top: '반팔 티셔츠', bottom: '반바지', items: ['선글라스'] },
      options: {
        outer: ['없음', '얇은 린넨 셔츠'],
        top: ['민소매', '반팔 티셔츠', '린넨 셔츠', '오버핏 반팔'],
        bottom: ['반바지', '린넨 팬츠', '얇은 치마', '숏팬츠'],
        items: ['선글라스', '양산', '휴대용 선풍기', '모자']
      }
    };
  } else if (temp >= 23) {
    return {
      step: 2,
      tempRange: '23°C ~ 27°C',
      description: '초여름 날씨',
      defaults: { outer: '없음', top: '반팔 티셔츠', bottom: '면바지', items: ['모자'] },
      options: {
        outer: ['없음', '얇은 셔츠(걸침용)'],
        top: ['반팔 티셔츠', '얇은 카라티', '블라우스', '7부 티셔츠'],
        bottom: ['면바지', '청바지', '슬랙스', '롱 스커트'],
        items: ['모자', '에코백', '선글라스']
      }
    };
  } else if (temp >= 20) {
    return {
      step: 3,
      tempRange: '20°C ~ 22°C',
      description: '포근하고 따뜻한 날씨',
      defaults: { outer: '얇은 가디건', top: '롱슬리브', bottom: '슬랙스', items: [] },
      options: {
        outer: ['없음', '얇은 가디건', '바람막이', '린넨 자켓'],
        top: ['롱슬리브', '셔츠', '칠부 티셔츠', '얇은 맨투맨'],
        bottom: ['슬랙스', '코튼 팬츠', '데님 팬츠'],
        items: ['가벼운 스니커즈', '시계']
      }
    };
  } else if (temp >= 17) {
    return {
      step: 4,
      tempRange: '17°C ~ 19°C',
      description: '온화하지만 아침저녁 쌀쌀한 환절기',
      defaults: { outer: '가디건', top: '맨투맨', bottom: '슬랙스', items: [] },
      options: {
        outer: ['없음', '가디건', '니트 조끼', '바람막이'],
        top: ['맨투맨', '얇은 니트', '후드티', '옥스포드 셔츠'],
        bottom: ['슬랙스', '데님 팬츠', '치노 팬츠'],
        items: ['머플러(선택)', '스니커즈']
      }
    };
  } else if (temp >= 12) {
    return {
      step: 5,
      tempRange: '12°C ~ 16°C',
      description: '선선한 가을/봄 날씨',
      defaults: { outer: '자켓', top: '니트', bottom: '청바지', items: [] },
      options: {
        outer: ['자켓', '야상', '청자켓', '가죽자켓', '도톰한 가디건'],
        top: ['니트', '맨투맨', '셔츠+조끼', '후드티'],
        bottom: ['청바지', '슬랙스', '면바지'],
        items: ['로퍼', '부츠', '스카프']
      }
    };
  } else if (temp >= 9) {
    return {
      step: 6,
      tempRange: '9°C ~ 11°C',
      description: '쌀쌀하여 보온 외투가 필요한 날씨',
      defaults: { outer: '트렌치코트', top: '도톰한 니트', bottom: '기모바지', items: ['보온 양말'] },
      options: {
        outer: ['트렌치코트', '점퍼', '울 자켓', '가죽자켓'],
        top: ['도톰한 니트', '기모 후드티', '터틀넥 니트'],
        bottom: ['기모바지', '청바지', '골덴 팬츠', '두꺼운 슬랙스'],
        items: ['보온 양말', '머플러']
      }
    };
  } else if (temp >= 5) {
    return {
      step: 7,
      tempRange: '5°C ~ 8°C',
      description: '초겨울 추위',
      defaults: { outer: '울 코트', top: '기모 니트', bottom: '기모 슬랙스', items: ['장갑'] },
      options: {
        outer: ['울 코트', '가죽 코트', '경량 패딩', '무스탕'],
        top: ['기모 니트', '목폴라', '히트텍+셔츠', '두꺼운 스웨터'],
        bottom: ['기모 슬랙스', '두꺼운 데님', '울 팬츠'],
        items: ['장갑', '기모 스타킹', '목도리']
      }
    };
  } else {
    return {
      step: 8,
      tempRange: '4°C 이하',
      description: '혹한기 한파 날씨',
      defaults: { outer: '롱패딩', top: '터틀넥+히트텍', bottom: '융기모 레깅스/데님', items: ['목도리', '장갑', '핫팩'] },
      options: {
        outer: ['롱패딩', '숏패딩', '두꺼운 패딩코트', '헤비 아우터'],
        top: ['터틀넥', '히트텍 필수', '기모 맨투맨', '극세사 내의'],
        bottom: ['방한 바지', '융기모 레깅스/데님', '패딩 팬츠'],
        items: ['목도리', '장갑', '핫팩', '비니', '귀마개']
      }
    };
  }
}
```

### 4.2 지능형 리콜(Intelligent Recall) 알고리즘

지능형 리콜은 **기온 오차 윈도우(±2°C) 필터링**과 **사용자 컨디션 체감온도 보정**을 결합하여 최적의 제언을 도출합니다.

```
                  [현재 기온 T_curr]
                          │
            [사용자 컨디션 오프셋 적용]
            - 감기:   T_eff = T_curr - 2.0°C
            - 피곤:   T_eff = T_curr - 1.0°C
            - 활발:   T_eff = T_curr + 1.5°C
            - 정상:   T_eff = T_curr
                          │
                          ▼
            [검색 기온 범위 윈도우 생성]
            [T_eff - 2.0°C  ~  T_eff + 2.0°C]
                          │
                          ▼
            [Supabase DB 쿼리 실행]
            SELECT * FROM outfit_logs 
            WHERE temperature BETWEEN min_range AND max_range
            ORDER BY created_at DESC LIMIT 20;
                          │
                          ▼
            [만족도 지수 기반 3대 버킷 분류]
            ┌────────────────────────────────────────┐
            │ 1. 추천 조합 (만족도 4 ~ 6점)          │
            │ 2. 추위 주의 (만족도 0 ~ 2점)          │
            │ 3. 더위 주의 (만족도 8 ~ 10점)         │
            └────────────────────────────────────────┘
```

#### 점수 및 메시지 매핑 규칙:
1. **만족도 4 ~ 6점 (추천 조합)**:
   - "이 기온대에서 가장 만족스러웠던 복장입니다: [외투 + 상의 + 하의]"
2. **만족도 0 ~ 2점 (추위 주의)**:
   - "주의: 과거에 이 복장([외투 + 상의])을 입었을 때 '너무 춥다(Score: {score})'고 기록했습니다. 외투를 한 겹 더 추가하세요!"
3. **만족도 8 ~ 10점 (더위 주의)**:
   - "주의: 과거에 이 복장을 입었을 때 '너무 덥다(Score: {score})'고 기록했습니다. 가벼운 이너나 얇은 옷으로 조절하세요!"

---

## 5. 프로젝트 디렉토리 구조 (Next.js 14 App Router)

```
My_clothes/
├── product.md                       # 기획 명세서
├── ui.md                            # UI/UX 및 디자인 시스템 명세서
├── engineering.md                   # 엔지니어링 및 아키텍처 명세서
├── .env.local.example               # 환경변수 템플릿
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx               # 루트 레이아웃 (폰트, 메타데이터, Providers)
│   │   ├── page.tsx                 # 메인 대시보드 페이지 (SSR + Client Shell)
│   │   └── api/
│   │       ├── weather/
│   │       │   └── route.ts         # Open-Meteo Proxy/Cache Route Handler
│   │       └── geocode/
│   │           └── route.ts         # Geocoding Proxy Route Handler
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx           # 위치 표시, 모달 트리거
│   │   ├── weather/
│   │   │   ├── WeatherHero.tsx      # 현재 날씨 / 기온 히어로
│   │   │   ├── TimeSlotTabs.tsx     # 08:00 / 13:00 / 19:00 세그먼트
│   │   │   └── WeeklyForecast.tsx   # 7일 주간 예보 가로 스크롤
│   │   ├── outfit/
│   │   │   ├── OutfitCustomizer.tsx # 8단계 룰셋 칩 선택 컴포넌트
│   │   │   └── IntelligentRecall.tsx# 과거 체감 리콜 카드 3대 분류
│   │   ├── feedback/
│   │   │   └── FeedbackForm.tsx     # 슬라이더(0~10), 컨디션 라디오, 메모
│   │   └── common/
│   │       ├── LocationModal.tsx    # 도시 검색 모달
│   │       └── Toast.tsx            # 피드백 저장 안내 토스트
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase Client
│   │   │   └── server.ts            # Server Supabase Client (Actions/Route용)
│   │   ├── weather/
│   │   │   ├── client.ts            # Open-Meteo fetch 유틸
│   │   │   └── wmoCodes.ts          # WMO 날씨 코드 한국어/아이콘 맵핑
│   │   └── outfit/
│   │       ├── rules.ts             # 8단계 기온 표준 가이드 엔진
│   │       └── recall.ts            # ±2°C 및 컨디션 보정 리콜 알고리즘
│   └── types/
│       ├── weather.ts               # 날씨 관련 인터페이스
│       ├── outfit.ts                # 복장 및 룰셋 인터페이스
│       └── database.ts              # Supabase DB 테이블 스키마 타입
```

---

## 6. 환경 변수 및 보안 구성 (`.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# (선택) Server-side 작업용 Service Role Key (Client 노출 금지)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Base URL (Vercel 배포 시 자동 주입, 로컬 기본값)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 보안 준수 사항:
1. `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저에 노출되므로 반드시 Supabase 대시보드에서 `outfit_logs` 테이블의 **Row Level Security (RLS)**가 활성화되어야 함.
2. Open-Meteo API는 별도의 API Key를 요구하지 않아 안전하며, 클라이언트의 직접 호출로 인한 CORS 또는 Rate Limit 이슈를 방지하기 위해 Next.js Route Handler(`src/app/api/weather/route.ts`)를 경유한 캐시 프록시 권장.

---

## 7. 테스트 전략 & 품질 보증

1. **단위 테스트 (Unit Tests - Vitest / Jest)**:
   - `getOutfitRuleByTemperature(temp)`: 8단계 각 경계값(-5°C, 4°C, 5°C, 8°C, 9°C, 12°C, 17°C, 20°C, 23°C, 28°C, 35°C)에 대해 올바른 룰셋 단계와 기본 아이템이 반환되는지 검증.
   - `calculateRecallRange(temp, condition)`: 감기(-2.0°C), 피곤(-1.0°C), 활동량(+1.5°C) 조건에 따른 체감온도 오프셋 계산 검증.
   - 만족도 점수 분류기(0~2점, 4~6점, 8~10점)의 경계값 테스트.
2. **컴포넌트 인터랙션 테스트 (React Testing Library)**:
   - 08시 탭 클릭 시 08시 기온 기준 룰셋으로 칩 상태가 동기화되는지 확인.
   - 단일 선택 칩(OUTER/TOP/BOTTOM) 클릭 시 이전 선택 해제 및 신규 선택 반영 확인.
   - 다중 선택 칩(ITEM)의 토글 동작 확인.
3. **E2E 및 배포 파이프라인 (Playwright & Vercel)**:
   - Vercel 프리뷰 브랜치 배포 시 자동 빌드(`next build`) 및 린트 검사 통과 여부 검증.
   - 지오로케이션 거부 시 서울 Fallback이 렌더링되는 시나리오 자동 점검.
