/**
 * 게시판 유형 API 클라이언트
 * 동적 게시판 관리
 */
import { authFetch } from './auth';

const API_BASE_URL = 'http://localhost:3001/api';

/** 게시판 유형 타입 */
export interface BoardType {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    isCommentEnabled: boolean;
    isAnonymous: boolean;
    createdAt: string;
    updatedAt: string;
    postCount?: number;
}

/** 게시판 유형 생성/수정 요청 타입 */
export interface BoardTypeRequest {
    name: string;
    slug: string;
    description?: string;
    isCommentEnabled?: boolean;
    isAnonymous?: boolean;
}

/**
 * 게시판 유형 목록 조회
 */
export async function getBoardTypes(): Promise<BoardType[]> {
    const response = await fetch(`${API_BASE_URL}/board-types`);
    if (!response.ok) {
        throw new Error('게시판 유형을 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시판 유형 상세 조회 (slug)
 */
export async function getBoardTypeBySlug(slug: string): Promise<BoardType> {
    const response = await fetch(`${API_BASE_URL}/board-types/slug/${slug}`);
    if (!response.ok) {
        throw new Error('게시판을 찾을 수 없습니다.');
    }
    return response.json();
}

/**
 * 게시판 유형 상세 조회 (ID)
 */
export async function getBoardType(id: number): Promise<BoardType> {
    const response = await fetch(`${API_BASE_URL}/board-types/${id}`);
    if (!response.ok) {
        throw new Error('게시판을 찾을 수 없습니다.');
    }
    return response.json();
}

/**
 * 게시판 유형 생성
 */
export async function createBoardType(data: BoardTypeRequest): Promise<BoardType> {
    const response = await authFetch(`${API_BASE_URL}/board-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게시판 생성에 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시판 유형 수정
 */
export async function updateBoardType(id: number, data: Partial<BoardTypeRequest>): Promise<BoardType> {
    const response = await authFetch(`${API_BASE_URL}/board-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게시판 수정에 실패했습니다.');
    }
    return response.json();
}

/**
 * 게시판 유형 삭제
 */
export async function deleteBoardType(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/board-types/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게시판 삭제에 실패했습니다.');
    }
}
