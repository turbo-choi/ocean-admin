# Frontend AGENTS

## Module Context
- 이 영역은 React SPA를 담당하며 관리자 화면, 인증 흐름, API 연동 UI를 제공한다.
- 백엔드 API(`http://localhost:3001/api`)와 계약이 맞아야 정상 동작한다.

## Tech Stack & Constraints
- React 19 + TypeScript + Vite + React Router DOM 기반.
- 스타일은 Tailwind 유틸리티 클래스 사용을 기본으로 한다.
- API 통신은 `front/api`를 경유하고 페이지/컴포넌트에서 직접 fetch 남용을 피한다.
- 인증 상태는 `front/contexts/AuthContext.tsx` 단일 소스로 유지한다.

## Implementation Patterns
- 라우팅은 `App.tsx`의 공개/보호 라우트 구조를 유지한다.
- 보호 페이지는 `ProtectedRoute`를 통해 접근 제어한다.
- 페이지는 데이터 로딩/에러/로딩 상태를 지역 상태로 명시 관리한다.
- 사용자/게시판 타입 계약은 API 모듈 export 타입과 동기화한다.

## Testing Strategy
- 개발 서버: `npm run dev`
- 빌드 검증: `npm run build`
- 주요 수동 시나리오:
- 로그인/로그아웃 후 라우트 접근 제어 확인
- 게시글 목록/상세/작성/수정/삭제 흐름 확인
- 관리자 계정의 회원관리 페이지 접근 및 수정/삭제 확인

## Local Golden Rules
- Do: 인증 필요 API는 `authFetch` 경로를 사용한다.
- Do: 폼 제출 시 기본 검증 및 에러 메시지 표시를 구현한다.
- Do: 네비게이션은 `react-router-dom` API로 일관 처리한다.
- Don't: 컴포넌트에서 토큰 키 문자열을 직접 다루지 않는다.
- Don't: 백엔드 응답 구조를 무시한 임의 파싱을 추가하지 않는다.
