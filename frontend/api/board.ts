/**
 * 게시판 API 클라이언트
 * 백엔드와 통신하기 위한 함수들
 */
import { authFetch } from './auth';

const API_BASE_URL = 'http://localhost:3001/api';

/** Board 타입 */
export interface Board {
    id: number;
    title: string;
    content: string;
    author: string;
    userId?: number;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    commentCount?: number;
}

/** 페이지네이션 응답 타입 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** 게시글 생성 요청 타입 */
export interface CreateBoardRequest {
    title: string;
    content: string;
    boardTypeId?: number;
}

/** 게시글 수정 요청 타입 */
export interface UpdateBoardRequest {
    title?: string;
    content?: string;
}

/**
 * 게시글 목록 조회
 */
export async function getBoards(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    boardType?: string
): Promise<PaginatedResponse<Board>> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) {
        params.set('search', search);
    }
    if (boardType) {
        params.set('boardType', boardType);
    }

    const response = await fetch(`${API_BASE_URL}/boards?${params}`);
    if (!response.ok) {
        throw new Error('게시글 목록을 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시글 상세 조회
 */
export async function getBoard(id: number): Promise<Board> {
    const response = await fetch(`${API_BASE_URL}/boards/${id}`);
    if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시글 작성 (인증 필요)
 */
export async function createBoard(data: CreateBoardRequest): Promise<Board> {
    const response = await authFetch(`${API_BASE_URL}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게시글 작성에 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시글 수정 (인증 필요)
 */
export async function updateBoard(id: number, data: UpdateBoardRequest): Promise<Board> {
    const response = await authFetch(`${API_BASE_URL}/boards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게시글 수정에 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시글 삭제 (인증 필요)
 */
export async function deleteBoard(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/boards/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게시글 삭제에 실패했습니다.');
    }
}

// ==================== 댓글 API ====================

/** 댓글 타입 */
export interface Comment {
    id: number;
    boardId: number;
    content: string;
    author: string;
    userId?: number;
    createdAt: string;
    updatedAt: string;
}

/** 댓글 생성 요청 타입 */
export interface CreateCommentRequest {
    content: string;
}

/**
 * 댓글 목록 조회
 */
export async function getComments(boardId: number): Promise<{ data: Comment[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}/comments`);
    if (!response.ok) {
        throw new Error('댓글 목록을 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 댓글 작성 (인증 필요)
 */
export async function createComment(boardId: number, data: CreateCommentRequest): Promise<Comment> {
    const response = await authFetch(`${API_BASE_URL}/boards/${boardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '댓글 작성에 실패했습니다.');
    }
    return response.json();
}

/**
 * 댓글 수정 (인증 필요)
 */
export async function updateComment(boardId: number, commentId: number, content: string): Promise<Comment> {
    const response = await authFetch(`${API_BASE_URL}/boards/${boardId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '댓글 수정에 실패했습니다.');
    }
    return response.json();
}

/**
 * 댓글 삭제 (인증 필요)
 */
export async function deleteComment(boardId: number, commentId: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/boards/${boardId}/comments/${commentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '댓글 삭제에 실패했습니다.');
    }
}
