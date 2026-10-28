'use client';

import React, { useState, useMemo } from 'react';
import { MatchedRecallRecord, OutfitLog } from '@/types/database';
import { OutfitSelection } from '@/types/outfit';
import { formatScoreTemp } from '@/lib/matcher';
import {
  isDiscontinuedItem,
  migrateOutfitSelection,
  getDiscontinuedItemsInLog,
} from '@/lib/dataMigration';
import { updateOutfitLog, deleteTemperatureEvaluation } from '@/lib/storage';
import { EvaluationEditModal } from '@/components/outfit/EvaluationEditModal';
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
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface HistoryRecallCardProps {
  recalls: MatchedRecallRecord[];
  onApplyOutfit: (outfit: OutfitSelection) => void;
  currentUserName: string;
  isAdmin?: boolean;
  onLogDeleted?: () => void;
}

export const HistoryRecallCard: React.FC<HistoryRecallCardProps> = ({
  recalls,
  onApplyOutfit,
  currentUserName,
  isAdmin = false,
  onLogDeleted,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<OutfitLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const renderItemWithBadge = (item: string) => {
    if (!item || item === '없음' || item === '미착용' || item.trim() === '') return <span>없음</span>;
    const discontinued = isDiscontinuedItem(item);
    return (
      <span className="inline-flex items-center gap-1">
        <span>{item}</span>
        {discontinued && (
          <span className="text-[10px] font-normal text-slate-500 bg-slate-200/90 px-1 py-0.2 rounded border border-slate-300">
            [단종/구버전]
          </span>
        )}
      </span>
    );
  };

  const handleApply = (outfit: OutfitSelection, label?: string) => {
    const migrated = migrateOutfitSelection(outfit);
    onApplyOutfit(migrated);
    setAppliedFeedback(label || '코디가 복장 선택기에 적용되었습니다.');
    setTimeout(() => {
      setAppliedFeedback(null);
    }, 2500);
  };

  const handleReplaceAndApply = async (
    log: OutfitLog,
    discontinued: { category: any; oldItem: string; replacement: string }[]
  ) => {
    let newOuter = log.selected_outer;
    let newTop = Array.isArray(log.selected_top) ? [...log.selected_top] : [log.selected_top];
    let newBottom = Array.isArray(log.selected_bottom) ? [...log.selected_bottom] : [log.selected_bottom];
    let newItems = Array.isArray(log.selected_items) ? [...log.selected_items] : [];

    for (const d of discontinued) {
      if (d.category === 'outer') {
        newOuter = d.replacement;
      } else if (d.category === 'top') {
        newTop = newTop.map((t) => (t === d.oldItem ? d.replacement : t));
      } else if (d.category === 'bottom') {
        newBottom = newBottom.map((b) => (b === d.oldItem ? d.replacement : b));
      } else if (d.category === 'items') {
        newItems = newItems.map((it) => (it === d.oldItem ? d.replacement : it));
      }
    }

    const replacedOutfit: OutfitSelection = {
      outer: newOuter,
      top: newTop,
      bottom: newBottom,
      items: newItems,
    };

    onApplyOutfit(replacedOutfit);

    if (log.id) {
      await updateOutfitLog(log.id, {
        selected_outer: newOuter,
        selected_top: newTop,
        selected_bottom: newBottom,
        selected_items: newItems,
      });
    }

    setAppliedFeedback(
      `단종된 '${discontinued[0].oldItem}' 대신 '${discontinued[0].replacement}'(으)로 대체 적용 및 저장되었습니다.`
    );
    setTimeout(() => {
      setAppliedFeedback(null);
    }, 3500);
  };

  const handleDelete = async (log: OutfitLog) => {
    if (!isAdmin) {
      alert('관리자 계정만 기록을 삭제할 수 있습니다.');
      return;
    }
    const confirmMsg = `'${log.user_name}' 님의 ${log.target_temp}°C 착용 평가 기록을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setDeletingId(log.id);
    try {
      const res = await deleteTemperatureEvaluation(log);
      if (res.success) {
        setAppliedFeedback('착용 평가 기록이 안전하게 삭제되었습니다.');
        setTimeout(() => setAppliedFeedback(null), 3000);
        onLogDeleted?.();
      } else {
        alert(res.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (e: any) {
      alert(e.message || '삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const bestDiscontinued = bestRecall ? getDiscontinuedItemsInLog(bestRecall.log) : [];

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
              <span className="font-medium text-slate-800 truncate max-w-full flex items-center gap-1 flex-wrap">
                <span>외투: <strong>{renderItemWithBadge(bestRecall.log.selected_outer)}</strong></span>
                <span>• 상의: <strong>{bestTop.map((t, i) => <React.Fragment key={i}>{i > 0 && ' + '}{renderItemWithBadge(t)}</React.Fragment>)}</strong></span>
                <span>• 하의: <strong>{bestBottom.map((b, i) => <React.Fragment key={i}>{i > 0 && ' + '}{renderItemWithBadge(b)}</React.Fragment>)}</strong></span>
                {bestRecall.log.selected_items && bestRecall.log.selected_items.length > 0 && (
                  <span>
                    • 소품: {bestRecall.log.selected_items.map((it, i) => <React.Fragment key={i}>{i > 0 && ', '}{renderItemWithBadge(it)}</React.Fragment>)}
                  </span>
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

        {/* 대표 코디 내 단종 아이템 대체 추천 안내 */}
        {bestDiscontinued.length > 0 && (
          <div className="mt-2.5 p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center justify-between gap-2 flex-wrap text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                단종된 <strong>'{bestDiscontinued[0].oldItem}'</strong> 대신 비슷한 <strong>'{bestDiscontinued[0].replacement}'</strong>(으)로 대체하시겠습니까?
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleReplaceAndApply(bestRecall.log, bestDiscontinued)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              대체 적용
            </button>
          </div>
        )}

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
                          외투: <strong>{renderItemWithBadge(log.selected_outer)}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          상의: <strong>{topArray.map((t, i) => <React.Fragment key={i}>{i > 0 && ' + '}{renderItemWithBadge(t)}</React.Fragment>)}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          하의: <strong>{bottomArray.map((b, i) => <React.Fragment key={i}>{i > 0 && ' + '}{renderItemWithBadge(b)}</React.Fragment>)}</strong>
                        </span>
                        {log.selected_items && log.selected_items.length > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                              소품: {log.selected_items.map((it, i) => <React.Fragment key={i}>{i > 0 && ', '}{renderItemWithBadge(it)}</React.Fragment>)}
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

                    {/* 단종 아이템 감지 및 최적 대체 제안 알림 */}
                    {(() => {
                      const itemDiscontinued = getDiscontinuedItemsInLog(log);
                      if (itemDiscontinued.length === 0) return null;
                      return (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 flex-wrap text-[11px] text-amber-900">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              단종된 <strong>'{itemDiscontinued[0].oldItem}'</strong> 대신 비슷한 <strong>'{itemDiscontinued[0].replacement}'</strong>(으)로 대체하시겠습니까?
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReplaceAndApply(log, itemDiscontinued)}
                            className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-95 transition-all"
                          >
                            대체 적용
                          </button>
                        </div>
                      );
                    })()}

                    {/* 수정 및 적용 버튼 영역 (수정 및 삭제는 관리자 전용) */}
                    <div className="mt-2.5 flex items-center justify-end gap-2 flex-wrap">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingRecord(log)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                            title="이 착용 평가 기록 수정 (관리자 전용)"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(log)}
                            disabled={deletingId === log.id}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all shadow-2xs active:scale-95 touch-manipulation cursor-pointer disabled:opacity-50"
                            title="이 착용 평가 기록 삭제 (관리자 전용)"
                          >
                            {deletingId === log.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span>삭제</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          handleApply(targetOutfit, `${formattedDate} 코디가 적용되었습니다.`);
                        }}
                        className={`flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 touch-manipulation cursor-pointer ${themeStyles.button}`}
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

      {/* 과거 평가 기록 수정 모달 (관리자 전용) */}
      {editingRecord && (
        <EvaluationEditModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          isAdmin={isAdmin}
          onSuccess={() => {
            setAppliedFeedback('착용 평가 기록이 성공적으로 수정되었습니다.');
            setTimeout(() => setAppliedFeedback(null), 3000);
            onLogDeleted?.();
          }}
        />
      )}
    </div>
  );
};