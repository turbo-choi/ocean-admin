/**
 * 게시판 목록 페이지
 * 게시글 목록을 테이블 형태로 표시하고 페이지네이션, 검색 기능 제공
 * 동적 게시판 유형 지원 (slug 파라미터)
 */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Search, Plus, Eye, ChevronLeft, ChevronRight, FileText, MessageCircle } from 'lucide-react';
import { getBoards, Board, PaginatedResponse } from '../api/board';
import { getBoardTypeBySlug, BoardType } from '../api/boardType';

const BoardList: React.FC = () => {
    const { slug } = useParams<{ slug?: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [boards, setBoards] = useState<Board[]>([]);
    const [boardType, setBoardType] = useState<BoardType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    // URL에서 페이지와 검색어 파라미터 가져오기
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const limit = 10;

    // 게시판 유형 정보 조회
    useEffect(() => {
        const fetchBoardType = async () => {
            if (slug) {
                try {
                    const data = await getBoardTypeBySlug(slug);
                    setBoardType(data);
                } catch {
                    setBoardType(null);
                }
            } else {
                setBoardType(null);
            }
        };
        fetchBoardType();
    }, [slug]);

    // 게시글 목록 조회
    useEffect(() => {
        const fetchBoards = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getBoards(page, limit, search, slug);
                setBoards(response.data);
                setTotal(response.total);
                setTotalPages(response.totalPages);
            } catch (err) {
                setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchBoards();
    }, [page, search, slug]);

    // 검색 제출 핸들러
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams({ page: '1', search: searchInput });
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString(), search });
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-ocean-100 rounded-lg">
                        <FileText className="text-ocean-600" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{boardType?.name || '게시판'}</h3>
                        <p className="text-sm text-gray-500">총 {total}개의 게시글</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* 검색 폼 */}
                    <form onSubmit={handleSearch} className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="검색..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 pr-4 py-2 w-48 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                        />
                    </form>
                    {/* 글쓰기 버튼 */}
                    <Link
                        to={slug ? `/board/${slug}/write` : '/board/write'}
                        className="btn-ocean flex items-center gap-2 px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-ocean-500/30"
                    >
                        <Plus size={16} />
                        글쓰기
                    </Link>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* 테이블 */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="p-4 w-16 text-center">번호</th>
                            <th className="p-4">제목</th>
                            <th className="p-4 w-28">작성자</th>
                            <th className="p-4 w-32 whitespace-nowrap">작성일</th>
                            <th className="p-4 w-16 text-center">댓글</th>
                            <th className="p-4 w-16 text-center">조회</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                        {loading ? (
                            // 로딩 스켈레톤
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="p-4" colSpan={6}>
                                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : boards.length === 0 ? (
                            // 빈 상태
                            <tr>
                                <td className="p-8 text-center text-gray-500" colSpan={6}>
                                    게시글이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            // 게시글 목록
                            boards.map((board) => (
                                <tr key={board.id} className="hover:bg-ocean-50/50 transition-colors">
                                    <td className="p-4 text-center text-gray-500">{board.id}</td>
                                    <td className="p-4">
                                        <Link
                                            to={slug ? `/board/${slug}/${board.id}` : `/board/${board.id}`}
                                            className="font-medium text-gray-900 hover:text-ocean-600 transition-colors"
                                        >
                                            {board.title}
                                        </Link>
                                    </td>
                                    <td className="p-4 text-gray-600">{board.author}</td>
                                    <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(board.createdAt)}</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-gray-500">
                                            <MessageCircle size={14} />
                                            {board.commentCount || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-gray-500">
                                            <Eye size={14} />
                                            {board.viewCount}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span>
                        -
                        <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span>
                        {' '}/ {total}개
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pageNum === page
                                        ? 'text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    style={pageNum === page ? { backgroundColor: '#0da2e7' } : undefined}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardList;
