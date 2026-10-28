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
  Sliders,
  Smile,
  Activity,
  ThermometerSnowflake,
  Coffee,
  Thermometer,
  AlertTriangle,
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
  onRequireUserChange,
}) => {
  // 기본값: 0도 (적정)
  const [tempOffset, setTempOffset] = useState<number>(0);
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userWarning, setUserWarning] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<{
    message: string;
    isFallback: boolean;
  } | null>(null);

  // '기본 사용자' 여부 검사 (기본 사용자인 경우 저장 금지)
  const isDefaultUser =
    !userName ||
    userName.trim() === '기본 사용자' ||
    userName.trim() === '기본사용자';

  // 사용자가 변경되면 경고 메시지 리셋
  React.useEffect(() => {
    if (!isDefaultUser) {
      setUserWarning(null);
    }
  }, [userName, isDefaultUser]);

  // 온도 기반(-5°C ~ +5°C) 체감 상태 라벨 계산
  const getOffsetInfo = (offset: number) => {
    const formatted = formatScoreTemp(offset);

    if (offset <= -4) {
      return {
        label: `${formatted} (매우 추움)`,
        emoji: '🥶',
        color: 'text-blue-700 bg-blue-100 border-blue-300',
      };
    } else if (offset <= -2) {
      return {
        label: `${formatted} (꽤 쌀쌀함)`,
        emoji: '🧣',
        color: 'text-sky-600 bg-sky-50 border-sky-200',
      };
    } else if (offset === -1) {
      return {
        label: `${formatted} (약간 쌀쌀함)`,
        emoji: '🍃',
        color: 'text-teal-600 bg-teal-50 border-teal-200',
      };
    } else if (offset === 0) {
      return {
        label: `0°C (적정 / 딱 맞음)`,
        emoji: '✨',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold',
      };
    } else if (offset === 1) {
      return {
        label: `${formatted} (약간 더움)`,
        emoji: '🌤️',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      };
    } else if (offset <= 3) {
      return {
        label: `${formatted} (꽤 더움)`,
        emoji: '☀️',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
      };
    } else {
      return {
        label: `${formatted} (매우 더움)`,
        emoji: '🥵',
        color: 'text-rose-700 bg-rose-100 border-rose-300',
      };
    }
  };

  const offsetInfo = getOffsetInfo(tempOffset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 사용자인 경우 반드시 다른 사용자를 선택하도록 강제
    if (isDefaultUser) {
      setUserWarning(
        '개인 맞춤 피드백을 기록하려면 "기본 사용자"가 아닌 본인의 프로필을 선택하거나 새로 등록해야 합니다.'
      );
      onRequireUserChange?.();
      return;
    }

    setIsSubmitting(true);
    setFeedbackSuccess(null);
    setUserWarning(null);

    try {
      const res = await createOutfitLog({
        user_name: userName,
        location_name: locationName,
        target_temp: currentTemp,
        apparent_temp: apparentTemp,
        time_slot: timeSlot,
        selected_outer: currentOutfit.outer,
        selected_top: currentOutfit.top,
        selected_bottom: currentOutfit.bottom,
        selected_items: currentOutfit.items,
        score: tempOffset, // -5 ~ +5 체감 온도 편차 저장
        condition: userCondition,
        memo: memo.trim() || undefined,
      });

      setFeedbackSuccess({
        message: res.isFallback
          ? '체감 피드백이 로컬 스토리지에 안전하게 기록되었습니다! (Supabase Fallback)'
          : '체감 피드백이 Supabase 클라우드에 성공적으로 기록되었습니다!',
        isFallback: res.isFallback,
      });

      setMemo('');
      onLogSaved();

      setTimeout(() => {
        setFeedbackSuccess(null);
      }, 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 sm:space-y-5">
      {/* 폼 타이틀 */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
            <Thermometer className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              오늘의 복장 체감 평가 & 피드백
            </h3>
            <p className="text-xs text-slate-500">
              실제 체감 편차(-5°C ~ +5°C)를 기록하면 지능형 리콜 추천에 반영됩니다.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. 체감 온도 편차 슬라이더 (-5°C ~ +5°C) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>착용 체감 온도 편차</span>
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
              min={-5}
              max={5}
              step={1}
              value={tempOffset}
              onChange={(e) => setTempOffset(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none touch-manipulation"
            />
            {/* 눈금 라벨 (-5°C: 매우 추움 / 0°C: 적정 / +5°C: 매우 더움) */}
            <div className="flex items-center justify-between text-[11px] font-medium mt-2">
              <span className="text-blue-600 font-bold">-5°C : 매우 추움</span>
              <span className="text-emerald-600 font-bold">0°C : 적정</span>
              <span className="text-rose-600 font-bold">+5°C : 매우 더움</span>
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
              기온 자동 보정
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

        {/* 4. 기본 사용자 경고 안내 또는 피드백 메시지 */}
        {isDefaultUser && (
          <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-2.5 text-amber-900 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                현재 <strong>&apos;기본 사용자&apos;</strong> 상태입니다. 체감 복장을 기록하려면 본인 프로필을 선택해야 합니다.
              </span>
            </div>
            {onRequireUserChange && (
              <button
                type="button"
                onClick={onRequireUserChange}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition-all active:scale-95 shadow-2xs"
              >
                프로필 선택/추가
              </button>
            )}
          </div>
        )}

        {userWarning && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-rose-800 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{userWarning}</span>
            </div>
            {onRequireUserChange && (
              <button
                type="button"
                onClick={onRequireUserChange}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 transition-all active:scale-95 shadow-2xs"
              >
                프로필 변경하기
              </button>
            )}
          </div>
        )}

        {/* 5. 저장 버튼 & 성공 안내 피드백 */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full min-h-[46px] py-3 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation ${
              isDefaultUser
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>저장 중...</span>
              </>
            ) : isDefaultUser ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>사용자 선택 후 저장 가능 (현재: 기본 사용자)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>오늘 복장 체감 저장하기</span>
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
