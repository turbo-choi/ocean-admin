/**
 * 게시글 상세 페이지
 * 게시글 내용을 표시하고 수정/삭제 기능 제공
 * 수정/삭제는 작성자 본인 또는 관리자만 가능
 * 동적 게시판 지원 (slug 파라미터)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Clock, User, Eye } from 'lucide-react';
import { getBoard, getComments, deleteBoard, Board, Comment } from '../api/board';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from '../components/CommentSection';

const BoardDetail: React.FC = () => {
    const { id, slug } = useParams<{ id: string; slug?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [board, setBoard] = useState<Board | null>(null);
    const [initialComments, setInitialComments] = useState<Comment[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // 목록 경로 (slug 있으면 해당 게시판, 없으면 기본)
    const listPath = slug ? `/board/${slug}` : '/board';

    // 조회수 API 중복 호출 방지 (React StrictMode 대응)
    const hasViewed = useRef<string | null>(null);

    // 게시글/댓글 병렬 조회
    useEffect(() => {
        if (!id) {
            setError('게시글 ID가 유효하지 않습니다.');
            setLoading(false);
            return;
        }

        const boardId = Number.parseInt(id, 10);
        if (Number.isNaN(boardId)) {
            setError('게시글 ID가 유효하지 않습니다.');
            setLoading(false);
            return;
        }

        // 이미 같은 게시글 데이터가 있으면 다시 로드하지 않음 (React StrictMode 대응)
        // 단, ID가 변경되면 새로 로드
        if (hasViewed.current === id && board !== null) {
            setLoading(false);
            return;
        }

        let active = true;
        const fetchBoard = async () => {
            setLoading(true);
            setError(null);
            setInitialComments(null);
            try {
                const [boardResult, commentsResult] = await Promise.allSettled([
                    getBoard(boardId),
                    getComments(boardId),
                ]);

                if (!active) return;

                if (boardResult.status === 'rejected') {
                    throw boardResult.reason;
                }

                setBoard(boardResult.value);
                setInitialComments(
                    commentsResult.status === 'fulfilled' ? commentsResult.value.data : null
                );
                hasViewed.current = id;
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
            } finally {
                if (!active) return;
                setLoading(false);
            }
        };

        fetchBoard();

        return () => {
            active = false;
        };
    }, [id, board]);

    /**
     * 게시글 수정/삭제 권한 확인
     * 작성자 본인 또는 관리자만 가능
     */
    const canEditOrDelete = (): boolean => {
        if (!user || !board) return false;
        // userId가 있으면 ID로 비교, 없으면 이름으로 비교 (기존 데이터 호환)
        const isOwner = board.userId
            ? board.userId === user.id
            : board.author === user.name;
        const isAdmin = user.role === 'admin';
        return isOwner || isAdmin;
    };

    // 삭제 핸들러
    const handleDelete = async () => {
        if (!board || !confirm('정말 삭제하시겠습니까?')) return;

        setDeleting(true);
        try {
            await deleteBoard(board.id);
            navigate(listPath, { replace: true });
        } catch (err) {
            alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
            setDeleting(false);
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

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-40 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    if (error || !board) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-red-500 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                    목록으로
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 헤더 */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-ocean-600 transition-colors text-sm"
                        >
                            <ArrowLeft size={18} />
                            목록으로
                        </button>
                        {/* 수정/삭제 버튼 (권한 있는 경우만 표시) */}
                        {canEditOrDelete() && (
                            <div className="flex items-center gap-2">
                                <Link
                                    to={`${listPath}/edit/${board.id}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Edit size={16} />
                                    수정
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    {deleting ? '삭제 중...' : '삭제'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 제목 */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{board.title}</h1>

                    {/* 메타 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                            <User size={14} />
                            {board.author}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatDate(board.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Eye size={14} />
                            조회 {board.viewCount}
                        </span>
                    </div>
                </div>

                {/* 본문 */}
                <div className="p-6">
                    <div className="prose prose-gray max-w-none whitespace-pre-wrap">
                        {board.content}
                    </div>
                </div>
            </div>

            {/* 댓글 섹션 */}
            <CommentSection boardId={board.id} initialComments={initialComments} />
        </>
    );
};

export default BoardDetail;
