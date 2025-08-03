# 스터디 도메인 모델 개선 계획

## 1. 현황 분석

### 1.1 프론트엔드 요구사항 vs 백엔드 현황

#### ✅ 이미 백엔드 도메인 모델에 구현된 필드
```java
// Study.java에 이미 존재하는 필드들
- title, description, proposerId
- generation (세대)
- slug (URL 식별자)
- type (StudyType: PARTICIPATORY, EDUCATIONAL)
- tagline (한 줄 소개)
- schedule (일정)
- duration (시간)
- capacity (정원)
- enrolled (현재 참여 인원)
- recruitDeadline (모집 마감일)
- startDate (시작일)
- endDate (종료일)
```

#### ❌ 프론트엔드에서 필요하지만 백엔드에 없는 필드
```typescript
// 웹 프론트엔드 studies.ts의 StudyInfo 인터페이스 참조
- leader: {
    name: string;
    profileImage: string;
    welcomeMessage: string;
  }
- color: {
    primary: string;
    glow: string;
  }
- status: 'recruiting' | 'ongoing' | 'closed' (백엔드와 상태 체계 차이)
```

### 1.2 API 레벨 문제점

#### StudyCreateRequest의 한계
현재 StudyCreateRequest는 기본 필드만 받고 있음:
```java
public record StudyCreateRequest(
    String title,
    String description,
    String proposerId
)
```

백엔드 도메인 모델이 지원하는 많은 필드들이 API 레벨에서 활용되지 못하고 있음.

### 1.3 백오피스 등록 폼 현황
현재 백오피스는 title과 description만 입력받는 매우 기초적인 수준.

## 2. 개선 방안

### 2.1 단계별 접근 전략

#### Phase 1: API 레벨 개선 (즉시 구현 가능)
백엔드 도메인 모델이 이미 지원하는 필드들을 API에서 활용할 수 있도록 확장

**1. StudyCreateRequest 확장**
```java
public record StudyCreateRequest(
    // 기존 필드
    @NotBlank String title,
    @NotBlank String description,
    @NotBlank String proposerId,
    
    // 추가 필드 (모두 optional)
    Integer generation,
    String slug,
    StudyType type,
    String tagline,
    String schedule,
    String duration,
    @Min(1) @Max(100) Integer capacity,
    @Future LocalDate recruitDeadline,
    @Future LocalDate startDate,
    LocalDate endDate
)
```

**2. 백오피스 StudyCreateModal 전면 재설계**
- 다단계 폼 또는 섹션별 구성
- 필수/선택 필드 구분
- 실시간 유효성 검사
- 미리보기 기능

#### Phase 2: 도메인 모델 확장 (중기 계획)
프론트엔드 요구사항을 충족하기 위한 추가 엔티티

**1. StudyLeader 엔티티 추가**
```java
@Entity
@Table(name = "study_leaders")
public class StudyLeader {
    @Id
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "study_id")
    private Study study;
    
    private String name;
    private String profileImage;
    private String welcomeMessage;
    private String email;
    private String githubId;
}
```

**2. StudyTheme 엔티티 추가**
```java
@Entity
@Table(name = "study_themes")
public class StudyTheme {
    @Id
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "study_id")
    private Study study;
    
    private String primaryColor;
    private String secondaryColor;
    private String glowColor;
    private String heroImage;
}
```

### 2.2 백오피스 UI 개선안

#### 섹션별 입력 폼 구성
1. **기본 정보**
   - 제목 (title) *
   - 한 줄 소개 (tagline)
   - 상세 설명 (description) *
   - 유형 (type): 참여형/교육형

2. **운영 정보**
   - 세대 (generation)
   - URL 식별자 (slug) - 자동 생성 옵션
   - 일정 (schedule): 예) "매주 금요일"
   - 시간 (duration): 예) "19:30-21:30"
   - 정원 (capacity)

3. **모집 정보**
   - 모집 마감일 (recruitDeadline)
   - 시작일 (startDate)
   - 종료일 (endDate) - 선택

4. **리더 정보** (Phase 2)
   - 리더 이름
   - 프로필 이미지
   - 환영 메시지

5. **테마 설정** (Phase 2)
   - 주 색상
   - 보조 색상
   - 글로우 효과

## 3. 구현 우선순위

### 즉시 구현 (Phase 1)
1. ✅ StudyCreateRequest 확장
2. ✅ ProposeStudyUseCase 수정
3. ✅ 백오피스 StudyCreateModal 재설계
4. ✅ StudyResponse에 모든 필드 포함
5. ✅ 백오피스 목록/상세 화면에 추가 필드 표시

### 중기 구현 (Phase 2)
1. StudyLeader 엔티티 및 관련 로직
2. StudyTheme 엔티티 및 관련 로직
3. 상태 체계 정렬 (프론트엔드와 백엔드)
4. 파일 업로드 (프로필 이미지, 히어로 이미지)

## 4. 백오피스 UI 목업

### 4.1 다단계 폼 방식
```
[1. 기본 정보] → [2. 운영 정보] → [3. 모집 정보] → [미리보기] → [제출]
```

### 4.2 탭 방식
```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│  기본 정보   │   운영 정보   │   모집 정보   │   미리보기    │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

### 4.3 싱글 페이지 섹션 방식 (권장)
모든 섹션을 한 페이지에 표시하되, 시각적으로 구분

## 5. 예상 효과

1. **즉각적 가치 제공**: 이미 구현된 백엔드 기능 활용
2. **프론트엔드 요구사항 충족**: 웹 페이지에서 필요한 데이터 제공
3. **사용자 경험 향상**: 풍부한 스터디 정보 입력/표시
4. **단계적 확장 가능**: Phase 2로 자연스러운 전환

## 6. 주의사항

1. **하위 호환성**: 기존 API 유지하면서 확장
2. **선택적 필드**: 새 필드는 모두 optional로 처리
3. **유효성 검사**: 프론트엔드와 백엔드 모두에서 검증
4. **마이그레이션**: 기존 데이터에 기본값 제공