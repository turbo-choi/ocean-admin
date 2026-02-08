/**
 * 게시판 CRUD API 라우트
 * 인증된 사용자만 게시글 작성/수정/삭제 가능
 * 수정/삭제는 작성자 본인 또는 관리자만 가능
 */
import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { requireAuth } from '../middleware/auth.js';
import type { Board, CreateBoardRequest, UpdateBoardRequest, PaginatedResponse } from '../types.js';

const router = Router();

/**
 * 게시글 목록 조회 (페이지네이션 지원)
 * GET /api/boards
 * Query: page, limit, search, boardType (slug)
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const search = (req.query.search as string) || '';
        const boardTypeSlug = (req.query.boardType as string) || '';
        const offset = (page - 1) * limit;

        // boardType slug로 board_type_id 조회
        let boardTypeId: number | null = null;
        if (boardTypeSlug) {
            const boardType = db.prepare('SELECT id FROM board_types WHERE slug = ?').get(boardTypeSlug) as { id: number } | undefined;
            if (boardType) {
                boardTypeId = boardType.id;
            }
        }

        // WHERE 절 구성
        const conditions: string[] = [];
        let params: (string | number)[] = [];

        if (boardTypeId) {
            conditions.push('b.board_type_id = ?');
            params.push(boardTypeId);
        }

        if (search) {
            conditions.push('(b.title LIKE ? OR b.content LIKE ? OR b.author LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 전체 개수 조회
        const countQuery = `SELECT COUNT(*) as count FROM boards b ${whereClause}`;
        const countResult = db.prepare(countQuery).get(...params) as { count: number };
        const total = countResult.count;

        // 데이터 조회 (최신순 정렬) - 댓글 수 포함
        const dataQuery = `
      SELECT b.id, b.title, b.content, b.author, b.user_id as userId,
             b.board_type_id as boardTypeId,
             b.created_at as createdAt, b.updated_at as updatedAt, b.view_count as viewCount,
             (SELECT COUNT(*) FROM comments c WHERE c.board_id = b.id) as commentCount
      FROM boards b
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
        const data = db.prepare(dataQuery).all(...params, limit, offset) as Board[];

        const response: PaginatedResponse<Board> = {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        res.json(response);
    } catch (error) {
        console.error('목록 조회 오류:', error);
        res.status(500).json({ error: '게시글 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시글 상세 조회
 * GET /api/boards/:id
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ error: '유효하지 않은 게시글 ID입니다.' });
            return;
        }

        // 조회수 증가
        db.prepare('UPDATE boards SET view_count = view_count + 1 WHERE id = ?').run(id);

        // 게시글 조회
        const board = db.prepare(`
      SELECT id, title, content, author, user_id as userId,
             created_at as createdAt, updated_at as updatedAt, view_count as viewCount
      FROM boards WHERE id = ?
    `).get(id) as Board | undefined;

        if (!board) {
            res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
            return;
        }

        res.json(board);
    } catch (error) {
        console.error('상세 조회 오류:', error);
        res.status(500).json({ error: '게시글 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시글 작성 (인증 필수)
 * POST /api/boards
 * Body: { title, content, boardTypeId }
 * 작성자는 로그인한 사용자의 이름으로 자동 설정
 */
router.post('/', requireAuth, (req: Request, res: Response) => {
    try {
        const { title, content, boardTypeId } = req.body;
        const user = req.user!;

        // 유효성 검사
        if (!title || !content) {
            res.status(400).json({ error: '제목과 내용을 모두 입력해주세요.' });
            return;
        }

        if (title.length > 200) {
            res.status(400).json({ error: '제목은 200자 이하로 입력해주세요.' });
            return;
        }

        // 게시글 생성 (board_type_id, user_id, author는 파라미터로 설정)
        const result = db.prepare(`
      INSERT INTO boards (board_type_id, title, content, author, user_id) VALUES (?, ?, ?, ?, ?)
    `).run(boardTypeId || 1, title, content, user.name, user.id);

        // 생성된 게시글 조회
        const newBoard = db.prepare(`
      SELECT id, title, content, author, user_id as userId, board_type_id as boardTypeId,
             created_at as createdAt, updated_at as updatedAt, view_count as viewCount
      FROM boards WHERE id = ?
    `).get(result.lastInsertRowid) as Board;

        res.status(201).json(newBoard);
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ error: '게시글 작성 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시글 수정 (인증 필수, 작성자 또는 관리자만)
 * PUT /api/boards/:id
 * Body: { title?, content? }
 */
router.put('/:id', requireAuth, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content } = req.body as UpdateBoardRequest;
        const user = req.user!;

        if (isNaN(id)) {
            res.status(400).json({ error: '유효하지 않은 게시글 ID입니다.' });
            return;
        }

        // 기존 게시글 확인
        const existing = db.prepare('SELECT id, user_id, author FROM boards WHERE id = ?').get(id) as { id: number; user_id: number | null; author: string } | undefined;
        if (!existing) {
            res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
            return;
        }

        // 권한 검사: 작성자 본인 또는 관리자만 수정 가능
        const isOwner = existing.user_id === user.id || existing.author === user.name;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: '게시글 수정 권한이 없습니다.' });
            return;
        }

        // 업데이트할 필드 구성
        const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: (string | number)[] = [];

        if (title !== undefined) {
            if (title.length > 200) {
                res.status(400).json({ error: '제목은 200자 이하로 입력해주세요.' });
                return;
            }
            updates.push('title = ?');
            values.push(title);
        }

        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
        }

        if (updates.length === 1) {
            res.status(400).json({ error: '수정할 내용을 입력해주세요.' });
            return;
        }

        values.push(id);
        db.prepare(`UPDATE boards SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        // 수정된 게시글 조회
        const updatedBoard = db.prepare(`
      SELECT id, title, content, author, user_id as userId,
             created_at as createdAt, updated_at as updatedAt, view_count as viewCount
      FROM boards WHERE id = ?
    `).get(id) as Board;

        res.json(updatedBoard);
    } catch (error) {
        console.error('게시글 수정 오류:', error);
        res.status(500).json({ error: '게시글 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * 게시글 삭제 (인증 필수, 작성자 또는 관리자만)
 * DELETE /api/boards/:id
 */
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const user = req.user!;

        if (isNaN(id)) {
            res.status(400).json({ error: '유효하지 않은 게시글 ID입니다.' });
            return;
        }

        // 기존 게시글 확인
        const existing = db.prepare('SELECT id, user_id, author FROM boards WHERE id = ?').get(id) as { id: number; user_id: number | null; author: string } | undefined;
        if (!existing) {
            res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
            return;
        }

        // 권한 검사: 작성자 본인 또는 관리자만 삭제 가능
        const isOwner = existing.user_id === user.id || existing.author === user.name;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: '게시글 삭제 권한이 없습니다.' });
            return;
        }

        db.prepare('DELETE FROM boards WHERE id = ?').run(id);

        res.json({ message: '게시글이 삭제되었습니다.', id });
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        res.status(500).json({ error: '게시글 삭제 중 오류가 발생했습니다.' });
    }
});

export default router;
