'use client';

import React, { useState, useMemo } from 'react';
import { MatchedRecallRecord } from '@/types/database';
import { OutfitSelection } from '@/types/outfit';
import { formatScoreTemp } from '@/lib/matcher';
import {
  Sparkles,
  Snowflake,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  CornerDownRight,
  User,
  X,
  ChevronRight,
  History,
} from 'lucide-react';

interface HistoryRecallCardProps {
  recalls: MatchedRecallRecord[];
  onApplyOutfit: (outfit: OutfitSelection) => void;
  currentUserName: string;
}

export const HistoryRecallCard: React.FC<HistoryRecallCardProps> = ({
  recalls,
  onApplyOutfit,
  currentUserName,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // 1. 대표 리콜 항목 선정 (체감 편차 |score|가 0에 가장 가까운 최적 평가 항목)
  const { bestRecall, avgScore, avgScoreFormatted } = useMemo(() => {
    if (!recalls || recalls.length === 0) {
      return { bestRecall: null, avgScore: 0, avgScoreFormatted: '0.0°C' };
    }

    const sortedBySuitability = [...recalls].sort((a, b) => {
      const diffA = Math.abs(a.log.score);
      const diffB = Math.abs(b.log.score);
      if (diffA !== diffB) return diffA - diffB;
      return new Date(b.log.created_at).getTime() - new Date(a.log.created_at).getTime();
    });

    const best = sortedBySuitability[0];
    const totalScore = recalls.reduce((sum, r) => sum + r.log.score, 0);
    const avg = totalScore / recalls.length;
    const avgFormatted = avg > 0 ? `+${avg.toFixed(1)}°C` : `${avg.toFixed(1)}°C`;

    return {
      bestRecall: best,
      avgScore: avg,
      avgScoreFormatted: avgFormatted,
    };
  }, [recalls]);

  if (!recalls || recalls.length === 0 || !bestRecall) {
    return null;
  }

  // 대표 코디 객체 구성
  const bestTop = Array.isArray(bestRecall.log.selected_top)
    ? bestRecall.log.selected_top
    : [bestRecall.log.selected_top];
  const bestBottom = Array.isArray(bestRecall.log.selected_bottom)
    ? bestRecall.log.selected_bottom
    : [bestRecall.log.selected_bottom];

  const bestOutfit: OutfitSelection = {
    outer: bestRecall.log.selected_outer,
    top: bestTop,
    bottom: bestBottom,
    items: bestRecall.log.selected_items || [],
  };

  const handleApply = (outfit: OutfitSelection, label?: string) => {
    onApplyOutfit(outfit);
    setAppliedFeedback(label || '코디가 복장 선택기에 적용되었습니다.');
    setTimeout(() => {
      setAppliedFeedback(null);
    }, 2500);
  };

  return (
    <div className="w-full">
      {/* =========================================================================
          요구사항 5: 간소화된 단일 컴팩트 카드 (요약 / 접힘 뷰)
          - 길게 나열되지 않는 단일 컴팩트 카드
          - 가장 좋은 평가를 받은 대표 항목 및 평균값 노출
          - 클릭 시 상세 이력 팝업 오픈
         ========================================================================= */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-slate-50 border border-indigo-100/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-indigo-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 좌측 정보 영역 */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1 rounded-lg bg-indigo-600 text-white shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {currentUserName} 님의 체감 기반 리콜 요약
              </h3>
              <span className="text-[11px] font-semibold bg-white text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                총 {recalls.length}건 매칭 (±2°C)
              </span>
              <span className="text-[11px] font-semibold bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded-full">
                평균 체감 {avgScoreFormatted}
              </span>
            </div>

            {/* 대표 1위 코디 요약 표시 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 flex-wrap pt-0.5">
              <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px]">
                최고만족 (체감 {formatScoreTemp(bestRecall.log.score)})
              </span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="font-medium text-slate-800 truncate max-w-full">
                외투: <strong>{bestRecall.log.selected_outer}</strong> • 상의: <strong>{bestTop.join(' + ')}</strong> • 하의: <strong>{bestBottom.join(' + ')}</strong>
                {bestRecall.log.selected_items && bestRecall.log.selected_items.length > 0 && (
                  <span> • 소품: {bestRecall.log.selected_items.join(', ')}</span>
                )}
              </span>
            </div>
          </div>

          {/* 우측 버튼 액션 영역 */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleApply(bestOutfit, '대표 추천 코디가 적용되었습니다.')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs active:scale-95 touch-manipulation flex items-center gap-1"
              title="가장 만족도 높았던 대표 코디 바로 적용"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>대표 코디 적용</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all active:scale-95 touch-manipulation flex items-center gap-1 shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>전체 이력 ({recalls.length}건)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {appliedFeedback && (
          <div className="mt-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{appliedFeedback}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          요구사항 5: 상세 팝업(모달)
          - 전체 이력 목록과 상세 평가 내용 스크롤 가능한 팝업
         ========================================================================= */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentUserName} 님의 과거 착용 및 체감 이력
                  </h3>
                  <p className="text-xs text-slate-500">
                    현재 기온(±2°C)과 매칭된 총 {recalls.length}개의 기록 (평균 체감 {avgScoreFormatted})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 본문 (스크롤 리스트) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 max-h-[calc(88vh-130px)] divide-y divide-slate-100">
              {recalls.map((item, idx) => {
                const { log, category, categoryTitle, categoryBadge, guidanceMessage } = item;
                const formattedDate = new Date(log.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                });
                const formattedDev = formatScoreTemp(log.score);

                let themeStyles = {
                  container: 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950',
                  badge: 'bg-emerald-600 text-white',
                  icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
                  button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                };

                if (category === 'cold_warning') {
                  themeStyles = {
                    container: 'bg-sky-50/70 border-sky-200/90 text-sky-950',
                    badge: 'bg-sky-600 text-white',
                    icon: <Snowflake className="w-4 h-4 text-sky-600 shrink-0" />,
                    button: 'bg-sky-600 hover:bg-sky-700 text-white',
                  };
                } else if (category === 'warm_warning') {
                  themeStyles = {
                    container: 'bg-amber-50/70 border-amber-200/90 text-amber-950',
                    badge: 'bg-amber-600 text-white',
                    icon: <Flame className="w-4 h-4 text-amber-600 shrink-0" />,
                    button: 'bg-amber-600 hover:bg-amber-700 text-white',
                  };
                }

                const topArray = Array.isArray(log.selected_top)
                  ? log.selected_top
                  : [log.selected_top];
                const bottomArray = Array.isArray(log.selected_bottom)
                  ? log.selected_bottom
                  : [log.selected_bottom];

                const targetOutfit: OutfitSelection = {
                  outer: log.selected_outer,
                  top: topArray,
                  bottom: bottomArray,
                  items: log.selected_items || [],
                };

                return (
                  <div
                    key={log.id || idx}
                    className={`rounded-xl p-3.5 sm:p-4 border shadow-2xs transition-all pt-3 ${themeStyles.container}`}
                  >
                    {/* 상단 뱃지 및 메타 정보 */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {themeStyles.icon}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${themeStyles.badge}`}>
                          {categoryTitle}
                        </span>
                        <span className="text-xs font-semibold opacity-90">
                          체감 {formattedDev} ({categoryBadge})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formattedDate} ({log.target_temp}°C)</span>
                      </div>
                    </div>

                    {/* 안내 가이드 메시지 */}
                    <p className="text-xs font-medium mt-1 mb-2 leading-relaxed text-slate-700">
                      {guidanceMessage}
                    </p>

                    {/* 당시 착용했던 복장 요약 */}
                    <div className="bg-white/95 rounded-xl p-2.5 sm:p-3 border border-slate-200/60 text-xs text-slate-800 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                          당시 착용 복장:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {log.user_name}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                            컨디션: {log.condition}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 font-medium leading-normal text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          외투: <strong>{log.selected_outer}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          상의: <strong>{topArray.join(' + ')}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          하의: <strong>{bottomArray.join(' + ')}</strong>
                        </span>
                        {log.selected_items && log.selected_items.length > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                              소품: {log.selected_items.join(', ')}
                            </span>
                          </>
                        )}
                      </div>

                      {log.memo && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2 py-1 rounded border-l-2 border-slate-300 mt-1">
                          "{log.memo}"
                        </p>
                      )}
                    </div>

                    {/* 적용 버튼 */}
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          handleApply(targetOutfit, `${formattedDate} 코디가 적용되었습니다.`);
                        }}
                        className={`w-full sm:w-auto flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 touch-manipulation ${themeStyles.button}`}
                      >
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                        <span>이 조합 그대로 선택기에 적용</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 모달 푸터 */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                선택기에 적용 후 창을 닫거나 다른 조합을 비교해보세요.
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};