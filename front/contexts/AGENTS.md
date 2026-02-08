# Frontend Contexts AGENTS

## Module Context
- 이 폴더는 전역 상태 중 인증 상태를 관리한다.
- `AuthProvider`는 앱 초기 인증 확인, 로그인/로그아웃, 사용자 갱신 흐름을 책임진다.

## Tech Stack & Constraints
- React Context + Hook 기반으로 구현한다.
- 인증 정보 원본은 API 응답이며, 토큰 저장소 직접 접근은 API 모듈에 위임한다.
- Provider 외부에서 `useAuth` 사용 시 예외를 던지는 현재 계약을 유지한다.

## Implementation Patterns
- 초기 로딩에서 `getAccessToken` 존재 시 `getMe`로 사용자 복원한다.
- `login` 성공 시 user 상태를 즉시 반영한다.
- `logout` 시 토큰 정리와 user 초기화를 항상 함께 수행한다.
- 파생 상태(`isAuthenticated`, `isAdmin`)는 `user` 기준으로 계산한다.

## Testing Strategy
- 앱 시작 시 토큰 유무별 인증 상태 전환 확인.
- 로그인 성공/실패 시 UI 상태 변화 확인.
- 로그아웃 후 보호 라우트 접근 차단 확인.
- 일반 사용자/관리자 사용자별 `isAdmin` 분기 확인.

## Local Golden Rules
- Do: 인증 관련 비즈니스 로직은 Context에 모으고 페이지 중복을 줄인다.
- Do: `loading` 상태를 명확히 관리해 보호 라우트 깜빡임을 방지한다.
- Don't: Context 외부에서 `localStorage` 직접 조작으로 상태 불일치를 만들지 않는다.
- Don't: 인증 에러를 무시하고 조용히 실패시키지 않는다.
