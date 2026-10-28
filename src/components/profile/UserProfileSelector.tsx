'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/types/database';
import { createProfile } from '@/lib/storage';
import { User, ChevronDown, Plus, Check, Loader2, UserPlus, X } from 'lucide-react';

interface UserProfileSelectorProps {
  currentUserName: string;
  profiles: UserProfile[];
  onSelectUser: (name: string) => void;
  onProfileCreated: () => void;
}

export const UserProfileSelector: React.FC<UserProfileSelectorProps> = ({
  currentUserName,
  profiles,
  onSelectUser,
  onProfileCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUserName.trim();
    if (!trimmed) return;

    if (profiles.some((p) => p.name === trimmed)) {
      setError('이미 존재하는 사용자 이름입니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createProfile(trimmed);
      setNewUserName('');
      setIsAdding(false);
      onProfileCreated();
      onSelectUser(trimmed);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || '사용자 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 touch-manipulation shadow-2xs"
        title="현재 사용자 프로필 전환"
      >
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
          {currentUserName.slice(0, 1)}
        </div>
        <span className="max-w-[100px] sm:max-w-[130px] truncate">{currentUserName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* 드롭다운 모달 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>사용자 전환</span>
            </span>
            <span className="text-[10px] text-slate-400">
              총 {profiles.length}명
            </span>
          </div>

          {/* 등록된 사용자 목록 */}
          <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
            {profiles.map((p) => {
              const isSelected = p.name === currentUserName;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectUser(p.name);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.name.slice(0, 1)}
                    </div>
                    <span className="truncate">{p.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* 신규 사용자 추가 섹션 */}
          <div className="pt-2 border-t border-slate-100">
            {!isAdding ? (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 rounded-xl transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ 새 사용자 추가</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewUser} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => {
                      setNewUserName(e.target.value);
                      setError(null);
                    }}
                    placeholder="새 사용자 이름 입력..."
                    maxLength={15}
                    autoFocus
                    className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newUserName.trim()}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      '추가'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewUserName('');
                      setError(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {error && <p className="text-[10px] text-rose-500 font-medium">{error}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
