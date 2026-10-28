'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/types/database';
import { createProfile, updateProfile, deleteProfile } from '@/lib/storage';
import {
  User,
  ChevronDown,
  Check,
  Loader2,
  UserPlus,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

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

  // 신규 사용자 추가 상태
  const [newUserName, setNewUserName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 사용자 이름 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 사용자 삭제 확인 상태
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기 및 모드 초기화
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setEditingId(null);
        setDeletingId(null);
        setAddError(null);
        setEditError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. 신규 사용자 생성
  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUserName.trim();
    if (!trimmed) return;

    if (profiles.some((p) => p.name === trimmed)) {
      setAddError('이미 존재하는 사용자 이름입니다.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);
    try {
      await createProfile(trimmed);
      setNewUserName('');
      setIsAdding(false);
      onProfileCreated();
      onSelectUser(trimmed);
      setIsOpen(false);
    } catch (err: any) {
      setAddError(err.message || '사용자 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. 사용자 수정 진입
  const handleStartEdit = (e: React.MouseEvent, profile: UserProfile) => {
    e.stopPropagation();
    setDeletingId(null);
    setEditingId(profile.id);
    setEditName(profile.name);
    setEditError(null);
  };

  // 2-1. 사용자 이름 저장
  const handleSaveEdit = async (e: React.FormEvent, profile: UserProfile) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('이름을 입력해주세요.');
      return;
    }

    if (trimmed === profile.name) {
      setEditingId(null);
      return;
    }

    if (profiles.some((p) => p.id !== profile.id && p.name === trimmed)) {
      setEditError('이미 존재하는 사용자 이름입니다.');
      return;
    }

    setIsUpdating(true);
    setEditError(null);
    try {
      await updateProfile(profile.id, profile.name, trimmed);
      if (profile.name === currentUserName) {
        onSelectUser(trimmed);
      }
      onProfileCreated();
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || '수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. 사용자 삭제 진입
  const handleStartDelete = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    setEditingId(null);
    setDeletingId(profileId);
  };

  // 3-1. 사용자 삭제 확정
  const handleConfirmDelete = async (e: React.MouseEvent, profile: UserProfile) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProfile(profile.id, profile.name);
      if (profile.name === currentUserName) {
        const remaining = profiles.filter((p) => p.id !== profile.id);
        onSelectUser(remaining[0]?.name || '기본 사용자');
      }
      onProfileCreated();
      setDeletingId(null);
    } catch (err: any) {
      console.error('사용자 삭제 오류:', err);
    } finally {
      setIsDeleting(false);
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
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1">
          {/* 모달 상단 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>사용자 관리</span>
            </span>
            <span className="text-[10px] text-slate-400">
              총 {profiles.length}명 (클라우드 동기화)
            </span>
          </div>

          {/* 등록된 사용자 목록 */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5">
            {profiles.map((p) => {
              const isSelected = p.name === currentUserName;
              const isEditingThis = editingId === p.id;
              const isDeletingThis = deletingId === p.id;

              // 1. 삭제 확인 모드 UI
              if (isDeletingThis) {
                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150"
                  >
                    <div className="flex items-start gap-1.5 text-rose-800 text-[11px] font-medium leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>&apos;{p.name}&apos;</strong> 사용자를 삭제하시겠습니까? 관련 복장 기록도 함께 정리됩니다.
                      </span>
                    </div>

                    {profiles.length <= 1 ? (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-rose-500 font-semibold">
                          최소 1명의 사용자가 필요합니다.
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg text-slate-700"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-medium rounded-lg text-slate-700"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleConfirmDelete(e, p)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            '삭제 확정'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // 2. 수정 모드 UI
              if (isEditingThis) {
                return (
                  <form
                    key={p.id}
                    onSubmit={(e) => handleSaveEdit(e, p)}
                    className="p-2 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setEditError(null);
                        }}
                        autoFocus
                        maxLength={15}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-blue-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <button
                        type="submit"
                        disabled={isUpdating || !editName.trim()}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        title="저장"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                          setEditError(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="취소"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {editError && (
                      <p className="text-[10px] text-rose-500 font-medium px-0.5">{editError}</p>
                    )}
                  </form>
                );
              }

              // 3. 기본 일반 모드 UI
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectUser(p.name);
                    setIsOpen(false);
                  }}
                  className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.name.slice(0, 1)}
                    </div>
                    <span className="truncate">{p.name}</span>
                    {isSelected && (
                      <span className="text-[9px] px-1 py-0.2 bg-blue-600 text-white font-semibold rounded shrink-0">
                        현재
                      </span>
                    )}
                  </div>

                  {/* 우측 액션 버튼들 (이름 편집 & 삭제) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(e, p)}
                      title="이름 수정"
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all opacity-80 group-hover:opacity-100"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleStartDelete(e, p.id)}
                      title="사용자 삭제"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-all opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 신규 사용자 추가 섹션 */}
          <div className="pt-2 border-t border-slate-100">
            {!isAdding ? (
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setEditingId(null);
                  setDeletingId(null);
                }}
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
                      setAddError(null);
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
                      setAddError(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {addError && <p className="text-[10px] text-rose-500 font-medium">{addError}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
