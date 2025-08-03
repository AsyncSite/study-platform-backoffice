# 스터디 백오피스 재설계 계획

## 현재 상황 분석

### 문제점
1. **역할 혼재**: 백오피스는 관리자 전용인데, 일반 유저 관점의 "내 스터디" 페이지가 있음
2. **중복 기능**: "스터디 관리", "스터디 승인", "내 스터디"가 유사한 기능을 중복 제공
3. **잘못된 흐름**: 백오피스에서 일반 유저가 스터디를 신청하는 것처럼 설계됨

### 올바른 시스템 구조
```
[일반 유저 웹페이지]
- 스터디 목록 조회
- 스터디 생성 신청
- 스터디 참여 신청

    ↓ 신청 데이터

[백오피스 (관리자 전용)]
- 스터디 승인/거절
- 참여 신청 승인/거절
- 스터디 관리 (수정/삭제/종료)
```

## 재설계 방향

### 1. 페이지 통합 계획

#### 통합된 "스터디 관리" 페이지
하나의 통합된 페이지에서 모든 스터디 관련 업무 처리:

```
스터디 관리
├── 탭 1: 승인 대기 (PENDING)
│   ├── 유저가 신청한 스터디 생성 요청
│   └── 승인/거절 액션
├── 탭 2: 활성 스터디 (APPROVED)
│   ├── 현재 운영 중인 스터디
│   ├── 참여 신청 관리
│   └── 수정/종료 액션
├── 탭 3: 종료된 스터디 (TERMINATED/REJECTED)
│   ├── 종료/거절된 스터디
│   └── 재활성화/삭제 액션
└── 관리자 직접 스터디 생성 버튼
```

### 2. 제거할 페이지
- **MyStudies.tsx**: 삭제 (관리자에게 불필요)
- **StudyApproval.tsx**: StudyManagement에 통합

### 3. 수정할 기능

#### StudyManagement.tsx 개선
```typescript
// 탭 기반 UI로 변경
interface StudyManagementTabs {
  PENDING: "승인 대기",
  ACTIVE: "활성 스터디",
  INACTIVE: "비활성 스터디"
}

// 각 탭별 기능
- PENDING 탭:
  - 생성 승인 대기 목록
  - 빠른 승인/거절 버튼
  - 상세 보기 모달
  
- ACTIVE 탭:
  - 운영 중인 스터디 목록
  - 참여 신청 대기 수 표시
  - 참여 신청 관리 (모달/서브페이지)
  - 스터디 수정/종료
  
- INACTIVE 탭:
  - 종료/거절된 스터디
  - 재활성화/영구삭제
```

#### ApplicationManagement.tsx 개선
- 독립 페이지 → StudyManagement 내 모달/서브뷰로 변경
- 특정 스터디의 참여 신청만 표시
- 일괄 승인/거절 기능 추가

### 4. 새로운 컴포넌트 구조

```
components/
├── study/
│   ├── StudyManagementTabs.tsx      # 탭 네비게이션
│   ├── PendingStudiesTab.tsx        # 승인 대기 탭
│   ├── ActiveStudiesTab.tsx         # 활성 스터디 탭
│   ├── InactiveStudiesTab.tsx       # 비활성 스터디 탭
│   ├── StudyApplicationsModal.tsx   # 참여 신청 관리 모달
│   └── AdminStudyCreateModal.tsx    # 관리자 직접 생성 모달
```

### 5. API 수정 필요사항

#### 새로운 엔드포인트
- `GET /api/studies/v1/studies/pending-applications-count` - 각 스터디별 대기 중인 신청 수
- `GET /api/studies/v1/studies/{studyId}/applications/pending` - 특정 스터디의 대기 중 신청
- `POST /api/studies/v1/studies/admin-create` - 관리자 직접 생성 (승인 과정 없음)

#### 수정할 엔드포인트
- `GET /api/studies/v1/studies/paged` - 필터링 파라미터 추가 (status[], hasApplications)

### 6. 구현 우선순위

1. **Phase 1: 페이지 통합** (1주)
   - MyStudies.tsx 삭제
   - StudyApproval 로직을 StudyManagement로 이동
   - 탭 기반 UI 구현

2. **Phase 2: 참여 신청 통합** (1주)
   - ApplicationManagement를 모달/서브뷰로 변경
   - 스터디별 신청 관리 구현
   - 대기 중인 신청 수 표시

3. **Phase 3: 관리자 기능 강화** (3일)
   - 관리자 직접 생성 (승인 없이)
   - 일괄 처리 기능
   - 고급 필터링/검색

### 7. 사이드바 메뉴 수정

```typescript
// 현재
- 대시보드
- 스터디 관리
- 스터디 승인
- 참여 신청
- 회원 관리
- 내 스터디  // 삭제

// 변경 후
- 대시보드
- 스터디 관리 (통합)
- 회원 관리
- 시스템 설정 (추가 고려)
```

### 8. 권한 체크 강화

```typescript
// 모든 페이지에 관리자 권한 체크
const requireAdmin = (user: User) => {
  if (!user.roles.includes('ADMIN')) {
    throw new Error('관리자 권한이 필요합니다');
  }
};

// 일반 유저가 실수로 접근 시 명확한 에러 메시지
```

## 예상 결과

1. **명확한 역할 분리**: 백오피스는 관리자 전용, 유저는 웹페이지 사용
2. **효율적인 워크플로우**: 한 페이지에서 모든 스터디 관련 업무 처리
3. **중복 제거**: 유사한 기능들이 하나로 통합
4. **직관적인 UI**: 탭 기반으로 상태별 스터디 관리

## 다음 단계

1. 이 계획에 대한 검토 및 승인
2. 백엔드 API 수정 사항 조율
3. Phase 1부터 순차적 구현 시작