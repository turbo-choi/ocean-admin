/**
 * 회원관리 API 라우트 (관리자 전용)
 * 회원 목록, 상세, 수정, 삭제
 */
import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import type { User, UpdateUserRequest, PaginatedResponse } from '../types.js';

const router = Router();

/**
 * DB에서 사용자를 User 타입으로 변환
 */
function mapToUser(row: any): User {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
    };
}

/**
 * 회원 목록 조회
 * GET /api/users
 */
router.get('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const search = (req.query.search as string) || '';
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params: (string | number)[] = [];

        if (search) {
            whereClause = 'WHERE email LIKE ? OR name LIKE ?';
            const searchPattern = `%${search}%`;
            params = [searchPattern, searchPattern];
        }

        // 전체 개수
        const countResult = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`)
            .get(...params) as { count: number };
        const total = countResult.count;

        // 데이터 조회
        const users = db.prepare(`
      SELECT id, email, name, role, created_at, updated_at, last_login_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

        const response: PaginatedResponse<User> = {
            data: users.map(mapToUser),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        res.json(response);
    } catch (error) {
        console.error('회원 목록 조회 오류:', error);
        res.status(500).json({ error: '회원 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 회원 상세 조회
 * GET /api/users/:id
 */
router.get('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
            return;
        }

        const user = db.prepare(`
      SELECT id, email, name, role, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(id) as any;

        if (!user) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }

        res.json(mapToUser(user));
    } catch (error) {
        console.error('회원 상세 조회 오류:', error);
        res.status(500).json({ error: '회원 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 회원 정보 수정
 * PUT /api/users/:id
 */
router.put('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { name, role } = req.body as UpdateUserRequest;

        if (isNaN(id)) {
            res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
            return;
        }

        // 존재 확인
        const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as any;
        if (!existing) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }

        // 마지막 관리자인지 확인 (관리자를 일반 사용자로 변경 시)
        if (existing.role === 'admin' && role === 'user') {
            const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
                .get() as { count: number };
            if (adminCount.count <= 1) {
                res.status(400).json({ error: '최소 한 명의 관리자가 필요합니다.' });
                return;
            }
        }

        // 업데이트
        const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: (string | number)[] = [];

        if (name !== undefined) {
            if (name.length < 2 || name.length > 50) {
                res.status(400).json({ error: '이름은 2~50자 사이로 입력해주세요.' });
                return;
            }
            updates.push('name = ?');
            values.push(name);
        }

        if (role !== undefined) {
            if (!['admin', 'user'].includes(role)) {
                res.status(400).json({ error: '유효하지 않은 역할입니다.' });
                return;
            }
            updates.push('role = ?');
            values.push(role);
        }

        if (updates.length === 1) {
            res.status(400).json({ error: '수정할 내용을 입력해주세요.' });
            return;
        }

        values.push(id);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        // 수정된 사용자 조회
        const updatedUser = db.prepare(`
      SELECT id, email, name, role, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(id) as any;

        res.json(mapToUser(updatedUser));
    } catch (error) {
        console.error('회원 정보 수정 오류:', error);
        res.status(500).json({ error: '회원 정보 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * 회원 삭제
 * DELETE /api/users/:id
 */
router.delete('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
            return;
        }

        // 자기 자신은 삭제 불가
        if (req.user!.id === id) {
            res.status(400).json({ error: '자기 자신은 삭제할 수 없습니다.' });
            return;
        }

        // 마지막 관리자인지 확인
        const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as any;
        if (user?.role === 'admin') {
            const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
                .get() as { count: number };
            if (adminCount.count <= 1) {
                res.status(400).json({ error: '최소 한 명의 관리자가 필요합니다.' });
                return;
            }
        }

        const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

        if (result.changes === 0) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }

        res.json({ message: '회원이 삭제되었습니다.', id });
    } catch (error) {
        console.error('회원 삭제 오류:', error);
        res.status(500).json({ error: '회원 삭제 중 오류가 발생했습니다.' });
    }
});

export default router;
