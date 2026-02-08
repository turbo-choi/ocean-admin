# Backend Middleware AGENTS

## Module Context
- 이 영역은 JWT 발급/검증과 인증/인가 미들웨어(`requireAuth`, `requireAdmin`)를 담당한다.
- 모든 보호 라우트의 보안 경계로 동작한다.

## Tech Stack & Constraints
- `jsonwebtoken` 단일 라이브러리를 사용한다.
- Access/Refresh 토큰은 서로 다른 시크릿과 만료시간을 유지한다.
- Express `Request` 확장(`req.user`) 규약을 유지한다.

## Implementation Patterns
- 토큰 생성 함수는 payload 입력, 문자열 토큰 반환 패턴을 고정한다.
- 검증 함수는 실패 시 `null` 반환으로 라우트에서 일관 처리 가능해야 한다.
- `requireAuth`는 `Authorization: Bearer <token>` 형식을 강제한다.
- `requireAdmin`은 `requireAuth` 이후 적용을 전제로 한다.

## Testing Strategy
- 빌드 검증: `npm run build`
- 인증 시나리오 수동 테스트:
- 토큰 없음 -> 401
- 만료/변조 토큰 -> 401
- 일반 유저의 관리자 API 접근 -> 403
- 유효 관리자 토큰 접근 -> 성공

## Local Golden Rules
- Do: 시크릿과 만료값 변경 시 Access/Refresh 모두 동기화 검토한다.
- Do: 인증 실패 응답은 구체 내부정보를 노출하지 않는다.
- Don't: 토큰 payload에 불필요한 민감정보를 추가하지 않는다.
- Don't: 인증 우회 편의 코드(하드코딩 user 주입 등)를 넣지 않는다.
