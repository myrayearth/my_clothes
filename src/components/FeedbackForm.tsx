'use client';

import React, { useState } from 'react';
import { OutfitSelection } from '@/types/outfit';
import { UserCondition } from '@/types/database';
import { createOutfitLog } from '@/lib/storage';
import { formatScoreTemp } from '@/lib/matcher';
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Smile,
  Activity,
  ThermometerSnowflake,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface FeedbackFormProps {
  userName: string;
  currentTemp: number;
  apparentTemp: number;
  timeSlot: string;
  locationName: string;
  currentOutfit: OutfitSelection;
  onLogSaved: () => void;
  userCondition: UserCondition;
  onChangeUserCondition: (cond: UserCondition) => void;
  onRequireUserChange?: () => void;
  onKakaoLogin?: () => void;
}

const conditionOptions: {
  value: UserCondition;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: '정상',
    label: '정상',
    desc: '평소 컨디션 (0°C)',
    icon: <Smile className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
  },
  {
    value: '피곤',
    label: '피곤',
    desc: '체감온도 -1.0°C',
    icon: <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  },
  {
    value: '감기',
    label: '감기',
    desc: '오한 주의 (-2.5°C)',
    icon: <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-500 shrink-0" />,
  },
  {
    value: '활동량많음',
    label: '활동량많음',
    desc: '발열 고려 (+1.5°C)',
    icon: <Activity className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
  },
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  userName,
  currentTemp,
  apparentTemp,
  timeSlot,
  locationName,
  currentOutfit,
  onLogSaved,
  userCondition,
  onChangeUserCondition,
  onKakaoLogin,
}) => {
  // 기본값: 0 (적정) / 범위: -2 ~ +2
  const [tempOffset, setTempOffset] = useState<number>(0);
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<{
    message: string;
    isFallback: boolean;
  } | null>(null);

  // 게스트(비로그인) 여부
  const isGuest =
    !userName ||
    userName.trim() === '기본 사용자' ||
    userName.trim() === '기본사용자' ||
    userName.trim() === '게스트';

  // 평가 점수(-2 ~ +2) 체감 상태 라벨 계산
  const getOffsetInfo = (offset: number) => {
    if (offset <= -2) {
      return {
        label: '-2 (추움)',
        emoji: '🥶',
        color: 'text-blue-700 bg-blue-100 border-blue-300',
      };
    } else if (offset === -1) {
      return {
        label: '-1 (약간 쌀쌀함)',
        emoji: '🍃',
        color: 'text-teal-600 bg-teal-50 border-teal-200',
      };
    } else if (offset === 0) {
      return {
        label: '0 (적정 / 딱 맞음)',
        emoji: '✨',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold',
      };
    } else if (offset === 1) {
      return {
        label: '+1 (약간 더움)',
        emoji: '🌤️',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      };
    } else {
      return {
        label: '+2 (더움)',
        emoji: '🥵',
        color: 'text-rose-700 bg-rose-100 border-rose-300',
      };
    }
  };

  const offsetInfo = getOffsetInfo(tempOffset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackSuccess(null);

    const effectiveUserName = isGuest ? '게스트' : userName;

    try {
      const res = await createOutfitLog({
        user_name: effectiveUserName,
        location_name: locationName,
        target_temp: currentTemp,
        apparent_temp: apparentTemp,
        time_slot: timeSlot,
        selected_outer: currentOutfit.outer,
        selected_top: currentOutfit.top,
        selected_bottom: currentOutfit.bottom,
        selected_items: currentOutfit.items,
        score: tempOffset, // -2 ~ +2 체감 평가 점수 저장
        condition: userCondition,
        memo: memo.trim() || undefined,
      });

      setFeedbackSuccess({
        message: res.isFallback
          ? '체감 피드백이 로컬에 안전하게 기록되었습니다.'
          : isGuest
          ? '게스트 피드백이 DB에 저장되어 전체 추천 집계에 반영되었습니다!'
          : '내 체감 피드백이 Supabase DB에 성공적으로 저장되었습니다!',
        isFallback: res.isFallback,
      });

      setMemo('');
      onLogSaved();

      setTimeout(() => {
        setFeedbackSuccess(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      alert('피드백 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-4">
      {/* 폼 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              오늘의 복장 체감 평가 (-2 ~ +2)
            </h3>
            <p className="text-[11px] text-slate-400">
              {isGuest
                ? '게스트 평가도 DB에 저장되어 전체 평균 추천에 반영됩니다.'
                : `${userName} 님의 체감 기록이 실시간 축적됩니다.`}
            </p>
          </div>
        </div>

        {isGuest && onKakaoLogin && (
          <button
            type="button"
            onClick={onKakaoLogin}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-[#FEE500] hover:bg-[#FDD835] px-2.5 py-1 rounded-lg shadow-2xs transition-all active:scale-95"
            title="카카오 로그인 시 나만의 과거 기록 맞춤 리콜 제공"
          >
            <span>💬 카카오 로그인 연동</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. 체감 온도 평가 슬라이더 (-2 ~ +2) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>착용 체감 평가 점수</span>
              <span className="text-[11px] text-slate-400 font-normal">
                (기온 {currentTemp}°C 기준)
              </span>
            </label>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${offsetInfo.color}`}
            >
              {offsetInfo.emoji} {offsetInfo.label}
            </span>
          </div>

          <div className="pt-2 px-1">
            <input
              type="range"
              min={-2}
              max={2}
              step={1}
              value={tempOffset}
              onChange={(e) => setTempOffset(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none touch-manipulation"
            />
            {/* 눈금 라벨 (-2: 추움 / 0: 적정 / +2: 더움) */}
            <div className="flex items-center justify-between text-[11px] font-medium mt-2">
              <span className="text-blue-600 font-bold">-2 : 추움</span>
              <span className="text-sky-600">-1 : 약간 쌀쌀</span>
              <span className="text-emerald-600 font-bold">0 : 적정 (딱 맞음)</span>
              <span className="text-amber-600">+1 : 약간 더움</span>
              <span className="text-rose-600 font-bold">+2 : 더움</span>
            </div>
          </div>
        </div>

        {/* 2. 컨디션 라디오 그룹 */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              내 오늘의 컨디션
            </label>
            <span className="text-[10px] text-slate-400">
              체감 보정
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {conditionOptions.map((opt) => {
              const isSelected = userCondition === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeUserCondition(opt.value)}
                  className={`min-h-[52px] p-2 sm:p-2.5 rounded-xl border text-left transition-all active:scale-95 touch-manipulation select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 한 줄 메모 입력창 */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>착용 메모 (선택사항)</span>
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="바람이 많이 불었음, 지하철 안이 더웠음 등..."
            maxLength={100}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-slate-400 touch-manipulation"
          />
        </div>

        {/* 4. 저장 버튼 & 성공 안내 피드백 */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[46px] py-3 active:scale-[0.99] font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>평가 저장 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {isGuest
                    ? '오늘 복장 체감 피드백 등록하기 (게스트)'
                    : `오늘 복장 체감 저장하기 (${userName})`}
                </span>
              </>
            )}
          </button>
        </div>

        {feedbackSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 font-medium">{feedbackSuccess.message}</div>
          </div>
        )}
      </form>
    </div>
  );
};
