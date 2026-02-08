/**
 * 게시글 작성/수정 페이지
 * 제목과 내용을 입력받아 게시글을 작성하거나 수정
 * 작성자는 로그인한 사용자로 자동 설정됨
 * 동적 게시판 지원 (slug 파라미터)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { createBoard, updateBoard, getBoard } from '../api/board';
import { getBoardTypeBySlug, BoardType } from '../api/boardType';
import { useAuth } from '../contexts/AuthContext';

const BoardWrite: React.FC = () => {
    const { id, slug } = useParams<{ id?: string; slug?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [boardType, setBoardType] = useState<BoardType | null>(null);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 게시판 유형 조회
    useEffect(() => {
        const fetchBoardType = async () => {
            if (slug) {
                try {
                    const data = await getBoardTypeBySlug(slug);
                    setBoardType(data);
                } catch {
                    setBoardType(null);
                }
            }
        };
        fetchBoardType();
    }, [slug]);

    // 수정 모드일 때 기존 게시글 로드
    useEffect(() => {
        if (!id) return;

        const fetchBoard = async () => {
            try {
                const data = await getBoard(parseInt(id));
                setTitle(data.title);
                setContent(data.content);
            } catch (err) {
                setError(err instanceof Error ? err.message : '게시글을 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchBoard();
    }, [id]);

    // 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 유효성 검사
        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setError('내용을 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const basePath = slug ? `/board/${slug}` : '/board';
            if (isEdit) {
                await updateBoard(parseInt(id!), { title, content });
                navigate(`${basePath}/${id}`, { replace: true });
            } else {
                const newBoard = await createBoard({ title, content, boardTypeId: boardType?.id });
                navigate(`${basePath}/${newBoard.id}`, { replace: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-100 rounded" />
                    <div className="h-40 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-500 hover:text-ocean-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-ocean-100 rounded-lg">
                        <FileText className="text-ocean-600" size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">
                        {isEdit ? '게시글 수정' : '새 글 작성'}
                    </h1>
                </div>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* 에러 메시지 */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* 작성자 표시 (읽기 전용) */}
                {!isEdit && user && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            작성자
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
                            {user.name}
                        </div>
                    </div>
                )}

                {/* 제목 */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                        maxLength={200}
                    />
                </div>

                {/* 내용 */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 입력하세요"
                        rows={12}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none resize-y"
                    />
                </div>

                {/* 버튼 */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-ocean flex items-center gap-2 px-6 py-3 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-ocean-500/30 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {submitting ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BoardWrite;
