# Weather Outfit 배포 가이드 (Vercel & Supabase)

본 문서는 **Weather Outfit** 웹 서비스를 **Supabase (PostgreSQL Database)**와 **Vercel (Next.js 호스팅 플랫폼)**에 성공적으로 배포하고 프로덕션 환경을 구성하기 위한 A-to-Z 실무 가이드입니다.

---

## 1. 사전 준비 사항
- [GitHub](https://github.com/) 계정 및 프로젝트 리포지토리
- [Supabase](https://supabase.com/) 계정 (무료 티어 지원)
- [Vercel](https://vercel.com/) 계정 (GitHub 계정 연동 권장)

---

## 2. [1단계] Supabase 프로젝트 생성 및 DB 스키마 구축

### 2.1 Supabase 신규 프로젝트 생성
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인합니다.
2. **`New project`** 버튼을 클릭합니다.
3. 프로젝트 정보를 입력합니다:
   - **Name**: `weather-outfit`
   - **Database Password**: 안전한 비밀번호 생성 및 보관
   - **Region**: `Northeast (Seoul)` 선택 (한국 사용자 대상 최적의 레이턴시 제공)
   - **Pricing Plan**: `Free` 선택
4. **`Create new project`**를 클릭하고 데이터베이스 프로비저닝이 완료될 때까지 약 1~2분 대기합니다.

### 2.2 SQL 마이그레이션 스키마 실행
1. 좌측 사이드바에서 **`SQL Editor`** (터미널 아이콘)를 클릭합니다.
2. **`New query`**를 누릅니다.
3. 프로젝트 내 [`supabase/schema.sql`](file:///c:/Users/Administrator/Documents/Antigravity/My_clothes/supabase/schema.sql) 파일의 내용을 그대로 복사하여 붙여넣습니다:

```sql
-- outfit_logs 테이블 생성 및 RLS 정책
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.outfit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    location_name TEXT NOT NULL,
    target_temp NUMERIC(4, 1) NOT NULL,
    apparent_temp NUMERIC(4, 1) NOT NULL,
    time_slot TEXT NOT NULL,
    selected_outer TEXT NOT NULL DEFAULT '없음',
    selected_top TEXT NOT NULL,
    selected_bottom TEXT NOT NULL,
    selected_items TEXT[] DEFAULT ARRAY[]::TEXT[],
    score INT NOT NULL CHECK (score BETWEEN 0 AND 10),
    condition TEXT NOT NULL DEFAULT '정상',
    memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_outfit_logs_target_temp ON public.outfit_logs (target_temp);
CREATE INDEX IF NOT EXISTS idx_outfit_logs_created_at ON public.outfit_logs (created_at DESC);

ALTER TABLE public.outfit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to outfit_logs"
ON public.outfit_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert to outfit_logs"
ON public.outfit_logs FOR INSERT WITH CHECK (true);
```

4. 우측 하단의 **`Run`** (또는 `Ctrl + Enter`) 버튼을 클릭하여 스키마를 생성합니다.
5. `Success. No rows returned` 메시지가 나오면 정상 완료된 것입니다.
6. 좌측 메뉴의 **`Table Editor`**에서 `outfit_logs` 테이블이 올바르게 생성되었는지 확인합니다.

---

## 3. [2단계] Supabase API Keys 취득

1. Supabase 좌측 하단 톱니바퀴 아이콘인 **`Project Settings`**을 클릭합니다.
2. 좌측 서브메뉴에서 **`API`**를 선택합니다.
3. 다음 두 개의 값을 복사하여 안전한 곳에 기록해 둡니다:
   - **Project URL**: 예: `https://xyzcompany.supabase.co`
   - **Project API Keys** 중 **`anon` / `public`** 키 (클라이언트 안전 키)

> [!IMPORTANT]
> `service_role` (secret) 키는 브라우저에 절대로 노출되어서는 안 되며, 오직 `anon` 공개 키만 프론트엔드 환경변수로 사용해야 합니다.

---

## 4. [3단계] GitHub 리포지토리 푸시

로컬 코드를 본인의 GitHub 저장소에 푸시합니다:

```bash
# Git 초기화 (미수행 상태인 경우)
git init
git add .
git commit -m "feat: complete weather outfit web service"

# 원격 저장소 연결 및 푸시
git branch -M main
git remote add origin https://github.com/<your-username>/weather-outfit.git
git push -u origin main
```

---

## 5. [4단계] Vercel 연동 및 환경 변수 (Environment Variables) 설정

### 5.1 Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인합니다.
2. **`Add New...`** -> **`Project`**를 클릭합니다.
3. GitHub 계정에서 방금 푸시한 `weather-outfit` 리포지토리를 찾아 **`Import`**를 클릭합니다.

### 5.2 프로젝트 구성 및 환경 변수 입력
1. **Framework Preset**: `Next.js` (자동 감지됨)
2. **Root Directory**: `./` (기본값 유지)
3. **Build and Output Settings**: 기본값 유지 (`npm run build`)
4. **Environment Variables** 아코디언 메뉴를 열고 아래 세 가지 환경 변수를 추가합니다:

| KEY | VALUE 예시 | 설명 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | 3단계에서 취득한 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | 3단계에서 취득한 `anon` public key |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Vercel 기본 부여 도메인 또는 커스텀 도메인 |

5. 하단의 **`Deploy`** 버튼을 클릭합니다.

---

## 6. [5단계] 배포 완료 확인 및 모바일 환경 검증

약 1~2분의 빌드가 완료되면 Vercel에서 제공하는 프로덕션 URL(예: `https://weather-outfit.vercel.app`)이 발급됩니다.

### 최종 검증 체크리스트
- [x] **위치 권한 자동 감지**: 첫 접속 시 브라우저 Geolocation 팝업 허용 시 현재 위치 반영 확인
- [x] **도시 검색 기능**: 상단 검색창에 "부산", "제주", "강남" 입력 시 자동완성 드롭다운 표시 및 좌표 이동 확인
- [x] **08시 / 13시 / 19시 탭 전환**: 시간대별 기온과 8단계 표준 복장 자동 동기화 확인
- [x] **복장 칩 커스텀**: 외투/상의/하의 단일 선택 및 소품 다중 선택 토글 동작 확인
- [x] **지능형 리콜 카드**: 현재 기온(±2°C) 범위의 과거 기록이 추천/주의 카드로 상단에 표출되는지 확인
- [x] **체감 평가 피드백 저장**: 슬라이더(0~10) 및 컨디션(정상/감기 등) 선택 후 저장 시 Supabase DB 또는 LocalStorage에 즉시 영속화 확인
- [x] **모바일 뷰포트(375px~430px)**: iPhone SE / 14 / 15, Galaxy S 시리즈 화면에서 가로 스크롤 깨짐 없이 최소 44px 이상 터치 영역 확보 확인

---

## 7. 트러블슈팅 및 장애 복구 (Fallback 가이드)

### Q1. Supabase 환경변수를 입력하지 않았거나 일시적으로 DB가 다운된 경우는?
- **내장된 무중단 LocalStorage Fallback**:
  본 서비스는 Supabase 연결이 불가능할 경우 즉시 브라우저의 `localStorage`로 전환되어 복장 평가를 저장하고 과거 기록을 매칭합니다. 사용자는 데이터 유실이나 런타임 오류 없이 동일한 지능형 리콜 경험을 유지할 수 있습니다.

### Q2. Open-Meteo API 호출 제한이 있나요?
- Open-Meteo는 무료 비상업/상업 오픈 API이며 API Key가 필요하지 않습니다.
- 프론트엔드 및 서버단에 30분(`revalidate: 1800`) 캐시가 기본 적용되어 있어 불필요한 중복 호출을 원천 차단합니다.
