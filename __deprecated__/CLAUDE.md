# 기도제목 웹 애플리케이션 개발 계획

## 프로젝트 개요
기도제목을 표시하고 배경음악을 재생하는 웹 애플리케이션. 권한 기반 편집 기능과 테마 전환 지원.

## 기술 스택

### 핵심 기술
- **Next.js 14** - Netlify 배포 최적화
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링 및 테마
- **Supabase** - 데이터베이스 및 인증

### 최소 의존성
- **Lucide React** - 아이콘만
- **@supabase/ssr** - Next.js SSR 지원

## 아키텍처 구조

### 폴더 구조
```
app/
├── globals.css
├── layout.tsx
├── page.tsx          # 메인 페이지
├── edit/
│   └── page.tsx      # 편집 페이지
└── login/
    └── page.tsx      # 로그인 페이지

components/
├── TopBar.tsx        # 상단 고정 바
├── PrayerDisplay.tsx # 기도제목 표시
├── AudioPlayer.tsx   # 음악 재생
├── ThemeToggle.tsx   # 테마 전환
└── VolumeControl.tsx # 볼륨 조절

lib/
├── supabase.ts       # Supabase 클라이언트
└── auth.ts           # 인증 유틸리티

hooks/
├── useAuth.ts        # 인증 상태
├── usePrayers.ts     # 기도제목 데이터
└── useTheme.ts       # 테마 상태
```

## 데이터베이스 설계

### prayers 테이블
- id (UUID, Primary Key)
- content (TEXT, 기도제목 내용)
- is_active (BOOLEAN, 활성화 상태)
- created_at, updated_at (TIMESTAMP)

### user_roles 테이블
- id (UUID, Primary Key)
- user_id (UUID, auth.users 참조)
- role (TEXT: 'admin', 'editor', 'viewer')
- created_at (TIMESTAMP)

### 보안 정책
- 모든 사용자: prayers 읽기 가능
- admin/editor만: prayers 쓰기 가능

## 페이지별 구조

### 메인 페이지 (/)
- PrayerDisplay: 현재 기도제목
- AudioPlayer: 자동 배경음악 재생
- TopBar: 고정 상단바

### 편집 페이지 (/edit)
- 권한 검증 후 접근
- 기도제목 CRUD 인터페이스
- 실시간 미리보기

### 로그인 페이지 (/login)
- Supabase Auth 연동
- 이메일/패스워드 로그인

## 상태 관리

### 클라이언트 상태
- 테마 (localStorage 저장)
- 오디오 상태 (재생/일시정지/볼륨)
- UI 상태 (모달, 로딩 등)

### 서버 상태
- 기도제목 데이터 (Supabase)
- 사용자 인증 상태
- 사용자 권한 정보

## 개발 단계

### Phase 1: 프론트엔드 페이지 구축
1. Next.js 프로젝트 설정
2. 기본 레이아웃 및 TopBar
3. 메인 페이지 UI
4. 편집 페이지 UI
5. 로그인 페이지 UI
6. 테마 시스템 구현

### Phase 2: 백엔드 로직 개발
1. Supabase 프로젝트 설정
2. 데이터베이스 스키마 생성
3. 인증 시스템 연동
4. 기도제목 CRUD API
5. 권한 시스템 구현
6. 실시간 데이터 동기화

### Phase 3: 기능 통합 및 최적화
1. 오디오 재생 시스템
2. 에러 처리 및 로딩 상태
3. 성능 최적화
4. Netlify 배포 설정

## 핵심 기능 요구사항

### TopBar (고정)
- 왼쪽: 편집 아이콘 (권한자만 표시)
- 오른쪽: 테마 토글, 볼륨 컨트롤

### 권한 시스템
- 로그인하지 않은 사용자: 보기만 가능
- 권한 없는 사용자: 로그인해도 편집 불가
- admin/editor: 편집 가능

### 테마 시스템
- 다크/라이트 테마
- 시스템 설정 감지
- 사용자 선택 저장

### 오디오 시스템
- 웹 스트리밍 음악 자동 재생
- 볼륨 조절 및 음소거
- 브라우저 autoplay 정책 준수

## 배포 설정

### Netlify 최적화
- Static export 설정
- Environment variables 관리
- 빌드 최적화
- CDN 캐싱 전략

### 환경 변수
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BACKGROUND_MUSIC_URL

이 계획을 바탕으로 먼저 모든 페이지의 UI를 완성한 후, 백엔드 로직을 단계별로 구현하겠습니다.

## 현재 완료된 작업

### ✅ Phase 1: 메인페이지 기본 구조 및 로직 (완료)

1. **기본 레이아웃 구조**
   - Next.js 14 프로젝트 설정
   - 기본 폴더 구조 생성 (`src/components/`, `src/hooks/`)
   - Tailwind CSS 4.0 설정 (`@variant dark (.dark &)` 사용)
   - RootLayout에 TopBar 통합

2. **TopBar 컴포넌트 (완료)**
   - 고정 상단바 구현 (`fixed top-0`)
   - 편집 아이콘 (왼쪽)
   - 글자 크기 조절 버튼 (Minus/Type 아이콘)
   - 볼륨 컨트롤 (슬라이더)
   - 테마 토글 (Sun/Moon 아이콘)
   - 다크 테마용 앤티크 골드 색상 (`amber-300`)

3. **PrayerDisplay 컴포넌트 (완료)**
   - 기도제목 표시 레이아웃
   - 섹션별 구분 (`<섹션명>` 형태, font-bold)
   - 번호가 있는 기도제목 리스트
   - 성경 구절 인용 영역 (구분선 포함)
   - TypeScript 인터페이스 정의

4. **상태 관리 시스템 (완료)**
   - `useTheme` 훅: localStorage 저장, 시스템 테마 감지
   - `useFontSize` 훅: scale transform 기반 크기 조절
   - 컴포넌트 간 상태 공유
   - 새로고침 시 상태 복원

5. **글자 크기 조절 시스템 (완료)**
   - 80%~150% 범위 제한
   - `transform: scale()` 사용으로 TopBar 크기 고정
   - `transformOrigin: 'top left'`로 자연스러운 확대
   - `.prayer-content` 클래스 타겟팅

6. **테마 시스템 (완료)**
   - 다크/라이트 테마 완전 구현
   - 기본값: 다크 테마 (번쩍임 방지)
   - 시스템 설정 초기 감지 후 수동 토글 가능
   - localStorage 저장 및 복원
   - SSR 하이드레이션 번쩍임 해결 (HTML에 기본 `dark` 클래스)

### 📁 현재 파일 구조
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx      # TopBar 포함
│   └── page.tsx        # 메인페이지, prayer-content 클래스
├── components/
│   ├── TopBar.tsx      # 상태 관리 훅 사용
│   └── PrayerDisplay.tsx
└── hooks/
    ├── useTheme.ts     # 테마 상태 관리
    └── useFontSize.ts  # 글자 크기 상태 관리
```

### 🔄 다음 작업 계획
1. **오디오 플레이어 구현** - AudioPlayer 컴포넌트 및 볼륨 연동
2. **편집 페이지 UI** - /edit 경로
3. **로그인 페이지 UI** - /login 경로
4. **Supabase 백엔드 연동**

### 🔧 주요 기술 구현 사항

#### Tailwind CSS 4.0 다크 모드 설정
```css
@import "tailwindcss";

@variant dark (.dark &);

:root {
  --background: #171717;
  --foreground: #ffffff;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

#### SSR 번쩍임 방지 설정
- `layout.tsx`에서 HTML 요소에 기본 `dark` 클래스 설정
- `useTheme` 훅에서 라이트 모드일 때만 클래스 제거
- 기본값을 다크로 설정하여 로딩 시 번쩍임 방지