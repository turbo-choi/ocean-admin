/**
 * 대시보드 페이지
 * 실시간 통계 및 최근 활동을 표시
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { StatsCard } from '../components/StatsCard';
import { RecentActivity } from '../components/RecentActivity';
import { RecentPostsTable } from '../components/TransactionsTable';
import { Users, FileText, MessageSquare, Activity } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '../api/dashboard';

// 차트는 레이지 로딩
const PostChart = lazy(() =>
    import('../components/RevenueChart').then((module) => ({ default: module.PostChart }))
);

/**
 * 대시보드 메인 페이지
 * - 상단: 4개의 통계 카드 (유저수, 게시글수, 댓글수, 액티브세션)
 * - 중간: 게시글 통계 차트 + 최근 활동
 * - 하단: 최근 게시글/댓글 테이블
 */
const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 통계 데이터 로드
    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                const data = await getDashboardStats();
                setStats(data);
                setError(null);
            } catch (err) {
                setError('통계를 불러오는데 실패했습니다.');
                console.error('통계 로드 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <>
            {/* Stats Grid - 상단 4개 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 유저 수 */}
                <StatsCard
                    label="총 사용자"
                    value={loading ? '...' : stats?.userCount.toLocaleString() ?? '-'}
                    trend={0}
                    trendLabel={error ? '로드 실패' : '등록된 사용자'}
                    icon={<Users size={24} />}
                />
                {/* 게시글 수 */}
                <StatsCard
                    label="총 게시글"
                    value={loading ? '...' : stats?.boardCount.toLocaleString() ?? '-'}
                    trend={0}
                    trendLabel={error ? '로드 실패' : '작성된 게시글'}
                    icon={<FileText size={24} />}
                />
                {/* 댓글 수 */}
                <StatsCard
                    label="총 댓글"
                    value={loading ? '...' : stats?.commentCount.toLocaleString() ?? '-'}
                    trend={0}
                    trendLabel={error ? '로드 실패' : '작성된 댓글'}
                    icon={<MessageSquare size={24} />}
                />
                {/* 액티브 세션 */}
                <StatsCard
                    label="활성 세션"
                    value={loading ? '...' : stats?.activeSessionCount.toLocaleString() ?? '-'}
                    trend={0}
                    trendLabel={error ? '로드 실패' : '최근 1시간 내 로그인'}
                    icon={<Activity size={24} />}
                />
            </div>

            {/* Charts & Activity Section - 차트 + 최근 활동 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-full">
                    <Suspense
                        fallback={
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full min-h-[300px] animate-pulse" />
                        }
                    >
                        <PostChart />
                    </Suspense>
                </div>
                <div className="lg:col-span-1 h-full">
                    <RecentActivity />
                </div>
            </div>

            {/* Recent Posts Section - 최근 게시글/댓글 */}
            <div className="w-full">
                <RecentPostsTable />
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-xs text-gray-400 pb-4">
                © 2026 Ocean Admin Dashboard. All rights reserved.
            </footer>
        </>
    );
};

export default Dashboard;
