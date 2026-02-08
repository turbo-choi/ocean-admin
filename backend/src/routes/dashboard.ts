/**
 * 대시보드 통계 API 라우트
 * 대시보드에서 사용할 통계 및 최근 활동 데이터 제공
 * 인증된 사용자만 접근 가능
 */
import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 모든 대시보드 API에 인증 필수
router.use(requireAuth);

/**
 * 대시보드 기본 통계 조회
 * GET /api/dashboard/stats
 * 
 * 반환값:
 * - userCount: 전체 유저 수
 * - boardCount: 전체 게시글 수
 * - commentCount: 전체 댓글 수
 * - activeSessionCount: 최근 1시간 내 로그인한 유저 수 (액티브 세션 추정)
 */
router.get('/stats', (req: Request, res: Response) => {
    try {
        // 전체 유저 수
        const userResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

        // 전체 게시글 수
        const boardResult = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number };

        // 전체 댓글 수
        const commentResult = db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number };

        // 액티브 세션 수 (최근 1시간 내 로그인한 유저)
        const activeResult = db.prepare(`
            SELECT COUNT(*) as count FROM users 
            WHERE last_login_at > datetime('now', '-1 hour')
        `).get() as { count: number };

        res.json({
            userCount: userResult.count,
            boardCount: boardResult.count,
            commentCount: commentResult.count,
            activeSessionCount: activeResult.count,
        });
    } catch (error) {
        console.error('대시보드 통계 조회 오류:', error);
        res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시글 통계 차트 데이터 조회 (일별)
 * GET /api/dashboard/chart
 * Query: year (연도), month (월, 1-12)
 * 
 * 지정된 월의 일별 게시글 수를 반환
 */
router.get('/chart', (req: Request, res: Response) => {
    try {
        const now = new Date();
        const year = parseInt(req.query.year as string) || now.getFullYear();
        const month = parseInt(req.query.month as string) || (now.getMonth() + 1);

        // 월의 시작일과 종료일 계산
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const daysInMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

        // 해당 월의 일별 데이터 생성
        const chartData: Array<{ day: number; date: string; boardCount: number; commentCount: number }> = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // 해당 날짜의 게시글 수
            const boardResult = db.prepare(`
                SELECT COUNT(*) as count FROM boards 
                WHERE date(created_at) = ?
            `).get(dateStr) as { count: number };

            // 해당 날짜의 댓글 수
            const commentResult = db.prepare(`
                SELECT COUNT(*) as count FROM comments 
                WHERE date(created_at) = ?
            `).get(dateStr) as { count: number };

            chartData.push({
                day,
                date: dateStr,
                boardCount: boardResult.count,
                commentCount: commentResult.count,
            });
        }

        res.json({
            year,
            month,
            daysInMonth,
            data: chartData,
        });
    } catch (error) {
        console.error('차트 데이터 조회 오류:', error);
        res.status(500).json({ error: '차트 데이터 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 최근 유저 활동 조회
 * GET /api/dashboard/recent-activities
 * 
 * 최근 가입 및 로그인 활동을 반환
 */
router.get('/recent-activities', (req: Request, res: Response) => {
    try {
        const limit = Math.min(10, parseInt(req.query.limit as string) || 5);

        // 최근 가입한 유저
        const recentUsers = db.prepare(`
            SELECT id, name, email, 'register' as type, created_at as activityAt
            FROM users
            ORDER BY created_at DESC
            LIMIT ?
        `).all(limit) as Array<{
            id: number;
            name: string;
            email: string;
            type: string;
            activityAt: string;
        }>;

        // 최근 로그인한 유저 (last_login_at 기준)
        const recentLogins = db.prepare(`
            SELECT id, name, email, 'login' as type, last_login_at as activityAt
            FROM users
            WHERE last_login_at IS NOT NULL
            ORDER BY last_login_at DESC
            LIMIT ?
        `).all(limit) as Array<{
            id: number;
            name: string;
            email: string;
            type: string;
            activityAt: string;
        }>;

        // 최근 게시글 작성
        const recentBoards = db.prepare(`
            SELECT b.id, b.author as name, b.title, 'post' as type, b.created_at as activityAt
            FROM boards b
            ORDER BY b.created_at DESC
            LIMIT ?
        `).all(limit) as Array<{
            id: number;
            name: string;
            title: string;
            type: string;
            activityAt: string;
        }>;

        // 모든 활동을 합쳐서 시간순 정렬
        const allActivities = [
            ...recentUsers.map(u => ({
                id: `user-${u.id}`,
                type: 'user' as const,
                userName: u.name,
                email: u.email,
                description: '계정을 생성했습니다.',
                activityAt: u.activityAt,
            })),
            ...recentLogins.map(u => ({
                id: `login-${u.id}-${u.activityAt}`,
                type: 'login' as const,
                userName: u.name,
                email: u.email,
                description: '로그인했습니다.',
                activityAt: u.activityAt,
            })),
            ...recentBoards.map(b => ({
                id: `board-${b.id}`,
                type: 'post' as const,
                userName: b.name,
                description: `"${b.title}" 게시글을 작성했습니다.`,
                activityAt: b.activityAt,
            })),
        ]
            .sort((a, b) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime())
            .slice(0, limit);

        res.json(allActivities);
    } catch (error) {
        console.error('최근 활동 조회 오류:', error);
        res.status(500).json({ error: '최근 활동 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 최근 게시글 및 댓글 조회
 * GET /api/dashboard/recent-posts
 * 
 * 최근 작성된 게시글과 댓글을 통합하여 반환
 */
router.get('/recent-posts', (req: Request, res: Response) => {
    try {
        const limit = Math.min(20, parseInt(req.query.limit as string) || 10);

        // 최근 게시글
        const recentBoards = db.prepare(`
            SELECT 
                id,
                title,
                author,
                'board' as type,
                created_at as createdAt
            FROM boards
            ORDER BY created_at DESC
            LIMIT ?
        `).all(limit) as Array<{
            id: number;
            title: string;
            author: string;
            type: string;
            createdAt: string;
        }>;

        // 최근 댓글
        const recentComments = db.prepare(`
            SELECT 
                c.id,
                c.content,
                c.author,
                c.board_id as boardId,
                b.title as boardTitle,
                'comment' as type,
                c.created_at as createdAt
            FROM comments c
            JOIN boards b ON c.board_id = b.id
            ORDER BY c.created_at DESC
            LIMIT ?
        `).all(limit) as Array<{
            id: number;
            content: string;
            author: string;
            boardId: number;
            boardTitle: string;
            type: string;
            createdAt: string;
        }>;

        // 모든 항목을 합쳐서 시간순 정렬
        const allPosts = [
            ...recentBoards.map(b => ({
                id: `board-${b.id}`,
                type: 'board' as const,
                title: b.title,
                author: b.author,
                createdAt: b.createdAt,
                boardId: b.id,
            })),
            ...recentComments.map(c => ({
                id: `comment-${c.id}`,
                type: 'comment' as const,
                title: c.content.length > 50 ? c.content.substring(0, 50) + '...' : c.content,
                author: c.author,
                createdAt: c.createdAt,
                boardId: c.boardId,
                boardTitle: c.boardTitle,
            })),
        ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);

        res.json(allPosts);
    } catch (error) {
        console.error('최근 게시글 조회 오류:', error);
        res.status(500).json({ error: '최근 게시글 조회 중 오류가 발생했습니다.' });
    }
});

export default router;
