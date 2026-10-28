'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { OutfitLog, TemperatureEvaluation, UserCondition, UserGender } from '@/types/database';
import { STANDARD_ITEMS } from '@/data/itemScores';
import { filterItemsByGender } from '@/lib/gender';
import {
  calculateTotalInsulation,
  scoreToCoverTemperature,
  getInsulationTargetRange,
  getRelativeCoverStatus,
  getItemChipWarmthClasses,
} from '@/lib/insulation';
import { getOutfitRuleByTemperature } from '@/lib/outfit';
import { formatScoreTemp } from '@/lib/matcher';
import { updateOutfitLog } from '@/lib/storage';
import { isDiscontinuedItem } from '@/lib/dataMigration';
import { X, Check, Shirt, Sparkles, AlertCircle, Save, Loader2 } from 'lucide-react';

interface EvaluationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: OutfitLog | TemperatureEvaluation | null;
  onSuccess?: () => void;
  gender?: UserGender;
  isAdmin?: boolean;
}

export const EvaluationEditModal: React.FC<EvaluationEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
  gender = 'male',
  isAdmin = true,
}) => {
  if (!isOpen || !record) return null;

  if (!isAdmin) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">관리자 전용 기능</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            과거 착용 평가 데이터 수정은 관리자 계정으로 로그인한 경우에만 이용할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // 초기 폼 상태 초기화
  const initialTop = Array.isArray(record.selected_top)
    ? record.selected_top
    : [record.selected_top].filter(Boolean) as string[];
  const initialBottom = Array.isArray(record.selected_bottom)
    ? record.selected_bottom
    : [record.selected_bottom].filter(Boolean) as string[];
  const initialItems = Array.isArray(record.selected_items)
    ? record.selected_items
    : [];

  const [outer, setOuter] = useState<string>(record.selected_outer || '없음');
  const [top, setTop] = useState<string[]>(initialTop.length > 0 ? initialTop : ['기본 반팔']);
  const [bottom, setBottom] = useState<string[]>(initialBottom.length > 0 ? initialBottom : ['기본 긴바지']);
  const [items, setItems] = useState<string[]>(initialItems);
  const [score, setScore] = useState<number>(record.score ?? 0);
  const [condition, setCondition] = useState<UserCondition>(record.condition || '정상');
  const [memo, setMemo] = useState<string>(record.memo || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // record 변경 시 내부 폼 상태 재동기화
  useEffect(() => {
    if (!record) return;
    const rTop = Array.isArray(record.selected_top)
      ? record.selected_top
      : [record.selected_top].filter(Boolean) as string[];
    const rBottom = Array.isArray(record.selected_bottom)
      ? record.selected_bottom
      : [record.selected_bottom].filter(Boolean) as string[];
    const rItems = Array.isArray(record.selected_items)
      ? record.selected_items
      : [];

    setOuter(record.selected_outer || '없음');
    setTop(rTop.length > 0 ? rTop : ['기본 반팔']);
    setBottom(rBottom.length > 0 ? rBottom : ['기본 긴바지']);
    setItems(rItems);
    setScore(record.score ?? 0);
    setCondition(record.condition || '정상');
    setMemo(record.memo || '');
    setErrorMessage(null);
  }, [record]);

  const effectiveGender: UserGender = (record as any)?.gender || gender || 'male';

  // 성별 필터링이 적용된 표준 옵션 목록 + 현재 선택된 과거/단종 아이템 보존
  const outerOptions = useMemo(() => {
    const list = STANDARD_ITEMS.filter((i) => i.category === 'outer').map((i) => i.name);
    const standard = ['없음', ...filterItemsByGender(list, effectiveGender)];
    if (outer && outer !== '없음' && !standard.includes(outer)) {
      return [...standard, outer];
    }
    return standard;
  }, [effectiveGender, outer]);

  const topOptions = useMemo(() => {
    const list = STANDARD_ITEMS.filter((i) => i.category === 'top').map((i) => i.name);
    const standard = filterItemsByGender(list, effectiveGender);
    const legacy = top.filter((t) => !standard.includes(t));
    return [...standard, ...legacy];
  }, [effectiveGender, top]);

  const bottomOptions = useMemo(() => {
    const list = STANDARD_ITEMS.filter((i) => i.category === 'bottom').map((i) => i.name);
    const standard = filterItemsByGender(list, effectiveGender);
    const legacy = bottom.filter((b) => !standard.includes(b));
    return [...standard, ...legacy];
  }, [effectiveGender, bottom]);

  const itemOptions = useMemo(() => {
    const list = STANDARD_ITEMS.filter((i) => i.category === 'items').map((i) => i.name);
    const standard = filterItemsByGender(list, effectiveGender);
    const legacy = items.filter((it) => !standard.includes(it));
    return [...standard, ...legacy];
  }, [effectiveGender, items]);

  // 실시간 보온 수치 및 커버 기온 재계산
  const totalScore = useMemo(() => {
    return calculateTotalInsulation({
      outer: outer === '없음' ? '' : outer,
      top,
      bottom,
      items,
    });
  }, [outer, top, bottom, items]);

  const coverTemp = useMemo(() => {
    return Math.round(scoreToCoverTemperature(totalScore) * 10) / 10;
  }, [totalScore]);

  const rule = useMemo(
    () => getOutfitRuleByTemperature(record.target_temp),
    [record.target_temp]
  );

  const targetRange = useMemo(
    () => getInsulationTargetRange(record.target_temp),
    [record.target_temp]
  );

  const relativeStatus = useMemo(
    () => getRelativeCoverStatus(coverTemp, record.target_temp),
    [coverTemp, record.target_temp]
  );

  // 단종/과거 아이템 여부와 무관하게 문자열 값(Value) 자체를 기준으로 안전하게 단일 항목 제거
  const handleRemoveItem = (category: 'top' | 'bottom' | 'items', itemName: string) => {
    if (category === 'top') {
      if (top.length <= 1) return; // 상의 최소 1개 유지
      setTop((prev) => prev.filter((name) => name !== itemName));
    } else if (category === 'bottom') {
      if (bottom.length <= 1) return; // 하의 최소 1개 유지
      setBottom((prev) => prev.filter((name) => name !== itemName));
    } else if (category === 'items') {
      setItems((prev) => prev.filter((name) => name !== itemName));
    }
  };

  const handleClearOuter = () => {
    setOuter('없음');
  };

  const handleOuterSelect = (opt: string) => {
    if (outer === opt) {
      setOuter('없음');
    } else {
      setOuter(opt);
    }
  };

  // 상의 다중 선택 토글 (문자열 값 기준 필터링, 최소 1개 유지)
  const handleToggleTop = (item: string) => {
    if (top.includes(item)) {
      if (top.length <= 1) return;
      setTop((prev) => prev.filter((t) => t !== item));
    } else {
      setTop((prev) => [...prev, item]);
    }
  };

  // 하의 다중 선택 토글 (문자열 값 기준 필터링, 최소 1개 유지)
  const handleToggleBottom = (item: string) => {
    if (bottom.includes(item)) {
      if (bottom.length <= 1) return;
      setBottom((prev) => prev.filter((b) => b !== item));
    } else {
      setBottom((prev) => [...prev, item]);
    }
  };

  // 소품 다중 선택 토글 (문자열 값 기준 필터링)
  const handleToggleItem = (item: string) => {
    if (items.includes(item)) {
      setItems((prev) => prev.filter((i) => i !== item));
    } else {
      setItems((prev) => [...prev, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record.id) return;

    if (top.length === 0) {
      setErrorMessage('상의는 최소 1개 이상 선택해야 합니다.');
      return;
    }
    if (bottom.length === 0) {
      setErrorMessage('하의는 최소 1개 이상 선택해야 합니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const updates = {
      selected_outer: outer === '없음' ? '' : outer,
      selected_top: top,
      selected_bottom: bottom,
      selected_items: items,
      score,
      condition,
      memo: memo.trim() || undefined,
      total_insulation_score: totalScore,
    };

    try {
      const res = await updateOutfitLog(record.id, updates);
      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.error || '수정 저장에 실패했습니다.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-xl">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                착용 평가 데이터 수정
              </h3>
              <p className="text-xs text-slate-500">
                {record.user_name} 님 • 기준 기온 {record.target_temp}°C ({record.time_slot})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 실시간 계산 요약 배너 및 룰셋 표준 정보 */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-2 text-blue-950 font-medium">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  복장 커버 기온: <strong className="text-blue-700 font-bold">약 {coverTemp}°C</strong>{' '}
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ({relativeStatus.diff > 0 ? `+${relativeStatus.diff}` : relativeStatus.diff}°C)
                  </span>
                </span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border shadow-2xs ${relativeStatus.badgeStyle}`}>
                {relativeStatus.badgeText}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-blue-100/80 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-semibold text-slate-800">
                  기준 기온 ({record.target_temp}°C) 표준 구간: <strong className="text-blue-600">{rule.label}</strong>
                </span>
                <span className="text-slate-500 font-medium">
                  권장 보온 지수: <strong className="text-slate-700">{targetRange.label}</strong> (현재: <strong className="text-blue-700">{totalScore}점</strong>)
                </span>
              </div>
              <div className="text-slate-500 text-[10px] leading-relaxed">
                <span className="font-semibold text-slate-700">표준 추천 복장:</span>{' '}
                {rule.recommend.outer !== '없음' ? `[외투] ${rule.recommend.outer} • ` : ''}
                [상의] {rule.recommend.top.join(', ')} • [하의] {rule.recommend.bottom.join(', ')}
              </div>
            </div>
          </div>

          {/* 1. 외투 (단일 선택) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-slate-700 font-bold">외투 (단일 선택)</span>
              <div className="flex items-center gap-1.5">
                {outer && outer !== '없음' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                    <span>{outer}</span>
                    {isDiscontinuedItem(outer) && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">단종</span>
                    )}
                    <button
                      type="button"
                      onClick={handleClearOuter}
                      className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 hover:text-blue-900 transition-colors"
                      title="외투 선택 해제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">없음</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 scrollbar-thin">
              {outerOptions.map((opt) => {
                const isSelected = outer === opt;
                const isRecommended = opt !== '없음' && (rule.recommend.outer === opt || rule.outer.includes(opt));
                const isDiscontinued = isDiscontinuedItem(opt);

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleOuterSelect(opt)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 active:scale-95 ${getItemChipWarmthClasses(
                      opt,
                      'outer',
                      isSelected,
                      isRecommended
                    )}`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#fdfbf7] stroke-[2.5] shrink-0" />
                    )}
                    <span className={isSelected ? 'text-[#fdfbf7] font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        추천
                      </span>
                    )}
                    {isDiscontinued && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected
                            ? 'bg-rose-900/60 text-rose-200 border border-rose-400/40'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        단종
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 상의 (다중 선택, 최소 1개) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-slate-700 font-bold">상의 (다중 선택, 최소 1개)</span>
              <div className="flex items-center flex-wrap gap-1 justify-end">
                {top.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                  >
                    <span>{item}</span>
                    {isDiscontinuedItem(item) && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">단종</span>
                    )}
                    {top.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('top', item)}
                        className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 hover:text-blue-900 transition-colors"
                        title={`${item} 삭제`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 scrollbar-thin">
              {topOptions.map((opt) => {
                const isSelected = top.includes(opt);
                const isRecommended = rule.recommend.top.includes(opt) || rule.top.includes(opt);
                const isDiscontinued = isDiscontinuedItem(opt);

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleTop(opt)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 active:scale-95 ${getItemChipWarmthClasses(
                      opt,
                      'top',
                      isSelected,
                      isRecommended
                    )}`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#fdfbf7] stroke-[2.5] shrink-0" />
                    )}
                    <span className={isSelected ? 'text-[#fdfbf7] font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        추천
                      </span>
                    )}
                    {isDiscontinued && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected
                            ? 'bg-rose-900/60 text-rose-200 border border-rose-400/40'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        단종
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 하의 (다중 선택, 최소 1개) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-slate-700 font-bold">하의 (다중 선택, 최소 1개)</span>
              <div className="flex items-center flex-wrap gap-1 justify-end">
                {bottom.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                  >
                    <span>{item}</span>
                    {isDiscontinuedItem(item) && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">단종</span>
                    )}
                    {bottom.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('bottom', item)}
                        className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 hover:text-blue-900 transition-colors"
                        title={`${item} 삭제`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 scrollbar-thin">
              {bottomOptions.map((opt) => {
                const isSelected = bottom.includes(opt);
                const isRecommended = rule.recommend.bottom.includes(opt) || rule.bottom.includes(opt);
                const isDiscontinued = isDiscontinuedItem(opt);

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleBottom(opt)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 active:scale-95 ${getItemChipWarmthClasses(
                      opt,
                      'bottom',
                      isSelected,
                      isRecommended
                    )}`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#fdfbf7] stroke-[2.5] shrink-0" />
                    )}
                    <span className={isSelected ? 'text-[#fdfbf7] font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        추천
                      </span>
                    )}
                    {isDiscontinued && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected
                            ? 'bg-rose-900/60 text-rose-200 border border-rose-400/40'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        단종
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 소품 (다중 선택) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-slate-700 font-bold">소품 (ITEM)</span>
              <div className="flex items-center flex-wrap gap-1 justify-end">
                {items.length > 0 ? (
                  items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                    >
                      <span>{item}</span>
                      {isDiscontinuedItem(item) && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">단종</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('items', item)}
                        className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 hover:text-blue-900 transition-colors"
                        title={`${item} 삭제`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">없음</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 scrollbar-thin">
              {itemOptions.map((opt) => {
                const isSelected = items.includes(opt);
                const isRecommended = rule.recommend.item.includes(opt) || rule.item.includes(opt);
                const isDiscontinued = isDiscontinuedItem(opt);

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleItem(opt)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 active:scale-95 ${getItemChipWarmthClasses(
                      opt,
                      'items',
                      isSelected,
                      isRecommended
                    )}`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#fdfbf7] stroke-[2.5] shrink-0" />
                    )}
                    <span className={isSelected ? 'text-[#fdfbf7] font-bold' : 'text-[#0b192c] font-semibold'}>
                      {opt}
                    </span>
                    {isRecommended && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        추천
                      </span>
                    )}
                    {isDiscontinued && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected
                            ? 'bg-rose-900/60 text-rose-200 border border-rose-400/40'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        단종
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 체감 편차 / 만족도 점수 (-5°C ~ +5°C) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-bold">
                체감 편차 ({formatScoreTemp(score)})
              </label>
              <span className="text-[11px] text-slate-500">
                {score === 0 ? '딱 맞음 (0°C)' : score > 0 ? `더움 (+${score}°C)` : `추움 (${score}°C)`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="-5"
                max="5"
                step="1"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value, 10))}
                className="flex-1 cursor-pointer"
              />
              <span className="font-bold text-sm w-12 text-right text-slate-800">
                {formatScoreTemp(score)}
              </span>
            </div>
          </div>

          {/* 6. 컨디션 및 메모 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">컨디션</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as UserCondition)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="정상">정상</option>
                <option value="피곤">피곤</option>
                <option value="감기">감기</option>
                <option value="활동량많음">활동량많음</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">피드백 메모</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="착용 당시 느낌이나 메모를 입력하세요"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* 모달 푸터 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>수정 사항 저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
