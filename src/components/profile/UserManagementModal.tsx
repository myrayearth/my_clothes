'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types/database';
import { createProfile, updateProfile, deleteProfile } from '@/lib/storage';
import {
  Settings,
  X,
  UserPlus,
  Pencil,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  User,
  Clock,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName: string;
  profiles: UserProfile[];
  onSelectUser: (name: string, id?: string) => void;
  onProfilesChanged: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserName,
  profiles,
  onSelectUser,
  onProfilesChanged,
}) => {
  // 신규 사용자 추가 상태
  const [newUserName, setNewUserName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 사용자 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 사용자 삭제 상태
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  // 1. 신규 사용자 추가
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUserName.trim();
    if (!trimmed) {
      setAddError('사용자 이름을 입력해주세요.');
      return;
    }

    if (profiles.some((p) => p.name === trimmed)) {
      setAddError('이미 존재하는 사용자 이름입니다.');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      const created = await createProfile(trimmed);
      setNewUserName('');
      onProfilesChanged();
      onSelectUser(created.name, created.id);
    } catch (err: any) {
      setAddError(err.message || '사용자 생성에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 2. 수정 진입
  const handleStartEdit = (profile: UserProfile) => {
    setDeletingId(null);
    setEditingId(profile.id);
    setEditName(profile.name);
    setEditError(null);
  };

  // 2-1. 수정 저장
  const handleSaveEdit = async (e: React.FormEvent, profile: UserProfile) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('사용자 이름을 입력해주세요.');
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
      const updated = await updateProfile(profile.id, profile.name, trimmed);
      if (profile.name === currentUserName) {
        onSelectUser(updated.name, updated.id);
      }
      onProfilesChanged();
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || '사용자 이름 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. 삭제 진입
  const handleStartDelete = (profileId: string) => {
    setEditingId(null);
    setDeletingId(profileId);
  };

  // 3-1. 삭제 확정
  const handleConfirmDelete = async (profile: UserProfile) => {
    if (profiles.length <= 1) return;

    setIsDeleting(true);
    try {
      await deleteProfile(profile.id, profile.name);
      // 만약 현재 선택된 사용자가 삭제된 경우 다른 사용자로 자동 전환
      if (profile.name === currentUserName) {
        const remaining = profiles.filter((p) => p.id !== profile.id);
        if (remaining.length > 0) {
          onSelectUser(remaining[0].name, remaining[0].id);
        } else {
          onSelectUser('기본 사용자');
        }
      }
      onProfilesChanged();
      setDeletingId(null);
    } catch (err: any) {
      console.error('사용자 삭제 오류:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
        d.getDate()
      ).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        {/* 모달 상단 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100/80 text-blue-700 rounded-xl">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                사용자 관리 (편집 / 삭제)
              </h3>
              <p className="text-xs text-slate-500">
                사용자 이름을 변경하거나 삭제할 수 있으며 Supabase DB와 실시간 동기화됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* 1. 신규 사용자 추가 영역 */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>새 사용자 등록</span>
            </span>

            <form onSubmit={handleAddUser} className="flex gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => {
                  setNewUserName(e.target.value);
                  setAddError(null);
                }}
                placeholder="추가할 사용자 이름 입력..."
                maxLength={15}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
              />
              <button
                type="submit"
                disabled={isAdding || !newUserName.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>추가</span>
              </button>
            </form>
            {addError && <p className="text-xs text-rose-500 font-medium px-1">{addError}</p>}
          </div>

          {/* 2. 등록된 사용자 목록 영역 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>등록된 사용자 ({profiles.length}명)</span>
              <span className="text-blue-600 font-semibold">
                현재 활성: {currentUserName}
              </span>
            </div>

            <div className="space-y-2">
              {profiles.map((p) => {
                const isSelected = p.name === currentUserName;
                const isEditingThis = editingId === p.id;
                const isDeletingThis = deletingId === p.id;

                // 2-A. 삭제 확인 상태
                if (isDeletingThis) {
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150"
                    >
                      <div className="flex items-start gap-2 text-rose-900 text-xs font-medium leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          정말 삭제하시겠습니까? <strong>&apos;{p.name}&apos;</strong> 사용자의 기존 복장 기록도 함께 삭제됩니다.
                        </span>
                      </div>

                      {profiles.length <= 1 ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-rose-600 font-bold">
                            최소 1명의 사용자가 필요하므로 삭제할 수 없습니다.
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-700"
                          >
                            확인
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium rounded-xl text-slate-700 active:scale-95 transition-all"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(p)}
                            disabled={isDeleting}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            <span>삭제 확정</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // 2-B. 수정 입력 상태
                if (isEditingThis) {
                  return (
                    <form
                      key={p.id}
                      onSubmit={(e) => handleSaveEdit(e, p)}
                      className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            setEditError(null);
                          }}
                          autoFocus
                          maxLength={15}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <button
                          type="submit"
                          disabled={isUpdating || !editName.trim()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shrink-0 active:scale-95 shadow-2xs"
                        >
                          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>저장</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditError(null);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {editError && <p className="text-xs text-rose-500 font-medium px-1">{editError}</p>}
                    </form>
                  );
                }

                // 2-C. 일반 사용자 행
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.name.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">{p.name}</span>
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-600 text-white font-semibold rounded-md shrink-0">
                              현재 선택됨
                            </span>
                          )}
                        </div>
                        {p.created_at && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(p.created_at)} 생성</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 우측 버튼 액션 (선택, 수정, 삭제) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectUser(p.name, p.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          선택
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        title="사용자 이름 수정 (연필)"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDelete(p.id)}
                        title="사용자 삭제 (휴지통)"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 모달 하단 푸터 */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            총 {profiles.length}명의 프로필이 연동 중입니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-2xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
