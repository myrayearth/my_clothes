'use client';

import React from 'react';
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
} from 'lucide-react';

interface HistoryRecallCardProps {
  recalls: MatchedRecallRecord[];
  onApplyOutfit: (outfit: OutfitSelection) => void;
}

export const HistoryRecallCard: React.FC<HistoryRecallCardProps> = ({
  recalls,
  onApplyOutfit,
}) => {
  if (!recalls || recalls.length === 0) {
    return null;
  }

  const displayRecalls = recalls.slice(0, 3);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">
            과거 체감 기록 기반 지능형 리콜
          </h3>
          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
            {recalls.length}건 매칭 (±2°C)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {displayRecalls.map((item, idx) => {
          const { log, category, categoryTitle, categoryBadge, guidanceMessage } = item;
          const formattedDate = new Date(log.created_at).toLocaleDateString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
          });
          const formattedDev = formatScoreTemp(log.score);

          let themeStyles = {
            container: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950',
            badge: 'bg-emerald-600 text-white',
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
            button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          };

          if (category === 'cold_warning') {
            themeStyles = {
              container: 'bg-sky-50/80 border-sky-200/90 text-sky-950',
              badge: 'bg-sky-600 text-white',
              icon: <Snowflake className="w-4 h-4 text-sky-600 shrink-0" />,
              button: 'bg-sky-600 hover:bg-sky-700 text-white',
            };
          } else if (category === 'warm_warning') {
            themeStyles = {
              container: 'bg-amber-50/80 border-amber-200/90 text-amber-950',
              badge: 'bg-amber-600 text-white',
              icon: <Flame className="w-4 h-4 text-amber-600 shrink-0" />,
              button: 'bg-amber-600 hover:bg-amber-700 text-white',
            };
          }

          const targetOutfit: OutfitSelection = {
            outer: log.selected_outer,
            top: log.selected_top,
            bottom: log.selected_bottom,
            items: log.selected_items || [],
          };

          return (
            <div
              key={log.id || idx}
              className={`rounded-2xl p-4 sm:p-5 border shadow-2xs transition-all relative ${themeStyles.container}`}
            >
              {/* 상단 뱃지 및 메타 정보 */}
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {themeStyles.icon}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${themeStyles.badge}`}>
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
              <p className="text-xs font-semibold mt-1 mb-2.5 leading-relaxed">
                {guidanceMessage}
              </p>

              {/* 당시 착용했던 복장 요약 */}
              <div className="bg-white/95 rounded-xl p-3 border border-slate-200/60 text-xs text-slate-800 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                    당시 착용 복장:
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                    컨디션: {log.condition}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-medium leading-normal">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                    외투: <strong>{log.selected_outer}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                    상의: <strong>{log.selected_top}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                    하의: <strong>{log.selected_bottom}</strong>
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
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onApplyOutfit(targetOutfit)}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-2xs active:scale-95 touch-manipulation ${themeStyles.button}`}
                >
                  <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                  <span>이 조합 그대로 선택기에 적용</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
