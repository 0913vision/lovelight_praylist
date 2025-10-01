# 기도제목 모바일 애플리케이션 개발 계획

## 프로젝트 개요
기도제목을 표시하고 배경음악을 재생하는 React Native 모바일 애플리케이션. 권한 기반 편집 기능과 테마 전환 지원, 앱스토어/플레이스토어 배포 예정.

## 기술 스택

### 핵심 기술
- **React Native (Expo)** - 크로스플랫폼 모바일 개발
- **TypeScript** - 타입 안정성
- **NativeWind** - 스타일링 및 테마 (Tailwind for React Native)
- **Supabase** - 데이터베이스 및 인증
- **Expo Audio** - 오디오 재생 시스템

### 주요 의존성
- **@supabase/supabase-js** - React Native 클라이언트
- **expo-av** - 오디오/비디오 재생
- **expo-secure-store** - 안전한 로컬 저장소
- **@react-navigation/native** - 네비게이션 (검토 중)
- **expo-splash-screen** - 스플래시 화면
- **expo-status-bar** - 상태바 제어

## 아키텍처 구조

### 폴더 구조
```
src/
├── components/
│   ├── TopBar.tsx          # 상단 고정 바
│   ├── PrayerDisplay.tsx   # 기도제목 표시
│   ├── AudioPlayer.tsx     # 음악 재생
│   ├── ThemeToggle.tsx     # 테마 전환
│   └── VolumeControl.tsx   # 볼륨 조절
├── screens/
│   ├── MainScreen.tsx      # 메인 화면
│   ├── EditScreen.tsx      # 편집 화면
│   └── LoginScreen.tsx     # 로그인 화면
├── hooks/
│   ├── useAuth.ts          # 인증 상태
│   ├── usePrayers.ts       # 기도제목 데이터
│   ├── useTheme.ts         # 테마 상태
│   └── useAudio.ts         # 오디오 상태
├── lib/
│   ├── supabase.ts         # Supabase 클라이언트
│   └── auth.ts             # 인증 유틸리티
├── types/
│   └── index.ts            # TypeScript 타입 정의
└── constants/
    ├── Colors.ts           # 테마 색상
    └── Audio.ts            # 오디오 설정
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

### 보안 정책 (RLS)
- 모든 사용자: prayers 읽기 가능
- admin/editor만: prayers 쓰기 가능

## 화면별 구조

### 메인 화면 (MainScreen)
- PrayerDisplay: 현재 기도제목
- AudioPlayer: 배경음악 재생
- TopBar: 고정 상단바
- StatusBar: 다크/라이트 테마에 따른 상태바

### 편집 화면 (EditScreen)
- 권한 검증 후 접근
- 기도제목 CRUD 인터페이스
- 실시간 미리보기
- 키보드 회피 처리

### 로그인 화면 (LoginScreen)
- Supabase Auth 연동
- 이메일/패스워드 로그인
- 앱 로고 및 브랜딩

## 상태 관리

### 로컬 상태 (Expo SecureStore)
- 테마 설정
- 오디오 볼륨 설정
- 사용자 토큰
- 글자 크기 설정

### 서버 상태 (Supabase)
- 기도제목 데이터
- 사용자 인증 상태
- 사용자 권한 정보
- 실시간 구독

### 앱 상태
- 오디오 재생 상태
- 네트워크 연결 상태
- 로딩 상태
- 에러 상태

## 개발 단계

### Phase 1: 기본 앱 구조 설정
1. Expo 프로젝트 초기 설정
2. NativeWind 및 TypeScript 설정
3. 기본 화면 구조 생성
4. 네비게이션 시스템 구현

### Phase 2: UI 컴포넌트 개발
1. TopBar 컴포넌트 (모바일 최적화)
2. PrayerDisplay 컴포넌트
3. 테마 시스템 구현
4. 글자 크기 조절 시스템

### Phase 3: 오디오 시스템 구현
1. Expo Audio 설정
2. 배경음악 자동 재생
3. 볼륨 조절 및 음소거
4. 오디오 포커스 관리

### Phase 4: 백엔드 연동
1. Supabase 클라이언트 설정
2. 인증 시스템 연동
3. 기도제목 CRUD 구현
4. 실시간 데이터 동기화

### Phase 5: 앱 배포 준비
1. 앱 아이콘 및 스플래시 화면
2. 앱 메타데이터 설정
3. 빌드 최적화
4. 스토어 배포 준비

## 핵심 기능 요구사항

### TopBar (모바일 최적화)
- Safe Area 고려
- 왼쪽: 편집 아이콘 (권한자만 표시)
- 오른쪽: 테마 토글, 볼륨 컨트롤
- 글자 크기 조절 버튼

### 권한 시스템
- 로그인하지 않은 사용자: 보기만 가능
- 권한 없는 사용자: 로그인해도 편집 불가
- admin/editor: 편집 가능
- 권한 확인 후 UI 조건부 렌더링

### 테마 시스템
- 다크/라이트 테마
- 시스템 설정 감지 (Appearance)
- 사용자 선택 저장 (SecureStore)
- StatusBar 색상 동기화

### 오디오 시스템
- 스트리밍 또는 로컬 파일 지원
- 백그라운드 재생
- 오디오 포커스 관리
- 볼륨 조절 및 음소거
- 앱 비활성화 시 일시정지

## 모바일 특화 기능

### 사용자 경험
- Safe Area 처리
- 키보드 회피 (KeyboardAvoidingView)
- 터치 피드백 (Haptic Feedback)
- 스와이프 제스처 고려
- 로딩 상태 표시

### 성능 최적화
- 이미지 최적화
- 번들 크기 최소화
- 메모리 관리
- 네트워크 요청 최적화

### 네이티브 기능 활용
- 시스템 알림
- 앱 상태 관리 (AppState)
- 디바이스 정보 접근
- 네트워크 상태 감지

## 배포 설정

### Expo Application Services (EAS)
- EAS Build 설정
- EAS Submit 설정
- 앱 서명 관리
- 환경별 빌드 구성

### 앱 스토어 메타데이터
- 앱 이름: "기도제목"
- 카테고리: "라이프스타일" 또는 "종교"
- 개인정보 처리방침
- 앱 설명 및 스크린샷

### 환경 변수
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_BACKGROUND_MUSIC_URL (검토 중)

## 유의사항

### 보안
- API 키 보안 관리
- 사용자 데이터 암호화
- HTTPS 통신 강제
- 취약점 점검

### 접근성
- Screen Reader 지원
- 색상 대비 준수
- 터치 영역 크기
- 키보드 네비게이션

### 플랫폼 차이
- iOS/Android 디자인 가이드라인
- 플랫폼별 권한 요청
- 네이티브 모듈 호환성
- 테스트 디바이스 커버리지

### 오디오 고려사항
- 스트리밍 vs 로컬 파일 결정 필요
- 저작권 및 라이선스 확인
- 데이터 사용량 최적화
- 오프라인 지원 여부

## 개발 우선순위

1. **필수 기능**: 기도제목 표시, 기본 테마, 권한 시스템
2. **핵심 기능**: 오디오 재생, 편집 기능, 인증
3. **개선 기능**: 글자 크기 조절, 고급 테마 옵션
4. **향후 기능**: 푸시 알림, 오프라인 지원, 소셜 기능

이 계획을 바탕으로 단계별로 React Native 앱을 개발하겠습니다.
- 정보는 항상 context7 을 사용하여 확인할 것