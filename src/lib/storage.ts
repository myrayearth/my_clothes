import { createClient } from '@supabase/supabase-js';
import { OutfitLog, NewOutfitLogInput, UserProfile, TemperatureEvaluation, NewTemperatureEvaluationInput } from '@/types/database';

const LOCAL_LOGS_KEY = 'weather_outfit_logs_v3';
const LOCAL_PROFILES_KEY = 'weather_outfit_profiles_v1';
const ACTIVE_USER_KEY = 'weather_outfit_active_user';
const ACTIVE_USER_ID_KEY = 'weather_outfit_active_user_id';

const defaultSupabaseUrl = 'https://fnrbqceinbksdfasdqvp.supabase.co';
const defaultSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucmJxY2VpbmJrc2RmYXNkcXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNDAzNDAsImV4cCI6MjEwODcxNjM0MH0.3e78J3L7GTK-ACSkoYj6NYYnJ0xmYH5O-gUPob2nXZM';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 이전 미활성화 프로젝트(pcrtjucvkxnpfzhkluje) 또는 누락 시 카카오 설정이 활성화된 현재 Supabase 프로젝트로 안전 보정
const supabaseUrl =
  !rawUrl || rawUrl.includes('pcrtjucvkxnpfzhkluje') || rawUrl.includes('dummy')
    ? defaultSupabaseUrl
    : rawUrl;

const supabaseAnonKey =
  !rawKey || rawKey.includes('dummy') || (rawUrl && rawUrl.includes('pcrtjucvkxnpfzhkluje'))
    ? defaultSupabaseAnonKey
    : rawKey;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * 기본 시드 사용자 목록
 */
const DEFAULT_SEED_PROFILES: UserProfile[] = [
  {
    id: 'user-default-1',
    name: '기본 사용자',
    created_at: new Date().toISOString(),
  },
];

/**
 * 초기 모의 복장 데이터 (Seed Data)
 */
const DEFAULT_SEED_LOGS: OutfitLog[] = [
  {
    id: 'seed-1',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: '기본 사용자',
    location_name: '서울특별시, 대한민국',
    target_temp: 15,
    apparent_temp: 14,
    time_slot: '13:00',
    selected_outer: '자켓',
    selected_top: ['니트'],
    selected_bottom: ['청바지'],
    selected_items: ['로퍼'],
    score: 0,
    condition: '정상',
    memo: '낮 햇살 아래서 걷기에 체감이 딱 맞고 아주 쾌적했음!',
  },
  {
    id: 'seed-2',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: '기본 사용자',
    location_name: '서울특별시, 대한민국',
    target_temp: 14,
    apparent_temp: 12,
    time_slot: '08:00',
    selected_outer: '없음',
    selected_top: ['맨투맨'],
    selected_bottom: ['슬랙스'],
    selected_items: [],
    score: -4,
    condition: '피곤',
    memo: '아침 바람 부는데 겉옷 없이 나갔다가 4도 이상 춥게 느껴짐 ㅠㅠ',
  },
  {
    id: 'seed-3',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: '기본 사용자',
    location_name: '서울특별시, 대한민국',
    target_temp: 16,
    apparent_temp: 17,
    time_slot: '13:00',
    selected_outer: '두꺼운 코트',
    selected_top: ['기모 니트'],
    selected_bottom: ['청바지'],
    selected_items: ['머플러'],
    score: 4,
    condition: '활동량많음',
    memo: '지하철 타고 이동하는데 체감이 4도 이상 더워서 코트 벗고 다님',
  },
  {
    id: 'seed-4',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: '기본 사용자',
    location_name: '서울특별시, 대한민국',
    target_temp: 11,
    apparent_temp: 9,
    time_slot: '19:00',
    selected_outer: '트렌치코트',
    selected_top: ['도톰한 니트'],
    selected_bottom: ['기모바지'],
    selected_items: ['보온 양말'],
    score: 0,
    condition: '정상',
    memo: '퇴근길 찬바람 막아줘서 체감 편차 없이 딱 좋았음',
  },
  {
    id: 'seed-5',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: '기본 사용자',
    location_name: '서울특별시, 대한민국',
    target_temp: 10,
    apparent_temp: 8,
    time_slot: '08:00',
    selected_outer: '가디건',
    selected_top: ['셔츠'],
    selected_bottom: ['면바지'],
    selected_items: [],
    score: -5,
    condition: '감기',
    memo: '감기 기운 있었는데 가디건만 입어서 5도 이상 극심한 오한 듬',
  },
];

// ========================
// 프로필 관리 (Profiles)
// ========================

export function getLocalProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return DEFAULT_SEED_PROFILES;
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(DEFAULT_SEED_PROFILES));
      return DEFAULT_SEED_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_PROFILES;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const profiles = getLocalProfiles();
    if (!profiles.some((p) => p.name === profile.name)) {
      const updated = [...profiles, profile];
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to save profile to localStorage:', e);
  }
}

function updateLocalProfileName(id: string, oldName: string, newName: string) {
  if (typeof window === 'undefined') return;
  try {
    const profiles = getLocalProfiles().map((p) =>
      p.id === id || p.name === oldName ? { ...p, name: newName } : p
    );
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));

    const currentActive = getSavedActiveUser();
    if (currentActive === oldName) {
      saveActiveUser(newName);
    }

    const rawLogs = localStorage.getItem(LOCAL_LOGS_KEY);
    if (rawLogs) {
      const logs: OutfitLog[] = JSON.parse(rawLogs);
      const updatedLogs = logs.map((log) =>
        log.user_name === oldName ? { ...log, user_name: newName } : log
      );
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updatedLogs));
    }
  } catch (e) {
    console.warn('Failed to update local profile name:', e);
  }
}

function deleteLocalProfile(id: string, name: string) {
  if (typeof window === 'undefined') return;
  try {
    const profiles = getLocalProfiles().filter(
      (p) => p.id !== id && p.name !== name
    );
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));

    const rawLogs = localStorage.getItem(LOCAL_LOGS_KEY);
    if (rawLogs) {
      const logs: OutfitLog[] = JSON.parse(rawLogs);
      const filtered = logs.filter((log) => log.user_name !== name);
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Failed to delete local profile:', e);
  }
}

/**
 * 모든 브라우저 및 기기 간 실시간 사용자 목록 동기화
 * (Supabase DB를 최우선 조회하며, 응답 시 LocalStorage에도 동기화)
 */
export async function fetchProfiles(): Promise<UserProfile[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        if (data.length === 0) {
          const seed = await createProfile('기본 사용자');
          return [seed];
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(data));
        }
        return data as UserProfile[];
      }
      if (error) {
        console.error('Supabase fetch profiles error:', error);
      }
    } catch (e) {
      console.warn('Supabase fetch profiles failed, using LocalStorage:', e);
    }
  }
  return getLocalProfiles();
}

/**
 * 신규 사용자 프로필 생성 (Supabase DB INSERT 최우선)
 */
export async function createProfile(name: string): Promise<UserProfile> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('사용자 이름을 입력해주세요.');
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ name: trimmed }])
        .select()
        .single();

      if (!error && data) {
        saveLocalProfile(data as UserProfile);
        return data as UserProfile;
      }
      if (error) {
        console.error('Supabase insert profile error:', error.message);
        throw new Error(
          error.code === '23505'
            ? '이미 존재하는 사용자 이름입니다.'
            : `사용자 생성 실패: ${error.message}`
        );
      }
    } catch (e: any) {
      console.warn('Supabase insert profile error:', e);
      throw e;
    }
  }

  const newProfile: UserProfile = {
    id: `user-${Date.now()}`,
    name: trimmed,
    created_at: new Date().toISOString(),
  };
  saveLocalProfile(newProfile);
  return newProfile;
}

/**
 * 사용자 이름 변경 (profiles 테이블 및 outfit_logs 연쇄 업데이트)
 */
export async function updateProfile(
  id: string,
  oldName: string,
  newName: string
): Promise<UserProfile> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error('변경할 사용자 이름을 입력해주세요.');
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: trimmed })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update profile error:', error);
        throw new Error(
          error.code === '23505'
            ? '이미 존재하는 사용자 이름입니다.'
            : `사용자 이름 변경 실패: ${error.message}`
        );
      }

      // 과거 복장 기록의 user_name도 연쇄 업데이트
      await supabase
        .from('outfit_logs')
        .update({ user_name: trimmed })
        .eq('user_name', oldName);

      updateLocalProfileName(id, oldName, trimmed);
      return data as UserProfile;
    } catch (e: any) {
      console.warn('Supabase update profile error:', e);
      throw e;
    }
  }

  updateLocalProfileName(id, oldName, trimmed);
  return {
    id,
    name: trimmed,
    created_at: new Date().toISOString(),
  };
}

/**
 * 사용자 프로필 삭제 (profiles 테이블 및 관련 기록 삭제)
 */
export async function deleteProfile(id: string, name: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete profile error:', error);
        throw new Error(`사용자 삭제 실패: ${error.message}`);
      }

      await supabase
        .from('outfit_logs')
        .delete()
        .eq('user_name', name);
    } catch (e: any) {
      console.warn('Supabase delete profile error:', e);
      throw e;
    }
  }

  deleteLocalProfile(id, name);
}

export function getSavedActiveUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function getSavedActiveUser(): string {
  if (typeof window === 'undefined') return '기본 사용자';
  try {
    return localStorage.getItem(ACTIVE_USER_KEY) || '기본 사용자';
  } catch {
    return '기본 사용자';
  }
}

export function saveActiveUser(user: { id?: string; name: string } | string): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof user === 'string') {
      localStorage.setItem(ACTIVE_USER_KEY, user);
    } else {
      localStorage.setItem(ACTIVE_USER_KEY, user.name);
      if (user.id) {
        localStorage.setItem(ACTIVE_USER_ID_KEY, user.id);
      }
    }
  } catch (e) {
    console.warn('Failed to save active user:', e);
  }
}

// ========================
// 복장 로그 관리 (Outfit Logs)
// ========================

function getLocalLogs(): OutfitLog[] {
  if (typeof window === 'undefined') return DEFAULT_SEED_LOGS;
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(DEFAULT_SEED_LOGS));
      return DEFAULT_SEED_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_LOGS;
  }
}

function saveLocalLog(newLog: OutfitLog): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalLogs();
    const updated = [newLog, ...existing];
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save log to localStorage:', e);
  }
}

export function removeLocalLog(
  id: string,
  target?: Partial<TemperatureEvaluation | OutfitLog> | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    if (!raw) return;
    const logs: OutfitLog[] = JSON.parse(raw);
    const filtered = logs.filter((l) => {
      if (l.id === id) return false;
      if (target) {
        if (
          target.user_name &&
          l.user_name === target.user_name &&
          target.target_temp !== undefined &&
          Number(l.target_temp) === Number(target.target_temp) &&
          target.score !== undefined &&
          Number(l.score) === Number(target.score) &&
          (!target.time_slot || l.time_slot === target.time_slot)
        ) {
          return false;
        }
      }
      return true;
    });
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('removeLocalLog error:', e);
  }
}

/**
 * 모든 복장 로그 가져오기 (특정 사용자 필터링 지원)
 */
export async function fetchAllOutfitLogs(userName?: string): Promise<OutfitLog[]> {
  if (supabase) {
    try {
      let query = supabase.from('outfit_logs').select('*');
      if (userName) {
        query = query.eq('user_name', userName);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        return data as OutfitLog[];
      }
      if (error) {
        console.warn('Supabase fetch logs failed, falling back to LocalStorage:', error.message);
      }
    } catch (e) {
      console.warn('Supabase query error, fallback to LocalStorage:', e);
    }
  }

  const local = getLocalLogs();
  if (userName) {
    return local.filter((l) => l.user_name === userName);
  }
  return local;
}

/**
 * 새 복장 로그 저장
 */
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
            user_name: input.user_name,
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
            gender: input.gender || 'male',
            total_insulation_score: input.total_insulation_score ?? 0,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        saveLocalLog(data as OutfitLog);

        // RBAC: temperature_evaluations 테이블에도 동일한 ID로 동기화 기록 (Admin 관리용)
        try {
          await supabase.from('temperature_evaluations').insert([
            {
              id: data.id,
              user_name: input.user_name,
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
              memo: input.memo || null,
              gender: input.gender || 'male',
              total_insulation_score: input.total_insulation_score ?? 0,
            },
          ]);
        } catch (syncErr) {
          console.warn('temperature_evaluations sync notice:', syncErr);
        }

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

// ==========================================
// 온도별 평가 데이터 관리 (RBAC - Admin 전용)
// ==========================================

/**
 * 온도별 평가 데이터 목록 조회 (Supabase RLS 적용: Admin만 접근 가능)
 */
export async function fetchTemperatureEvaluations(): Promise<{
  data: TemperatureEvaluation[];
  error?: string;
}> {
  if (!supabase) {
    return { data: [], error: 'Supabase 클라이언트가 설정되지 않았습니다.' };
  }

  try {
    const { data, error } = await supabase
      .from('temperature_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchTemperatureEvaluations error:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as TemperatureEvaluation[] };
  } catch (err: any) {
    console.error('fetchTemperatureEvaluations exception:', err);
    return { data: [], error: err.message || '데이터를 불러오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 온도별 평가 데이터 항목 수정 (Admin 전용 - outfit_logs 및 LocalStorage 연쇄 동기화)
 */
export async function updateTemperatureEvaluation(
  id: string,
  updates: Partial<TemperatureEvaluation>
): Promise<{ success: boolean; data?: TemperatureEvaluation; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 클라이언트가 설정되지 않았습니다.' };
  }

  try {
    const { data, error } = await supabase
      .from('temperature_evaluations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // outfit_logs 테이블에도 실시간 동기화 (과거 리콜 즉시 반영)
    try {
      const outfitUpdates: Record<string, any> = {};
      if (updates.target_temp !== undefined) outfitUpdates.target_temp = updates.target_temp;
      if (updates.apparent_temp !== undefined) outfitUpdates.apparent_temp = updates.apparent_temp;
      if (updates.score !== undefined) outfitUpdates.score = updates.score;
      if (updates.condition !== undefined) outfitUpdates.condition = updates.condition;
      if (updates.memo !== undefined) outfitUpdates.memo = updates.memo;
      if (updates.selected_outer !== undefined) outfitUpdates.selected_outer = updates.selected_outer;
      if (updates.selected_top !== undefined) outfitUpdates.selected_top = updates.selected_top;
      if (updates.selected_bottom !== undefined) outfitUpdates.selected_bottom = updates.selected_bottom;
      if (updates.selected_items !== undefined) outfitUpdates.selected_items = updates.selected_items;
      if (updates.total_insulation_score !== undefined) outfitUpdates.total_insulation_score = updates.total_insulation_score;

      await supabase.from('outfit_logs').update(outfitUpdates).eq('id', id);
    } catch (logErr) {
      console.warn('outfit_logs sync update warning:', logErr);
    }

    // LocalStorage 실시간 동기화
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_LOGS_KEY);
        if (raw) {
          const logs: OutfitLog[] = JSON.parse(raw);
          const updatedLogs = logs.map((l) => (l.id === id ? { ...l, ...updates } : l));
          localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updatedLogs));
        }
      } catch (e) {
        console.warn('local storage update warning:', e);
      }
      window.dispatchEvent(new Event('weather_outfit_logs_changed'));
    }

    return { success: true, data: data as TemperatureEvaluation };
  } catch (err: any) {
    return { success: false, error: err.message || '수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 온도별 평가 데이터 항목 삭제 (Admin 전용 - outfit_logs 및 LocalStorage 완벽 연쇄 삭제)
 */
export async function deleteTemperatureEvaluation(
  target: string | TemperatureEvaluation
): Promise<{ success: boolean; error?: string }> {
  const targetId = typeof target === 'string' ? target : target.id;
  const targetItem = typeof target === 'string' ? null : target;

  if (supabase) {
    try {
      // 1. temperature_evaluations 테이블에서 삭제
      const { error } = await supabase
        .from('temperature_evaluations')
        .delete()
        .eq('id', targetId);

      if (error) {
        console.warn('temperature_evaluations delete notice:', error.message);
      }

      // 2. outfit_logs 테이블에서도 id 일치 항목 삭제
      await supabase
        .from('outfit_logs')
        .delete()
        .eq('id', targetId);

      // 3. ID가 상이한 마이그레이션 항목 대비 복합 조건 매칭 연쇄 삭제
      if (targetItem) {
        await supabase
          .from('outfit_logs')
          .delete()
          .match({
            user_name: targetItem.user_name,
            target_temp: targetItem.target_temp,
            time_slot: targetItem.time_slot,
            score: targetItem.score,
          });
      }
    } catch (err: any) {
      console.warn('Supabase delete exception:', err);
    }
  }

  // 4. 로컬 스토리지 캐시(weather_outfit_logs_v3)에서도 완전 제거 (리콜 화면 잔존 원천 차단)
  removeLocalLog(targetId, targetItem);

  // 5. 전역 실시간 갱신 이벤트 전파 (메인 화면 HistoryRecall 즉시 동기화)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('weather_outfit_logs_changed'));
  }

  return { success: true };
}

/**
 * 온도별 평가 데이터 수동 등록 (Admin 전용 - outfit_logs 및 LocalStorage 연쇄 등록)
 */
export async function createTemperatureEvaluation(
  input: NewTemperatureEvaluationInput
): Promise<{ success: boolean; data?: TemperatureEvaluation; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 클라이언트가 설정되지 않았습니다.' };
  }

  try {
    const { data, error } = await supabase
      .from('temperature_evaluations')
      .insert([input])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // outfit_logs 에도 동일한 ID로 동기화 등록 (리콜 대상 포함)
    try {
      await supabase.from('outfit_logs').insert([
        {
          id: data.id,
          user_name: input.user_name,
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
          memo: input.memo || null,
        },
      ]);
    } catch (logErr) {
      console.warn('outfit_logs sync insert notice:', logErr);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('weather_outfit_logs_changed'));
    }

    return { success: true, data: data as TemperatureEvaluation };
  } catch (err: any) {
    return { success: false, error: err.message || '등록 중 오류가 발생했습니다.' };
  }
}

