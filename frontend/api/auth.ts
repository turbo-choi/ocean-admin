/**
 * 인증 API 클라이언트
 * 로그인, 회원가입, 토큰 갱신, 사용자 정보 조회
 */

const API_BASE_URL = 'http://localhost:3001/api';

/** 사용자 역할 */
export type UserRole = 'admin' | 'user';

/** 사용자 타입 */
export interface User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
}

/** 인증 응답 타입 */
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

/** 로컬 스토리지 키 */
const ACCESS_TOKEN_KEY = 'ocean_access_token';
const REFRESH_TOKEN_KEY = 'ocean_refresh_token';

/**
 * Access Token 저장
 */
export function setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Access Token 가져오기
 */
export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Refresh Token 저장
 */
export function setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Refresh Token 가져오기
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 토큰 삭제 (로그아웃)
 */
export function clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * 인증 헤더 생성
 */
export function getAuthHeaders(): HeadersInit {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 인증된 fetch 요청 (자동 토큰 갱신)
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = { ...options.headers, ...getAuthHeaders() };
    let response = await fetch(url, { ...options, headers });

    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            const newHeaders = { ...options.headers, ...getAuthHeaders() };
            response = await fetch(url, { ...options, headers: newHeaders });
        }
    }

    return response;
}

/**
 * 회원가입
 */
export async function register(email: string, password: string, name: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '회원가입에 실패했습니다.');
    }

    const data = await response.json();
    return data.user;
}

/**
 * 로그인
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '로그인에 실패했습니다.');
    }

    const data: AuthResponse = await response.json();

    // 토큰 저장
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    return data;
}

/**
 * 로그아웃
 */
export function logout(): void {
    clearTokens();
}

/**
 * 토큰 갱신
 */
export async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            clearTokens();
            return false;
        }

        const data = await response.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        return true;
    } catch {
        clearTokens();
        return false;
    }
}

/**
 * 내 정보 조회
 */
export async function getMe(): Promise<User | null> {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const response = await authFetch(`${API_BASE_URL}/auth/me`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

/**
 * 비밀번호 변경
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '비밀번호 변경에 실패했습니다.');
    }
}

// ==================== 회원관리 API ====================

/**
 * 회원 목록 조회 (관리자용)
 */
export async function getUsers(page = 1, limit = 10, search = ''): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.set('search', search);

    const response = await authFetch(`${API_BASE_URL}/users?${params}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '회원 목록을 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 회원 상세 조회 (관리자용)
 */
export async function getUser(id: number): Promise<User> {
    const response = await authFetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '회원 정보를 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 회원 정보 수정 (관리자용)
 */
export async function updateUser(id: number, data: { name?: string; role?: UserRole }): Promise<User> {
    const response = await authFetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '회원 정보 수정에 실패했습니다.');
    }
    return response.json();
}

/**
 * 회원 삭제 (관리자용)
 */
export async function deleteUser(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '회원 삭제에 실패했습니다.');
    }
}
