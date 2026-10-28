export type UserCondition = '정상' | '피곤' | '감기' | '활동량많음';

export interface OutfitLog {
  id: string;
  created_at: string;
  location_name: string;
  target_temp: number;
  apparent_temp: number;
  time_slot: string; // '08:00' | '13:00' | '19:00' | 'morning' | 'noon' | 'evening'
  selected_outer: string;
  selected_top: string;
  selected_bottom: string;
  selected_items: string[];
  score: number; // 체감 온도 편차: -5°C (매우 추움) ~ 0°C (적정) ~ +5°C (매우 더움)
  condition: UserCondition;
  memo?: string;
}

export type NewOutfitLogInput = Omit<OutfitLog, 'id' | 'created_at'>;

export type RecallCategory = 'recommended' | 'cold_warning' | 'warm_warning';

export interface MatchedRecallRecord {
  log: OutfitLog;
  category: RecallCategory;
  categoryTitle: string;
  categoryBadge: string;
  guidanceMessage: string;
  tempDiff: number; // 현재 기온과의 차이
}
