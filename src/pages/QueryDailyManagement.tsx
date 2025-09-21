import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

// Types
type UserType = 'LEAD' | 'MEMBER';

type LeadStatus =
  | '신청완료'
  | '챌린지진행중'
  | '챌린지완료'
  | '전환제안발송'
  | '전환됨'
  | '이탈';

type MemberStatus =
  | '구독중'
  | '구독만료'
  | '구독취소';

interface User {
  id: string;
  type: UserType;
  name: string;
  email: string;
  applicationDate: string;
  resumeUrl: string;
  assignedTo?: string;
  startDate?: string;
  totalDays: number;
  currentDay: number;
  leadStatus?: LeadStatus;
  memberStatus?: MemberStatus;
  product?: '인터뷰 패스' | '예상 질문 50선';
  paymentDate?: string;
  paymentAmount?: number;
  notes?: string;
  lastEmailSentAt?: string;
}

interface ScheduledEmail {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  type: 'daily_question' | 'answer_guide' | 'welcome' | 'conversion_offer' | 'completion';
  subject: string;
  content: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  dayNumber?: number;
  sentAt?: string;
  error?: string;
}

// interface AnswerGuide {
//   id: string;
//   questionId: string;
//   questionAnalysis: string;
//   coreKeywords: string[];
//   starStructure: {
//     situation: string;
//     task: string;
//     action: string;
//     result: string;
//   };
//   personaExamples: {
//     junior: string;
//     senior: string;
//   };
//   followUpQuestions: string[];
//   createdAt: string;
//   updatedAt: string;
// }

const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].substring(0, 5);
  return { date, time };
};

const QueryDailyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'emails' | 'content' | 'analytics'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); // Used in handleUserAction
  const [showAnswerGuideModal, setShowAnswerGuideModal] = useState(false);
  const [contentTab, setContentTab] = useState<'guides' | 'questions' | 'templates'>('guides');
  const [guideKeywords, setGuideKeywords] = useState<string[]>(['JWT', 'Stateless', '보안']);
  const [keywordInput, setKeywordInput] = useState('');

  const { date: todayDate } = getCurrentDateTime();

  // Mock data - 리드/멤버 통합 데이터
  const [users] = useState<User[]>([
    {
      id: '1',
      type: 'MEMBER',
      name: '김철수',
      email: 'chulsoo@example.com',
      applicationDate: '2024-01-20',
      resumeUrl: '/resumes/kim_chulsoo.pdf',
      startDate: '2024-01-21',
      totalDays: 7,
      currentDay: 7,
      memberStatus: '구독중',
      product: '인터뷰 패스',
      paymentDate: '2024-01-28',
      paymentAmount: 99000,
      notes: '백엔드 3년차, Spring 경험'
    },
    {
      id: '2',
      type: 'LEAD',
      name: '이영희',
      email: 'younghee@example.com',
      applicationDate: '2024-01-20',
      resumeUrl: '/resumes/lee_younghee.pdf',
      startDate: '2024-01-22',
      totalDays: 7,
      currentDay: 5,
      leadStatus: '챌린지진행중',
      notes: '프론트엔드 신입, React 포트폴리오'
    },
    {
      id: '3',
      type: 'LEAD',
      name: '박민수',
      email: 'minsoo@example.com',
      applicationDate: '2024-01-21',
      resumeUrl: '/resumes/park_minsoo.pdf',
      startDate: '2024-01-23',
      totalDays: 7,
      currentDay: 7,
      leadStatus: '챌린지완료',
      notes: '풀스택 5년차, 이직 준비중'
    },
    {
      id: '4',
      type: 'LEAD',
      name: '정수진',
      email: 'soojin@example.com',
      applicationDate: '2024-01-21',
      resumeUrl: '/resumes/jung_soojin.pdf',
      totalDays: 7,
      currentDay: 0,
      leadStatus: '신청완료',
      notes: '데이터 엔지니어 2년차'
    },
    {
      id: '5',
      type: 'MEMBER',
      name: '최동훈',
      email: 'donghoon@example.com',
      applicationDate: '2024-01-15',
      resumeUrl: '/resumes/choi_donghoon.pdf',
      startDate: '2024-01-16',
      totalDays: 7,
      currentDay: 10,
      memberStatus: '구독중',
      product: '예상 질문 50선',
      paymentDate: '2024-01-23',
      paymentAmount: 49000,
      notes: 'DevOps 엔지니어 4년차'
    }
  ]);

  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([
    {
      id: '1',
      userId: '2',
      userName: '이영희',
      userEmail: 'younghee@example.com',
      scheduledDate: todayDate,
      scheduledTime: '10:00',
      type: 'daily_question',
      subject: '[QueryDaily] Day-6 오늘의 면접 질문',
      content: '오늘의 질문: React의 Virtual DOM은 어떻게 작동하나요?',
      status: 'scheduled',
      dayNumber: 6
    },
    {
      id: '2',
      userId: '3',
      userName: '박민수',
      userEmail: 'minsoo@example.com',
      scheduledDate: todayDate,
      scheduledTime: '10:00',
      type: 'conversion_offer',
      subject: '[QueryDaily] 7일 챌린지를 완료하셨습니다! 🎉',
      content: '축하합니다! 이제 인터뷰 패스로 더 깊이있는 준비를...',
      status: 'scheduled'
    },
    {
      id: '3',
      userId: '1',
      userName: '김철수',
      userEmail: 'chulsoo@example.com',
      scheduledDate: todayDate,
      scheduledTime: '10:00',
      type: 'answer_guide',
      subject: '[인터뷰 패스] 오늘의 질문과 답변 가이드',
      content: '프리미엄 답변 가이드를 확인하세요...',
      status: 'scheduled'
    }
  ]);

  // 계산된 통계
  const stats = useMemo(() => {
    const leads = users.filter(u => u.type === 'LEAD');
    const members = users.filter(u => u.type === 'MEMBER');
    const activeLeads = leads.filter(u => u.leadStatus === '챌린지진행중');
    const completedLeads = leads.filter(u => u.leadStatus === '챌린지완료' || u.leadStatus === '전환됨');
    const conversionRate = completedLeads.length > 0
      ? (members.length / completedLeads.length * 100).toFixed(1)
      : '0';

    return {
      totalLeads: leads.length,
      totalMembers: members.length,
      activeLeads: activeLeads.length,
      conversionRate
    };
  }, [users]);

  // 오늘의 할 일
  const todayTasks = useMemo(() => {
    const questionTargets = users.filter(u =>
      (u.type === 'LEAD' && u.leadStatus === '챌린지진행중') ||
      (u.type === 'MEMBER' && u.memberStatus === '구독중')
    );
    const conversionTargets = users.filter(u =>
      u.type === 'LEAD' && u.leadStatus === '챌린지완료'
    );
    const paymentPending = users.filter(u =>
      u.type === 'LEAD' && u.leadStatus === '전환제안발송'
    );

    return {
      questionTargets: questionTargets.length,
      conversionTargets: conversionTargets.length,
      paymentPending: paymentPending.length
    };
  }, [users]);

  // 다음 액션 결정 함수
  const getNextAction = (user: User) => {
    if (user.type === 'LEAD') {
      switch(user.leadStatus) {
        case '신청완료':
          return { label: '챌린지 시작하기', action: 'start_challenge' };
        case '챌린지진행중':
          return { label: `Day ${user.currentDay + 1} 질문 발송하기`, action: 'send_question' };
        case '챌린지완료':
          return { label: '인터뷰 패스 제안하기', action: 'send_conversion' };
        case '전환제안발송':
          return { label: '입금 확인하기', action: 'confirm_payment' };
        default:
          return null;
      }
    } else {
      if (user.memberStatus === '구독중') {
        return { label: '오늘의 질문+답변 발송', action: 'send_premium_content' };
      }
      return null;
    }
  };

  const handleUserAction = (user: User, action: string) => {
    switch(action) {
      case 'start_challenge':
        alert(`${user.name}님의 7일 챌린지를 시작합니다!`);
        // 상태를 '챌린지진행중'으로 변경
        break;
      case 'send_question':
        setSelectedUser(user);
        setShowEmailModal(true);
        // 질문 발송 모달 오픈
        break;
      case 'send_conversion':
        alert(`${user.name}님에게 인터뷰 패스 전환 제안 메일을 발송합니다!`);
        // 전환 제안 메일 발송
        break;
      case 'confirm_payment':
        setSelectedUser(user);
        setShowUserDetailModal(true);
        // 결제 확인 모달 오픈
        break;
      case 'send_premium_content':
        setSelectedUser(user);
        setShowEmailModal(true);
        // 프리미엄 콘텐츠 발송 모달
        break;
      default:
        break;
    }
  };

  const handleUserTypeConversion = (userId: string) => {
    // 리드를 멤버로 전환하는 로직
    console.log('Converting user', userId, 'from LEAD to MEMBER');
    alert('입금이 확인되어 멤버로 전환되었습니다!');
    setShowUserDetailModal(false);
  };

  const renderDashboard = () => (
    <DashboardContainer>
      {/* 미션 컨트롤 섹션 */}
      <MissionControlSection>
        <SectionTitle>
          <h2>🎯 미션 컨트롤</h2>
          <span>오늘 해야 할 일을 한눈에</span>
        </SectionTitle>

        <TasksGrid>
          <TaskCard>
            <TaskIcon>📮</TaskIcon>
            <TaskInfo>
              <TaskLabel>오늘 질문 발송 대상</TaskLabel>
              <TaskCount>{todayTasks.questionTargets}명</TaskCount>
              <TaskDescription>챌린지 진행중 + 구독 멤버</TaskDescription>
            </TaskInfo>
            <TaskAction onClick={() => setActiveTab('emails')}>
              발송 관리 →
            </TaskAction>
          </TaskCard>

          <TaskCard highlight>
            <TaskIcon>🎯</TaskIcon>
            <TaskInfo>
              <TaskLabel>전환 제안 대상</TaskLabel>
              <TaskCount>{todayTasks.conversionTargets}명</TaskCount>
              <TaskDescription>7일 챌린지 완료자</TaskDescription>
            </TaskInfo>
            <TaskAction primary onClick={() => setActiveTab('users')}>
              전환 제안 →
            </TaskAction>
          </TaskCard>

          <TaskCard>
            <TaskIcon>💳</TaskIcon>
            <TaskInfo>
              <TaskLabel>결제 확인 대기</TaskLabel>
              <TaskCount>{todayTasks.paymentPending}명</TaskCount>
              <TaskDescription>입금 확인 필요</TaskDescription>
            </TaskInfo>
            <TaskAction onClick={() => setActiveTab('users')}>
              확인하기 →
            </TaskAction>
          </TaskCard>
        </TasksGrid>
      </MissionControlSection>

      {/* 핵심 지표 섹션 */}
      <MetricsSection>
        <SectionTitle>
          <h3>📊 핵심 지표</h3>
        </SectionTitle>

        <MetricsGrid>
          <MetricCard>
            <MetricLabel>총 리드</MetricLabel>
            <MetricValue>{stats.totalLeads}</MetricValue>
            <MetricBadge type="lead">LEAD</MetricBadge>
          </MetricCard>

          <MetricCard>
            <MetricLabel>활성 리드</MetricLabel>
            <MetricValue>{stats.activeLeads}</MetricValue>
            <MetricSubtext>챌린지 진행중</MetricSubtext>
          </MetricCard>

          <MetricCard>
            <MetricLabel>총 멤버</MetricLabel>
            <MetricValue>{stats.totalMembers}</MetricValue>
            <MetricBadge type="member">MEMBER</MetricBadge>
          </MetricCard>

          <MetricCard highlight>
            <MetricLabel>전환율</MetricLabel>
            <MetricValue>{stats.conversionRate}%</MetricValue>
            <MetricSubtext>리드→멤버</MetricSubtext>
          </MetricCard>
        </MetricsGrid>
      </MetricsSection>

      {/* 오늘 발송 예정 */}
      <EmailSection>
        <SectionTitle>
          <h3>✉️ 오늘 발송 예정</h3>
          <Badge>{scheduledEmails.filter(e => e.scheduledDate === todayDate && e.status === 'scheduled').length}건</Badge>
        </SectionTitle>

        <EmailList>
          {scheduledEmails
            .filter(e => e.scheduledDate === todayDate && e.status === 'scheduled')
            .map(email => (
              <EmailCard key={email.id}>
                <EmailTime>{email.scheduledTime}</EmailTime>
                <EmailInfo>
                  <EmailRecipient>
                    {email.userName} ({email.userEmail})
                  </EmailRecipient>
                  <EmailSubject>{email.subject}</EmailSubject>
                </EmailInfo>
                <EmailType type={email.type}>
                  {email.type === 'daily_question' ? '일일질문' :
                   email.type === 'answer_guide' ? '답변가이드' :
                   email.type === 'conversion_offer' ? '전환제안' : email.type}
                </EmailType>
                <ActionButton primary onClick={() => handleEmailStatusChange(email.id, 'sent')}>
                  발송완료
                </ActionButton>
              </EmailCard>
            ))}
        </EmailList>
      </EmailSection>
    </DashboardContainer>
  );

  const renderUsers = () => (
    <UsersContainer>
      <Header>
        <div>
          <h2>사용자 관리</h2>
          <Subtitle>리드와 멤버를 한눈에 관리</Subtitle>
        </div>
        <FilterGroup>
          <FilterButton className="active">전체</FilterButton>
          <FilterButton>리드</FilterButton>
          <FilterButton>멤버</FilterButton>
        </FilterGroup>
      </Header>

      <UsersTable>
        <thead>
          <tr>
            <th>타입</th>
            <th>이름</th>
            <th>이메일</th>
            <th>신청일</th>
            <th>상태</th>
            <th>진행상황</th>
            <th>최근 발송</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const nextAction = getNextAction(user);
            return (
              <tr key={user.id}>
                <td>
                  <UserTypeBadge type={user.type}>
                    {user.type}
                  </UserTypeBadge>
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.applicationDate}</td>
                <td>
                  <StatusBadge userType={user.type}>
                    {user.type === 'LEAD' ? user.leadStatus : user.memberStatus}
                  </StatusBadge>
                </td>
                <td>
                  {user.type === 'LEAD' && user.leadStatus === '챌린지진행중' && (
                    <ProgressBar>
                      <ProgressFill width={(user.currentDay / user.totalDays) * 100} />
                      <ProgressText>Day {user.currentDay}/{user.totalDays}</ProgressText>
                    </ProgressBar>
                  )}
                  {user.type === 'MEMBER' && user.product && (
                    <ProductBadge>{user.product}</ProductBadge>
                  )}
                </td>
                <td>{user.lastEmailSentAt || '-'}</td>
                <td>
                  <ActionButtons>
                    <ActionButton onClick={() => {
                      setSelectedUser(user);
                      setShowUserDetailModal(true);
                    }}>
                      상세
                    </ActionButton>
                    {nextAction && (
                      <ActionButton primary onClick={() => handleUserAction(user, nextAction.action)}>
                        {nextAction.label}
                      </ActionButton>
                    )}
                  </ActionButtons>
                </td>
              </tr>
            );
          })}
        </tbody>
      </UsersTable>
    </UsersContainer>
  );

  const renderContent = () => (
    <ContentContainer>
      <Header>
        <h2>콘텐츠 관리</h2>
        <AddButton onClick={() => setShowAnswerGuideModal(true)}>
          + 답변 가이드 작성
        </AddButton>
      </Header>

      <ContentTabs>
        <ContentTab
          className={contentTab === 'guides' ? 'active' : ''}
          onClick={() => setContentTab('guides')}
        >
          답변 가이드
        </ContentTab>
        <ContentTab
          className={contentTab === 'questions' ? 'active' : ''}
          onClick={() => setContentTab('questions')}
        >
          질문 은행
        </ContentTab>
        <ContentTab
          className={contentTab === 'templates' ? 'active' : ''}
          onClick={() => setContentTab('templates')}
        >
          템플릿
        </ContentTab>
      </ContentTabs>

      {contentTab === 'guides' && (
        <AnswerGuideSection>
          <GuideCard>
            <GuideHeader>
              <h4>Spring Security JWT 인증 구현 방식</h4>
              <GuideDate>2024-01-28</GuideDate>
            </GuideHeader>
            <GuidePreview>
              <GuideSection>
                <SectionLabel>🎯 핵심 키워드</SectionLabel>
                <KeywordList>
                  <Keyword>JWT</Keyword>
                  <Keyword>Stateless</Keyword>
                  <Keyword>Bearer Token</Keyword>
                </KeywordList>
              </GuideSection>
            </GuidePreview>
            <GuideActions>
              <button onClick={() => {
                setShowAnswerGuideModal(true);
                alert('Spring Security JWT 답변 가이드를 편집합니다');
              }}>편집</button>
              <button onClick={() => alert('답변 가이드 미리보기 창이 열립니다')}>미리보기</button>
              <button onClick={() => {
                setShowEmailModal(true);
                alert('답변 가이드 발송 대상을 선택하세요');
              }}>발송</button>
            </GuideActions>
          </GuideCard>

          <GuideCard>
            <GuideHeader>
              <h4>JPA N+1 문제 해결 방법</h4>
              <GuideDate>2024-01-27</GuideDate>
            </GuideHeader>
            <GuidePreview>
              <GuideSection>
                <SectionLabel>🎯 핵심 키워드</SectionLabel>
                <KeywordList>
                  <Keyword>Fetch Join</Keyword>
                  <Keyword>@EntityGraph</Keyword>
                  <Keyword>Batch Size</Keyword>
                </KeywordList>
              </GuideSection>
            </GuidePreview>
            <GuideActions>
              <button onClick={() => {
                setShowAnswerGuideModal(true);
                alert('JPA N+1 답변 가이드를 편집합니다');
              }}>편집</button>
              <button onClick={() => alert('답변 가이드 미리보기 창이 열립니다')}>미리보기</button>
              <button onClick={() => {
                setShowEmailModal(true);
                alert('답변 가이드 발송 대상을 선택하세요');
              }}>발송</button>
            </GuideActions>
          </GuideCard>
        </AnswerGuideSection>
      )}

      {contentTab === 'questions' && (
        <QuestionBankSection>
          <QuestionCard>
            <QuestionType>경험 연결형</QuestionType>
            <QuestionText>가장 어려웠던 버그를 해결한 경험을 공유해주세요</QuestionText>
            <QuestionTags>
              <Tag>디버깅</Tag>
              <Tag>문제해결</Tag>
              <Tag>All Level</Tag>
            </QuestionTags>
          </QuestionCard>

          <QuestionCard>
            <QuestionType>트레이드오프형</QuestionType>
            <QuestionText>NoSQL vs SQL 데이터베이스 선택 기준은?</QuestionText>
            <QuestionTags>
              <Tag>데이터베이스</Tag>
              <Tag>아키텍처</Tag>
              <Tag>Senior</Tag>
            </QuestionTags>
          </QuestionCard>
        </QuestionBankSection>
      )}

      {contentTab === 'templates' && (
        <TemplateSection>
          <TemplateCard>
            <TemplateHeader>
              <h4>7일 챌린지 시작 환영 메일</h4>
              <TemplateType>welcome</TemplateType>
            </TemplateHeader>
            <TemplatePreview>
              안녕하세요 {'{name}'}님! 🎉
              QueryDaily 7일 챌린지에 오신 것을 환영합니다.
              내일부터 매일 아침 10시에 맞춤형 면접 질문을...
            </TemplatePreview>
            <TemplateActions>
              <button>편집</button>
              <button>복사</button>
            </TemplateActions>
          </TemplateCard>

          <TemplateCard>
            <TemplateHeader>
              <h4>챌린지 완료 축하 메일</h4>
              <TemplateType>completion</TemplateType>
            </TemplateHeader>
            <TemplatePreview>
              축하합니다 {'{name}'}님! 🏆
              7일간의 여정을 완주하셨습니다!
              이제 인터뷰 패스로 더 깊이있는 준비를...
            </TemplatePreview>
            <TemplateActions>
              <button>편집</button>
              <button>복사</button>
            </TemplateActions>
          </TemplateCard>
        </TemplateSection>
      )}
    </ContentContainer>
  );

  const renderEmails = () => (
    <EmailsContainer>
      <Header>
        <div>
          <h2>메일 발송 관리</h2>
          <Subtitle>예약 메일과 발송 이력을 관리합니다</Subtitle>
        </div>
        <AddButton onClick={() => setShowEmailModal(true)}>
          + 메일 예약
        </AddButton>
      </Header>

      <EmailSections>
        {/* 오늘 발송 예정 */}
        <Section>
          <SectionTitle>
            <h3>📅 오늘 발송 예정</h3>
            <Badge>{scheduledEmails.filter(e => e.scheduledDate === todayDate && e.status === 'scheduled').length}건</Badge>
          </SectionTitle>
          <EmailGrid>
            {scheduledEmails
              .filter(e => e.scheduledDate === todayDate && e.status === 'scheduled')
              .map(email => (
                <EmailDetailCard key={email.id}>
                  <EmailHeader>
                    <EmailTime>{email.scheduledTime}</EmailTime>
                    <EmailType type={email.type}>
                      {email.type === 'daily_question' ? '일일질문' :
                       email.type === 'answer_guide' ? '답변가이드' :
                       email.type === 'conversion_offer' ? '전환제안' : email.type}
                    </EmailType>
                  </EmailHeader>
                  <EmailBody>
                    <EmailTo>To: {email.userName} ({email.userEmail})</EmailTo>
                    <EmailSubjectLine>{email.subject}</EmailSubjectLine>
                    <EmailPreview>{email.content}</EmailPreview>
                  </EmailBody>
                  <EmailFooter>
                    <ActionButton onClick={() => handleEmailStatusChange(email.id, 'cancelled')}>
                      취소
                    </ActionButton>
                    <ActionButton primary onClick={() => handleEmailStatusChange(email.id, 'sent')}>
                      발송 완료
                    </ActionButton>
                  </EmailFooter>
                </EmailDetailCard>
              ))}
          </EmailGrid>
        </Section>

        {/* 발송 완료 */}
        <Section>
          <SectionTitle>
            <h3>✅ 최근 발송 완료</h3>
          </SectionTitle>
          <EmailGrid>
            {scheduledEmails
              .filter(e => e.status === 'sent')
              .map(email => (
                <EmailDetailCard key={email.id} sent>
                  <EmailHeader>
                    <EmailTime>{email.scheduledTime}</EmailTime>
                    <EmailStatus sent>발송완료</EmailStatus>
                  </EmailHeader>
                  <EmailBody>
                    <EmailTo>To: {email.userName} ({email.userEmail})</EmailTo>
                    <EmailSubjectLine>{email.subject}</EmailSubjectLine>
                  </EmailBody>
                  <EmailFooter>
                    <EmailSentTime>발송: {email.sentAt}</EmailSentTime>
                  </EmailFooter>
                </EmailDetailCard>
              ))}
          </EmailGrid>
        </Section>
      </EmailSections>
    </EmailsContainer>
  );

  const renderAnalytics = () => (
    <AnalyticsContainer>
      <Header>
        <h2>분석 & 인사이트</h2>
      </Header>

      <AnalyticsGrid>
        <ChartCard>
          <h3>주간 전환 추이</h3>
          <ChartPlaceholder>
            📈 차트 영역
          </ChartPlaceholder>
        </ChartCard>

        <ChartCard>
          <h3>질문 유형별 응답률</h3>
          <ChartPlaceholder>
            📊 차트 영역
          </ChartPlaceholder>
        </ChartCard>
      </AnalyticsGrid>
    </AnalyticsContainer>
  );

  const handleEmailStatusChange = (emailId: string, status: 'sent' | 'cancelled') => {
    setScheduledEmails(emails =>
      emails.map(email =>
        email.id === emailId
          ? { ...email, status, sentAt: status === 'sent' ? new Date().toISOString() : undefined }
          : email
      )
    );
  };

  const handleKeywordAdd = () => {
    if (keywordInput.trim() && !guideKeywords.includes(keywordInput.trim())) {
      setGuideKeywords([...guideKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setGuideKeywords(guideKeywords.filter(k => k !== keyword));
  };

  const handleGuideSave = () => {
    alert('답변 가이드가 저장되었습니다!\n키워드: ' + guideKeywords.join(', '));
    setShowAnswerGuideModal(false);
  };

  return (
    <Container>
      <PageHeader>
        <TitleSection>
          <Title>QueryDaily</Title>
          <Subtitle>리드 & 멤버 운영 백오피스</Subtitle>
        </TitleSection>
        <HeaderActions>
          <CurrentTime>{getCurrentDateTime().date} {getCurrentDateTime().time}</CurrentTime>
        </HeaderActions>
      </PageHeader>

      <TabBar>
        <Tab
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          🎯 대시보드
        </Tab>
        <Tab
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 사용자 관리
        </Tab>
        <Tab
          className={activeTab === 'emails' ? 'active' : ''}
          onClick={() => setActiveTab('emails')}
        >
          ✉️ 메일 발송
        </Tab>
        <Tab
          className={activeTab === 'content' ? 'active' : ''}
          onClick={() => setActiveTab('content')}
        >
          📝 콘텐츠
        </Tab>
        <Tab
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📊 분석
        </Tab>
      </TabBar>

      <Content>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'emails' && renderEmails()}
        {activeTab === 'content' && renderContent()}
        {activeTab === 'analytics' && renderAnalytics()}
      </Content>

      {/* 사용자 상세 모달 */}
      {showUserDetailModal && selectedUser && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                <UserTypeBadge type={selectedUser.type}>{selectedUser.type}</UserTypeBadge>
                {selectedUser.name}
              </ModalTitle>
              <CloseButton onClick={() => setShowUserDetailModal(false)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <DetailSection>
                <DetailLabel>기본 정보</DetailLabel>
                <DetailContent>
                  <DetailRow>
                    <span>이메일:</span> {selectedUser.email}
                  </DetailRow>
                  <DetailRow>
                    <span>신청일:</span> {selectedUser.applicationDate}
                  </DetailRow>
                  <DetailRow>
                    <span>이력서:</span>
                    <a href={selectedUser.resumeUrl} target="_blank" rel="noreferrer">
                      📄 보기
                    </a>
                  </DetailRow>
                </DetailContent>
              </DetailSection>

              <DetailSection>
                <DetailLabel>상태 관리</DetailLabel>
                <DetailContent>
                  <DetailRow>
                    <span>현재 상태:</span>
                    <StatusBadge userType={selectedUser.type}>
                      {selectedUser.type === 'LEAD' ? selectedUser.leadStatus : selectedUser.memberStatus}
                    </StatusBadge>
                  </DetailRow>
                  {selectedUser.type === 'LEAD' && (
                    <DetailRow>
                      <span>진행 상황:</span> Day {selectedUser.currentDay}/{selectedUser.totalDays}
                    </DetailRow>
                  )}
                  {selectedUser.type === 'MEMBER' && (
                    <>
                      <DetailRow>
                        <span>구독 상품:</span> {selectedUser.product}
                      </DetailRow>
                      <DetailRow>
                        <span>결제일:</span> {selectedUser.paymentDate}
                      </DetailRow>
                    </>
                  )}
                </DetailContent>
              </DetailSection>

              {selectedUser.type === 'LEAD' && selectedUser.leadStatus === '전환제안발송' && (
                <PaymentSection>
                  <DetailLabel>결제 관리</DetailLabel>
                  <PaymentForm>
                    <FormGroup>
                      <Label>구매 상품</Label>
                      <Select>
                        <option>인터뷰 패스</option>
                        <option>예상 질문 50선</option>
                      </Select>
                    </FormGroup>
                    <FormRow>
                      <FormGroup>
                        <Label>입금액</Label>
                        <Input type="number" placeholder="99000" />
                      </FormGroup>
                      <FormGroup>
                        <Label>입금일</Label>
                        <Input type="date" />
                      </FormGroup>
                    </FormRow>
                    <ConversionButton onClick={() => handleUserTypeConversion(selectedUser.id)}>
                      입금 확인 및 멤버로 전환
                    </ConversionButton>
                  </PaymentForm>
                </PaymentSection>
              )}

              <DetailSection>
                <DetailLabel>다음 액션</DetailLabel>
                <NextActionBox>
                  {getNextAction(selectedUser) ? (
                    <ActionButton primary large onClick={() => {
                      const action = getNextAction(selectedUser);
                      if (action) {
                        handleUserAction(selectedUser, action.action);
                        setShowUserDetailModal(false);
                      }
                    }}>
                      {getNextAction(selectedUser)?.label}
                    </ActionButton>
                  ) : (
                    <span>현재 가능한 액션이 없습니다</span>
                  )}
                </NextActionBox>
              </DetailSection>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 답변 가이드 작성 모달 */}
      {showAnswerGuideModal && (
        <Modal>
          <ModalContent large>
            <ModalHeader>
              <h3>답변 가이드 작성</h3>
              <CloseButton onClick={() => setShowAnswerGuideModal(false)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <GuideEditorSection>
                <FormGroup>
                  <Label>질문</Label>
                  <Input placeholder="예: JWT를 사용한 인증 방식의 장단점은?" />
                </FormGroup>

                <FormGroup>
                  <Label>1. 질문 해부 (유형 선택, 의도 분석)</Label>
                  <Textarea rows={3} placeholder="이 질문은 '트레이드오프형' 질문으로..." />
                </FormGroup>

                <FormGroup>
                  <Label>2. 핵심 키워드</Label>
                  <KeywordInput>
                    <Input
                      placeholder="키워드를 입력 후 Enter"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleKeywordAdd();
                        }
                      }}
                    />
                    <KeywordList>
                      {guideKeywords.map((keyword, index) => (
                        <Keyword key={index} style={{ cursor: 'pointer' }}
                          onClick={() => handleKeywordRemove(keyword)}>
                          {keyword} ✕
                        </Keyword>
                      ))}
                    </KeywordList>
                  </KeywordInput>
                </FormGroup>

                <FormGroup>
                  <Label>3. STAR 구조화</Label>
                  <StarGrid>
                    <div>
                      <SubLabel>Situation</SubLabel>
                      <Textarea rows={2} />
                    </div>
                    <div>
                      <SubLabel>Task</SubLabel>
                      <Textarea rows={2} />
                    </div>
                    <div>
                      <SubLabel>Action</SubLabel>
                      <Textarea rows={2} />
                    </div>
                    <div>
                      <SubLabel>Result</SubLabel>
                      <Textarea rows={2} />
                    </div>
                  </StarGrid>
                </FormGroup>

                <FormGroup>
                  <Label>4. 페르소나별 답변 예시</Label>
                  <PersonaGrid>
                    <div>
                      <SubLabel>신입 개발자 관점</SubLabel>
                      <Textarea rows={4} />
                    </div>
                    <div>
                      <SubLabel>경력 개발자 관점</SubLabel>
                      <Textarea rows={4} />
                    </div>
                  </PersonaGrid>
                </FormGroup>

                <FormGroup>
                  <Label>5. 예상 꼬리 질문</Label>
                  <Textarea rows={3} placeholder="• Refresh Token은 어떻게 관리하시나요?&#10;• Token 탈취 시 대응 방안은?" />
                </FormGroup>
              </GuideEditorSection>

              <ModalActions>
                <CancelButton onClick={() => setShowAnswerGuideModal(false)}>취소</CancelButton>
                <SaveButton onClick={handleGuideSave}>저장하기</SaveButton>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 5px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CurrentTime = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TabBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Tab = styled.button`
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  &.active {
    color: ${({ theme }) => theme.colors.primary};
    border-bottom-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Content = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 30px;
  min-height: 600px;
`;

// Dashboard Components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const MissionControlSection = styled.section``;

const SectionTitle = styled.div`
  margin-bottom: 20px;

  h2, h3 {
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 4px;
  }

  span {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const TasksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const TaskCard = styled.div<{ highlight?: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 2px solid ${({ highlight, theme }) =>
    highlight ? theme.colors.primary : theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const TaskIcon = styled.div`
  font-size: 32px;
`;

const TaskInfo = styled.div`
  flex: 1;
`;

const TaskLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const TaskCount = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const TaskDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const TaskAction = styled.button<{ primary?: boolean }>`
  width: 100%;
  padding: 10px;
  background: ${({ primary, theme }) =>
    primary ? theme.colors.primary : 'white'};
  color: ${({ primary, theme }) =>
    primary ? 'white' : theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const MetricsSection = styled.section``;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div<{ highlight?: boolean }>`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid ${({ highlight, theme }) =>
    highlight ? theme.colors.primary : theme.colors.gray[200]};
`;

const MetricLabel = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const MetricSubtext = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const MetricBadge = styled.span<{ type: 'lead' | 'member' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ type }) =>
    type === 'lead' ? '#fef3c7' : '#dbeafe'};
  color: ${({ type }) =>
    type === 'lead' ? '#a16207' : '#1e40af'};
`;

const EmailSection = styled.section``;

const Badge = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const EmailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmailCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const EmailTime = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 60px;
`;

const EmailInfo = styled.div`
  flex: 1;
`;

const EmailRecipient = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const EmailSubject = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmailType = styled.span<{ type: string }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ type }) =>
    type === 'daily_question' ? '#e0f2fe' :
    type === 'answer_guide' ? '#f0fdf4' :
    type === 'conversion_offer' ? '#fef3c7' :
    '#f3f4f6'};
  color: ${({ type }) =>
    type === 'daily_question' ? '#0369a1' :
    type === 'answer_guide' ? '#166534' :
    type === 'conversion_offer' ? '#a16207' :
    '#374151'};
`;

// Users Components
const UsersContainer = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const UsersTable = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;

  thead {
    background: ${({ theme }) => theme.colors.gray[50]};

    th {
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 16px 12px;
      font-size: 14px;
      color: ${({ theme }) => theme.colors.text.primary};
    }
  }
`;

const UserTypeBadge = styled.span<{ type: 'LEAD' | 'MEMBER' }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  background: ${({ type }) =>
    type === 'LEAD' ? '#fef3c7' : '#dbeafe'};
  color: ${({ type }) =>
    type === 'LEAD' ? '#a16207' : '#1e40af'};
`;

const StatusBadge = styled.span<{ userType: 'LEAD' | 'MEMBER' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #e0f2fe;
  color: #0369a1;
`;

const ProgressBar = styled.div`
  position: relative;
  width: 120px;
  height: 20px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 10px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${({ width }) => width}%;
  background: ${({ theme }) => theme.colors.primary};
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  z-index: 1;
`;

const ProductBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button<{ primary?: boolean; large?: boolean }>`
  padding: ${({ large }) => large ? '12px 24px' : '6px 10px'};
  border-radius: 4px;
  font-size: ${({ large }) => large ? '14px' : '12px'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ primary, theme }) => primary ? theme.colors.primary : 'white'};
  color: ${({ primary, theme }) => primary ? 'white' : theme.colors.text.primary};

  &:hover {
    background: ${({ primary, theme }) => primary ? theme.colors.primaryDark : theme.colors.gray[50]};
  }
`;

// Content Components
const ContentContainer = styled.div``;

const AddButton = styled.button`
  padding: 10px 20px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ContentTabs = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-bottom: 16px;
`;

const ContentTab = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  &.active {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`;

const AnswerGuideSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
`;

const GuideCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const GuideHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;

  h4 {
    font-size: 16px;
    font-weight: 600;
  }
`;

const GuideDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const GuidePreview = styled.div`
  margin-bottom: 16px;
`;

const GuideSection = styled.div`
  margin-bottom: 12px;
`;

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const KeywordList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Keyword = styled.span`
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const GuideActions = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    padding: 8px;
    background: white;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: ${({ theme }) => theme.colors.gray[50]};
    }
  }
`;

// Question Bank Components
const QuestionBankSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
`;

const QuestionCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const QuestionType = styled.div`
  display: inline-block;
  padding: 4px 10px;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const QuestionText = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
  line-height: 1.4;
`;

const QuestionTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Template Components
const TemplateSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
`;

const TemplateCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TemplateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h4 {
    font-size: 16px;
    font-weight: 600;
  }
`;

const TemplateType = styled.span`
  padding: 4px 10px;
  background: #f0fdf4;
  color: #166534;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const TemplatePreview = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const TemplateActions = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    padding: 8px;
    background: white;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: ${({ theme }) => theme.colors.gray[50]};
    }
  }
`;

// Email Tab Components
const EmailsContainer = styled.div``;

const EmailSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.section``;

const EmailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const EmailDetailCard = styled.div<{ sent?: boolean }>`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid ${({ theme, sent }) =>
    sent ? theme.colors.gray[200] : theme.colors.primary};
  opacity: ${({ sent }) => sent ? 0.7 : 1};
`;

const EmailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const EmailBody = styled.div`
  margin-bottom: 16px;
`;

const EmailTo = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const EmailSubjectLine = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const EmailPreview = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const EmailFooter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const EmailStatus = styled.span<{ sent?: boolean }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ sent }) => sent ? '#e0f2fe' : '#fef3c7'};
  color: ${({ sent }) => sent ? '#0369a1' : '#a16207'};
`;

const EmailSentTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

// Analytics Components
const AnalyticsContainer = styled.div``;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
  }
`;

const ChartPlaceholder = styled.div`
  height: 200px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

// Modal Components
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div<{ large?: boolean }>`
  background: white;
  border-radius: 12px;
  width: ${({ large }) => large ? '900px' : '600px'};
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  h3 {
    font-size: 18px;
    font-weight: 600;
  }
`;

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const DetailSection = styled.div`
  margin-bottom: 24px;
`;

const DetailLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 12px;
`;

const DetailContent = styled.div``;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;

  span:first-child {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    min-width: 100px;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const PaymentSection = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const PaymentForm = styled.div``;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ConversionButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const NextActionBox = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
  text-align: center;
`;

const GuideEditorSection = styled.div``;

const SubLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const KeywordInput = styled.div``;

const StarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const PersonaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const CancelButton = styled.button`
  padding: 10px 24px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const SaveButton = styled.button`
  padding: 10px 24px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

export default QueryDailyManagement;