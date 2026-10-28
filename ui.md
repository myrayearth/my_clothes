# UI/UX Specification: Weather Outfit (컴포넌트 구조 및 스타일 가이드)

## 1. 디자인 시스템 & 스타일 가이드

### 1.1 기술 스택 및 기본 원칙
- **Styling**: Tailwind CSS (유틸리티 퍼스트)
- **Icons**: Lucide React (가독성 높은 24px/20px 스트로크 아이콘)
- **UI 원칙**: 모바일 퍼스트(Mobile-First), 클린 카드 기반 레이아웃(Card-based UI), 부드러운 인터랙션 및 명확한 피드백

### 1.2 컬러 팔레트 & 기온 단계별 테마 컬러
기온 구간에 따라 동적으로 상단 헤더 및 기온 뱃지 색상이 변화하여 직관적인 날씨 체감을 돕습니다.

```
+-------------------------------------------------------------------------+
| 기온 단계       | 구간         | 주 색상 (Tailwind)      | 테마 분위기    |
|----------------|--------------|-------------------------|----------------|
| Step 1 (폭염)   | 28°C 이상    | bg-rose-500, text-rose-600 | 핫 레드       |
| Step 2 (여름)   | 23°C ~ 27°C  | bg-amber-500, text-amber-600 | 웜 오렌지   |
| Step 3 (초여름) | 20°C ~ 22°C  | bg-emerald-500, text-emerald-600 | 프레시 그린 |
| Step 4 (온화)   | 17°C ~ 19°C  | bg-teal-500, text-teal-600   | 틸 민트     |
| Step 5 (선선)   | 12°C ~ 16°C  | bg-sky-500, text-sky-600     | 스카이 블루 |
| Step 6 (쌀쌀)   | 9°C ~ 11°C   | bg-blue-600, text-blue-700   | 딥 블루     |
| Step 7 (초겨울) | 5°C ~ 8°C    | bg-indigo-600, text-indigo-700 | 인디고      |
| Step 8 (한파)   | 4°C 이하     | bg-violet-700, text-violet-800 | 퍼플 프로스트 |
+-------------------------------------------------------------------------+
```

#### 중립 및 시스템 컬러
- **배경 (Background)**: `bg-slate-50` (라이트 모드 기본), 다크 모드 확장 대비 `bg-slate-900`
- **카드/서피스 (Surface)**: `bg-white`, `border border-slate-200/80`, `shadow-sm hover:shadow-md transition-shadow`
- **텍스트 (Typography)**:
  - Heading: `text-slate-900 font-bold`
  - Body: `text-slate-700 font-medium`
  - Caption: `text-slate-400 text-xs`
- **피드백 상태 컬러**:
  - 추천 조합 (쾌적): `emerald-500` (배경 `bg-emerald-50`, 테두리 `border-emerald-200`)
  - 추위 주의: `blue-500` (배경 `bg-blue-50`, 테두리 `border-blue-200`)
  - 더위 주의: `amber-500` (배경 `bg-amber-50`, 테두리 `border-amber-200`)

### 1.3 타이포그래피 계층 (Typography Scale)
- `Display (기온)`: `text-5xl font-black tracking-tight` (예: 18°)
- `H1 (페이지 헤더)`: `text-xl font-bold tracking-tight`
- `H2 (섹션 타이틀)`: `text-base font-semibold text-slate-800 flex items-center gap-2`
- `Body (기본 텍스트)`: `text-sm font-normal text-slate-700 leading-relaxed`
- `Badge/Chip`: `text-xs font-semibold px-2.5 py-1 rounded-full`

---

## 2. 화면 레이아웃 및 뷰 계층 구조

전체 애플리케이션은 사용자가 외출 전 한눈에 스크롤하며 확인할 수 있는 **단일 대시보드(Single Page Responsive Dashboard)** 구조를 취합니다.

```mermaid
flowchart TD
    App[App Container max-w-md / md:max-w-2xl mx-auto]
    
    Header[1. Top Navigation Bar<br/>- 서비스 로고<br/>- 위치 뱃지 & 검색 버튼<br/>- 새로고침 / 히스토리 열기 버튼]
    WeatherHero[2. Weather Hero Section<br/>- 현재 기온 / 체감온도 / 날씨 상태 아이콘<br/>- 당일 최고/최저 기온 및 강수확률]
    TimeTabs[3. Target Time Slot Tabs<br/>- 08:00 (출근) / 13:00 (활동) / 19:00 (퇴근)<br/>- 탭별 기온 및 체감온도 표시]
    RecallSection[4. Intelligent Recall Cards<br/>- 과거 ±2°C 유사 기온 기록 기반<br/>- 추천 조합 / 추위 주의 / 더위 주의]
    OutfitSection[5. Outfit Recommendation & Customizer<br/>- OUTER (단일)<br/>- TOP (단일)<br/>- BOTTOM (단일)<br/>- ITEM (다중 칩)]
    FeedbackSection[6. Feedback & Evaluation Drawer/Card<br/>- 복장 만족도 슬라이더 0~10점<br/>- 컨디션 라디오 선택<br/>- 메모 입력 & 저장 버튼]
    WeeklyForecast[7. Weekly 7-Day Forecast Section<br/>- 일별 미니 예보 가로 스크롤 / 리스트]

    App --> Header
    App --> WeatherHero
    App --> TimeTabs
    App --> RecallSection
    App --> OutfitSection
    App --> FeedbackSection
    App --> WeeklyForecast
```

---

## 3. 핵심 컴포넌트 명세 & 인터페이스 정의

### 3.1 Header & LocationSearchModal
- **역할**: 현재 위치 표시 및 Open-Meteo Geocoding을 통한 지역 검색/선택 모달.
```typescript
interface LocationState {
  name: string;        // 예: "서울시 중구" 또는 "Gangnam-gu"
  latitude: number;    // 37.5665
  longitude: number;   // 126.9780
  isCurrentLocation: boolean;
}

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationState) => void;
}
```
- **UX 요구사항**:
  - 검색창에 텍스트 입력 시 디바운스(300ms) 적용하여 Open-Meteo Geocoding API 호출.
  - 검색 결과 클릭 시 즉시 닫히고 메인 화면 날씨 갱신.
  - "현재 위치로 자동 감지" 버튼 항상 상단 제공.

### 3.2 TimeSlotTabs (08:00 / 13:00 / 19:00)
- **역할**: 사용자가 출퇴근/활동 시간에 맞추어 탭을 원클릭 전환할 수 있는 세그먼트 컨트롤러.
```typescript
type TimeSlot = '08:00' | '13:00' | '19:00';

interface TimeSlotForecast {
  timeSlot: TimeSlot;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  weatherLabel: string;
}

interface TimeSlotTabsProps {
  selectedSlot: TimeSlot;
  slots: Record<TimeSlot, TimeSlotForecast>;
  onSelectSlot: (slot: TimeSlot) => void;
}
```
- **인터랙션**:
  - 탭 활성화 시 슬라이딩 인디케이터 애니메이션(`transition-all duration-200`).
  - 활성 탭 하단에 해당 시간대의 기온과 체감온도(예: `14°C (체감 12°C)`) 강조 표시.

### 3.3 IntelligentRecallCard (지능형 리콜 알림)
- **역할**: 사용자의 과거 피드백 중 현재 기온(±2°C) 및 컨디션과 부합하는 기록을 요약하여 의사결정을 도움.
```typescript
type RecallType = 'recommended' | 'cold_warning' | 'warm_warning';

interface RecallItem {
  id: string;
  type: RecallType;
  date: string;
  temperature: number;
  recordedCondition: string;
  satisfactionScore: number;
  outfit: {
    outer: string;
    top: string;
    bottom: string;
    items: string[];
  };
  memo?: string;
}

interface IntelligentRecallCardProps {
  recalls: RecallItem[];
  onApplyOutfit: (outfit: RecallItem['outfit']) => void; // "이 조합 그대로 입기" 버튼
}
```
- **디자인 표현**:
  - **추천 조합 (만족도 4~6점)**: `bg-emerald-50 text-emerald-900 border-emerald-200` + `CheckCircle2` 아이콘.
  - **추위 주의 (만족도 0~2점)**: `bg-blue-50 text-blue-900 border-blue-200` + `Snowflake` / `AlertCircle` 아이콘.
  - **더위 주의 (만족도 8~10점)**: `bg-amber-50 text-amber-900 border-amber-200` + `Flame` / `AlertTriangle` 아이콘.
  - "이 조합 적용" 액션 버튼을 두어 원클릭으로 칩 선택에 반영 가능.

### 3.4 OutfitCustomizer (복장 추천 및 인터랙티브 칩)
- **역할**: 8단계 룰셋에 의해 자동 제안된 조합을 보여주고, 사용자가 직접 옷장 사정에 맞게 칩을 눌러 변경.
```typescript
interface OutfitSelection {
  outer: string;         // '없음' 포함 단일 선택
  top: string;           // 단일 선택
  bottom: string;        // 단일 선택
  items: string[];       // 다중 선택 가능
}

interface OutfitCustomizerProps {
  ruleStep: number;      // 1 ~ 8단계
  stepName: string;      // 예: "5단계 (12°C ~ 16°C: 선선한 환절기 날씨)"
  selection: OutfitSelection;
  availableOptions: {
    outer: string[];
    top: string[];
    bottom: string[];
    item: string[];
  };
  onChangeSelection: (newSelection: OutfitSelection) => void;
}
```
- **칩 인터랙션 가이드**:
  - `OUTER`, `TOP`, `BOTTOM`: 선택된 칩은 `bg-slate-900 text-white font-semibold`, 미선택 칩은 `bg-slate-100 text-slate-700 hover:bg-slate-200`. 다른 칩 클릭 시 즉시 교체(Single Selection).
  - `ITEM`: 토글식 다중 선택(Multi Selection). 선택 시 `bg-indigo-600 text-white`, 미선택 시 `bg-slate-100 text-slate-700`.

### 3.5 FeedbackSection (체감 평가 및 피드백)
- **역할**: 착용 만족도 지수, 개인 컨디션, 메모를 입력받아 Supabase에 저장.
```typescript
type ConditionType = 'normal' | 'tired' | 'cold' | 'active';

interface FeedbackFormData {
  satisfaction: number;    // 0 ~ 10 (기본값 5)
  condition: ConditionType;
  memo: string;
}

interface FeedbackSectionProps {
  currentTemp: number;
  currentSlot: TimeSlot;
  currentOutfit: OutfitSelection;
  onSubmit: (data: FeedbackFormData) => Promise<boolean>;
  isSubmitting: boolean;
}
```
- **슬라이더 인터랙션 (0 ~ 10점)**:
  - `0`: "너무 추움 🥶" (Blue)
  - `5`: "딱 좋음 / 최적 ✨" (Green)
  - `10`: "너무 더움 🥵" (Red)
  - 슬라이더 Thumb 이동 시 점수와 감정 라벨이 상단 툴팁/텍스트로 실시간 변경.
- **컨디션 라디오 버튼**:
  - 버튼형 라디오 그룹 (정상 🟢 / 피곤 🥱 / 감기 🤒 / 활동량많음 🏃)

---

## 4. UI 상태 관리 및 사용자 피드백 패턴

1. **로딩 상태 (Skeleton Loaders)**:
   - 날씨 API 통신 중에는 텍스트와 칩 영역에 `animate-pulse bg-slate-200 rounded` 형태의 스켈레톤을 노출하여 Layout Shift 방지.
2. **에러 및 안내 상태**:
   - Geolocation 차단 시: 상단 헤더 위치 옆에 ⚠️ 아이콘과 함께 "위치 권한 필요 (기본: 서울)" 툴팁 노출.
   - 리콜 데이터 부재 시: "아직 이 기온대(±2°C)의 기록이 없습니다. 오늘의 체감을 첫 번째로 기록해보세요!" 안내 카드.
3. **토스트 알림 (Toast Notifications)**:
   - 피드백 저장 성공 시: "체감 피드백이 저장되었습니다! 다음 추천에 반영됩니다." 토스트 2.5초 노출.
   - 저장 실패 시 에러 사유 인라인 표시.
