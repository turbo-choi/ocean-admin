# Backend AGENTS

## Module Context
- 이 영역은 Express API 서버와 SQLite 데이터 계층을 담당한다.
- `src/index.ts`가 엔트리포인트이며 라우트/미들웨어/DB 초기화가 결합된다.
- 프론트엔드(`../frontend`)는 `http://localhost:3001/api` 계약에 의존한다.

## Tech Stack & Constraints
- Node.js + TypeScript + Express + better-sqlite3 기반.
- 인증은 JWT + bcrypt를 사용한다.
- 서버 모듈은 ESM 규칙을 따르며 로컬 import 시 `.js` 확장자를 유지한다.
- DB는 `data/board.db` 단일 SQLite 파일을 사용한다.
- 제약: 대규모 ORM 도입 없이 현재 SQL 패턴(`db.prepare(...).get/all/run`)을 유지한다.

## API Routes
- `/api/auth` - 인증 (로그인, 회원가입, 토큰 갱신)
- `/api/users` - 회원 관리 (관리자 전용)
- `/api/boards` - 게시판 CRUD, `?boardType={slug}` 파라미터 지원
- `/api/boards/:boardId/comments` - 댓글 CRUD
- `/api/menus` - **메뉴 관리** (조회는 공개, CUD는 관리자)
- `/api/board-types` - **게시판 유형 관리** (조회는 공개, CUD는 관리자)
- `/api/dashboard` - 대시보드 통계

## Implementation Patterns
- 라우트 등록은 `src/index.ts`에서 `/api/*` prefix로 일관되게 관리한다.
- 요청 처리 순서: 입력 검증 -> 리소스 존재 확인 -> DB 작업 -> 응답 생성.
- 오류 응답은 400/401/403/404/409/500을 의미에 맞게 사용한다.
- 사용자 반환 시 비밀번호 해시를 절대 포함하지 않는다.
- 도메인 타입은 `src/types.ts`를 단일 기준으로 맞춘다.

## Testing Strategy
- 빌드 검증: `npm run build`
- 실행 검증: `npm run dev` 후 `curl http://localhost:3001/api/health`
- 수동 API 스모크 테스트 예시:
  - `POST /api/auth/login`
  - `GET /api/boards`
  - `GET /api/users` (관리자 토큰)
  - `GET /api/menus` (공개)
  - `GET /api/board-types` (공개)

## Local Golden Rules
- Do: 인증 필요 라우트에 `requireAuth`를 적용한다.
- Do: 관리자 전용 라우트에 `requireAdmin`을 함께 적용한다.
- Do: SQL 파라미터 바인딩을 사용해 직접 문자열 결합을 피한다.
- Do: 응답 필드명은 기존 camelCase 매핑 규칙을 유지한다.
- Don't: JWT 시크릿 기본값에 의존한 채 배포하지 않는다.
- Don't: DB 스키마 변경 시 초기화/기존 데이터 영향 검토 없이 반영하지 않는다.
- Don't: 라우트에서 공통 인증 로직을 중복 구현하지 않는다.
