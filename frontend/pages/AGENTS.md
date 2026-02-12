# Frontend Pages AGENTS

## Module Context
- 이 폴더는 라우트 단위 화면을 담당한다.
- 페이지는 데이터 로딩, 사용자 입력 처리, 화면 전환, 에러 피드백을 결합한다.

## Tech Stack & Constraints
- React 함수형 컴포넌트 + Hook 패턴을 사용한다.
- 라우트 파라미터는 `react-router-dom` 훅으로 처리한다.
- 서버 통신은 `../api/*` 모듈을 통해서만 수행한다.

## Implementation Patterns
- 표준 상태 세트: `loading`, `error`, `submitting/deleting` 등을 명시 관리한다.
- `useEffect` 데이터 로딩은 의존성 배열과 조기 반환(`if (!id) return`)을 명확히 한다.
- 파괴적 작업(삭제 등)은 사용자 확인 후 실행한다.
- 성공 후 이동은 `navigate(..., { replace: true })` 규칙을 상황에 맞게 적용한다.

## Testing Strategy
- 라우트 시나리오 수동 검증:
- `/login`, `/register` 인증 흐름
- `/board`, `/board/:id`, `/board/write`, `/board/edit/:id` CRUD 흐름
- `/users` 관리자 접근/권한 차단 흐름
- 오류 시나리오: 네트워크 실패, 404 데이터, 권한 부족

## Local Golden Rules
- Do: 페이지에서 API 에러를 사용자에게 명확히 노출한다.
- Do: 폼 입력값 기본 검증을 클라이언트에서 먼저 수행한다.
- Don't: 대규모 비즈니스 로직을 페이지에 과도하게 누적하지 않는다.
- Don't: 하드코딩된 테스트 계정/민감정보를 신규 페이지에 추가하지 않는다.
