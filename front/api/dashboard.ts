/**
 * 대시보드 API 클라이언트
 * 대시보드 통계 및 최근 활동 데이터 조회
 * 인증된 사용자만 접근 가능
 */
import { authFetch } from './auth';

const API_BASE_URL = 'http://localhost:3001/api';

/** 대시보드 통계 타입 */
export interface DashboardStats {
    userCount: number;
    boardCount: number;
    commentCount: number;
    activeSessionCount: number;
}

/** 차트 데이터 아이템 타입 */
export interface ChartDataItem {
    day: number;
    date: string;
    boardCount: number;
    commentCount: number;
}

/** 차트 응답 타입 */
export interface ChartResponse {
    year: number;
    month: number;
    daysInMonth: number;
    data: ChartDataItem[];
}

/** 최근 활동 타입 */
export interface RecentActivity {
    id: string;
    type: 'user' | 'login' | 'post';
    userName: string;
    email?: string;
    description: string;
    activityAt: string;
}

/** 최근 게시글/댓글 타입 */
export interface RecentPost {
    id: string;
    type: 'board' | 'comment';
    title: string;
    author: string;
    createdAt: string;
    boardId: number;
    boardTitle?: string;
}

/**
 * 대시보드 통계 조회
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const response = await authFetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) {
        throw new Error('통계를 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시글 차트 데이터 조회 (일별)
 * @param year 연도 (생략시 현재 연도)
 * @param month 월 1-12 (생략시 현재 월)
 */
export async function getPostChartData(year?: number, month?: number): Promise<ChartResponse> {
    const params = new URLSearchParams();
    if (year) params.set('year', year.toString());
    if (month) params.set('month', month.toString());

    const url = params.toString()
        ? `${API_BASE_URL}/dashboard/chart?${params}`
        : `${API_BASE_URL}/dashboard/chart`;

    const response = await authFetch(url);
    if (!response.ok) {
        throw new Error('차트 데이터를 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 최근 활동 조회
 */
export async function getRecentActivities(limit = 5): Promise<RecentActivity[]> {
    const response = await authFetch(`${API_BASE_URL}/dashboard/recent-activities?limit=${limit}`);
    if (!response.ok) {
        throw new Error('최근 활동을 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 최근 게시글/댓글 조회
 */
export async function getRecentPosts(limit = 10): Promise<RecentPost[]> {
    const response = await authFetch(`${API_BASE_URL}/dashboard/recent-posts?limit=${limit}`);
    if (!response.ok) {
        throw new Error('최근 게시글을 불러오는데 실패했습니다.');
    }
    return response.json();
}
