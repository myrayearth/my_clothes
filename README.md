# 🌤️ Ondo Fit (Weather Outfit)

> **날씨 기반 맞춤 복장 추천 및 체감 피드백 웹 서비스**  
> 기상청 및 글로벌 기상 데이터(Open-Meteo)를 활용해 시간대별 표준 복장을 추천하고, 사용자의 체감 만족도 피드백을 축적하여 기온 및 컨디션에 맞춘 **'지능형 복장 리콜(Intelligent Recall)'** 기능을 제공합니다.

---

## 🚀 로컬 환경 실행 가이드 (Quick Start)

### 1. 사전 요구사항
- **Node.js**: `18.18.0` 이상 (Node.js 20.x 또는 24.x 권장)
- **패키지 매니저**: `npm` (또는 `pnpm`, `yarn`)
- **Git**

### 2. 저장소 클론 (폴더명: `Ondofit`)
터미널을 열고 다음 명령어를 실행하여 `Ondofit` 폴더로 프로젝트를 내려받습니다:

```bash
# 1. 저장소 클론 (Ondofit 폴더로 생성)
git clone https://github.com/myrayearth/my_clothes.git Ondofit

# 2. 프로젝트 폴더로 이동
cd Ondofit
```

### 3. 패키지 의존성 설치
```bash
npm install
```

### 4. 환경 변수 설정 (`.env.local`)
프로젝트 루트에 `.env.local` 파일을 생성합니다.

```bash
# 템플릿 복사
cp .env.local.example .env.local
```

`.env.local` 내용:
```env
# Supabase 연동 정보 (미입력 시 내장 LocalStorage 모드로 100% 정상 동작)
NEXT_PUBLIC_SUPABASE_URL=https://fnrbqceinbksdfasdqvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucmJxY2VpbmJrc2RmYXNkcXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNDAzNDAsImV4cCI6MjEwODcxNjM0MH0.3e78J3L7GTK-ACSkoYj6NYYnJ0xmYH5O-gUPob2nXZM

# 로컬 개발 서버 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!NOTE]
> **무중단 LocalStorage Fallback**:
> Supabase 연결 없이도 브라우저의 `localStorage`를 통해 평가 저장, 복장 선택, 지능형 리콜 기능이 로컬에서 완벽하게 작동합니다.

### 5. 로컬 개발 서버 실행
```bash
npm run dev
```

브라우저에서 **[http://localhost:3000](http://localhost:3000)**에 접속하여 서비스를 확인합니다.

---

## 🛠️ 주요 스크립트 (CLI Commands)

| 명령어 | 설명 |
| :--- | :--- |
| `npm run dev` | 로컬 개발 서버 구동 (기본 포트: 3000) |
| `npm run build` | 프로덕션 빌드 및 TypeScript 정적 타입 검증 |
| `npm run start` | 빌드된 프로덕션 서버 실행 |
| `npm run lint` | Next.js ESLint 정적 분석 검사 |

---

## 📁 프로젝트 구조

```
Ondofit/
├── src/
│   ├── app/                      # Next.js App Router 페이지 및 API 라우트
│   │   ├── page.tsx              # 메인 대시보드 화면
│   │   ├── evaluations/          # 내 복장 평가 히스토리 관리
│   │   └── admin/                # 관리자 통계 및 전체 평가 관리
│   ├── components/               # React 컴포넌트
│   │   ├── weather/              # 날씨 개요, 시간대별 탭, 주간 예보, 체감 게이지
│   │   ├── outfit/               # 복장 카탈로그 모달, 평가 수정 모달
│   │   ├── layout/               # 위치 탐색바, 네비게이션
│   │   ├── profile/              # 다중 사용자 프로필 모달
│   │   └── OutfitSelector.tsx    # 핵심 복장 칩 선택 컴포넌트
│   ├── lib/                      # 비즈니스 로직 및 유틸리티
│   │   ├── weather.ts            # Open-Meteo 기상청 데이터 파이프라인
│   │   ├── recommendation.ts     # 기온별 8단계 추천 룰셋 매핑
│   │   ├── insulation.ts         # 보온 점수 계산 및 칩 스타일 엔진
│   │   ├── matcher.ts            # 과거 데이터 매칭 지능형 리콜 엔진
│   │   └── storage.ts            # Supabase & LocalStorage 하이브리드 스토리지
│   ├── data/                     # 기온별 표준 룰셋(JSON) 및 아이템 점수표
│   └── types/                    # TypeScript 전역 타입 정의
├── supabase/                     # Supabase SQL 스키마 마이그레이션 파일
├── CHANGELOG.md                  # 릴리즈 버전 히스토리
├── DEPLOYMENT.md                 # Vercel & Supabase 실무 배포 가이드
└── package.json
```

---

## 🌟 핵심 기술 스택
- **Framework**: Next.js 14 (App Router), React 18
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL), Kakao OAuth, LocalStorage
- **External API**: Open-Meteo Weather & Geocoding API (Keyless, Free)
- **Icons**: Lucide React
