'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/storage';
import { syncKakaoUserProfile } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      router.replace('/');
      return;
    }

    const client = supabase;
    const handleCallback = async () => {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          await syncKakaoUserProfile(data.session.user);
        }
      } catch (err) {
        console.error('인증 콜백 처리 에러:', err);
      } finally {
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-xs">
          <svg viewBox="0 0 24 24" fill="#191919" className="w-6 h-6">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.012l-1.08 4.025c-.097.362.316.65.617.433l4.757-3.15c.144.01.29.016.436.016 4.97 0 9-3.185 9-7.116S16.97 3 12 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">카카오 로그인 처리 중</h2>
          <p className="text-xs text-slate-500 mt-1">
            계정 정보를 안전하게 연결하고 있습니다...
          </p>
        </div>
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin mt-2" />
      </div>
    </div>
  );
}
