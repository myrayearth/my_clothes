import { supabase, saveActiveUser, saveLocalProfile } from '@/lib/storage';
import { UserProfile, UserRole } from '@/types/database';

export const ADMIN_EMAIL = 'ray0412@kakao.com';

export interface AuthSessionState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    role?: UserRole;
  } | null;
}

/**
 * 사용자 정보 객체를 기반으로 관리자(Admin) 여부 판별
 * 1) email === 'ray0412@kakao.com'
 * 2) user_metadata->>'email' 또는 kakao_account.email === 'ray0412@kakao.com'
 * 3) profiles.role === 'admin' 또는 app_metadata.role === 'admin'
 */
export function isUserAdmin(profileOrUser: any): boolean {
  if (!profileOrUser) return false;

  // 1. role 필드 판별
  if (profileOrUser.role === 'admin') return true;

  // 2. email 주소 판별 (대소문자 무시)
  const directEmail = profileOrUser.email;
  if (directEmail && String(directEmail).trim().toLowerCase() === ADMIN_EMAIL) {
    return true;
  }

  // 3. raw_user_meta_data 및 nested metadata 판별
  const meta = profileOrUser.user_metadata || profileOrUser.raw_user_meta_data;
  if (meta) {
    const metaEmail = meta.email || meta.kakao_account?.email;
    if (metaEmail && String(metaEmail).trim().toLowerCase() === ADMIN_EMAIL) {
      return true;
    }
  }

  // 4. app_metadata 판별
  const appMeta = profileOrUser.app_metadata || profileOrUser.raw_app_meta_data;
  if (appMeta?.role === 'admin') {
    return true;
  }

  // 5. 알려진 카카오 관리자 ID 직접 매칭 (fallback)
  if (profileOrUser.id === 'cc4a3175-6560-4a1b-9d6a-1390858fe311') {
    return true;
  }

  return false;
}

/**
 * 카카오 OAuth 로그인 실행 (Supabase Auth 연동 - email 제외, 닉네임 및 프로필 이미지만 요청)
 */
export async function signInWithKakao(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 클라이언트가 설정되지 않았습니다.');
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: 'profile_nickname profile_image', // 카카오에 등록된 항목만 명시하여 account_email 요청 차단
      queryParams: {
        scope: 'profile_nickname profile_image', // 쿼리 파라미터로도 scope 강제 지정
      },
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
 * 서버/DB 연동 기반 관리자 권한 완전 검증
 * 세션 검증 -> RPC is_admin() 확인 -> profiles role 확인
 */
export async function verifyAdminAccess(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
  profile: UserProfile | null;
  error?: string;
}> {
  if (!supabase) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      profile: null,
      error: 'Supabase 클라이언트가 초기화되지 않았습니다.',
    };
  }

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session?.user) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        profile: null,
      };
    }

    const authUser = sessionData.session.user;

    // 1. 클라이언트 레벨 1차 판별
    let adminFlag = isUserAdmin(authUser);

    // 2. profiles 테이블 조회
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileData) {
      if (profileData.role === 'admin' || isUserAdmin(profileData)) {
        adminFlag = true;
      }
    }

    // 3. PostgreSQL Security Definer RPC is_admin() 정밀 검증
    try {
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('is_admin');
      if (!rpcErr && typeof rpcResult === 'boolean') {
        adminFlag = rpcResult || adminFlag;
      }
    } catch (rpcEx) {
      console.warn('RPC is_admin 호출 생략/경고:', rpcEx);
    }

    const currentProfile: UserProfile = profileData || {
      id: authUser.id,
      name: authUser.user_metadata?.name || '카카오 사용자',
      email: authUser.email || (adminFlag ? ADMIN_EMAIL : null),
      role: adminFlag ? 'admin' : 'user',
      avatar_url: authUser.user_metadata?.avatar_url || null,
      created_at: authUser.created_at || new Date().toISOString(),
    };

    return {
      isAuthenticated: true,
      isAdmin: adminFlag,
      user: authUser,
      profile: currentProfile,
    };
  } catch (err: any) {
    console.error('관리자 권한 검증 중 예외 발생:', err);
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      profile: null,
      error: err.message,
    };
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
  const isTargetAdmin = isUserAdmin(user) || user.id === 'cc4a3175-6560-4a1b-9d6a-1390858fe311';
  const email = user.email || (isTargetAdmin ? ADMIN_EMAIL : null);
  const role: UserRole = isTargetAdmin ? 'admin' : 'user';

  if (supabase) {
    try {
      // 1. user.id 기준으로 기존 profiles 조회
      const { data: existingById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingById) {
        const targetRole = isTargetAdmin ? 'admin' : (existingById.role || 'user');
        const targetEmail = email || existingById.email || (isTargetAdmin ? ADMIN_EMAIL : null);

        // 변경사항 있을 경우 동기화
        if (
          existingById.avatar_url !== avatarUrl ||
          existingById.email !== targetEmail ||
          existingById.role !== targetRole
        ) {
          await supabase
            .from('profiles')
            .update({
              avatar_url: avatarUrl,
              email: targetEmail,
              role: targetRole,
            })
            .eq('id', user.id);
        }
        const synced = {
          ...existingById,
          avatar_url: avatarUrl,
          email: targetEmail,
          role: targetRole,
        } as UserProfile;

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
            role: role,
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
    role: role,
    created_at: new Date().toISOString(),
  };
  saveActiveUser({ id: fallback.id, name: fallback.name });
  saveLocalProfile(fallback);
  return fallback;
}
