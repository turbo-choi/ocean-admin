# AGENTS.md

## Project Context & Operations

### Business Goal
- Ocean Admin은 관리자용 게시판 및 회원관리 시스템이다.
- 핵심 기능은 인증(JWT), 역할 기반 접근 제어(admin/user), 게시글/댓글 CRUD, 회원관리다.

### Tech Stack Summary
- Frontend: React 19, TypeScript, Vite, React Router DOM, Lucide React, Tailwind 유틸리티 클래스 기반 스타일링.
- Backend: Node.js, TypeScript, Express, SQLite(better-sqlite3), bcrypt, jsonwebtoken.
- Architecture: SPA(프론트) + REST API(백엔드) 분리 구조.

### Operational Commands
- 의존성 설치(백엔드): `npm --prefix backend install`
- 의존성 설치(프론트): `npm --prefix front install`
- 백엔드 개발 서버: `npm --prefix backend run dev`
- 프론트 개발 서버: `npm --prefix front run dev`
- 백엔드 빌드: `npm --prefix backend run build`
- 프론트 빌드: `npm --prefix front run build`
- 백엔드 프로덕션 실행(빌드 후): `npm --prefix backend run start`
- 서버 헬스체크: `curl http://localhost:3001/api/health`
- 참고: 현재 `test` 스크립트가 없으므로 빌드 + 수동 API/화면 검증을 기본 검증 절차로 사용한다.

## Golden Rules

### Immutable
- 인증/인가 우회 금지: 관리자 전용 API는 반드시 `requireAuth` + `requireAdmin`을 거쳐야 한다.
- 비밀번호/토큰 보안 규칙 완화 금지: bcrypt 해싱, JWT 검증, 에러 일반화 원칙을 유지한다.
- 시크릿/토큰/민감정보 하드코딩 금지: 환경변수 기반 설정을 우선한다.
- DB 무결성 훼손 금지: 스키마/관계(특히 comments.board_id FK)와 데이터 일관성을 깨는 변경을 금지한다.
- `node_modules`, 빌드 산출물, 로컬 DB 파일을 기능 구현의 기준 소스로 취급하지 않는다.

### Do's & Don'ts
- Do: API 계약(요청/응답 필드명, 상태코드)을 프론트/백엔드에서 동시에 맞춘다.
- Do: 입력값 검증 후 DB 작업을 수행한다.
- Do: 인증 실패/권한 부족/리소스 없음/서버 오류를 구분된 상태코드로 반환한다.
- Do: 타입 정의(`types.ts`)를 기준으로 데이터 구조를 유지한다.
- Don't: API 키, JWT 시크릿, 비밀번호를 코드/커밋에 직접 노출하지 않는다.
- Don't: 인증 토큰을 URL 쿼리스트링으로 전달하지 않는다.
- Don't: 프론트에서 임의 에러 문자열을 하드코딩해 서버 에러 계약을 무시하지 않는다.
- Don't: 화면 컴포넌트에서 직접 인증 스토리지(localStorage) 조작 로직을 중복 구현하지 않는다.

## Standards & References

### Coding Convention
- TypeScript 우선, 명시적 타입 사용을 기본으로 한다.
- 파일 역할 분리: API 통신은 `front/api`, 전역 인증 상태는 `front/contexts`, 서버 엔드포인트는 `backend/src/routes`.
- 네이밍: React 컴포넌트 PascalCase, 함수/변수 camelCase, API 경로 REST 관례 준수.
- import는 ESM 기준(`.js` 확장 포함)으로 서버 코드와 일치시킨다.

### Git Strategy
- 브랜치: `main` 보호 가정, 기능 단위 단기 브랜치(`feat/*`, `fix/*`, `chore/*`) 사용.
- 커밋 메시지 포맷: Conventional Commits 권장.
- 예시: `feat(auth): add refresh token rotation guard`

### Maintenance Policy
- 규칙 문서와 실제 코드가 어긋나면, 코드 변경 시점에 해당 `AGENTS.md`를 함께 갱신 제안 또는 반영한다.
- 신규 경계(새 패키지, 새 프레임워크, 고밀도 도메인 폴더)가 생기면 해당 위치에 하위 `AGENTS.md`를 추가한다.

## Context Map (Action-Based Routing)
- **[Backend 전체 수정 및 서버 운영](./backend/AGENTS.md)** — Express 서버, DB 초기화, 런타임/배포 동작을 다룰 때.
- **[Backend API 라우트 구현](./backend/src/routes/AGENTS.md)** — 인증/회원/게시판/댓글 엔드포인트 로직 수정 시.
- **[Backend 인증 미들웨어](./backend/src/middleware/AGENTS.md)** — JWT 검증, 권한 체크, 토큰 생성 규칙 수정 시.
- **[Frontend 전체 수정 및 앱 운영](./front/AGENTS.md)** — React 앱 구조, 빌드/실행, 라우팅 전반 수정 시.
- **[Frontend API 클라이언트](./front/api/AGENTS.md)** — fetch/authFetch, 토큰 저장, API 계약 처리 수정 시.
- **[Frontend 인증 상태 관리](./front/contexts/AGENTS.md)** — `AuthContext`와 로그인 상태 흐름 수정 시.
- **[Frontend 페이지 로직](./front/pages/AGENTS.md)** — 페이지 단위 데이터 로딩, 라우트, 폼 처리 수정 시.
- **[Frontend 공통 컴포넌트](./front/components/AGENTS.md)** — 재사용 UI 컴포넌트, 프레젠테이션 계층 수정 시.
