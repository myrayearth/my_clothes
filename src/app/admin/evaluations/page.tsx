'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/auth/AdminGuard';
import {
  fetchTemperatureEvaluations,
  updateTemperatureEvaluation,
  deleteTemperatureEvaluation,
  createTemperatureEvaluation,
} from '@/lib/storage';
import { TemperatureEvaluation, UserCondition } from '@/types/database';
import { ADMIN_EMAIL } from '@/lib/auth';
import { formatScoreTemp } from '@/lib/matcher';
import {
  Shirt,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Smile,
  Coffee,
  ThermometerSnowflake,
  Activity,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';

const TEMP_TIERS = [
  { min: 28, max: 50, label: '28°C 이상', desc: '한여름 (민소매, 반팔)' },
  { min: 23, max: 27.9, label: '23°C ~ 27°C', desc: '초여름/초가을 (반팔, 얇은 셔츠)' },
  { min: 20, max: 22.9, label: '20°C ~ 22°C', desc: '완연한 봄/가을 (긴팔, 가디건)' },
  { min: 17, max: 19.9, label: '17°C ~ 19°C', desc: '선선한 날씨 (니트, 맨투맨)' },
  { min: 12, max: 16.9, label: '12°C ~ 16°C', desc: '쌀쌀한 날씨 (자켓, 야상)' },
  { min: 9, max: 11.9, label: '9°C ~ 11°C', desc: '초겨울 (트렌치코트, 도톰한 니트)' },
  { min: 5, max: 8.9, label: '5°C ~ 8°C', desc: '겨울 (울코트, 가죽자켓)' },
  { min: -30, max: 4.9, label: '4°C 이하', desc: '한겨울 (패딩, 목도리)' },
];

export default function TemperatureEvaluationsAdminPage() {
  return (
    <AdminGuard>
      <EvaluationsDashboardContent />
    </AdminGuard>
  );
}

function EvaluationsDashboardContent() {
  const [evaluations, setEvaluations] = useState<TemperatureEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSlot, setFilterSlot] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterTempTier, setFilterTempTier] = useState<string>('all');

  // 모달 상태
  const [editingItem, setEditingItem] = useState<TemperatureEvaluation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTemperatureEvaluations();
      if (res.error) {
        setError(res.error);
      } else {
        setEvaluations(res.data);
      }
    } catch (err: any) {
      setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 알림 메시지 자동 숨김
  useEffect(() => {
    if (actionSuccessMsg) {
      const timer = setTimeout(() => setActionSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMsg]);

  // 필터링된 평가 데이터 목록
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      // 1. 텍스트 검색 (사용자명, 위치, 메모, 복장)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchUser = item.user_name.toLowerCase().includes(q);
        const matchLoc = item.location_name.toLowerCase().includes(q);
        const matchMemo = (item.memo || '').toLowerCase().includes(q);
        const matchOuter = item.selected_outer.toLowerCase().includes(q);
        const matchTop = item.selected_top.some((t) => t.toLowerCase().includes(q));
        const matchBottom = item.selected_bottom.some((b) => b.toLowerCase().includes(q));
        if (!matchUser && !matchLoc && !matchMemo && !matchOuter && !matchTop && !matchBottom) {
          return false;
        }
      }

      // 2. 시간대 필터
      if (filterSlot !== 'all' && item.time_slot !== filterSlot) {
        return false;
      }

      // 3. 점수 필터
      if (filterScore === 'cold' && item.score >= 0) return false;
      if (filterScore === 'perfect' && item.score !== 0) return false;
      if (filterScore === 'warm' && item.score <= 0) return false;

      // 4. 컨디션 필터
      if (filterCondition !== 'all' && item.condition !== filterCondition) {
        return false;
      }

      // 5. 기온 구간 필터
      if (filterTempTier !== 'all') {
        const tier = TEMP_TIERS.find((t) => t.label === filterTempTier);
        if (tier) {
          if (item.target_temp < tier.min || item.target_temp > tier.max) {
            return false;
          }
        }
      }

      return true;
    });
  }, [evaluations, searchQuery, filterSlot, filterScore, filterCondition, filterTempTier]);

  // KPI 통계 계산
  const stats = useMemo(() => {
    const total = evaluations.length;
    if (total === 0) {
      return {
        total: 0,
        avgScore: 0,
        perfectRate: 0,
        coldCount: 0,
        warmCount: 0,
        perfectCount: 0,
      };
    }

    let sumScore = 0;
    let perfect = 0;
    let cold = 0;
    let warm = 0;

    evaluations.forEach((item) => {
      sumScore += item.score;
      if (item.score === 0) perfect++;
      else if (item.score < 0) cold++;
      else warm++;
    });

    return {
      total,
      avgScore: Number((sumScore / total).toFixed(1)),
      perfectRate: Math.round((perfect / total) * 100),
      coldCount: cold,
      warmCount: warm,
      perfectCount: perfect,
    };
  }, [evaluations]);

  // 기온 구간별 분포 통계
  const tierDistribution = useMemo(() => {
    return TEMP_TIERS.map((tier) => {
      const itemsInTier = evaluations.filter(
        (e) => e.target_temp >= tier.min && e.target_temp <= tier.max
      );
      const count = itemsInTier.length;
      const avgOffset =
        count > 0
          ? (itemsInTier.reduce((acc, cur) => acc + cur.score, 0) / count).toFixed(1)
          : '0.0';
      return {
        ...tier,
        count,
        avgOffset,
        percentage: evaluations.length > 0 ? Math.round((count / evaluations.length) * 100) : 0,
      };
    });
  }, [evaluations]);

  // 점수 라벨 헬퍼
  const getScoreBadge = (score: number) => {
    const formatted = formatScoreTemp(score);
    if (score === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          ✨ 0°C (적정)
        </span>
      );
    }
    if (score < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          🥶 {formatted} (추움)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        🥵 {formatted} (더움)
      </span>
    );
  };

  // 컨디션 아이콘 헬퍼
  const getConditionIcon = (cond: UserCondition) => {
    switch (cond) {
      case '피곤':
        return <Coffee className="w-3.5 h-3.5 text-amber-500 inline mr-1" />;
      case '감기':
        return <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-500 inline mr-1" />;
      case '활동량많음':
        return <Activity className="w-3.5 h-3.5 text-rose-500 inline mr-1" />;
      default:
        return <Smile className="w-3.5 h-3.5 text-emerald-500 inline mr-1" />;
    }
  };

  // 항목 수정 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const res = await updateTemperatureEvaluation(editingItem.id, {
        score: editingItem.score,
        condition: editingItem.condition,
        memo: editingItem.memo,
        selected_outer: editingItem.selected_outer,
        target_temp: editingItem.target_temp,
        apparent_temp: editingItem.apparent_temp,
      });

      if (res.success) {
        setActionSuccessMsg('평가 데이터가 성공적으로 수정되었습니다.');
        setEditingItem(null);
        await loadData();
      } else {
        alert(res.error || '수정에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 항목 삭제 처리
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsSubmitting(true);
    try {
      const res = await deleteTemperatureEvaluation(deletingId);
      if (res.success) {
        setActionSuccessMsg('평가 데이터가 성공적으로 삭제되었습니다.');
        setDeletingId(null);
        await loadData();
      } else {
        alert(res.error || '삭제에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              title="메인 홈으로 이동"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    온도별 평가 데이터 관리
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    RBAC Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  기온 체감 피드백 분석 및 데이터베이스(RLS) 제어
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* 관리자 이메일 뱃지 */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ADMIN_EMAIL}</span>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>평가 수동 등록</span>
            </button>
          </div>
        </div>
      </header>

      {/* 액션 성공 메시지 알림 */}
      {actionSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* 에러 알림 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">데이터를 불러오지 못했습니다 (Supabase RLS 검증):</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 대시보드 메인 본문 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. 상단 KPI 통계 요약 카드 4종 */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">총 누적 평가</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total}건</div>
            <p className="text-[11px] text-slate-400 mt-1">Supabase DB 실시간 동기화</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">평균 체감 편차</span>
              <Thermometer className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.avgScore > 0 ? `+${stats.avgScore}` : stats.avgScore}°C
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.avgScore === 0
                ? '완벽한 적정 기온대'
                : stats.avgScore < 0
                ? '전반적으로 춥게 느낌'
                : '전반적으로 덥게 느낌'}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">적정(0°C) 평가율</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.perfectRate}%</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.perfectCount}건 적정 만족
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">추움 vs 더움 비율</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              <span className="text-blue-600">{stats.coldCount}</span>
              <span className="text-slate-300 mx-1">:</span>
              <span className="text-amber-600">{stats.warmCount}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">파랑: 춥다고 평가 / 주황: 덥다고 평가</p>
          </div>
        </section>

        {/* 3. 기온 구간별 체감 평가 차트 & 분포 분석 */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>8단계 기온 구간별 체감 평가 분포 차트</span>
              </h2>
              <p className="text-xs text-slate-500">
                각 기온 구간별 누적 평가 건수와 평균 체감 오차(°C)를 시각화합니다.
              </p>
            </div>
            <span className="text-xs text-slate-400">총 {stats.total}개 평가 기반</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {tierDistribution.map((tier) => (
              <div
                key={tier.label}
                className={`p-3.5 rounded-xl border transition-all ${
                  tier.count > 0
                    ? 'bg-slate-50/80 border-slate-200 hover:border-blue-300'
                    : 'bg-slate-50/40 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{tier.label}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{tier.count}건</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mb-2">{tier.desc}</p>

                {/* 프로그레스 바 */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-slate-500">평균 오차</span>
                  <span
                    className={`font-bold ${
                      Number(tier.avgOffset) === 0
                        ? 'text-emerald-600'
                        : Number(tier.avgOffset) < 0
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {Number(tier.avgOffset) > 0 ? `+${tier.avgOffset}` : tier.avgOffset}°C
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 검색 & 다중 필터 컨트롤 바 */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* 검색창 */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="사용자명, 위치, 메모, 복장 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 시간대 필터 */}
            <select
              value={filterSlot}
              onChange={(e) => setFilterSlot(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">시간대: 전체</option>
              <option value="08:00">08:00 (아침)</option>
              <option value="13:00">13:00 (낮)</option>
              <option value="19:00">19:00 (저녁)</option>
            </select>

            {/* 체감 점수 필터 */}
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">체감 평가: 전체</option>
              <option value="perfect">✨ 적정 (0°C)</option>
              <option value="cold">🥶 추움 (-5°C ~ -1°C)</option>
              <option value="warm">🥵 더움 (+1°C ~ +5°C)</option>
            </select>

            {/* 컨디션 필터 */}
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">컨디션: 전체</option>
              <option value="정상">정상</option>
              <option value="피곤">피곤 (-1.0°C)</option>
              <option value="감기">감기 (-2.5°C)</option>
              <option value="활동량많음">활동량많음 (+1.5°C)</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              필터 결과: <strong>{filteredEvaluations.length}</strong>건 (전체 {evaluations.length}건)
            </span>
            {(searchQuery || filterSlot !== 'all' || filterScore !== 'all' || filterCondition !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterSlot('all');
                  setFilterScore('all');
                  setFilterCondition('all');
                  setFilterTempTier('all');
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                필터 초기화
              </button>
            )}
          </div>
        </section>

        {/* 5. 평가 데이터 인터랙티브 테이블 */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-blue-600" />
              <span>평가 데이터 내역</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold">
              RLS Read/Write 허용 (관리자 전용)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                  <th className="py-3 px-4">작성일시</th>
                  <th className="py-3 px-4">사용자</th>
                  <th className="py-3 px-4">위치</th>
                  <th className="py-3 px-4">기온 / 체감</th>
                  <th className="py-3 px-4">시간대</th>
                  <th className="py-3 px-4">선택 복장</th>
                  <th className="py-3 px-4">체감 평가</th>
                  <th className="py-3 px-4">컨디션</th>
                  <th className="py-3 px-4">메모</th>
                  <th className="py-3 px-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      <span>평가 데이터를 불러오는 중...</span>
                    </td>
                  </tr>
                ) : filteredEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      조회된 평가 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 작성일시 */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* 사용자 */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {item.user_name}
                      </td>

                      {/* 위치 */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{item.location_name}</span>
                        </span>
                      </td>

                      {/* 기온 / 체감 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{item.target_temp}°C</span>
                        <span className="text-[10px] text-slate-400 block">
                          체감 {item.apparent_temp}°C
                        </span>
                      </td>

                      {/* 시간대 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold text-[11px]">
                          {item.time_slot}
                        </span>
                      </td>

                      {/* 선택 복장 */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="space-y-0.5 text-[11px]">
                          {item.selected_outer && item.selected_outer !== '없음' && (
                            <div>
                              <span className="text-slate-400 mr-1">[외투]</span>
                              <span className="font-medium text-slate-800">
                                {item.selected_outer}
                              </span>
                            </div>
                          )}
                          {item.selected_top && item.selected_top.length > 0 && (
                            <div>
                              <span className="text-slate-400 mr-1">[상의]</span>
                              <span className="text-slate-700">
                                {item.selected_top.join(', ')}
                              </span>
                            </div>
                          )}
                          {item.selected_bottom && item.selected_bottom.length > 0 && (
                            <div>
                              <span className="text-slate-400 mr-1">[하의]</span>
                              <span className="text-slate-700">
                                {item.selected_bottom.join(', ')}
                              </span>
                            </div>
                          )}
                          {item.selected_items && item.selected_items.length > 0 && (
                            <div className="text-slate-500">
                              <span className="text-slate-400 mr-1">[소품]</span>
                              <span>{item.selected_items.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 체감 평가 점수 */}
                      <td className="py-3 px-4 whitespace-nowrap">{getScoreBadge(item.score)}</td>

                      {/* 컨디션 */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {getConditionIcon(item.condition)}
                        <span>{item.condition}</span>
                      </td>

                      {/* 메모 */}
                      <td className="py-3 px-4 max-w-[180px] truncate text-slate-500" title={item.memo || ''}>
                        {item.memo || '-'}
                      </td>

                      {/* 관리 동작 */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingItem({ ...item })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* 6. 수정 모달 */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">평가 데이터 수정</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">사용자</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.user_name}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">기온 (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.target_temp}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        target_temp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">체감 기온 (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.apparent_temp}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        apparent_temp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  체감 점수 편차 (-5°C ~ +5°C)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="1"
                    value={editingItem.score}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, score: parseInt(e.target.value, 10) })
                    }
                    className="flex-1"
                  />
                  <span className="font-bold text-sm w-12 text-right">
                    {formatScoreTemp(editingItem.score)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">컨디션</label>
                <select
                  value={editingItem.condition}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      condition: e.target.value as UserCondition,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="정상">정상</option>
                  <option value="피곤">피곤</option>
                  <option value="감기">감기</option>
                  <option value="활동량많음">활동량많음</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">메모</label>
                <textarea
                  rows={2}
                  value={editingItem.memo || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, memo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="피드백 메모"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '변경사항 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. 삭제 확인 모달 */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-rose-200 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">평가 데이터 삭제</h3>
              <p className="text-xs text-slate-500 mt-1">
                정말 이 평가 기록을 삭제하시겠습니까? 데이터베이스(Supabase)에서 영구 제거됩니다.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex-1"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex-1 disabled:opacity-50"
              >
                {isSubmitting ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 수동 평가 등록 모달 */}
      <ManualAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={async () => {
          setIsAddModalOpen(false);
          setActionSuccessMsg('신규 평가 데이터가 등록되었습니다.');
          await loadData();
        }}
      />
    </div>
  );
}

// 수동 등록 모달 컴포넌트
function ManualAddModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [userName, setUserName] = useState<string>('관리자 테스트');
  const [targetTemp, setTargetTemp] = useState<number>(15.0);
  const [apparentTemp, setApparentTemp] = useState<number>(14.0);
  const [timeSlot, setTimeSlot] = useState<string>('13:00');
  const [outer, setOuter] = useState<string>('가디건');
  const [top, setTop] = useState<string>('셔츠');
  const [bottom, setBottom] = useState<string>('청바지');
  const [score, setScore] = useState<number>(0);
  const [condition, setCondition] = useState<UserCondition>('정상');
  const [memo, setMemo] = useState<string>('관리자 수동 벤치마크 데이터');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createTemperatureEvaluation({
        user_name: userName.trim() || '관리자',
        location_name: '서울특별시, 대한민국',
        target_temp: targetTemp,
        apparent_temp: apparentTemp,
        time_slot: timeSlot,
        selected_outer: outer,
        selected_top: top ? top.split(',').map((s) => s.trim()) : [],
        selected_bottom: bottom ? bottom.split(',').map((s) => s.trim()) : [],
        selected_items: [],
        score,
        condition,
        memo: memo.trim() || null,
      });

      if (res.success) {
        onSaved();
      } else {
        alert(res.error || '등록 실패');
      }
    } catch (e: any) {
      alert(e.message || '오류 발생');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">신규 평가 데이터 등록</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">사용자명</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-bold mb-1">기온 (°C)</label>
              <input
                type="number"
                step="0.1"
                value={targetTemp}
                onChange={(e) => setTargetTemp(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">체감 기온 (°C)</label>
              <input
                type="number"
                step="0.1"
                value={apparentTemp}
                onChange={(e) => setApparentTemp(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-bold mb-1">시간대</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="08:00">08:00 (아침)</option>
                <option value="13:00">13:00 (낮)</option>
                <option value="19:00">19:00 (저녁)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">컨디션</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as UserCondition)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="정상">정상</option>
                <option value="피곤">피곤</option>
                <option value="감기">감기</option>
                <option value="활동량많음">활동량많음</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">외투</label>
            <input
              type="text"
              value={outer}
              onChange={(e) => setOuter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-bold mb-1">상의 (쉼표 구분)</label>
              <input
                type="text"
                value={top}
                onChange={(e) => setTop(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">하의 (쉼표 구분)</label>
              <input
                type="text"
                value={bottom}
                onChange={(e) => setBottom(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">
              체감 점수 ({formatScoreTemp(score)})
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="1"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">메모</label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
