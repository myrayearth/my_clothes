import { createClient } from '@supabase/supabase-js';
import { OutfitLog, NewOutfitLogInput } from '@/types/database';

const LOCAL_STORAGE_KEY = 'weather_outfit_logs_local_v2'; // 스키마 변경에 맞추어 키 버전 업그레이드

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('dummy') &&
    !supabaseAnonKey.includes('dummy') &&
    supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * 초기 모의 데이터 (Seed Data)
 * score 단위: -5°C (매우 추움) ~ 0°C (적정) ~ +5°C (매우 더움)
 */
const DEFAULT_SEED_LOGS: OutfitLog[] = [
  {
    id: 'seed-1',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    location_name: '서울특별시, 대한민국',
    target_temp: 15,
    apparent_temp: 14,
    time_slot: '13:00',
    selected_outer: '자켓',
    selected_top: '니트',
    selected_bottom: '청바지',
    selected_items: ['로퍼'],
    score: 0, // 0°C = 적정 (추천 조합)
    condition: '정상',
    memo: '낮 햇살 아래서 걷기에 체감이 딱 맞고 아주 쾌적했음!',
  },
  {
    id: 'seed-2',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    location_name: '서울특별시, 대한민국',
    target_temp: 14,
    apparent_temp: 12,
    time_slot: '08:00',
    selected_outer: '없음',
    selected_top: '맨투맨',
    selected_bottom: '슬랙스',
    selected_items: [],
    score: -4, // -4°C = 꽤 추움 (추위 주의)
    condition: '피곤',
    memo: '아침 바람 부는데 겉옷 없이 나갔다가 4도 이상 춥게 느껴짐 ㅠㅠ',
  },
  {
    id: 'seed-3',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location_name: '서울특별시, 대한민국',
    target_temp: 16,
    apparent_temp: 17,
    time_slot: '13:00',
    selected_outer: '두꺼운 코트',
    selected_top: '기모 니트',
    selected_bottom: '청바지',
    selected_items: ['머플러'],
    score: 4, // +4°C = 꽤 더움 (더위 주의)
    condition: '활동량많음',
    memo: '지하철 타고 이동하는데 체감이 4도 이상 더워서 코트 벗고 다님',
  },
  {
    id: 'seed-4',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    location_name: '서울특별시, 대한민국',
    target_temp: 11,
    apparent_temp: 9,
    time_slot: '19:00',
    selected_outer: '트렌치코트',
    selected_top: '도톰한 니트',
    selected_bottom: '기모바지',
    selected_items: ['보온 양말'],
    score: 0, // 0°C = 적정 (추천 조합)
    condition: '정상',
    memo: '퇴근길 찬바람 막아줘서 체감 편차 없이 딱 좋았음',
  },
  {
    id: 'seed-5',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    location_name: '서울특별시, 대한민국',
    target_temp: 10,
    apparent_temp: 8,
    time_slot: '08:00',
    selected_outer: '가디건',
    selected_top: '셔츠',
    selected_bottom: '면바지',
    selected_items: [],
    score: -5, // -5°C = 매우 추움 (추위 주의)
    condition: '감기',
    memo: '감기 기운 있었는데 가디건만 입어서 5도 이상 극심한 오한 듬',
  },
];

function getLocalLogs(): OutfitLog[] {
  if (typeof window === 'undefined') return DEFAULT_SEED_LOGS;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_LOGS));
      return DEFAULT_SEED_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SEED_LOGS;
  } catch (e) {
    console.error('Failed to parse local logs:', e);
    return DEFAULT_SEED_LOGS;
  }
}

function saveLocalLog(newLog: OutfitLog): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getLocalLogs();
    const updated = [newLog, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save log to localStorage:', e);
  }
}

export async function fetchAllOutfitLogs(): Promise<OutfitLog[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('outfit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as OutfitLog[];
      }
      if (error) {
        console.warn('Supabase fetch failed, falling back to LocalStorage:', error.message);
      }
    } catch (e) {
      console.warn('Supabase query error, fallback to LocalStorage:', e);
    }
  }

  return getLocalLogs();
}

export async function createOutfitLog(input: NewOutfitLogInput): Promise<{
  success: boolean;
  savedLog: OutfitLog;
  isFallback: boolean;
}> {
  const generatedId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const logToSave: OutfitLog = {
    ...input,
    id: generatedId,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('outfit_logs')
        .insert([
          {
            location_name: input.location_name,
            target_temp: input.target_temp,
            apparent_temp: input.apparent_temp,
            time_slot: input.time_slot,
            selected_outer: input.selected_outer,
            selected_top: input.selected_top,
            selected_bottom: input.selected_bottom,
            selected_items: input.selected_items,
            score: input.score,
            condition: input.condition,
            memo: input.memo,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        saveLocalLog(data as OutfitLog);
        return { success: true, savedLog: data as OutfitLog, isFallback: false };
      }
      console.warn('Supabase insert failed, fallback to LocalStorage:', error?.message);
    } catch (e) {
      console.warn('Supabase insert exception, fallback to LocalStorage:', e);
    }
  }

  saveLocalLog(logToSave);
  return { success: true, savedLog: logToSave, isFallback: true };
}
