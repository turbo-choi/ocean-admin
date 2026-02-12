/**
 * 최근 게시글/댓글 테이블 컴포넌트
 * API에서 최근 작성된 게시글과 댓글을 가져와 표시
 */
import React, { useEffect, useState } from 'react';
import { FileText, MessageSquare, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRecentPosts, RecentPost } from '../api/dashboard';

/**
 * 시간을 상대적 형식으로 변환
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

/**
 * 타입 배지 컴포넌트
 */
const TypeBadge: React.FC<{ type: RecentPost['type'] }> = ({ type }) => {
  const styles = {
    board: 'bg-blue-100 text-blue-800',
    comment: 'bg-purple-100 text-purple-800',
  };

  const labels = {
    board: '게시글',
    comment: '댓글',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}>
      {type === 'board' ? <FileText size={12} /> : <MessageSquare size={12} />}
      {labels[type]}
    </span>
  );
};

/**
 * 최근 게시글/댓글 테이블 컴포넌트
 * - 최근 작성된 게시글과 댓글을 시간순으로 표시
 * - 각 항목을 클릭하면 해당 게시글로 이동
 */
export const RecentPostsTable: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getRecentPosts(10);
        setPosts(data);
        setError(null);
      } catch (err) {
        setError('최근 게시글을 불러오는데 실패했습니다.');
        console.error('최근 게시글 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /**
   * 게시글 상세 페이지로 이동
   */
  const handleRowClick = (boardId: number) => {
    navigate(`/boards/${boardId}`);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-pulse">
        <div className="p-6 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-60" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">최근 게시글 & 댓글</h3>
        </div>
        <div className="p-6 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">최근 게시글 & 댓글</h3>
          <p className="text-sm text-gray-500">최근 작성된 게시글과 댓글 목록</p>
        </div>
        <button
          onClick={() => navigate('/board')}
          className="btn-ocean flex items-center gap-2 px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-ocean-500/30"
        >
          <ExternalLink size={16} />
          게시판 보기
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="p-4">유형</th>
              <th className="p-4">제목/내용</th>
              <th className="p-4">작성자</th>
              <th className="p-4">작성일</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  아직 작성된 게시글이나 댓글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-ocean-50/50 transition-colors group cursor-pointer"
                  onClick={() => handleRowClick(post.boardId)}
                >
                  <td className="p-4">
                    <TypeBadge type={post.type} />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <p className="font-medium text-gray-900 group-hover:text-ocean-600 transition-colors line-clamp-1">
                        {post.title}
                      </p>
                      {post.type === 'comment' && post.boardTitle && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          원글: {post.boardTitle}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-xs font-bold">
                        {post.author.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-gray-600">{post.author}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {formatTimeAgo(post.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{posts.length}</span>개 항목
        </p>
        <button
          onClick={() => navigate('/boards')}
          className="px-3 py-1 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
        >
          더보기 →
        </button>
      </div>
    </div>
  );
};

// 기존 컴포넌트 export 유지 (레거시 지원)
export const TransactionsTable = RecentPostsTable;
