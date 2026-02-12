/**
 * 댓글 섹션 컴포넌트
 * 댓글 목록 표시, 작성, 수정, 삭제 기능
 * 작성자는 로그인한 사용자로 자동 설정, 수정/삭제는 본인 또는 관리자만 가능
 */
import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Edit2, Trash2, X, Check } from 'lucide-react';
import { getComments, createComment, updateComment, deleteComment, Comment } from '../api/board';
import { useAuth } from '../contexts/AuthContext';

interface CommentSectionProps {
    boardId: number;
    initialComments?: Comment[] | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ boardId, initialComments = null }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
    const [loading, setLoading] = useState(initialComments === null);
    const [error, setError] = useState<string | null>(null);

    // 새 댓글 작성
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 댓글 수정
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (initialComments !== null) {
            setComments(initialComments);
            setLoading(false);
            setError(null);
            return;
        }

        let active = true;
        const fetchComments = async () => {
            setLoading(true);
            try {
                const response = await getComments(boardId);
                if (!active) return;
                setComments(response.data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : '댓글을 불러올 수 없습니다.');
            } finally {
                if (!active) return;
                setLoading(false);
            }
        };

        fetchComments();

        return () => {
            active = false;
        };
    }, [boardId, initialComments]);

    /**
     * 댓글 수정/삭제 권한 확인
     * 작성자 본인 또는 관리자만 가능
     */
    const canEditOrDelete = (comment: Comment): boolean => {
        if (!user) return false;
        // userId가 있으면 ID로 비교, 없으면 이름으로 비교 (기존 데이터 호환)
        const isOwner = comment.userId
            ? comment.userId === user.id
            : comment.author === user.name;
        const isAdmin = user.role === 'admin';
        return isOwner || isAdmin;
    };

    // 댓글 작성
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim() || !user) return;

        setSubmitting(true);
        try {
            const newComment = await createComment(boardId, {
                content: newContent.trim(),
            });
            setComments((currentComments) => [...currentComments, newComment]);
            setNewContent('');
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 댓글 수정 시작
    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    // 댓글 수정 취소
    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    // 댓글 수정 저장
    const saveEdit = async (commentId: number) => {
        if (!editContent.trim()) return;

        try {
            const updated = await updateComment(boardId, commentId, editContent.trim());
            setComments((currentComments) =>
                currentComments.map((comment) => (comment.id === commentId ? updated : comment))
            );
            setEditingId(null);
            setEditContent('');
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '댓글 수정에 실패했습니다.');
        }
    };

    // 댓글 삭제
    const handleDelete = async (commentId: number) => {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;

        try {
            await deleteComment(boardId, commentId);
            setComments((currentComments) =>
                currentComments.filter((comment) => comment.id !== commentId)
            );
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.');
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <MessageCircle className="text-ocean-500" size={20} />
                <h3 className="font-bold text-gray-900">댓글 {comments.length > 0 && `(${comments.length})`}</h3>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* 댓글 목록 */}
            <div className="divide-y divide-gray-100">
                {loading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-100 rounded w-1/4" />
                                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                                {/* 아바타 */}
                                <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-xs font-bold shrink-0">
                                    {comment.author.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* 헤더 */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                                        <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                                        {comment.createdAt !== comment.updatedAt && (
                                            <span className="text-xs text-gray-400">(수정됨)</span>
                                        )}
                                    </div>

                                    {/* 내용 (수정 모드) */}
                                    {editingId === comment.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => saveEdit(comment.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                    )}
                                </div>

                                {/* 액션 버튼 (작성자 또는 관리자만) */}
                                {editingId !== comment.id && canEditOrDelete(comment) && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => startEdit(comment)}
                                            className="p-1.5 text-gray-400 hover:text-ocean-500 hover:bg-gray-100 rounded transition-colors"
                                            title="수정"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 댓글 작성 폼 (로그인한 경우만) */}
            {user ? (
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="댓글을 입력하세요..."
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                                    maxLength={1000}
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !newContent.trim()}
                                    className="btn-ocean px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Send size={14} />
                                    {submitting ? '등록 중...' : '등록'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-gray-500 text-sm">
                    댓글을 작성하려면 로그인이 필요합니다.
                </div>
            )}
        </div>
    );
};

export default CommentSection;
