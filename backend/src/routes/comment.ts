/**
 * 댓글 CRUD API 라우트
 * 인증된 사용자만 댓글 작성/수정/삭제 가능
 * 수정/삭제는 작성자 본인 또는 관리자만 가능
 */
import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { requireAuth } from '../middleware/auth.js';
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types.js';

const router = Router({ mergeParams: true });

/**
 * 특정 게시글의 댓글 목록 조회
 * GET /api/boards/:boardId/comments
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const boardId = parseInt(req.params.boardId);

        if (isNaN(boardId)) {
            res.status(400).json({ error: '유효하지 않은 게시글 ID입니다.' });
            return;
        }

        // 게시글 존재 확인
        const board = db.prepare('SELECT id FROM boards WHERE id = ?').get(boardId);
        if (!board) {
            res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
            return;
        }

        // 댓글 조회 (오래된 순)
        const comments = db.prepare(`
      SELECT id, board_id as boardId, content, author, user_id as userId,
             created_at as createdAt, updated_at as updatedAt
      FROM comments 
      WHERE board_id = ?
      ORDER BY created_at ASC
    `).all(boardId) as Comment[];

        res.json({ data: comments, total: comments.length });
    } catch (error) {
        console.error('댓글 목록 조회 오류:', error);
        res.status(500).json({ error: '댓글 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 댓글 작성 (인증 필수)
 * POST /api/boards/:boardId/comments
 * Body: { content }
 * 작성자는 로그인한 사용자의 이름으로 자동 설정
 */
router.post('/', requireAuth, (req: Request, res: Response) => {
    try {
        const boardId = parseInt(req.params.boardId);
        const { content } = req.body as CreateCommentRequest;
        const user = req.user!;

        if (isNaN(boardId)) {
            res.status(400).json({ error: '유효하지 않은 게시글 ID입니다.' });
            return;
        }

        // 유효성 검사
        if (!content) {
            res.status(400).json({ error: '내용을 입력해주세요.' });
            return;
        }

        if (content.length > 1000) {
            res.status(400).json({ error: '댓글은 1000자 이하로 입력해주세요.' });
            return;
        }

        // 게시글 존재 확인
        const board = db.prepare('SELECT id FROM boards WHERE id = ?').get(boardId);
        if (!board) {
            res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
            return;
        }

        // 댓글 생성 (user_id와 author는 로그인 사용자 정보 사용)
        const result = db.prepare(`
      INSERT INTO comments (board_id, content, author, user_id) VALUES (?, ?, ?, ?)
    `).run(boardId, content, user.name, user.id);

        // 생성된 댓글 조회
        const newComment = db.prepare(`
      SELECT id, board_id as boardId, content, author, user_id as userId,
             created_at as createdAt, updated_at as updatedAt
      FROM comments WHERE id = ?
    `).get(result.lastInsertRowid) as Comment;

        res.status(201).json(newComment);
    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
    }
});

/**
 * 댓글 수정 (인증 필수, 작성자 또는 관리자만)
 * PUT /api/boards/:boardId/comments/:id
 * Body: { content }
 */
router.put('/:id', requireAuth, (req: Request, res: Response) => {
    try {
        const boardId = parseInt(req.params.boardId);
        const commentId = parseInt(req.params.id);
        const { content } = req.body as UpdateCommentRequest;
        const user = req.user!;

        if (isNaN(boardId) || isNaN(commentId)) {
            res.status(400).json({ error: '유효하지 않은 ID입니다.' });
            return;
        }

        if (!content) {
            res.status(400).json({ error: '내용을 입력해주세요.' });
            return;
        }

        if (content.length > 1000) {
            res.status(400).json({ error: '댓글은 1000자 이하로 입력해주세요.' });
            return;
        }

        // 댓글 존재 확인
        const existing = db.prepare('SELECT id, user_id, author FROM comments WHERE id = ? AND board_id = ?').get(commentId, boardId) as { id: number; user_id: number | null; author: string } | undefined;
        if (!existing) {
            res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
            return;
        }

        // 권한 검사: 작성자 본인 또는 관리자만 수정 가능
        const isOwner = existing.user_id === user.id || existing.author === user.name;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: '댓글 수정 권한이 없습니다.' });
            return;
        }

        // 댓글 수정
        db.prepare(`
      UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(content, commentId);

        // 수정된 댓글 조회
        const updatedComment = db.prepare(`
      SELECT id, board_id as boardId, content, author, user_id as userId,
             created_at as createdAt, updated_at as updatedAt
      FROM comments WHERE id = ?
    `).get(commentId) as Comment;

        res.json(updatedComment);
    } catch (error) {
        console.error('댓글 수정 오류:', error);
        res.status(500).json({ error: '댓글 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * 댓글 삭제 (인증 필수, 작성자 또는 관리자만)
 * DELETE /api/boards/:boardId/comments/:id
 */
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
    try {
        const boardId = parseInt(req.params.boardId);
        const commentId = parseInt(req.params.id);
        const user = req.user!;

        if (isNaN(boardId) || isNaN(commentId)) {
            res.status(400).json({ error: '유효하지 않은 ID입니다.' });
            return;
        }

        // 댓글 존재 확인
        const existing = db.prepare('SELECT id, user_id, author FROM comments WHERE id = ? AND board_id = ?').get(commentId, boardId) as { id: number; user_id: number | null; author: string } | undefined;
        if (!existing) {
            res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
            return;
        }

        // 권한 검사: 작성자 본인 또는 관리자만 삭제 가능
        const isOwner = existing.user_id === user.id || existing.author === user.name;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: '댓글 삭제 권한이 없습니다.' });
            return;
        }

        db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

        res.json({ message: '댓글이 삭제되었습니다.', id: commentId });
    } catch (error) {
        console.error('댓글 삭제 오류:', error);
        res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
    }
});

export default router;
