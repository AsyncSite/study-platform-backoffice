# Study Platform Backoffice - 프로젝트 분석

## 🏗️ 프로젝트 개요

**Study Platform Backoffice**는 스터디 플랫폼의 관리자 전용 백오피스 시스템으로, React + TypeScript + Vite 기반의 현대적인 웹 애플리케이션입니다.

### 📋 기본 정보
- **이름**: study-platform-backoffice
- **버전**: 0.0.0
- **타입**: 프라이빗 프로젝트
- **빌드 툴**: Vite 7.0.4
- **배포 환경**: Vercel

---

## 🛠️ 기술 스택

### 핵심 프레임워크
- **React 19.1.0** - 최신 버전 사용
- **TypeScript 5.8.3** - 타입 안전성
- **Vite 7.0.4** - 빠른 개발 환경

### 주요 라이브러리
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `styled-components` | 6.1.19 | CSS-in-JS 스타일링 |
| `react-router-dom` | 7.7.0 | 클라이언트 사이드 라우팅 |
| `@tanstack/react-router` | 1.128.0 | 고급 라우팅 (추가) |
| `axios` | 1.10.0 | HTTP 클라이언트 |
| `date-fns` | 4.1.0 | 날짜 처리 |
| `lucide-react` | 0.536.0 | 아이콘 라이브러리 |

### 개발 도구
- **ESLint** - 코드 품질 관리
- **TypeScript ESLint** - TypeScript 전용 린팅 규칙

---

## 📁 프로젝트 구조

```
study-platform-backoffice/
├── 📄 Configuration Files
│   ├── package.json              # 프로젝트 메타데이터 & 스크립트
│   ├── vite.config.ts           # Vite 설정
│   ├── tsconfig.json            # TypeScript 루트 설정
│   ├── tsconfig.app.json        # 앱용 TypeScript 설정
│   ├── tsconfig.node.json       # Node.js용 TypeScript 설정
│   ├── eslint.config.js         # ESLint 설정
│   └── vercel.json              # Vercel 배포 설정
│
├── 📁 src/                      # 소스 코드
│   ├── 📁 api/                  # API 클라이언트
│   │   ├── client.ts            # Axios 클라이언트 설정
│   │   ├── auth.ts              # 인증 API
│   │   ├── study.ts             # 스터디 API
│   │   ├── users.ts             # 사용자 API
│   │   ├── membership.ts        # 멤버십 API
│   │   ├── noti.ts              # 알림 API
│   │   └── mock*.ts             # 목 데이터
│   │
│   ├── 📁 components/           # 재사용 가능한 컴포넌트
│   │   ├── 📁 common/           # 공통 컴포넌트
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Toast.tsx
│   │   ├── 📁 dashboard/        # 대시보드 전용 컴포넌트
│   │   ├── 📁 study/            # 스터디 관리 컴포넌트
│   │   ├── 📁 members/          # 멤버 관리 컴포넌트
│   │   ├── 📁 noti/             # 알림 관리 컴포넌트
│   │   └── 📁 navigation/       # 내비게이션 컴포넌트
│   │
│   ├── 📁 pages/                # 페이지 컴포넌트
│   │   ├── Dashboard.tsx        # 메인 대시보드
│   │   ├── StudyManagement.tsx  # 스터디 관리
│   │   ├── MemberManagement.tsx # 멤버 관리
│   │   ├── NotiManagement.tsx   # 알림 관리
│   │   ├── MyPage.tsx           # 마이페이지
│   │   └── Login.tsx            # 로그인
│   │
│   ├── 📁 contexts/             # React Context
│   │   ├── AuthContext.tsx      # 인증 컨텍스트
│   │   └── NotificationContext.tsx # 알림 컨텍스트
│   │
│   ├── 📁 types/                # TypeScript 타입 정의
│   │   ├── auth.ts              # 인증 관련 타입
│   │   ├── user.ts              # 사용자 타입
│   │   ├── schedule.ts          # 스케줄 타입
│   │   └── api.ts               # API 응답 타입
│   │
│   ├── 📁 styles/               # 스타일 설정
│   │   ├── GlobalStyle.ts       # 글로벌 스타일
│   │   └── theme.ts             # 테마 설정
│   │
│   ├── 📁 utils/                # 유틸리티 함수
│   │   └── dateUtils.ts         # 날짜 관련 유틸
│   │
│   ├── 📁 config/               # 설정 파일
│   │   └── environment.ts       # 환경 설정
│   │
│   ├── App.tsx                  # 메인 App 컴포넌트
│   └── main.tsx                 # 진입점
│
├── 📁 docs/                     # 문서
├── 📁 public/                   # 정적 파일
└── 📁 scripts/                  # 빌드/배포 스크립트
```

---

## 🚀 빌드 및 실행 방법

### 📋 사용 가능한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 코드 린팅
npm run lint

# 빌드된 앱 미리보기
npm run preview
```

### 🔧 빌드 프로세스

1. **TypeScript 컴파일**: `tsc -b` 명령으로 타입 검사
2. **Vite 빌드**: 최적화된 프로덕션 빌드 생성
3. **정적 파일 생성**: `dist/` 폴더에 배포용 파일 출력

### 🌍 환경 설정

프로젝트는 다음 환경 파일들을 지원합니다:
- `.env` - 기본 환경 변수
- `.env.development` - 개발 환경
- `.env.production` - 프로덕션 환경
- `.env.example` - 환경 변수 템플릿

---

## 🏛️ 아키텍처

### 인증 시스템
- **JWT 토큰 기반** 인증
- **역할 기반 접근 제어** (ADMIN/OPERATOR/USER)
- **자동 세션 만료** 처리
- **localStorage** 기반 토큰 저장

### 상태 관리
- **React Context** 기반 전역 상태
- **AuthContext**: 사용자 인증 상태
- **NotificationContext**: 토스트 알림 시스템

### API 설계
- **Axios** 기반 HTTP 클라이언트
- **인터셉터**를 통한 에러 처리 및 인증 토큰 자동 주입
- **이벤트 기반** 에러 처리 시스템

### 라우팅 구조
```
/login                    # 로그인 페이지
/dashboard               # 대시보드 (메인)
/studies                 # 스터디 관리
/members                 # 멤버 관리
/noti-management         # 알림 관리
/myPage                  # 마이페이지
```

---

## 📊 주요 기능

### 🎯 대시보드
- 전체 시스템 통계 overview
- 최근 활동 내역
- 카테고리별 분포 차트
- 주간 트렌드 분석

### 📚 스터디 관리
- **승인 대기** 스터디 처리
- **활성 스터디** 모니터링
- **종료된 스터디** 관리
- 스터디 생성/수정/삭제
- 참여 신청 승인/거절

### 👥 멤버 관리
- 사용자 목록 조회
- 멤버 상세 정보 패널
- 멤버 필터링 및 검색
- 멤버 통계 카드

### 📢 알림 관리
- 알림 템플릿 관리
- 알림 변수 시스템
- 알림 발송 이력

---

## 🎨 디자인 시스템

### 스타일링 접근법
- **styled-components**를 활용한 CSS-in-JS
- **테마 시스템** 지원 (다크/라이트 모드 준비)
- **반응형 디자인** 적용

### 컴포넌트 라이브러리
자체 개발한 재사용 가능한 공통 컴포넌트:
- Badge, Button, Card, Modal
- Select, Pagination, Toast
- StatCard 등

---

## 🔐 보안 고려사항

### 인증 보안
- JWT 토큰 만료 검증
- 관리자/운영자 권한 검증
- 자동 로그아웃 처리

### 코드 품질
- **TypeScript** 엄격 모드 활성화
- **ESLint** 규칙 적용 (`@typescript-eslint/no-explicit-any` 비활성화)
- 미사용 변수/파라미터 검증

---

## 📈 개선 계획

프로젝트에는 다음과 같은 개선 계획 문서들이 존재합니다:

### 1. 백오피스 재설계 계획
- 역할 혼재 문제 해결
- 중복 기능 통합
- 스터디 관리 페이지 통합

### 2. 스터디 도메인 개선 계획
- 백엔드 API와 프론트엔드 요구사항 동기화
- 새로운 필드 추가 (리더 정보, 색상 테마 등)
- 상태 체계 일원화

---

## 📚 참고사항

### Git 상태
- **현재 브랜치**: main
- **최근 커밋**: StudyManagement 스타일 개선 관련
- **상태**: Clean (변경사항 없음)

### 개발 환경
- **Node.js** 환경
- **macOS** (Darwin 24.6.0) 최적화
- **Vercel** 배포 설정 완료

---

## 🎯 다음 단계

1. **의존성 설치**: `npm install`
2. **환경 설정**: `.env` 파일 설정
3. **개발 서버 실행**: `npm run dev`
4. **코드 품질 검사**: `npm run lint`
5. **프로덕션 빌드**: `npm run build`

이 프로젝트는 현대적인 React 개발 표준을 따르며, 확장 가능한 아키텍처와 체계적인 코드 구조를 갖추고 있습니다.