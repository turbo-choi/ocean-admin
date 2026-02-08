/**
 * Express 서버 메인 엔트리포인트
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './database.js';
import boardRouter from './routes/board.js';
import commentRouter from './routes/comment.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import dashboardRouter from './routes/dashboard.js';
import menuRouter from './routes/menu.js';
import boardTypeRouter from './routes/boardType.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 허용 오리진 목록 (환경변수 또는 기본값)
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

// 보안 미들웨어
app.use(helmet({
    contentSecurityPolicy: false, // 개발 환경에서는 비활성화
    crossOriginEmbedderPolicy: false,
}));

// CORS 설정 (허용된 오리진만)
app.use(cors({
    origin: (origin, callback) => {
        // 서버-서버 요청(origin 없음) 또는 허용된 오리진인 경우 허용
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true,
}));

// 로그인 엔드포인트 Rate Limiting (브루트포스 방지)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 10, // 15분당 최대 10회 시도
    message: { error: '너무 많은 로그인 시도입니다. 15분 후에 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 일반 API Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1분
    max: 100, // 분당 100회
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', apiLimiter);

app.use(express.json()); // JSON 파싱

// 데이터베이스 초기화
initDatabase();

// API 라우트 등록
// 로그인에 rate limiter 적용 (브루트포스 방지)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/menus', menuRouter);
app.use('/api/board-types', boardTypeRouter);
app.use('/api/boards', boardRouter);
app.use('/api/boards/:boardId/comments', commentRouter);
app.use('/api/dashboard', dashboardRouter);

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('서버 오류:', err);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🌊 Ocean Admin Backend`);
    console.log(`📍 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`📋 게시판 API: http://localhost:${PORT}/api/boards`);
});
