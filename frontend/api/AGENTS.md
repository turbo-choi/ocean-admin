# Frontend API AGENTS

## Module Context
- 이 폴더는 프론트엔드의 서버 통신 경계를 담당한다.
- `auth.ts`는 인증/회원관리, `board.ts`는 게시판/댓글 API를 제공한다.

## Tech Stack & Constraints
- 네트워크 클라이언트는 브라우저 기본 `fetch`를 사용한다.
- 인증 요청은 `authFetch` 기반 자동 토큰 갱신 패턴을 따른다.
- API 기본 경로는 `http://localhost:3001/api`를 기준으로 맞춘다.

## Implementation Patterns
- 함수 단위로 요청/응답 타입을 명시한다.
- 실패 시 `response.ok` 검사 후 서버 `error` 메시지를 우선 사용해 `Error`를 던진다.
- 토큰 저장/조회/삭제는 `auth.ts` 유틸 함수만 사용한다.
- 목록 API는 페이지네이션 메타 필드를 유지한다.

## Testing Strategy
- 프론트 실행 후 주요 API 호출 화면에서 동작 확인.
- 인증 API 검증:
- 로그인 성공 시 토큰 저장
- 만료 토큰 시 refresh 후 재시도
- refresh 실패 시 토큰 정리
- 데이터 API 검증:
- 게시글/댓글 CRUD 요청과 에러 처리 확인

## Local Golden Rules
- Do: 인증 헤더 생성은 `getAuthHeaders`를 재사용한다.
- Do: API 함수 시그니처를 페이지 요구사항과 함께 갱신한다.
- Don't: 페이지 컴포넌트에서 동일한 fetch 로직을 중복 작성하지 않는다.
- Don't: 토큰이 필요한 요청에 일반 fetch를 사용해 401 재시도 로직을 우회하지 않는다.
