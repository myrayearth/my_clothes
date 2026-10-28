import { supabase, saveActiveUser, saveLocalProfile } from '@/lib/storage';
import { UserProfile } from '@/types/database';

export interface AuthSessionState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

/**
 * 카카오 OAuth 로그인 실행 (Supabase Auth 연동)
 */
export async function signInWithKakao(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 클라이언트가 설정되지 않았습니다.');
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${origin}/`,
    },
  });

  if (error) {
    console.error('카카오 로그인 에러:', error);
    throw error;
  }
}

/**
 * 카카오 로그아웃 (Supabase 세션 종료 및 활성 사용자 초기화)
 */
export async function signOutKakao(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('카카오 로그아웃 에러:', err);
    }
  }

  // 로컬 활성 사용자 '기본 사용자'로 리셋
  saveActiveUser('기본 사용자');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('weather_outfit_active_user_id');
  }
}

/**
 * 현재 인증 세션 조회
 */
export async function getCurrentAuthUser() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;
    return data.session.user;
  } catch {
    return null;
  }
}

/**
 * 카카오 로그인 완료 후 profiles 테이블과 프로필 동기화
 */
export async function syncKakaoUserProfile(user: any): Promise<UserProfile> {
  const meta = user.user_metadata || {};
  const rawName =
    meta.name ||
    meta.full_name ||
    meta.preferred_username ||
    meta.nickname ||
    (user.email ? user.email.split('@')[0] : '카카오 사용자');

  const cleanName = String(rawName).trim() || '카카오 사용자';
  const avatarUrl = meta.avatar_url || meta.picture || null;
  const email = user.email || null;

  if (supabase) {
    try {
      // 1. user.id 기준으로 기존 profiles 조회
      const { data: existingById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingById) {
        // 아바타나 이메일 변경사항 동기화
        if (existingById.avatar_url !== avatarUrl || existingById.email !== email) {
          await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl, email: email })
            .eq('id', user.id);
        }
        const synced = { ...existingById, avatar_url: avatarUrl, email: email } as UserProfile;
        saveActiveUser({ id: synced.id, name: synced.name });
        saveLocalProfile(synced);
        return synced;
      }

      // 2. 동명 사용자 존재 여부 확인 (이름 unique 제약 고려)
      const { data: existingByName } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', cleanName)
        .maybeSingle();

      let targetName = cleanName;
      if (existingByName && existingByName.id !== user.id) {
        targetName = `${cleanName}_${user.id.substring(0, 4)}`;
      }

      // 3. 신규 프로필 생성 (INSERT)
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            name: targetName,
            avatar_url: avatarUrl,
            email: email,
          },
        ])
        .select()
        .single();

      if (!error && newProfile) {
        saveActiveUser({ id: newProfile.id, name: newProfile.name });
        saveLocalProfile(newProfile as UserProfile);
        return newProfile as UserProfile;
      }

      if (error) {
        console.warn('Kakao profile insert error:', error.message);
      }
    } catch (e) {
      console.warn('Kakao profile sync exception:', e);
    }
  }

  const fallback: UserProfile = {
    id: user.id,
    name: cleanName,
    avatar_url: avatarUrl,
    email: email,
    created_at: new Date().toISOString(),
  };
  saveActiveUser({ id: fallback.id, name: fallback.name });
  saveLocalProfile(fallback);
  return fallback;
}
