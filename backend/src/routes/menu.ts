/**
 * 메뉴 관리 API 라우트
 * 동적 메뉴 CRUD 기능 제공
 */
import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

/** 메뉴 타입 */
interface Menu {
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

/**
 * DB 행을 Menu 타입으로 변환
 */
function mapToMenu(row: any): Menu {
    return {
        id: row.id,
        parentId: row.parent_id,
        title: row.title,
        icon: row.icon,
        linkType: row.link_type,
        linkValue: row.link_value,
        sortOrder: row.sort_order,
        isAdminOnly: !!row.is_admin_only,
        isActive: !!row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * 외부 링크 URL 검증
 * - https:// 또는 http://만 허용
 * - javascript:, data: 등 위험한 스키마 차단
 */
function validateExternalUrl(url: string): { valid: boolean; error?: string } {
    if (!url) return { valid: true };

    const lower = url.toLowerCase().trim();

    // 위험한 스키마 차단
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const scheme of dangerousSchemes) {
        if (lower.startsWith(scheme)) {
            return { valid: false, error: `위험한 URL 스키마(${scheme})는 허용되지 않습니다.` };
        }
    }

    // https:// 또는 http://만 허용
    if (!lower.startsWith('https://') && !lower.startsWith('http://')) {
        return { valid: false, error: '외부 링크는 https:// 또는 http://로 시작해야 합니다.' };
    }

    return { valid: true };
}

/**
 * 메뉴를 트리 구조로 변환
 */
function buildMenuTree(menus: Menu[], parentId: number | null = null): Menu[] {
    return menus
        .filter(menu => menu.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(menu => ({
            ...menu,
            children: buildMenuTree(menus, menu.id),
        }));
}

/**
 * 메뉴 목록 조회 (트리 구조)
 * GET /api/menus
 * 인증된 관리자는 관리자 전용 메뉴도 볼 수 있음
 */
router.get('/', optionalAuth, (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.role === 'admin';

        let query = `
            SELECT id, parent_id, title, icon, link_type, link_value, 
                   sort_order, is_admin_only, is_active, created_at, updated_at
            FROM menus
            WHERE is_active = 1
        `;

        // 관리자가 아니면 관리자 전용 메뉴 제외
        if (!isAdmin) {
            query += ' AND is_admin_only = 0';
        }

        query += ' ORDER BY sort_order ASC';

        const rows = db.prepare(query).all() as any[];
        const menus = rows.map(mapToMenu);
        const tree = buildMenuTree(menus);

        res.json(tree);
    } catch (error) {
        console.error('메뉴 목록 조회 오류:', error);
        res.status(500).json({ error: '메뉴 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 전체 메뉴 목록 조회 (관리자용, flat 구조)
 * GET /api/menus/all
 */
router.get('/all', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const rows = db.prepare(`
            SELECT id, parent_id, title, icon, link_type, link_value, 
                   sort_order, is_admin_only, is_active, created_at, updated_at
            FROM menus
            ORDER BY sort_order ASC
        `).all() as any[];

        res.json(rows.map(mapToMenu));
    } catch (error) {
        console.error('전체 메뉴 조회 오류:', error);
        res.status(500).json({ error: '메뉴 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 메뉴 생성
 * POST /api/menus
 */
router.post('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const { parentId, title, icon, linkType, linkValue, sortOrder, isAdminOnly } = req.body;

        if (!title) {
            res.status(400).json({ error: '메뉴명을 입력해주세요.' });
            return;
        }

        // 외부 링크 URL 검증
        if (linkType === 'external' && linkValue) {
            const urlValidation = validateExternalUrl(linkValue);
            if (!urlValidation.valid) {
                res.status(400).json({ error: urlValidation.error });
                return;
            }
        }

        const result = db.prepare(`
            INSERT INTO menus (parent_id, title, icon, link_type, link_value, sort_order, is_admin_only)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(parentId || null, title, icon || null, linkType || 'route', linkValue || null, sortOrder || 0, isAdminOnly ? 1 : 0);

        const newMenu = db.prepare(`
            SELECT id, parent_id, title, icon, link_type, link_value, 
                   sort_order, is_admin_only, is_active, created_at, updated_at
            FROM menus WHERE id = ?
        `).get(result.lastInsertRowid) as any;

        res.status(201).json(mapToMenu(newMenu));
    } catch (error) {
        console.error('메뉴 생성 오류:', error);
        res.status(500).json({ error: '메뉴 생성 중 오류가 발생했습니다.' });
    }
});

/**
 * 메뉴 수정
 * PUT /api/menus/:id
 */
router.put('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { parentId, title, icon, linkType, linkValue, sortOrder, isAdminOnly, isActive } = req.body;

        const existing = db.prepare('SELECT id FROM menus WHERE id = ?').get(id);
        if (!existing) {
            res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
            return;
        }

        // 외부 링크 URL 검증
        if (linkType === 'external' && linkValue) {
            const urlValidation = validateExternalUrl(linkValue);
            if (!urlValidation.valid) {
                res.status(400).json({ error: urlValidation.error });
                return;
            }
        }

        db.prepare(`
            UPDATE menus SET
                parent_id = COALESCE(?, parent_id),
                title = COALESCE(?, title),
                icon = COALESCE(?, icon),
                link_type = COALESCE(?, link_type),
                link_value = COALESCE(?, link_value),
                sort_order = COALESCE(?, sort_order),
                is_admin_only = COALESCE(?, is_admin_only),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            parentId !== undefined ? parentId : null,
            title || null,
            icon !== undefined ? icon : null,
            linkType || null,
            linkValue !== undefined ? linkValue : null,
            sortOrder !== undefined ? sortOrder : null,
            isAdminOnly !== undefined ? (isAdminOnly ? 1 : 0) : null,
            isActive !== undefined ? (isActive ? 1 : 0) : null,
            id
        );

        const updated = db.prepare(`
            SELECT id, parent_id, title, icon, link_type, link_value, 
                   sort_order, is_admin_only, is_active, created_at, updated_at
            FROM menus WHERE id = ?
        `).get(id) as any;

        res.json(mapToMenu(updated));
    } catch (error) {
        console.error('메뉴 수정 오류:', error);
        res.status(500).json({ error: '메뉴 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * 메뉴 삭제
 * DELETE /api/menus/:id
 */
router.delete('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const existing = db.prepare('SELECT id FROM menus WHERE id = ?').get(id);
        if (!existing) {
            res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
            return;
        }

        // 하위 메뉴도 함께 삭제됨 (CASCADE)
        db.prepare('DELETE FROM menus WHERE id = ?').run(id);

        res.json({ message: '메뉴가 삭제되었습니다.' });
    } catch (error) {
        console.error('메뉴 삭제 오류:', error);
        res.status(500).json({ error: '메뉴 삭제 중 오류가 발생했습니다.' });
    }
});

/**
 * 메뉴 순서 일괄 변경
 * PUT /api/menus/reorder
 */
router.put('/reorder', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const { orders } = req.body; // [{ id: 1, sortOrder: 1 }, ...]

        if (!Array.isArray(orders)) {
            res.status(400).json({ error: '유효하지 않은 요청입니다.' });
            return;
        }

        const update = db.prepare('UPDATE menus SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

        for (const { id, sortOrder } of orders) {
            update.run(sortOrder, id);
        }

        res.json({ message: '메뉴 순서가 변경되었습니다.' });
    } catch (error) {
        console.error('메뉴 순서 변경 오류:', error);
        res.status(500).json({ error: '메뉴 순서 변경 중 오류가 발생했습니다.' });
    }
});

export default router;
