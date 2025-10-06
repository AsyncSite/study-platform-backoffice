# QueryDaily 백오피스 - Phase 1 설계 (데이터 적재 중심)

## 🎯 Phase 1 목표

**"이메일 발송은 현재 방식 유지, 데이터만 query-daily-service에 적재 + UX 개선"**

### 핵심 방향
1. ✅ Kafka 이벤트 발행은 백오피스에서 계속 (noti-service 직접 호출)
2. ✅ query-daily-service는 **데이터 저장소** 역할만
3. ✅ 답변 가이드의 복잡한 구조를 **JSON으로 유연하게 저장**
4. ✅ UX 개선: 질문 목록 조회 → 답변 작성 시 자동 채움

---

## 📊 데이터 모델 (Phase 1)

### 테이블 설계

#### 1. questions (질문)

```sql
CREATE TABLE questions (
    id VARCHAR(100) PRIMARY KEY,
    member_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL COMMENT '질문 내용',
    type ENUM('TRIAL', 'GROWTH_PLAN') NOT NULL DEFAULT 'TRIAL',
    current_day INT COMMENT '몇 일차 질문인지',
    total_days INT COMMENT '전체 일차',
    scheduled_at DATETIME NOT NULL COMMENT '발송 예약 시간',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member_id (member_id),
    INDEX idx_question_type (type),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='질문';
```

**특징**:
- 단순 구조 (content TEXT 하나에 저장)
- type으로 Trial/Growth Plan 구분

#### 2. answers (답변 가이드)

```sql
CREATE TABLE answers (
    id VARCHAR(100) PRIMARY KEY,
    question_id VARCHAR(100) NOT NULL COMMENT '연관된 질문 ID',
    member_id VARCHAR(100) NOT NULL COMMENT '회원 ID (question에서 자동 조회)',
    type ENUM('TRIAL', 'GROWTH_PLAN') NOT NULL DEFAULT 'TRIAL',

    -- JSON 기반 유연한 구조
    content JSON NOT NULL COMMENT '답변 가이드 데이터 (구조화된 JSON)',

    scheduled_at DATETIME NOT NULL COMMENT '발송 예약 시간',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_question_id (question_id),
    INDEX idx_member_id (member_id),
    INDEX idx_answer_type (type),
    INDEX idx_scheduled_at (scheduled_at),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='답변 가이드';
```

**핵심: content JSON 구조**

##### QueryDaily/Growth Plan 답변 가이드 JSON 구조

```json
{
  "version": "1.0",
  "question": "JWT를 사용한 인증 방식의 장단점은?",
  "analysis": "이 질문은 '트레이드오프형' 질문으로, JWT의 기술적 특성을 이해하고 실무 상황에 맞게 판단할 수 있는지를 평가합니다.",
  "keywords": [
    "Stateless 인증",
    "토큰 기반 인증",
    "세션 vs JWT",
    "보안 이슈"
  ],
  "starStructure": {
    "situation": "이전 프로젝트에서 세션 기반 인증을 사용했으나, MSA 전환 과정에서 인증 방식 재검토가 필요했습니다.",
    "task": "분산 환경에서도 효율적인 인증 방식을 선택해야 했고, JWT와 세션의 장단점을 비교 분석해야 했습니다.",
    "action": "JWT의 Stateless 특성과 확장성, 그리고 토큰 탈취 시 무효화 어려움 등을 고려하여 Refresh Token 방식을 도입했습니다.",
    "result": "API Gateway에서 JWT 검증, 민감한 작업은 추가 검증을 통해 보안과 확장성을 모두 확보했습니다."
  },
  "personaAnswers": {
    "bigTech": "JWT는 Stateless하여 수평 확장에 유리하지만, 토큰 탈취 시 즉시 무효화가 어렵습니다. 저희 팀은 이를 보완하기 위해 짧은 만료 시간과 Refresh Token을 조합했고, Redis를 활용한 블랙리스트 방식을 추가로 구현했습니다.",
    "unicorn": "MSA 환경에서 세션 방식은 세션 저장소 의존성 때문에 확장성에 제약이 있습니다. JWT를 선택한 이유는 각 서비스가 독립적으로 토큰을 검증할 수 있어 Gateway 부하를 줄이고, 서비스 간 인증 전파가 간단하기 때문입니다."
  },
  "followUpQuestions": [
    "JWT 토큰이 탈취되었을 때 어떻게 대응하시겠습니까?",
    "Refresh Token의 저장 위치와 보안 방안은?",
    "JWT Payload에 어떤 정보를 담으시겠습니까?"
  ]
}
```

**미래 확장 가능성**:
- 새로운 필드 추가 시 JSON에만 추가하면 됨 (스키마 변경 불필요)
- 템플릿 버전 관리 가능 (`"version": "1.0"`, `"version": "2.0"`)
- 다른 형태의 답변 가이드도 동일한 테이블에 저장 가능

---

## 🔌 API 설계 (Phase 1)

### 1. Member 조회 (기존 유지)

**GET /api/v1/admin/members**
- 백오피스에서 회원 목록 조회
- 질문 발송 시 회원 선택에 사용

### 2. Question 생성

**POST /api/v1/admin/questions**

요청:
```json
{
  "memberId": "MEM_001",
  "content": "JWT를 사용한 인증 방식의 장단점은?",
  "type": "GROWTH_PLAN",
  "currentDay": 5,
  "totalDays": 20,
  "scheduledAt": "2025-10-06T07:00:00Z"
}
```

응답:
```json
{
  "success": true,
  "data": {
    "id": "Q_001"
  }
}
```

### 3. Question 목록 조회 (답변 작성 시 사용)

**GET /api/v1/admin/questions?memberId=MEM_001&hasAnswer=false&page=0&size=20**

응답:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "Q_001",
        "member": {
          "memberId": "MEM_001",
          "email": "user@example.com",
          "name": "홍길동"
        },
        "content": "JWT를 사용한 인증 방식의 장단점은?",
        "type": "GROWTH_PLAN",
        "currentDay": 5,
        "scheduledAt": "2025-10-06T09:00:00Z",
        "hasAnswer": false
      }
    ],
    "page": { ... }
  }
}
```

**UX 개선 포인트**:
- 답변 작성 모달에서 이 API 호출
- 질문 선택 시 회원 정보, 이메일, id 자동 채움
- 답변이 없는 질문만 필터링 (`hasAnswer=false`)

### 4. Answer 생성

**POST /api/v1/admin/answers**

요청:
```json
{
  "questionId": "Q_001",
  "content": {
    "analysis": "...",
    "keywords": ["...", "..."],
    "starStructure": { ... },
    "personaAnswers": { ... },
    "followUpQuestions": ["...", "..."]
  },
  "scheduledAt": "2025-10-06T20:00:00Z"
}
```

**백엔드 처리**:
1. questionId로 member_id 자동 조회
2. content JSON 검증 (스키마 체크)
3. DB 저장

응답:
```json
{
  "success": true,
  "data": {
    "id": "A_001",
    "questionId": "Q_001",
    "memberId": "MEM_001",
    "scheduledAt": "2025-10-06T20:00:00Z"
  }
}
```

---

## 🎨 백오피스 UI 개선 (Phase 1)

### 1. 질문 발송 폼 (기존 유지 + API 연동)

**변경 사항**:
```typescript
const handleSendQuestion = async () => {
  try {
    // 1. query-daily-service에 Question 생성
    const response = await queryDailyApi.createQuestion({
      memberId: selectedMember.id,
      content: questionData.question,
      type: emailModalType === 'growthPlanQuestion' ? 'GROWTH_PLAN' : 'TRIAL',
      currentDay: questionData.currentDay,
      totalDays: questionData.totalDays,
      scheduledAt: scheduledAt
    });

    const questionId = response.data.id;

    // 2. noti-service로 이메일 발송 (기존 방식)
    await emailService.sendGrowthPlanQuestion(
      recipientEmail,
      questionData.question,
      questionData.userName,
      questionData.currentDay,
      questionData.totalDays,
      dayIntroMessage,
      dayMotivationMessage,
      scheduledAt
    );
    
    setEmailSuccess('질문 발송이 예약되었습니다!');
  } catch (error) {
    setEmailError('발송 실패: ' + error.message);
  }
};
```

### 2. 답변 발송 폼 (대폭 개선)

**Step 1: 질문 선택 드롭다운 추가**

```typescript
const [questions, setQuestions] = useState<Question[]>([]);
const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

useEffect(() => {
  if (emailModalType === 'answerGuide' || emailModalType === 'growthPlanAnswerGuide') {
    // 답변이 없는 질문 목록 조회
    queryDailyApi.getQuestions({
      hasAnswer: false,
      page: 0,
      size: 100
    }).then(res => setQuestions(res.data.content));
  }
}, [emailModalType]);

const handleQuestionSelect = (question: Question) => {
  setSelectedQuestion(question);
  // 자동 채움
  setRecipientEmail(question.member.email);
  setAnswerGuideData(prev => ({
    ...prev,
    question: question.content
  }));
  setQuestionData(prev => ({
    ...prev,
    userName: question.member.name
  }));
};
```

**UI 구조**:
```jsx
{(emailModalType === 'answerGuide' || emailModalType === 'growthPlanAnswerGuide') && (
  <>
    <FormGroup>
      <Label>질문 선택 (필수) *</Label>
      <QuestionDropdown>
        {questions.map(q => (
          <QuestionOption
            key={q.id}
            onClick={() => handleQuestionSelect(q)}
            selected={selectedQuestion?.id === q.id}
          >
            <QuestionMeta>
              <span>{q.member.name}</span>
              <span>{format(new Date(q.scheduledAt), 'M/d HH:mm')}</span>
            </QuestionMeta>
            <QuestionPreview>{q.content}</QuestionPreview>
          </QuestionOption>
        ))}
      </QuestionDropdown>
    </FormGroup>

    {selectedQuestion && (
      <SelectedQuestionInfo>
        ✅ 선택됨: {selectedQuestion.member.name} ({selectedQuestion.member.email})
        <br />
        질문: {selectedQuestion.content.substring(0, 100)}...
      </SelectedQuestionInfo>
    )}

    {/* 기존 답변 가이드 폼 필드들 */}
    <FormGroup>
      <Label>질문 * (자동 채워짐)</Label>
      <Textarea
        value={answerGuideData.question}
        onChange={e => setAnswerGuideData({...answerGuideData, question: e.target.value})}
        rows={2}
        disabled
      />
    </FormGroup>

    {/* 질문 해부, 키워드, STAR, 페르소나 답변, 꼬리질문 ... */}
  </>
)}
```

**Step 2: Answer 생성 API 호출**

```typescript
const handleSendAnswer = async () => {
  if (!selectedQuestion) {
    setEmailError('질문을 먼저 선택해주세요.');
    return;
  }

  try {
    // 1. query-daily-service에 Answer 생성
    const answerResponse = await queryDailyApi.createAnswer({
      questionId: selectedQuestion.id,
      content: {
        version: '1.0',
        question: answerGuideData.question,
        analysis: answerGuideData.analysis,
        keywords: answerGuideData.keywords.filter(k => k.trim() !== ''),
        starStructure: answerGuideData.starStructure,
        personaAnswers: answerGuideData.personaAnswers,
        followUpQuestions: answerGuideData.followUpQuestions.filter(q => q.trim() !== '')
      },
      scheduledAt: scheduledAt
    });

    const answerId = answerResponse.data.id;

    // 2. noti-service로 이메일 발송 (기존 방식)
    await emailService.sendGrowthPlanAnswerGuide(
      recipientEmail,
      answerGuideData.question,
      answerGuideData.analysis,
      answerGuideData.keywords.filter(k => k.trim() !== ''),
      answerGuideData.starStructure,
      answerGuideData.personaAnswers,
      answerGuideData.followUpQuestions.filter(q => q.trim() !== ''),
      scheduledAt
    );

    setEmailSuccess('답변 가이드 발송이 예약되었습니다!');
  } catch (error) {
    setEmailError('발송 실패: ' + error.message);
  }
};
```

---

## 🏗️ 백엔드 구현 (Phase 1)

### 도메인 모델

#### Question.java

```java
package com.asyncsite.querydailyservice.question.domain;

import com.asyncsite.querydailyservice.common.domain.vo.MemberId;
import com.asyncsite.querydailyservice.common.domain.vo.QuestionId;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class Question {
    private final QuestionId id;
    private final MemberId memberId;
    private final String content;
    private final QuestionType type;
    private final Integer currentDay;
    private final Integer totalDays;
    private final LocalDateTime scheduledAt;

    public static Question create(
        MemberId memberId,
        String content,
        QuestionType type,
        Integer currentDay,
        Integer totalDays,
        LocalDateTime scheduledAt
    ) {
        return Question.builder()
            .id(QuestionId.generate())
            .memberId(memberId)
            .content(content)
            .type(type)
            .currentDay(currentDay)
            .totalDays(totalDays)
            .scheduledAt(scheduledAt)
            .build();
    }
}
```

#### Answer.java

```java
package com.asyncsite.querydailyservice.answer.domain;

import com.asyncsite.querydailyservice.common.domain.vo.AnswerId;
import com.asyncsite.querydailyservice.common.domain.vo.MemberId;
import com.asyncsite.querydailyservice.common.domain.vo.QuestionId;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class Answer {
    private final AnswerId id;
    private final QuestionId questionId;
    private final MemberId memberId;
    private final AnswerType type;
    private final AnswerContent content;  // JSON을 담는 VO
    private final LocalDateTime scheduledAt;

    public static Answer create(
        QuestionId questionId,
        MemberId memberId,
        AnswerType type,
        AnswerContent content,
        LocalDateTime scheduledAt
    ) {
        return Answer.builder()
            .id(AnswerId.generate())
            .questionId(questionId)
            .memberId(memberId)
            .type(type)
            .content(content)
            .scheduledAt(scheduledAt)
            .build();
    }
}
```

#### AnswerContent.java (VO)

```java
package com.asyncsite.querydailyservice.answer.domain;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Value;

@Value
public class AnswerContent {
    JsonNode data;

    public static AnswerContent of(JsonNode jsonNode) {
        // JSON 스키마 검증 (선택)
        return new AnswerContent(jsonNode);
    }

    public String toJsonString() {
        return data.toString();
    }
}
```

### Use Case

```java
@Service
@RequiredArgsConstructor
@Transactional
public class CreateAnswerService implements CreateAnswerUseCase {

    private final LoadQuestionPort loadQuestionPort;
    private final SaveAnswerPort saveAnswerPort;

    @Override
    public AnswerResponse createAnswer(CreateAnswerCommand command) {
        // 1. Question 조회 (memberId 자동 추출)
        Question question = loadQuestionPort.findById(command.getQuestionId())
            .orElseThrow(() -> new QuestionNotFoundException(command.getQuestionId()));

        // 2. Answer 생성
        Answer answer = Answer.create(
            command.getQuestionId(),
            question.getMemberId(),  // question에서 가져옴
            command.getType(),
            AnswerContent.of(command.getContent()),
            command.getScheduledAt()
        );

        // 3. 저장
        Answer saved = saveAnswerPort.save(answer);

        return AnswerResponse.from(saved);
    }
}
```

---

## ✅ Phase 1 구현 체크리스트

### 백엔드 (query-daily-service)

- [ ] **DB 스키마**
  - [ ] questions 테이블 생성
  - [ ] answers 테이블 생성 (content JSON)

- [ ] **도메인 모델**
  - [ ] Question.java
  - [ ] Answer.java
  - [ ] AnswerContent.java (JSON VO)

- [ ] **Use Cases**
  - [ ] CreateQuestionUseCase
  - [ ] GetQuestionsUseCase
  - [ ] CreateAnswerUseCase

- [ ] **REST API**
  - [ ] POST /api/v1/admin/questions
  - [ ] GET /api/v1/admin/questions
  - [ ] POST /api/v1/admin/answers

### 백오피스 (study-platform-backoffice)

- [ ] **API Client**
  - [ ] queryDailyApi.createQuestion()
  - [ ] queryDailyApi.getQuestions()
  - [ ] queryDailyApi.createAnswer()

- [ ] **UI 개선**
  - [ ] 질문 발송 폼: API 연동
  - [ ] 답변 발송 폼: 질문 선택 드롭다운 추가
  - [ ] 답변 발송 폼: 자동 채움 기능
  - [ ] 발송 이력 조회 (선택)

---

## 🚀 다음 단계 (Phase 2 - 미래)

- Kafka 이벤트 기반 발송으로 전환
- 자동 스케줄링
- 통계 대시보드
- 템플릿 관리

---

**작성일**: 2025-10-05
**문서 버전**: 1.0 (Phase 1 확정)
