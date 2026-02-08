/**
 * JWT 인증 미들웨어
 * 토큰 검증 및 역할 기반 접근 제어
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, User } from '../types.js';

// 환경 변수에서 시크릿 키 가져오기 (필수)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// 프로덕션 환경에서는 반드시 환경변수 설정 필요
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET과 JWT_REFRESH_SECRET 환경변수가 설정되어야 합니다.');
    }
    console.warn('⚠️  JWT_SECRET/JWT_REFRESH_SECRET이 설정되지 않았습니다. 개발용 기본값을 사용합니다.');
}

// 개발 환경 fallback (프로덕션에서는 위에서 에러 발생)
const SECRET = JWT_SECRET || 'dev-only-ocean-admin-secret';
const REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev-only-ocean-admin-refresh-secret';

/** Access Token 만료 시간 (1시간) */
export const ACCESS_TOKEN_EXPIRES = '1h';

/** Refresh Token 만료 시간 (7일) */
export const REFRESH_TOKEN_EXPIRES = '7d';

/**
 * Request에 user 정보를 추가하기 위한 타입 확장
 */
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Access Token 생성
 */
export function generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

/**
 * Refresh Token 생성
 */
export function generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

/**
 * Access Token 검증
 */
export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * Refresh Token 검증
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * 인증 필수 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 검증합니다.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: '인증이 필요합니다.' });
        return;
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    const payload = verifyAccessToken(token);

    if (!payload) {
        res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
        return;
    }

    req.user = payload;
    next();
}

/**
 * 관리자 권한 필수 미들웨어
 * requireAuth 이후에 사용해야 합니다.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: '인증이 필요합니다.' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ error: '관리자 권한이 필요합니다.' });
        return;
    }

    next();
}

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 파싱하고, 없으면 그냥 통과
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);
        if (payload) {
            req.user = payload;
        }
    }

    next();
}
