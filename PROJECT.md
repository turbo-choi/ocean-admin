# Ocean Admin

관리자 대시보드 시스템 - React + Express 풀스택 프로젝트

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Ocean Admin |
| **목적** | 관리자용 게시판 및 회원관리 시스템 |
| **아키텍처** | 클라이언트-서버 (SPA + REST API) |
| **개발 기간** | 2026년 2월 |

---

## 🛠 기술 스택

### Frontend (`/front`)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (CDN)
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Backend (`/backend`)
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **인증**: JWT (jsonwebtoken) + bcrypt

---

## 🏗 프로젝트 구조

```
ocean-admin/
├── front/                 # 프론트엔드
│   ├── api/               # API 클라이언트
│   │   ├── auth.ts        # 인증 API
│   │   ├── board.ts       # 게시판/댓글 API
│   │   ├── menu.ts        # 메뉴 API
│   │   ├── boardType.ts   # 게시판 유형 API
│   │   └── dashboard.ts   # 대시보드 API
│   ├── components/        # 공통 컴포넌트
│   │   ├── Sidebar.tsx    # 동적 메뉴 사이드바
│   │   └── CommentSection.tsx
│   ├── contexts/          # Context API
│   │   └── AuthContext.tsx
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── BoardList.tsx        # 동적 게시판 지원
│   │   ├── BoardDetail.tsx
│   │   ├── BoardWrite.tsx
│   │   ├── UserList.tsx
│   │   ├── Profile.tsx
│   │   ├── MenuManagement.tsx   # 메뉴 관리 (관리자)
│   │   └── BoardTypeManagement.tsx  # 게시판 관리 (관리자)
│   └── App.tsx            # 메인 앱 (동적 라우팅)
│
└── backend/               # 백엔드
    ├── src/
    │   ├── middleware/
    │   │   └── auth.ts    # JWT 인증 미들웨어
    │   ├── routes/
    │   │   ├── auth.ts      # 인증 API
    │   │   ├── user.ts      # 회원관리 API
    │   │   ├── board.ts     # 게시판 API
    │   │   ├── comment.ts   # 댓글 API
    │   │   ├── menu.ts      # 메뉴 관리 API
    │   │   ├── boardType.ts # 게시판 유형 API
    │   │   └── dashboard.ts # 대시보드 API
    │   ├── database.ts    # DB 연결 (menus, board_types 포함)
    │   ├── types.ts       # 타입 정의
    │   └── index.ts       # 서버 진입점
    └── data/              # SQLite DB 파일
```

---

## 🔐 보안 아키텍처

| 기능 | 구현 |
|------|------|
| 비밀번호 해싱 | bcrypt (salt rounds: 12) |
| 토큰 인증 | JWT (Access: 1h, Refresh: 7d) |
| 역할 기반 접근 제어 | admin / user |
| 보호된 라우트 | 로그인 필수 |
| 에러 메시지 일반화 | 로그인 실패 시 상세 정보 노출 방지 |

---

## 📊 데이터베이스 스키마

```sql
-- 사용자 테이블
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- 게시판 유형 테이블
CREATE TABLE board_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_comment_enabled INTEGER DEFAULT 1,
    is_anonymous INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 테이블
CREATE TABLE boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_type_id INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (board_type_id) REFERENCES board_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 댓글 테이블
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 메뉴 테이블
CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    title TEXT NOT NULL,
    icon TEXT,
    link_type TEXT DEFAULT 'route' CHECK(link_type IN ('route', 'board', 'external')),
    link_value TEXT,
    sort_order INTEGER DEFAULT 0,
    is_admin_only INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id)
);
```

---

## 🚀 실행 방법

```bash
# 1. 백엔드 서버 실행 (포트 3001)
cd backend
npm install
npm run dev

# 2. 프론트엔드 서버 실행 (포트 3000)
cd front
npm install
npm run dev
```

**접속**: http://localhost:3000

---

## 🔑 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@ocean.com | Admin123! |

---

## 📝 API 엔드포인트

### 인증 (`/api/auth`)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /register | 회원가입 |
| POST | /login | 로그인 |
| POST | /refresh | 토큰 갱신 |
| GET | /me | 내 정보 조회 |
| PUT | /password | 비밀번호 변경 |

### 회원관리 (`/api/users`) - 관리자 전용
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | / | 회원 목록 |
| GET | /:id | 회원 상세 |
| PUT | /:id | 회원 수정 |
| DELETE | /:id | 회원 삭제 |

### 게시판 (`/api/boards`)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | / | 게시글 목록 (페이지네이션, 검색, boardType) |
| GET | /:id | 게시글 상세 |
| POST | / | 게시글 작성 |
| PUT | /:id | 게시글 수정 |
| DELETE | /:id | 게시글 삭제 |

### 댓글 (`/api/boards/:boardId/comments`)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | / | 댓글 목록 |
| POST | / | 댓글 작성 |
| PUT | /:id | 댓글 수정 |
| DELETE | /:id | 댓글 삭제 |

### 메뉴 (`/api/menus`) - 조회는 공개, 수정은 관리자 전용
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | / | 메뉴 트리 조회 |
| GET | /all | 전체 메뉴 목록 (관리자) |
| POST | / | 메뉴 생성 |
| PUT | /:id | 메뉴 수정 |
| DELETE | /:id | 메뉴 삭제 |
| PUT | /reorder | 메뉴 순서 변경 |

### 게시판 유형 (`/api/board-types`) - 조회는 공개, 수정은 관리자 전용
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | / | 게시판 유형 목록 |
| GET | /slug/:slug | 게시판 유형 조회 (slug) |
| GET | /:id | 게시판 유형 조회 (ID) |
| POST | / | 게시판 유형 생성 |
| PUT | /:id | 게시판 유형 수정 |
| DELETE | /:id | 게시판 유형 삭제 |

---

## ✅ 구현 완료 기능

- [x] 대시보드 화면 (통계 API 포함)
- [x] 게시판 CRUD (목록, 상세, 작성, 수정, 삭제)
- [x] 댓글 기능 (작성, 수정, 삭제)
- [x] 회원가입 / 로그인 / 로그아웃
- [x] JWT 토큰 기반 인증
- [x] 역할 기반 접근 제어 (관리자/일반)
- [x] 회원관리 (관리자 전용)
- [x] 반응형 사이드바
- [x] **동적 메뉴 관리** (`/admin/menus`)
- [x] **게시판 유형 관리** (`/admin/board-types`)
- [x] **동적 게시판 라우팅** (`/board/{slug}`)
- [x] **내 정보/비밀번호 변경** (`/profile`)

---

## 📂 관련 문서

- [구현 계획서](./docs/implementation_plan.md)
- [인증 아키텍처 계획](./docs/auth_implementation_plan.md)
- [작업 워크스루](./docs/walkthrough.md)
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)
