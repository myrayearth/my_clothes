'use client';

import React from 'react';
import { OutfitCategory } from '@/types/outfit';
import { getAllUniqueCategoryItems } from '@/lib/outfit';
import { X, Check, Shirt } from 'lucide-react';

interface AllItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: OutfitCategory;
  categoryTitle: string;
  selectedItems: string[]; // outer의 경우 단일 문자열이 1개 원소로 전달됨
  onToggleItem: (item: string) => void;
  isSingleSelect?: boolean;
}

export const AllItemsModal: React.FC<AllItemsModalProps> = ({
  isOpen,
  onClose,
  category,
  categoryTitle,
  selectedItems,
  onToggleItem,
  isSingleSelect = false,
}) => {
  if (!isOpen) return null;

  const allItemsMap = getAllUniqueCategoryItems();
  const rawItems = allItemsMap[category] || [];
  // OUTER에서 '없음' 항목 제외
  const allCategoryItems = category === 'outer' ? rawItems.filter((i) => i !== '없음') : rawItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* 모달 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Shirt className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {categoryTitle} 전체 의류 카탈로그
              </h3>
              <p className="text-[11px] text-slate-500">
                사계절 전체 룰셋에서 원하는 옷을 직접 선택하세요 ({isSingleSelect ? '단일 선택' : '다중 선택'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 아이템 목록 그리드 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>총 {allCategoryItems.length}개 의류 아이템</span>
            <span className="text-blue-600 font-semibold">
              현재 {selectedItems.filter((x) => x && x !== '없음').length}개 선택됨
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {allCategoryItems.map((item) => {
              const isSelected = selectedItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleItem(item)}
                  title={
                    isSingleSelect
                      ? isSelected
                        ? '클릭하여 선택 해제'
                        : `${item} 선택`
                      : (category === 'top' || category === 'bottom') && isSelected && selectedItems.length === 1
                      ? '최소 1개 선택이 유지되어야 합니다 (다른 옷을 추가 후 해제 가능)'
                      : isSelected
                      ? '클릭하여 선택 해제'
                      : '선택 추가'
                  }
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 touch-manipulation select-none flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};
