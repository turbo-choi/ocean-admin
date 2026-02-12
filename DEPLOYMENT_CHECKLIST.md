# 🚀 배포 체크리스트

> **배포 전 반드시 확인하세요!**

---

## 🔐 필수 환경변수

```bash
# .env.production
NODE_ENV=production
JWT_SECRET=<32자 이상 랜덤 문자열>
JWT_REFRESH_SECRET=<32자 이상 랜덤 문자열>
CORS_ORIGINS=https://your-domain.com
```

### 시크릿 생성 예시
```bash
# Node.js로 랜덤 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ **JWT 시크릿 미설정 시 프로덕션 환경에서 서버가 시작되지 않습니다.**

---

## ✅ 보안 체크리스트

### 백엔드

| 항목 | 상태 | 설명 |
|------|------|------|
| JWT_SECRET 환경변수 설정 | ☐ | 32자 이상 랜덤 문자열 |
| JWT_REFRESH_SECRET 환경변수 설정 | ☐ | 32자 이상 랜덤 문자열 |
| NODE_ENV=production 설정 | ☐ | 프로덕션 모드 필수 |
| CORS_ORIGINS 설정 | ☐ | 허용할 도메인 목록 (쉼표 구분) |
| 기본 관리자 계정 비밀번호 변경 | ☐ | admin@ocean.com 비밀번호 변경 필수 |
| HTTPS 적용 | ☐ | SSL 인증서 설정 |

### 프론트엔드

| 항목 | 상태 | 설명 |
|------|------|------|
| API_BASE_URL 프로덕션 주소로 변경 | ☐ | localhost → 실제 도메인 |
| 테스트 계정 안내 UI 제거 | ☐ | Login.tsx의 테스트 계정 표시 제거 |
| 빌드 테스트 | ☐ | `npm run build` 성공 확인 |

---

## 🛡️ 적용된 보안 기능

### 현재 적용됨 ✅

| 기능 | 위치 | 설명 |
|------|------|------|
| helmet | `index.ts` | 보안 HTTP 헤더 |
| CORS allowlist | `index.ts` | 허용된 오리진만 접근 |
| Rate Limiting (API) | `index.ts` | 분당 100회 제한 |
| Rate Limiting (로그인) | `index.ts` | 15분당 10회 제한 |
| JWT 필수 검증 | `auth.ts` | 프로덕션에서 환경변수 필수 |
| 대시보드 API 인증 | `dashboard.ts` | requireAuth 적용 |
| 외부 링크 URL 검증 | `menu.ts` | javascript:, data: 차단 |

### 향후 개선 권장 ⚠️

| 항목 | 현재 상태 | 권장 사항 |
|------|-----------|-----------|
| Refresh Token | 재사용 가능 | 토큰 회전 + 블랙리스트 도입 |
| 토큰 저장 | localStorage | httpOnly 쿠키 전환 |
| 이메일 노출 | 대시보드에서 표시 | 민감 정보 마스킹 |

---

## 📋 배포 순서

1. **환경변수 파일 생성**
   ```bash
   cp .env.example .env.production
   # 필수 값 설정
   ```

2. **빌드**
   ```bash
   # 백엔드
   cd backend && npm run build
   
   # 프론트엔드
   cd frontend && npm run build
   ```

3. **테스트**
   ```bash
   # 헬스체크
   curl https://your-domain.com/api/health
   ```

4. **관리자 계정 비밀번호 변경**
   - 로그인 후 프로필에서 비밀번호 변경

---

## 🔗 관련 문서

- [PROJECT.md](./PROJECT.md)
- [Backend AGENTS.md](./backend/AGENTS.md)
