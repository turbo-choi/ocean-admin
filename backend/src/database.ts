/**
 * SQLite 데이터베이스 연결 및 스키마 초기화
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'board.db');

/** SQLite 데이터베이스 인스턴스 */
export const db = new Database(dbPath);

/** 비밀번호 해싱 라운드 */
const SALT_ROUNDS = 12;

/**
 * 데이터베이스 스키마 초기화
 * 테이블이 없으면 생성하고, 샘플 데이터를 추가합니다.
 */
export function initDatabase(): void {
  // users 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )
  `);

  // menus 테이블 생성 (동적 메뉴 관리)
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      title TEXT NOT NULL,
      icon TEXT,
      link_type TEXT CHECK(link_type IN ('route', 'board', 'external')),
      link_value TEXT,
      sort_order INTEGER DEFAULT 0,
      is_admin_only INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE
    )
  `);

  // board_types 테이블 생성 (게시판 유형 관리)
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      is_comment_enabled INTEGER DEFAULT 1,
      is_anonymous INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // boards 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_type_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      view_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (board_type_id) REFERENCES board_types(id) ON DELETE SET NULL
    )
  `);

  // 기존 테이블에 user_id 컬럼이 없으면 추가 (마이그레이션)
  try {
    db.exec(`ALTER TABLE boards ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    console.log('✅ boards 테이블에 user_id 컬럼이 추가되었습니다.');
  } catch {
    // 컬럼이 이미 존재하면 무시
  }

  // 기존 테이블에 board_type_id 컬럼이 없으면 추가 (마이그레이션)
  // SQLite ALTER TABLE은 REFERENCES 지원 안함
  try {
    db.exec(`ALTER TABLE boards ADD COLUMN board_type_id INTEGER DEFAULT 1`);
    console.log('✅ boards 테이블에 board_type_id 컬럼이 추가되었습니다.');
  } catch {
    // 컬럼이 이미 존재하면 무시
  }

  // comments 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 기존 comments 테이블에 user_id 컬럼이 없으면 추가 (마이그레이션)
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    console.log('✅ comments 테이블에 user_id 컬럼이 추가되었습니다.');
  } catch {
    // 컬럼이 이미 존재하면 무시
  }

  // 관리자 계정이 없으면 생성
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number };
  if (adminCount.count === 0) {
    const passwordHash = bcrypt.hashSync('Admin123!', SALT_ROUNDS);
    db.prepare(`
      INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
    `).run('admin@ocean.com', passwordHash, '관리자', 'admin');
    console.log('✅ 관리자 계정이 생성되었습니다. (admin@ocean.com / Admin123!)');
  }

  // 기본 게시판 유형 생성
  const boardTypeCount = db.prepare('SELECT COUNT(*) as count FROM board_types').get() as { count: number };
  if (boardTypeCount.count === 0) {
    const insertType = db.prepare(`
      INSERT INTO board_types (name, slug, description) VALUES (?, ?, ?)
    `);
    insertType.run('자유게시판', 'free', '자유롭게 글을 작성할 수 있는 게시판입니다.');
    insertType.run('공지사항', 'notice', '공지사항을 확인하세요.');
    insertType.run('Q&A', 'qna', '질문과 답변을 주고받는 게시판입니다.');
    console.log('✅ 기본 게시판 유형이 생성되었습니다.');
  }

  // 기본 메뉴 생성
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menus').get() as { count: number };
  if (menuCount.count === 0) {
    const insertMenu = db.prepare(`
      INSERT INTO menus (parent_id, title, icon, link_type, link_value, sort_order, is_admin_only) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Main Menu
    insertMenu.run(null, 'Dashboard', 'LayoutDashboard', 'route', '/', 1, 0);
    insertMenu.run(null, '자유게시판', 'FileText', 'board', 'free', 2, 0);
    insertMenu.run(null, '공지사항', 'Bell', 'board', 'notice', 3, 0);
    insertMenu.run(null, 'Q&A', 'HelpCircle', 'board', 'qna', 4, 0);
    insertMenu.run(null, '회원 관리', 'Users', 'route', '/users', 5, 1);
    // System Menu
    insertMenu.run(null, '메뉴 관리', 'Menu', 'route', '/admin/menus', 10, 1);
    insertMenu.run(null, '게시판 관리', 'Layers', 'route', '/admin/board-types', 11, 1);
    console.log('✅ 기본 메뉴가 생성되었습니다.');
  } else {
    // 기존 DB에 관리자 메뉴가 없으면 추가 (마이그레이션)
    const adminMenus = [
      { title: '회원 관리', icon: 'Users', linkType: 'route', linkValue: '/users', sortOrder: 5 },
      { title: '메뉴 관리', icon: 'Menu', linkType: 'route', linkValue: '/admin/menus', sortOrder: 10 },
      { title: '게시판 관리', icon: 'Layers', linkType: 'route', linkValue: '/admin/board-types', sortOrder: 11 },
    ];

    const insertMenu = db.prepare(`
      INSERT INTO menus (parent_id, title, icon, link_type, link_value, sort_order, is_admin_only) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const menu of adminMenus) {
      const exists = db.prepare('SELECT id FROM menus WHERE link_value = ?').get(menu.linkValue);
      if (!exists) {
        insertMenu.run(null, menu.title, menu.icon, menu.linkType, menu.linkValue, menu.sortOrder, 1);
        console.log(`✅ "${menu.title}" 메뉴가 추가되었습니다.`);
      }
    }
  }

  // 게시판 샘플 데이터
  const boardCount = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number };
  if (boardCount.count === 0) {
    const insert = db.prepare(`
      INSERT INTO boards (board_type_id, title, content, author) VALUES (?, ?, ?, ?)
    `);

    const sampleData = [
      [1, '환영합니다!', 'Ocean Admin 게시판에 오신 것을 환영합니다. 이 게시판에서 다양한 정보를 공유해 보세요.', '관리자'],
      [1, '게시판 이용 안내', '게시글 작성 시 제목과 내용을 모두 입력해주세요. 부적절한 게시글은 삭제될 수 있습니다.', '관리자'],
      [2, '시스템 업데이트 공지', '2026년 2월 10일에 시스템 정기 점검이 예정되어 있습니다. 점검 시간: 02:00 ~ 04:00', '관리자'],
      [2, '신규 기능 안내', '대시보드에 새로운 통계 기능이 추가되었습니다. 확인해 보세요!', '개발팀'],
      [3, 'Q&A 이용 방법', '질문을 올리면 관리자가 답변해 드립니다.', '관리자'],
    ];

    for (const [typeId, title, content, author] of sampleData) {
      insert.run(typeId, title, content, author);
    }

    console.log('✅ 샘플 데이터가 추가되었습니다.');
  }

  console.log('✅ 데이터베이스가 초기화되었습니다.');
}

