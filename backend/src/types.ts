/**
 * 게시판 데이터 타입 정의
 */

/** 게시글 타입 */
export interface Board {
    id: number;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
}

/** 게시글 생성 요청 타입 */
export interface CreateBoardRequest {
    title: string;
    content: string;
    author: string;
}

/** 게시글 수정 요청 타입 */
export interface UpdateBoardRequest {
    title?: string;
    content?: string;
}

/** 페이지네이션 응답 타입 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** 댓글 타입 */
export interface Comment {
    id: number;
    boardId: number;
    content: string;
    author: string;
    createdAt: string;
    updatedAt: string;
}

/** 댓글 생성 요청 타입 */
export interface CreateCommentRequest {
    content: string;
    author: string;
}

/** 댓글 수정 요청 타입 */
export interface UpdateCommentRequest {
    content: string;
}

// ==================== 사용자 및 인증 타입 ====================

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

/** 사용자 (비밀번호 해시 포함, 내부용) */
export interface UserWithPassword extends User {
    passwordHash: string;
}

/** 회원가입 요청 타입 */
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

/** 로그인 요청 타입 */
export interface LoginRequest {
    email: string;
    password: string;
}

/** 로그인 응답 타입 */
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

/** JWT 페이로드 타입 */
export interface JwtPayload {
    id: number;
    email: string;
    name: string;
    role: UserRole;
}

/** 사용자 수정 요청 타입 */
export interface UpdateUserRequest {
    name?: string;
    role?: UserRole;
}

