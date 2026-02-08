# Backend Routes AGENTS

## Module Context
- `auth.ts`, `user.ts`, `board.ts`, `comment.ts`는 핵심 비즈니스 로직이 밀집된 API 경계다.
- 이 폴더의 변경은 프론트 API 클라이언트와 직접 계약된다.

## Tech Stack & Constraints
- Express Router + better-sqlite3 쿼리 패턴을 사용한다.
- 비동기 필요 구간(예: bcrypt)은 `async/await`를 사용한다.
- 응답 본문은 JSON 고정이며, 에러는 `{ error: string }` 형식을 기본으로 한다.

## Implementation Patterns
- 라우트 핸들러 기본 템플릿:
- 파라미터/바디 검증 -> DB 존재성 확인 -> DB 변경/조회 -> 명확한 상태코드 반환.
- 페이지네이션 API는 `page`, `limit`, `total`, `totalPages`를 함께 반환한다.
- ID 파라미터는 `parseInt` 후 `isNaN` 검사로 조기 실패한다.
- 데이터 반환 시 SQL alias를 사용해 클라이언트 기대 필드(camelCase)를 맞춘다.

## Testing Strategy
- 백엔드 개발 서버 실행: `npm run dev`
- 타입/빌드 확인: `npm run build`
- 엔드포인트 수동 검증:
- 인증: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`
- 게시판/댓글: `/api/boards`, `/api/boards/:id`, `/api/boards/:boardId/comments`
- 회원관리(관리자): `/api/users`

## Local Golden Rules
- Do: 로그인 실패 메시지는 계정 존재 여부를 유추할 수 없게 유지한다.
- Do: 쓰기 작업 전 대상 리소스 존재 여부를 확인한다.
- Do: 관리자 수 최소 1명 유지 규칙을 깨지 않게 처리한다.
- Don't: 사용자 입력을 그대로 SQL 조합 문자열에 삽입하지 않는다.
- Don't: 성공/실패에 대해 모호한 상태코드(항상 200 등)를 사용하지 않는다.
