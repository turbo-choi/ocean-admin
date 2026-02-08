/**
 * 메뉴 API 클라이언트
 * 동적 메뉴 관리
 */
import { authFetch } from './auth';

const API_BASE_URL = 'http://localhost:3001/api';

/** 메뉴 타입 */
export interface Menu {
    id: number;
    parentId: number | null;
    title: string;
    icon: string | null;
    linkType: 'route' | 'board' | 'external';
    linkValue: string | null;
    sortOrder: number;
    isAdminOnly: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    children?: Menu[];
}

/** 메뉴 생성/수정 요청 타입 */
export interface MenuRequest {
    parentId?: number | null;
    title: string;
    icon?: string;
    linkType?: 'route' | 'board' | 'external';
    linkValue?: string;
    sortOrder?: number;
    isAdminOnly?: boolean;
    isActive?: boolean;
}

/**
 * 메뉴 목록 조회 (트리 구조)
 * 인증된 사용자는 권한에 맞는 메뉴를 볼 수 있음
 */
export async function getMenus(): Promise<Menu[]> {
    const response = await authFetch(`${API_BASE_URL}/menus`);
    if (!response.ok) {
        throw new Error('메뉴를 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 전체 메뉴 목록 조회 (관리자용, flat)
 */
export async function getAllMenus(): Promise<Menu[]> {
    const response = await authFetch(`${API_BASE_URL}/menus/all`);
    if (!response.ok) {
        throw new Error('메뉴를 불러오는데 실패했습니다.');
    }
    return response.json();
}

/**
 * 메뉴 생성
 */
export async function createMenu(data: MenuRequest): Promise<Menu> {
    const response = await authFetch(`${API_BASE_URL}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '메뉴 생성에 실패했습니다.');
    }
    return response.json();
}

/**
 * 메뉴 수정
 */
export async function updateMenu(id: number, data: Partial<MenuRequest>): Promise<Menu> {
    const response = await authFetch(`${API_BASE_URL}/menus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '메뉴 수정에 실패했습니다.');
    }
    return response.json();
}

/**
 * 메뉴 삭제
 */
export async function deleteMenu(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/menus/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '메뉴 삭제에 실패했습니다.');
    }
}

/**
 * 메뉴 순서 변경
 */
export async function reorderMenus(orders: { id: number; sortOrder: number }[]): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/menus/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '메뉴 순서 변경에 실패했습니다.');
    }
}
