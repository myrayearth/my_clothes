export type UserCondition = '정상' | '피곤' | '감기' | '활동량많음';

export type UserRole = 'admin' | 'user';

export type UserGender = 'male' | 'female';

export interface UserProfile {
  id: string;
  name: string;
  created_at: string;
  avatar_url?: string | null;
  email?: string | null;
  role?: UserRole | null;
  gender?: UserGender | null;
}

export interface OutfitLog {
  id: string;
  created_at: string;
  user_name: string; // 사용자 프로필명
  location_name: string;
  target_temp: number;
  apparent_temp: number;
  time_slot: string; // 'current' | '08:00' | '13:00' | '19:00'
  selected_outer: string;
  selected_top: string[]; // 다중 선택 (레이어드 지원)
  selected_bottom: string[]; // 다중 선택
  selected_items: string[];
  score: number; // 체감 온도 편차: -5°C ~ 0°C ~ +5°C
  condition: UserCondition;
  memo?: string;
  gender?: UserGender;
  total_insulation_score?: number; // 의류 보온 수치 점수 (Insulation Score)
  calculated_cover_temp?: number; // 환산된 복장 적정 커버 기온 (°C)
}

export type NewOutfitLogInput = Omit<OutfitLog, 'id' | 'created_at'>;

export type RecallCategory = 'recommended' | 'cold_warning' | 'warm_warning';

export interface MatchedRecallRecord {
  log: OutfitLog;
  category: RecallCategory;
  categoryTitle: string;
  categoryBadge: string;
  guidanceMessage: string;
  tempDiff: number;
}

/**
 * 온도별 평가 데이터 관리 모델 (RBAC - Admin 전용 관리 테이블)
 */
export interface TemperatureEvaluation {
  id: string;
  created_at: string;
  user_id?: string | null;
  user_name: string;
  location_name: string;
  target_temp: number;
  apparent_temp: number;
  time_slot: string;
  selected_outer: string;
  selected_top: string[];
  selected_bottom: string[];
  selected_items: string[];
  score: number;
  condition: UserCondition;
  memo?: string | null;
  gender?: UserGender;
  total_insulation_score?: number;
  calculated_cover_temp?: number;
}

export type NewTemperatureEvaluationInput = Omit<TemperatureEvaluation, 'id' | 'created_at'>;
