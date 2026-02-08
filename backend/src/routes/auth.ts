/**
 * 인증 API 라우트
 * 회원가입, 로그인, 토큰 갱신, 로그아웃
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../database.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    requireAuth
} from '../middleware/auth.js';
import type {
    User,
    UserWithPassword,
    RegisterRequest,
    LoginRequest,
    AuthResponse
} from '../types.js';

const router = Router();

/** 비밀번호 해싱 라운드 */
const SALT_ROUNDS = 12;

/** 이메일 유효성 검사 정규식 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 비밀번호 강도 검사 (최소 8자, 대소문자, 숫자, 특수문자) */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
 * 회원가입
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body as RegisterRequest;

        // 유효성 검사
        if (!email || !password || !name) {
            res.status(400).json({ error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' });
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            res.status(400).json({ error: '유효한 이메일 형식이 아닙니다.' });
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            res.status(400).json({
                error: '비밀번호는 8자 이상, 대소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다.'
            });
            return;
        }

        if (name.length < 2 || name.length > 50) {
            res.status(400).json({ error: '이름은 2~50자 사이로 입력해주세요.' });
            return;
        }

        // 이메일 중복 확인
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
            return;
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 사용자 생성
        const result = db.prepare(`
      INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)
    `).run(email, passwordHash, name);

        // 생성된 사용자 조회
        const newUser = db.prepare(`
      SELECT id, email, name, role, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid) as any;

        res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            user: mapToUser(newUser)
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
    }
});

/**
 * 로그인
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as LoginRequest;

        // 유효성 검사
        if (!email || !password) {
            res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
            return;
        }

        // 사용자 조회 (비밀번호 해시 포함)
        const user = db.prepare(`
      SELECT id, email, password_hash, name, role, created_at, updated_at, last_login_at
      FROM users WHERE email = ?
    `).get(email) as any;

        // 보안: 이메일/비밀번호 오류 시 동일한 메시지 반환
        if (!user) {
            res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            return;
        }

        // 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            return;
        }

        // 마지막 로그인 시간 업데이트
        db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // JWT 토큰 생성
        const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        const response: AuthResponse = {
            accessToken,
            refreshToken,
            user: mapToUser(user),
        };

        res.json(response);
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
    }
});

/**
 * 토큰 갱신
 * POST /api/auth/refresh
 */
router.post('/refresh', (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token이 필요합니다.' });
            return;
        }

        // Refresh Token 검증
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            res.status(401).json({ error: '유효하지 않거나 만료된 refresh token입니다.' });
            return;
        }

        // 사용자 존재 확인
        const user = db.prepare(`
      SELECT id, email, name, role, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(payload.id) as any;

        if (!user) {
            res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }

        // 새 토큰 생성
        const newPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error('토큰 갱신 오류:', error);
        res.status(500).json({ error: '토큰 갱신 중 오류가 발생했습니다.' });
    }
});

/**
 * 내 정보 조회
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const user = db.prepare(`
      SELECT id, email, name, role, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(userId) as any;

        if (!user) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }

        res.json(mapToUser(user));
    } catch (error) {
        console.error('내 정보 조회 오류:', error);
        res.status(500).json({ error: '정보 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 비밀번호 변경
 * PUT /api/auth/password
 */
router.put('/password', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
            return;
        }

        if (!PASSWORD_REGEX.test(newPassword)) {
            res.status(400).json({
                error: '새 비밀번호는 8자 이상, 대소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다.'
            });
            return;
        }

        // 현재 비밀번호 확인
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValid) {
            res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
            return;
        }

        // 새 비밀번호 해싱 및 저장
        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(newHash, userId);

        res.json({ message: '비밀번호가 변경되었습니다.' });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
});

export default router;
