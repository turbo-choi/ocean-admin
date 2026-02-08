/**
 * 게시판 유형 관리 API 라우트
 * 동적 게시판 생성/관리 기능 제공
 */
import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/** 게시판 유형 타입 */
interface BoardType {
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

/**
 * DB 행을 BoardType으로 변환
 */
function mapToBoardType(row: any): BoardType {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        isCommentEnabled: !!row.is_comment_enabled,
        isAnonymous: !!row.is_anonymous,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        postCount: row.post_count,
    };
}

/**
 * 게시판 유형 목록 조회
 * GET /api/board-types
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const rows = db.prepare(`
            SELECT bt.*, 
                   (SELECT COUNT(*) FROM boards b WHERE b.board_type_id = bt.id) as post_count
            FROM board_types bt
            ORDER BY bt.id ASC
        `).all() as any[];

        res.json(rows.map(mapToBoardType));
    } catch (error) {
        console.error('게시판 유형 목록 조회 오류:', error);
        res.status(500).json({ error: '게시판 유형 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시판 유형 상세 조회 (slug로)
 * GET /api/board-types/slug/:slug
 */
router.get('/slug/:slug', (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        const row = db.prepare(`
            SELECT bt.*, 
                   (SELECT COUNT(*) FROM boards b WHERE b.board_type_id = bt.id) as post_count
            FROM board_types bt
            WHERE bt.slug = ?
        `).get(slug) as any;

        if (!row) {
            res.status(404).json({ error: '게시판을 찾을 수 없습니다.' });
            return;
        }

        res.json(mapToBoardType(row));
    } catch (error) {
        console.error('게시판 유형 조회 오류:', error);
        res.status(500).json({ error: '게시판 유형 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시판 유형 상세 조회 (ID로)
 * GET /api/board-types/:id
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const row = db.prepare(`
            SELECT bt.*, 
                   (SELECT COUNT(*) FROM boards b WHERE b.board_type_id = bt.id) as post_count
            FROM board_types bt
            WHERE bt.id = ?
        `).get(id) as any;

        if (!row) {
            res.status(404).json({ error: '게시판을 찾을 수 없습니다.' });
            return;
        }

        res.json(mapToBoardType(row));
    } catch (error) {
        console.error('게시판 유형 조회 오류:', error);
        res.status(500).json({ error: '게시판 유형 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시판 유형 생성
 * POST /api/board-types
 */
router.post('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const { name, slug, description, isCommentEnabled, isAnonymous } = req.body;

        if (!name || !slug) {
            res.status(400).json({ error: '게시판 이름과 URL 경로를 입력해주세요.' });
            return;
        }

        // slug 유효성 검사 (영문, 숫자, 하이픈만 허용)
        if (!/^[a-z0-9-]+$/.test(slug)) {
            res.status(400).json({ error: 'URL 경로는 영문 소문자, 숫자, 하이픈만 사용 가능합니다.' });
            return;
        }

        // slug 중복 확인
        const existing = db.prepare('SELECT id FROM board_types WHERE slug = ?').get(slug);
        if (existing) {
            res.status(409).json({ error: '이미 사용 중인 URL 경로입니다.' });
            return;
        }

        const result = db.prepare(`
            INSERT INTO board_types (name, slug, description, is_comment_enabled, is_anonymous)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, slug, description || null, isCommentEnabled !== false ? 1 : 0, isAnonymous ? 1 : 0);

        const newType = db.prepare('SELECT * FROM board_types WHERE id = ?').get(result.lastInsertRowid) as any;

        res.status(201).json(mapToBoardType(newType));
    } catch (error) {
        console.error('게시판 유형 생성 오류:', error);
        res.status(500).json({ error: '게시판 유형 생성 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시판 유형 수정
 * PUT /api/board-types/:id
 */
router.put('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { name, slug, description, isCommentEnabled, isAnonymous } = req.body;

        const existing = db.prepare('SELECT id, slug FROM board_types WHERE id = ?').get(id) as any;
        if (!existing) {
            res.status(404).json({ error: '게시판을 찾을 수 없습니다.' });
            return;
        }

        // slug 변경 시 중복 확인
        if (slug && slug !== existing.slug) {
            if (!/^[a-z0-9-]+$/.test(slug)) {
                res.status(400).json({ error: 'URL 경로는 영문 소문자, 숫자, 하이픈만 사용 가능합니다.' });
                return;
            }

            const duplicate = db.prepare('SELECT id FROM board_types WHERE slug = ? AND id != ?').get(slug, id);
            if (duplicate) {
                res.status(409).json({ error: '이미 사용 중인 URL 경로입니다.' });
                return;
            }
        }

        db.prepare(`
            UPDATE board_types SET
                name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                is_comment_enabled = COALESCE(?, is_comment_enabled),
                is_anonymous = COALESCE(?, is_anonymous),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name || null,
            slug || null,
            description !== undefined ? description : null,
            isCommentEnabled !== undefined ? (isCommentEnabled ? 1 : 0) : null,
            isAnonymous !== undefined ? (isAnonymous ? 1 : 0) : null,
            id
        );

        const updated = db.prepare('SELECT * FROM board_types WHERE id = ?').get(id) as any;

        res.json(mapToBoardType(updated));
    } catch (error) {
        console.error('게시판 유형 수정 오류:', error);
        res.status(500).json({ error: '게시판 유형 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시판 유형 삭제
 * DELETE /api/board-types/:id
 */
router.delete('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const existing = db.prepare('SELECT id FROM board_types WHERE id = ?').get(id);
        if (!existing) {
            res.status(404).json({ error: '게시판을 찾을 수 없습니다.' });
            return;
        }

        // 해당 게시판에 글이 있는지 확인
        const postCount = db.prepare('SELECT COUNT(*) as count FROM boards WHERE board_type_id = ?').get(id) as { count: number };
        if (postCount.count > 0) {
            res.status(400).json({ error: `이 게시판에 ${postCount.count}개의 글이 있습니다. 글을 먼저 삭제해주세요.` });
            return;
        }

        db.prepare('DELETE FROM board_types WHERE id = ?').run(id);

        res.json({ message: '게시판이 삭제되었습니다.' });
    } catch (error) {
        console.error('게시판 유형 삭제 오류:', error);
        res.status(500).json({ error: '게시판 유형 삭제 중 오류가 발생했습니다.' });
    }
});

export default router;
