# Frontend Components AGENTS

## Module Context
- 이 폴더는 재사용 UI 컴포넌트와 화면 조립 요소를 담당한다.
- 페이지 로직과 분리된 프레젠테이션 계층을 유지하는 것이 목표다.

## Tech Stack & Constraints
- React + TypeScript props 기반 컴포넌트 작성.
- 스타일은 프로젝트 기존 Tailwind 클래스 사용 패턴을 따른다.
- 컴포넌트 내부에서 전역 인증 로직/네트워크 로직을 과도하게 직접 처리하지 않는다.

## Implementation Patterns
- Props 타입을 명시하고 이벤트 콜백은 상위에서 주입받는다.
- 표시 전용 컴포넌트는 가능한 순수 함수형으로 유지한다.
- 반복되는 UI 패턴(버튼/카드/배지)은 클래스 규칙을 일관되게 재사용한다.
- 접근성 기본 규칙(버튼/라벨/title)을 지킨다.

## Testing Strategy
- 페이지 통합 시나리오에서 컴포넌트 상호작용 검증.
- 반응형 동작(모바일/데스크톱) 확인.
- 이벤트 콜백 호출 및 상태 반영이 의도대로 되는지 수동 확인.

## Local Golden Rules
- Do: 컴포넌트는 단일 책임을 유지한다.
- Do: 재사용 가능한 UI는 props 기반으로 일반화한다.
- Don't: 컴포넌트 내부에 API URL/토큰 처리 같은 인프라 세부사항을 넣지 않는다.
- Don't: 동일한 스타일 블록을 여러 파일에 복붙해 분산시키지 않는다.
