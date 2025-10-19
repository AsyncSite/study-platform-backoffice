import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { EmailSendModal } from '../components/QueryDailyEmailModal';
import queryDailyService, { type AnswerWithMember, type QuestionWithMember, type PurchaseAdmin } from '../services/queryDailyService';

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

type OperatorName = '르네' | '현두' | '지연' | '동건';

interface Operator {
  id: string;
  name: OperatorName;
  email: string;
  activeLeads: number;
  activeMembers: number;
  totalAssigned: number;
}

interface ChangeHistory {
  changedBy: string; // operator name who made the change
  changedAt: Date;
  from?: string; // previous operator id
  to?: string; // new operator id
}

interface User {
  id: string;
  type: UserType;
  name: string;
  email: string;
  applicationDate: string;
  resumeUrl: string;
  resumeAssetId?: string;
  resumeFileName?: string;
  assignedTo?: string;
  assignmentHistory?: ChangeHistory[];
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

// interface ScheduledEmail {
//   id: string;
//   userId: string;
//   userName: string;
//   userEmail: string;
//   scheduledDate: string;
//   scheduledTime: string;
//   type: 'daily_question' | 'answer_guide' | 'welcome' | 'conversion_offer' | 'completion';
//   subject: string;
//   content: string;
//   status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
//   dayNumber?: number;
//   sentAt?: string;
//   error?: string;
// }

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
  const [activeTab, setActiveTab] = useState<'users' | 'emails' | 'purchases'>('emails');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalType, setEmailModalType] = useState<'question' | 'answerGuide' | 'welcome' | 'midFeedback' | 'complete' | 'purchaseConfirmation' | 'growthPlanQuestion' | 'growthPlanAnswerGuide'>('question');
  const [showAnswerGuideModal, setShowAnswerGuideModal] = useState(false);
  const [guideKeywords, setGuideKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [currentOperator] = useState<string>('르네'); // 현재 로그인한 사용자 (임시)
  const [answers, setAnswers] = useState<AnswerWithMember[]>([]);
  const [questions, setQuestions] = useState<QuestionWithMember[]>([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseAdmin[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

  // Purchase sub-tabs (상품별 탭)
  const [purchaseProductTab, setPurchaseProductTab] = useState<'all' | 'TRIAL' | 'GROWTH_PLAN' | 'REAL_INTERVIEW' | 'CRITICAL_HIT' | 'LAST_CHECK' | 'RESUME_FIT'>('all');

  // Upcoming (예정됨) UI state
  const [upcomingViewMode, setUpcomingViewMode] = useState<'combined' | 'split'>('split');
  const [upcomingTimeWindow, setUpcomingTimeWindow] = useState<'all' | '24h' | '7d'>('24h');
  const [upcomingKindFilter, setUpcomingKindFilter] = useState<'all' | 'question' | 'answer'>('all');
  const [upcomingTypeFilter, setUpcomingTypeFilter] = useState<'all' | 'TRIAL' | 'GROWTH_PLAN'>('all');

  // History (발송 이력) UI state
  const [historyKindFilter, setHistoryKindFilter] = useState<'all' | 'questions' | 'answers'>('answers');
  const [historyTimeWindow, setHistoryTimeWindow] = useState<'all' | 'today' | '7d' | '30d'>('7d');

  // Emails sub-tabs (Option A)
  const [emailsTab, setEmailsTab] = useState<'upcoming' | 'history'>('upcoming');

  // const { date: todayDate } = getCurrentDateTime();

  // Operators data
  const operators: Operator[] = [
    { id: '1', name: '르네', email: 'rene@querydaily.com', activeLeads: 2, activeMembers: 1, totalAssigned: 3 },
    { id: '2', name: '현두', email: 'hyundu@querydaily.com', activeLeads: 1, activeMembers: 1, totalAssigned: 2 },
    { id: '3', name: '지연', email: 'jiyeon@querydaily.com', activeLeads: 0, activeMembers: 0, totalAssigned: 0 },
    { id: '4', name: '동건', email: 'donggun@querydaily.com', activeLeads: 0, activeMembers: 0, totalAssigned: 0 },
  ];

  const [operatorFilter, setOperatorFilter] = useState<string>('all');

  // 실제 데이터는 API에서 가져와야 함
  const [users, setUsers] = useState<User[]>([]);

  // 실제 API에서 데이터 로드
  useEffect(() => {
    const loadApplications = async () => {
      try {
        const applications = await queryDailyService.getAllApplications();

        // API 데이터를 User 타입으로 변환
        const mappedUsers: User[] = applications.map((app, index) => {
          // UTC를 KST로 변환 (UTC+9)
          const utcDate = new Date(app.createdAt);
          const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));

          return {
            id: app.id !== undefined && app.id !== null ? String(app.id) : `temp-${index}`,
            type: 'LEAD', // 신규 신청자는 모두 LEAD로 시작
            name: app.name || '익명',
            email: app.email,
            applicationDate: kstDate.toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }),
            resumeUrl: queryDailyService.getAssetDownloadUrl(app.resumeAssetId),
            resumeAssetId: app.resumeAssetId,
            resumeFileName: app.resumeFileName,
            leadStatus: '신청완료',
            totalDays: 7,
            currentDay: 0,
            notes: `이력서: ${app.resumeFileName}`
          }
        });

        setUsers(mappedUsers);
        console.log('✅ Loaded', mappedUsers.length, 'applications');
      } catch (error) {
        console.error('❌ Failed to load applications:', error);
      }
    };

    loadApplications();
  }, []);

  // 질문 및 답변 발송 이력 로드
  useEffect(() => {
    const loadEmailData = async () => {
      if (activeTab !== 'emails') return;

      setIsLoadingAnswers(true);
      try {
        // 질문과 답변을 병렬로 로드
        const [answersResponse, questionsResponse] = await Promise.all([
          queryDailyService.getAnswers({ page: 0, size: 50 }),
          queryDailyService.getQuestions({ page: 0, size: 50 })
        ]);

        setAnswers(answersResponse.content);
        setQuestions(questionsResponse.content);
        console.log('✅ Loaded', answersResponse.content.length, 'answers and', questionsResponse.content.length, 'questions');
      } catch (error) {
        console.error('❌ Failed to load email data:', error);
      } finally {
        setIsLoadingAnswers(false);
      }
    };

    loadEmailData();
  }, [activeTab]);

  // 구매 내역 로드
  useEffect(() => {
    const loadPurchases = async () => {
      if (activeTab !== 'purchases') return;

      setIsLoadingPurchases(true);
      try {
        const purchasesData = await queryDailyService.getPurchases();
        setPurchases(purchasesData);
        console.log('✅ Loaded', purchasesData.length, 'purchases');
      } catch (error) {
        console.error('❌ Failed to load purchases:', error);
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    loadPurchases();
  }, [activeTab]);

  // const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);

  // // 계산된 통계
  // const stats = useMemo(() => {
  //   const leads = users.filter(u => u.type === 'LEAD');
  //   const members = users.filter(u => u.type === 'MEMBER');
  //   const activeLeads = leads.filter(u => u.leadStatus === '챌린지진행중');
  //   const completedLeads = leads.filter(u => u.leadStatus === '챌린지완료' || u.leadStatus === '전환됨');
  //   const conversionRate = completedLeads.length > 0
  //     ? (members.length / completedLeads.length * 100).toFixed(1)
  //     : '0';

  //   return {
  //     totalLeads: leads.length,
  //     totalMembers: members.length,
  //     activeLeads: activeLeads.length,
  //     conversionRate
  //   };
  // }, [users]);

  // // 오늘의 할 일
  // const todayTasks = useMemo(() => {
  //   const questionTargets = users.filter(u =>
  //     (u.type === 'LEAD' && u.leadStatus === '챌린지진행중') ||
  //     (u.type === 'MEMBER' && u.memberStatus === '구독중')
  //   );
  //   const conversionTargets = users.filter(u =>
  //     u.type === 'LEAD' && u.leadStatus === '챌린지완료'
  //   );
  //   const paymentPending = users.filter(u =>
  //     u.type === 'LEAD' && u.leadStatus === '전환제안발송'
  //   );

  //   return {
  //     questionTargets: questionTargets.length,
  //     conversionTargets: conversionTargets.length,
  //     paymentPending: paymentPending.length
  //   };
  // }, [users]);

  // 다음 액션 결정 함수
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  const getLatestChange = (user: User) => {
    if (!user.assignmentHistory || user.assignmentHistory.length === 0) {
      return null;
    }
    const latest = user.assignmentHistory[user.assignmentHistory.length - 1];
    return latest;
  };

  // const getNextAction = (user: User) => {
  //   if (user.type === 'LEAD') {
  //     switch(user.leadStatus) {
  //       case '신청완료':
  //         return { label: '챌린지 시작하기', action: 'start_challenge' };
  //       case '챌린지진행중':
  //         return { label: `Day ${user.currentDay + 1} 질문 발송하기`, action: 'send_question' };
  //       case '챌린지완료':
  //         return { label: '인터뷰 패스 제안하기', action: 'send_conversion' };
  //       case '전환제안발송':
  //         return { label: '입금 확인하기', action: 'confirm_payment' };
  //       default:
  //         return null;
  //     }
  //   } else {
  //     if (user.memberStatus === '구독중') {
  //       return { label: '오늘의 질문+답변 발송', action: 'send_premium_content' };
  //     }
  //     return null;
  //   }
  // };

  const handleOperatorChange = (userId: string, operatorId: string) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === userId) {
        const newHistory: ChangeHistory = {
          changedBy: currentOperator,
          changedAt: new Date(),
          from: u.assignedTo,
          to: operatorId || undefined
        };

        return {
          ...u,
          assignedTo: operatorId || undefined,
          assignmentHistory: [...(u.assignmentHistory || []), newHistory]
        };
      }
      return u;
    }));
  };

  // const handleUserAction = (user: User, action: string) => {
  //   switch(action) {
  //     case 'start_challenge':
  //       alert(`${user.name}님의 7일 챌린지를 시작합니다!`);
  //       // 상태를 '챌린지진행중'으로 변경
  //       break;
  //     case 'send_question':
  //       setSelectedUser(user);
  //       setShowEmailModal(true);
  //       // 질문 발송 모달 오픈
  //       break;
  //     case 'send_conversion':
  //       alert(`${user.name}님에게 인터뷰 패스 전환 제안 메일을 발송합니다!`);
  //       // 전환 제안 메일 발송
  //       break;
  //     case 'confirm_payment':
  //       setSelectedUser(user);
  //       setShowUserDetailModal(true);
  //       // 결제 확인 모달 오픈
  //       break;
  //     case 'send_premium_content':
  //       setSelectedUser(user);
  //       setShowEmailModal(true);
  //       // 프리미엄 콘텐츠 발송 모달
  //       break;
  //     default:
  //       break;
  //   }
  // };

  const handleUserTypeConversion = (userId: string) => {
    // 리드를 멤버로 전환하는 로직
    console.log('Converting user', userId, 'from LEAD to MEMBER');
    alert('입금이 확인되어 멤버로 전환되었습니다!');
    setShowUserDetailModal(false);
  };

  // const renderDashboard = () => (
  //   <DashboardContainer>
  //     <div style={{ textAlign: 'center', padding: '100px 20px', color: '#999' }}>
  //       <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>🚧 대시보드 준비중</h2>
  //       <p style={{ fontSize: '14px' }}>
  //         대시보드 기능은 곧 추가될 예정입니다.<br/>
  //         지금은 "발송 센터" 탭을 이용해주세요.
  //       </p>
  //     </div>
  //   </DashboardContainer>
  // );

  const renderPurchases = () => {
    // 상품별 필터링
    const filteredPurchases = purchases.filter(purchase => {
      if (purchaseProductTab === 'all') return true;
      return purchase.productCode === purchaseProductTab;
    });

    // 상품별 테이블 렌더링 함수
    const renderProductTable = () => {
      if (purchaseProductTab === 'TRIAL') {
        return (
          <UsersTable>
            <thead>
              <tr>
                <th>회원</th>
                <th>구매일</th>
                <th>발송진행</th>
                <th>최근발송</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    무료 체험 구매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.purchaseId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                    </td>
                    <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '67%', backgroundColor: '#10b981' }}></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>2/3일</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      2025-10-08 09:00
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setSelectedPurchaseId(purchase.purchaseId);
                            setSelectedUser({ email: purchase.memberEmail } as User);
                            setEmailModalType('question');
                            setShowEmailModal(true);
                          }}
                        >
                          📤 질문
                        </button>
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setSelectedPurchaseId(purchase.purchaseId);
                            setSelectedUser({ email: purchase.memberEmail } as User);
                            setEmailModalType('answerGuide');
                            setShowEmailModal(true);
                          }}
                        >
                          ⭐ 답변
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>
        );
      }

      if (purchaseProductTab === 'GROWTH_PLAN') {
        return (
          <UsersTable>
            <thead>
              <tr>
                <th>회원</th>
                <th>구매일</th>
                <th>발송진행</th>
                <th>최근발송</th>
                <th>이력서</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    그로스 플랜 구매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.purchaseId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                    </td>
                    <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '35%', backgroundColor: '#3b82f6' }}></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>7/20일</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      2025-10-09 09:00
                    </td>
                    <td>
                      {purchase.resumeId ? (
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={async () => {
                            try {
                              if (!purchase.resumeDownloadUrl) {
                                alert('이력서 다운로드 URL을 찾을 수 없습니다.');
                                return;
                              }

                              // resumeDownloadUrl: /api/assets/{assetId}/download
                              const assetId = purchase.resumeDownloadUrl.split('/')[3];
                              await queryDailyService.downloadAsset(
                                assetId,
                                purchase.resumeFilename || 'resume.pdf'
                              );
                            } catch (error) {
                              alert('이력서 다운로드 중 오류가 발생했습니다.');
                            }
                          }}
                        >
                          📄 다운로드
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setSelectedPurchaseId(purchase.purchaseId);
                            setSelectedUser({ email: purchase.memberEmail } as User);
                            setEmailModalType('growthPlanQuestion');
                            setShowEmailModal(true);
                          }}
                        >
                          📤 질문
                        </button>
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setSelectedPurchaseId(purchase.purchaseId);
                            setSelectedUser({ email: purchase.memberEmail } as User);
                            setEmailModalType('growthPlanAnswerGuide');
                            setShowEmailModal(true);
                          }}
                        >
                          ⭐ 답변
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>
        );
      }

      if (purchaseProductTab === 'REAL_INTERVIEW') {
        return (
          <UsersTable>
            <thead>
              <tr>
                <th>회원</th>
                <th>구매일</th>
                <th>면접일정</th>
                <th>진행상태</th>
                <th>이력서</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    리얼 인터뷰 구매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.purchaseId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                    </td>
                    <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>미정</td>
                    <td>
                      <UserTypeBadge type="LEAD" style={{ backgroundColor: '#fbbf24' }}>
                        일정대기
                      </UserTypeBadge>
                    </td>
                    <td>
                      {purchase.resumeId ? (
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={async () => {
                            try {
                              if (!purchase.resumeDownloadUrl) {
                                alert('이력서 다운로드 URL을 찾을 수 없습니다.');
                                return;
                              }

                              // resumeDownloadUrl: /api/assets/{assetId}/download
                              const assetId = purchase.resumeDownloadUrl.split('/')[3];
                              await queryDailyService.downloadAsset(
                                assetId,
                                purchase.resumeFilename || 'resume.pdf'
                              );
                            } catch (error) {
                              alert('이력서 다운로드 중 오류가 발생했습니다.');
                            }
                          }}
                        >
                          📄 다운로드
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={() => alert('면접 일정 등록 기능 준비 중입니다.')}
                      >
                        📅 일정등록
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>
        );
      }

      if (purchaseProductTab === 'CRITICAL_HIT') {
        return (
          <UsersTable>
            <thead>
              <tr>
                <th>회원</th>
                <th>구매일</th>
                <th>발송상태</th>
                <th>발송일시</th>
                <th>이력서</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    크리티컬 히트 구매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.purchaseId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                    </td>
                    <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <UserTypeBadge type="LEAD" style={{ backgroundColor: '#fbbf24' }}>
                        ⏳ 발송대기
                      </UserTypeBadge>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>-</td>
                    <td>
                      {purchase.resumeId ? (
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={async () => {
                            try {
                              if (!purchase.resumeDownloadUrl) {
                                alert('이력서 다운로드 URL을 찾을 수 없습니다.');
                                return;
                              }

                              // resumeDownloadUrl: /api/assets/{assetId}/download
                              const assetId = purchase.resumeDownloadUrl.split('/')[3];
                              await queryDailyService.downloadAsset(
                                assetId,
                                purchase.resumeFilename || 'resume.pdf'
                              );
                            } catch (error) {
                              alert('이력서 다운로드 중 오류가 발생했습니다.');
                            }
                          }}
                        >
                          📄 다운로드
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={() => alert('즉시 발송 기능 준비 중입니다.')}
                      >
                        📤 즉시발송
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>
        );
      }

      if (purchaseProductTab === 'RESUME_FIT') {
        return (
          <UsersTable>
            <thead>
              <tr>
                <th>회원</th>
                <th>구매일</th>
                <th>발송상태</th>
                <th>발송일시</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    레주메 핏 구매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.purchaseId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                    </td>
                    <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <UserTypeBadge type="LEAD" style={{ backgroundColor: '#fbbf24' }}>
                        ⏳ 발송대기
                      </UserTypeBadge>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>-</td>
                    <td>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={() => alert('즉시 발송 기능 준비 중입니다.')}
                      >
                        📤 즉시발송
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>
        );
      }

      if (purchaseProductTab === 'LAST_CHECK') {
        return (
          <UsersTable>
            <thead>
              <tr>
                <th>회원</th>
                <th>구매일</th>
                <th>발송상태</th>
                <th>발송일시</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    라스트 체크 구매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.purchaseId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                    </td>
                    <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <UserTypeBadge type="LEAD" style={{ backgroundColor: '#fbbf24' }}>
                        ⏳ 발송대기
                      </UserTypeBadge>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>-</td>
                    <td>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={() => alert('즉시 발송 기능 준비 중입니다.')}
                      >
                        📤 즉시발송
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>
        );
      }

      // 전체 탭
      return (
        <UsersTable>
          <thead>
            <tr>
              <th>회원</th>
              <th>상품</th>
              <th>금액</th>
              <th>구매일</th>
              <th>이력서</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                  구매 내역이 없습니다
                </td>
              </tr>
            ) : (
              filteredPurchases.map(purchase => (
                <tr key={purchase.purchaseId}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{purchase.memberName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{purchase.memberEmail}</div>
                  </td>
                  <td>{purchase.productName}</td>
                  <td>{purchase.purchasedPrice.toLocaleString()}원</td>
                  <td>{new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    {purchase.resumeId ? (
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={async () => {
                          try {
                            if (!purchase.resumeDownloadUrl) {
                              alert('이력서 다운로드 URL을 찾을 수 없습니다.');
                              return;
                            }

                            // resumeDownloadUrl: /api/assets/{assetId}/download
                            const assetId = purchase.resumeDownloadUrl.split('/')[3];
                            await queryDailyService.downloadAsset(
                              assetId,
                              purchase.resumeFilename || 'resume.pdf'
                            );
                          } catch (error) {
                            alert('이력서 다운로드 중 오류가 발생했습니다.');
                          }
                        }}
                      >
                        📄 다운로드
                      </button>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </UsersTable>
      );
    };

    return (
      <UsersContainer>
        <Header>
          <div>
            <h2>💳 구매 내역 관리</h2>
            <Subtitle>상품별 맞춤 관리 및 발송 처리</Subtitle>
          </div>
        </Header>

        {/* Product Tabs */}
        <EmailSubTabs>
          <EmailSubTab
            className={purchaseProductTab === 'all' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('all')}
          >
            전체 ({purchases.length})
          </EmailSubTab>
          <EmailSubTab
            className={purchaseProductTab === 'TRIAL' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('TRIAL')}
          >
            🎁 무료 체험 ({purchases.filter(p => p.productCode === 'TRIAL').length})
          </EmailSubTab>
          <EmailSubTab
            className={purchaseProductTab === 'GROWTH_PLAN' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('GROWTH_PLAN')}
          >
            🚀 그로스 플랜 ({purchases.filter(p => p.productCode === 'GROWTH_PLAN').length})
          </EmailSubTab>
          <EmailSubTab
            className={purchaseProductTab === 'REAL_INTERVIEW' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('REAL_INTERVIEW')}
          >
            🎤 리얼 인터뷰 ({purchases.filter(p => p.productCode === 'REAL_INTERVIEW').length})
          </EmailSubTab>
          <EmailSubTab
            className={purchaseProductTab === 'CRITICAL_HIT' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('CRITICAL_HIT')}
          >
            🎯 크리티컬 히트 ({purchases.filter(p => p.productCode === 'CRITICAL_HIT').length})
          </EmailSubTab>
          <EmailSubTab
            className={purchaseProductTab === 'LAST_CHECK' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('LAST_CHECK')}
          >
            🚨 라스트 체크 ({purchases.filter(p => p.productCode === 'LAST_CHECK').length})
          </EmailSubTab>
          <EmailSubTab
            className={purchaseProductTab === 'RESUME_FIT' ? 'active' : ''}
            onClick={() => setPurchaseProductTab('RESUME_FIT')}
          >
            📄 레주메 핏 ({purchases.filter(p => p.productCode === 'RESUME_FIT').length})
          </EmailSubTab>
        </EmailSubTabs>

        {isLoadingPurchases ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : (
          renderProductTable()
        )}
      </UsersContainer>
    );
  };

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
          <OperatorSelect
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="all">담당자: 전체</option>
            {operators.map(op => (
              <option key={op.id} value={op.id}>{op.name}</option>
            ))}
            <option value="unassigned">미지정</option>
          </OperatorSelect>
        </FilterGroup>
      </Header>

      <UsersTable>
        <thead>
          <tr>
            <th>타입</th>
            <th>이름</th>
            <th>이메일</th>
            <th>담당자</th>
            <th>신청일 (KST)</th>
            <th>상태</th>
            <th>진행상황</th>
            <th>최근 발송</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter(user => {
              if (operatorFilter === 'all') return true;
              if (operatorFilter === 'unassigned') return !user.assignedTo;
              return user.assignedTo === operatorFilter;
            })
            .map(user => {
            return (
              <tr key={user.id}>
                <td>
                  <UserTypeBadge type={user.type}>
                    {user.type}
                  </UserTypeBadge>
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <OperatorCell>
                    <OperatorSelect
                      value={user.assignedTo || ''}
                      onChange={(e) => handleOperatorChange(user.id, e.target.value)}
                    >
                      <option value="">미지정</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </OperatorSelect>
                    {(() => {
                      const latestChange = getLatestChange(user);
                      if (latestChange) {
                        return (
                          <ChangeInfoWrapper>
                            <ChangeInfo>
                              ({latestChange.changedBy}가 {getTimeAgo(latestChange.changedAt)} 변경)
                            </ChangeInfo>
                            {user.assignmentHistory && user.assignmentHistory.length > 0 && (
                              <HistoryTooltip className="history-tooltip">
                                <div style={{ fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                                  변경 이력
                                </div>
                                {user.assignmentHistory.map((history, idx) => (
                                  <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    {history.changedAt.toLocaleDateString('ko-KR')} {history.changedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                    - {history.changedBy}가 {
                                      history.from
                                        ? operators.find(op => op.id === history.from)?.name || '알 수 없음'
                                        : '미지정'
                                    }→{
                                      history.to
                                        ? operators.find(op => op.id === history.to)?.name || '알 수 없음'
                                        : '미지정'
                                    }으로 변경
                                  </div>
                                )).reverse()}
                              </HistoryTooltip>
                            )}
                          </ChangeInfoWrapper>
                        );
                      }
                      return null;
                    })()}
                  </OperatorCell>
                </td>
                <td>{user.applicationDate}</td>
                <td>
                  <StatusBadge $userType={user.type}>
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
                  <ActionButton onClick={() => {
                    setSelectedUser(user);
                    setShowUserDetailModal(true);
                  }}>
                    상세
                  </ActionButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </UsersTable>
    </UsersContainer>
  );

  const handleResendAnswerGuide = async (answerId: string) => {
    if (!confirm('이 답변 가이드를 재발송하시겠습니까?')) return;

    try {
      await queryDailyService.resendAnswerGuide(answerId);
      alert('재발송이 완료되었습니다.');
    } catch (error: any) {
      alert('재발송 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelQuestion = async (questionId: string) => {
    if (!confirm('이 질문을 취소하시겠습니까?\n예약된 이메일도 함께 취소됩니다.')) return;

    try {
      await queryDailyService.cancelQuestion(questionId);
      alert('질문이 취소되었습니다.');
      // 목록 새로고침
      const questionsResponse = await queryDailyService.getQuestions({ page: 0, size: 50 });
      setQuestions(questionsResponse.content);
    } catch (error: any) {
      alert('취소 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelAnswer = async (answerId: string) => {
    if (!confirm('이 답변을 취소하시겠습니까?\n예약된 이메일도 함께 취소됩니다.')) return;

    try {
      await queryDailyService.cancelAnswer(answerId);
      alert('답변이 취소되었습니다.');
      // 목록 새로고침
      const answersResponse = await queryDailyService.getAnswers({ page: 0, size: 50 });
      setAnswers(answersResponse.content);
    } catch (error: any) {
      alert('취소 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderEmails = () => {
    // KST 기준 현재 시점
    const now = new Date();

    // Upcoming window (현재 이후, 선택적 범위)
    const upcomingWindowMs: number | undefined =
      upcomingTimeWindow === '24h' ? 24 * 60 * 60 * 1000 :
      upcomingTimeWindow === '7d' ? 7 * 24 * 60 * 60 * 1000 :
      undefined;

    const isWithinUpcomingWindow = (t: Date): boolean => {
      if (t < now) return false;
      if (upcomingWindowMs === undefined) return true;
      return (t.getTime() - now.getTime()) <= upcomingWindowMs;
    };

    const upcomingQuestions = questions.filter(q => {
      if (!q.scheduledAt) return false; // scheduledAt이 null이면 제외
      const scheduledDateUTC = new Date(q.scheduledAt + 'Z');
      return isWithinUpcomingWindow(scheduledDateUTC);
    });

    const upcomingAnswers = answers.filter(a => {
      if (!a.scheduledAt) return false; // scheduledAt이 null이면 제외
      const scheduledDateUTC = new Date(a.scheduledAt + 'Z');
      return isWithinUpcomingWindow(scheduledDateUTC);
    });

    const upcomingCombined = [
      ...upcomingQuestions.map(q => ({ kind: 'question' as const, data: q })),
      ...upcomingAnswers.map(a => ({ kind: 'answer' as const, data: a }))
    ].sort((a, b) => {
      const dateA = new Date(a.data.scheduledAt + 'Z').getTime();
      const dateB = new Date(b.data.scheduledAt + 'Z').getTime();
      return dateA - dateB;
    });

    const upcomingFilteredByKind = upcomingCombined.filter(item => {
      if (upcomingKindFilter === 'all') return true;
      return item.kind === upcomingKindFilter;
    });

    const upcomingFiltered = upcomingFilteredByKind.filter(item => {
      if (upcomingTypeFilter === 'all') return true;
      const itemType = item.kind === 'question' ? (item.data as QuestionWithMember).type : (item.data as AnswerWithMember).type;
      return itemType === upcomingTypeFilter;
    });

    const upcomingCounts = {
      total: upcomingFiltered.length,
      questions: upcomingFiltered.filter(i => i.kind === 'question').length,
      answers: upcomingFiltered.filter(i => i.kind === 'answer').length
    };

    // History window (과거 중심)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const historyFromTime: Date | undefined =
      historyTimeWindow === 'today' ? startOfToday :
      historyTimeWindow === '7d' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
      historyTimeWindow === '30d' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) :
      undefined;

    const isWithinHistoryWindow = (t: Date): boolean => {
      if (t > now) return false; // 이력은 현재 시점 이전만
      if (!historyFromTime) return true;
      return t >= historyFromTime;
    };

    const historyCombinedAll = [
      ...questions.map(q => ({ kind: 'question' as const, data: q })),
      ...answers.map(a => ({ kind: 'answer' as const, data: a }))
    ].filter(item => {
      if (!item.data.scheduledAt) return false; // scheduledAt이 null이면 제외
      return isWithinHistoryWindow(new Date(item.data.scheduledAt + 'Z'));
    })
     .sort((a, b) => new Date(b.data.scheduledAt + 'Z').getTime() - new Date(a.data.scheduledAt + 'Z').getTime());

    const historyFiltered = historyCombinedAll.filter(item => {
      if (historyKindFilter === 'all') return true;
      if (historyKindFilter === 'questions') return item.kind === 'question';
      return item.kind === 'answer';
    });

    return (
    <EmailsContainer>
      <Header>
        <div>
          <h2>📮 발송 센터</h2>
          <Subtitle>모든 QueryDaily 메일 발송을 여기서 관리합니다</Subtitle>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <AddButton onClick={() => {
            setEmailModalType('growthPlanQuestion');
            setShowEmailModal(true);
          }} style={{ background: '#FF8C00' }}>
            🚀 그로스 플랜 질문 발송
          </AddButton>
          <AddButton onClick={() => {
            setEmailModalType('growthPlanAnswerGuide');
            setShowEmailModal(true);
          }} style={{ background: '#FFD700' }}>
            ⭐ 그로스 플랜 답변 가이드
          </AddButton>
          <AddButton onClick={() => {
            setEmailModalType('purchaseConfirmation');
            setShowEmailModal(true);
          }} style={{ background: '#0066CC' }}>
            💳 그로스 플랜 구매 확인
          </AddButton>
        </div>
      </Header>

      {/* Emails sub-tabs */}
      <EmailSubTabs>
        <EmailSubTab
          className={emailsTab === 'upcoming' ? 'active' : ''}
          onClick={() => setEmailsTab('upcoming')}
        >예정</EmailSubTab>
        <EmailSubTab
          className={emailsTab === 'history' ? 'active' : ''}
          onClick={() => setEmailsTab('history')}
        >이력</EmailSubTab>
      </EmailSubTabs>

      <EmailSections>
        {/* 발송 이력 */}
        {emailsTab === 'history' && (
        <Section>
          <SectionTitle>
            <h3>📋 발송 이력</h3>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
              {historyFiltered.length}건
            </span>
          </SectionTitle>
          {/* History filters */}
          <FilterBar>
            <ToggleGroup>
              <ToggleLabel>종류</ToggleLabel>
              <ToggleButton
                className={historyKindFilter === 'all' ? 'active' : ''}
                onClick={() => setHistoryKindFilter('all')}
              >전체</ToggleButton>
              <ToggleButton
                className={historyKindFilter === 'questions' ? 'active' : ''}
                onClick={() => setHistoryKindFilter('questions')}
              >질문만</ToggleButton>
              <ToggleButton
                className={historyKindFilter === 'answers' ? 'active' : ''}
                onClick={() => setHistoryKindFilter('answers')}
              >답변만</ToggleButton>
            </ToggleGroup>
            <ToggleGroup>
              <ToggleLabel>시간</ToggleLabel>
              <ToggleButton
                className={historyTimeWindow === 'today' ? 'active' : ''}
                onClick={() => setHistoryTimeWindow('today')}
              >오늘</ToggleButton>
              <ToggleButton
                className={historyTimeWindow === '7d' ? 'active' : ''}
                onClick={() => setHistoryTimeWindow('7d')}
              >7일</ToggleButton>
              <ToggleButton
                className={historyTimeWindow === '30d' ? 'active' : ''}
                onClick={() => setHistoryTimeWindow('30d')}
              >30일</ToggleButton>
              <ToggleButton
                className={historyTimeWindow === 'all' ? 'active' : ''}
                onClick={() => setHistoryTimeWindow('all')}
              >전체</ToggleButton>
            </ToggleGroup>
          </FilterBar>
          {isLoadingAnswers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              로딩 중...
            </div>
          ) : historyFiltered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              표시할 발송 이력이 없습니다.
            </div>
          ) : (
            <AnswerHistoryTable>
              <thead>
                <tr>
                  <th>발송일시 (KST)</th>
                  <th>종류</th>
                  <th>이메일</th>
                  <th>이름</th>
                  <th>질문 (일부)</th>
                  <th>진행률</th>
                  <th>타입</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {historyFiltered.map(item => {
                  const scheduledDate = new Date(item.data.scheduledAt + 'Z');
                  const dateTimeStr = scheduledDate.toLocaleString('ko-KR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false
                  });
                  if (item.kind === 'answer') {
                    const answer = item.data as AnswerWithMember;
                    return (
                      <tr key={`hist-a-${answer.id}`}>
                        <td>{dateTimeStr}</td>
                        <td><KindBadge kind="answer">답변</KindBadge></td>
                        <td>{answer.member.email}</td>
                        <td>{answer.member.name}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {answer.questionContent}
                        </td>
                        <td>
                          {answer.currentDay && answer.totalDays ? (
                            <ProgressBadge>
                              {answer.currentDay}일차 / {answer.totalDays}일
                            </ProgressBadge>
                          ) : (
                            <ProgressBadge $empty>-</ProgressBadge>
                          )}
                        </td>
                        <td>
                          <TypeBadge type={answer.type}>
                            {answer.type === 'TRIAL' ? '무료체험' : '그로스 플랜'}
                          </TypeBadge>
                        </td>
                        <td>
                          <ActionButton
                            $primary
                            onClick={() => handleResendAnswerGuide(answer.id)}
                            style={{ fontSize: '13px' }}
                          >
                            🔄 재발송
                          </ActionButton>
                        </td>
                      </tr>
                    );
                  } else {
                    const question = item.data as QuestionWithMember;
                    return (
                      <tr key={`hist-q-${question.id}`}>
                        <td>{dateTimeStr}</td>
                        <td><KindBadge kind="question">질문</KindBadge></td>
                        <td>{question.member?.email}</td>
                        <td>{question.member?.name}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {question.content}
                        </td>
                        <td>
                          {question.currentDay && question.totalDays ? (
                            <ProgressBadge>
                              {question.currentDay}일차 / {question.totalDays}일
                            </ProgressBadge>
                          ) : (
                            <ProgressBadge $empty>-</ProgressBadge>
                          )}
                        </td>
                        <td>
                          <TypeBadge type={question.type}>
                            {question.type === 'TRIAL' ? '무료체험' : '그로스 플랜'}
                          </TypeBadge>
                        </td>
                        <td>
                          {/* 질문 이력: 액션 없음 */}
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </AnswerHistoryTable>
          )}
        </Section>
        )}

        {/* 예정됨 (현재 이후) */}
        {emailsTab === 'upcoming' && (
        <Section>
          <SectionTitle>
            <h3>📅 예정됨 (현재 이후)</h3>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
              총 {upcomingCounts.total}건 · 질문 {upcomingCounts.questions} · 답변 {upcomingCounts.answers}
            </span>
          </SectionTitle>
          {/* Upcoming filters */}
          <FilterBar>
            <ToggleGroup>
              <ToggleLabel>시간</ToggleLabel>
              <ToggleButton
                className={upcomingTimeWindow === 'all' ? 'active' : ''}
                onClick={() => setUpcomingTimeWindow('all')}
              >전체</ToggleButton>
              <ToggleButton
                className={upcomingTimeWindow === '24h' ? 'active' : ''}
                onClick={() => setUpcomingTimeWindow('24h')}
              >24시간</ToggleButton>
              <ToggleButton
                className={upcomingTimeWindow === '7d' ? 'active' : ''}
                onClick={() => setUpcomingTimeWindow('7d')}
              >7일</ToggleButton>
            </ToggleGroup>
            <ToggleGroup>
              <ToggleLabel>종류</ToggleLabel>
              <ToggleButton
                className={upcomingKindFilter === 'all' ? 'active' : ''}
                onClick={() => setUpcomingKindFilter('all')}
              >전체</ToggleButton>
              <ToggleButton
                className={upcomingKindFilter === 'question' ? 'active' : ''}
                onClick={() => setUpcomingKindFilter('question')}
              >질문만</ToggleButton>
              <ToggleButton
                className={upcomingKindFilter === 'answer' ? 'active' : ''}
                onClick={() => setUpcomingKindFilter('answer')}
              >답변만</ToggleButton>
            </ToggleGroup>
            <ToggleGroup>
              <ToggleLabel>유형</ToggleLabel>
              <ToggleButton
                className={upcomingTypeFilter === 'all' ? 'active' : ''}
                onClick={() => setUpcomingTypeFilter('all')}
              >전체</ToggleButton>
              <ToggleButton
                className={upcomingTypeFilter === 'TRIAL' ? 'active' : ''}
                onClick={() => setUpcomingTypeFilter('TRIAL')}
              >TRIAL</ToggleButton>
              <ToggleButton
                className={upcomingTypeFilter === 'GROWTH_PLAN' ? 'active' : ''}
                onClick={() => setUpcomingTypeFilter('GROWTH_PLAN')}
              >GROWTH_PLAN</ToggleButton>
            </ToggleGroup>
            <ToggleGroup>
              <ToggleLabel>보기</ToggleLabel>
              <ToggleButton
                className={upcomingViewMode === 'combined' ? 'active' : ''}
                onClick={() => setUpcomingViewMode('combined')}
              >모아 보기</ToggleButton>
              <ToggleButton
                className={upcomingViewMode === 'split' ? 'active' : ''}
                onClick={() => setUpcomingViewMode('split')}
              >구분 보기</ToggleButton>
            </ToggleGroup>
          </FilterBar>

          {upcomingFiltered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              예정된 메일이 없습니다.
            </div>
          ) : (
            upcomingViewMode === 'combined' ? (
              <EmailGrid>
                {upcomingFiltered.map((item) => {
                  if (item.kind === 'question') {
                    const question = item.data as QuestionWithMember;
                    const questionTime = new Date(question.scheduledAt + 'Z');
                    return (
                      <EmailDetailCard key={`q-${question.id}`}>
                        <EmailHeader>
                          <EmailTime>{questionTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}</EmailTime>
                          <EmailType type="daily_question">질문</EmailType>
                        </EmailHeader>
                        <EmailBody>
                          <EmailTo>To: {question.member.name} ({question.member.email})</EmailTo>
                          <EmailSubjectLine>
                            [{question.type === 'TRIAL' ? '무료체험' : '그로스 플랜'}]
                            {question.currentDay && question.totalDays ? ` Day ${question.currentDay}/${question.totalDays}` : ''} 질문
                          </EmailSubjectLine>
                          <EmailPreview>
                            {question.content.substring(0, 100)}{question.content.length > 100 ? '...' : ''}
                          </EmailPreview>
                        </EmailBody>
                        <EmailFooter>
                          <ActionButton
                            onClick={() => handleCancelQuestion(question.id)}
                            style={{ background: '#dc2626', color: 'white', border: 'none' }}
                          >
                            ❌ 취소
                          </ActionButton>
                        </EmailFooter>
                      </EmailDetailCard>
                    );
                  } else {
                    const answer = item.data as AnswerWithMember;
                    const answerTime = new Date(answer.scheduledAt + 'Z');
                    return (
                      <EmailDetailCard key={`a-${answer.id}`}>
                        <EmailHeader>
                          <EmailTime>{answerTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}</EmailTime>
                          <EmailType type="answer_guide">답변</EmailType>
                        </EmailHeader>
                        <EmailBody>
                          <EmailTo>To: {answer.member.name} ({answer.member.email})</EmailTo>
                          <EmailSubjectLine>
                            [{answer.type === 'TRIAL' ? '무료체험' : '그로스 플랜'}]
                            {answer.currentDay && answer.totalDays ? ` Day ${answer.currentDay}/${answer.totalDays}` : ''} 답변 가이드
                          </EmailSubjectLine>
                          <EmailPreview>
                            {answer.questionContent ? answer.questionContent.substring(0, 100) + '...' : '질문 없음 (답변만 발송)'}
                          </EmailPreview>
                        </EmailBody>
                        <EmailFooter>
                          <ActionButton
                            $primary
                            onClick={() => handleResendAnswerGuide(answer.id)}
                          >
                            🔄 재발송
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleCancelAnswer(answer.id)}
                            style={{ background: '#dc2626', color: 'white', border: 'none' }}
                          >
                            ❌ 취소
                          </ActionButton>
                        </EmailFooter>
                      </EmailDetailCard>
                    );
                  }
                })}
              </EmailGrid>
            ) : (
              <SplitGrid>
                <SplitColumn>
                  <SplitTitle>질문 예정</SplitTitle>
                  <EmailGrid>
                    {upcomingFiltered.filter(i => i.kind === 'question').map(item => {
                      const question = item.data as QuestionWithMember;
                      const questionTime = new Date(question.scheduledAt + 'Z');
                      return (
                        <EmailDetailCard key={`sq-${question.id}`}>
                          <EmailHeader>
                            <EmailTime>{questionTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}</EmailTime>
                            <EmailType type="daily_question">질문</EmailType>
                          </EmailHeader>
                          <EmailBody>
                            <EmailTo>To: {question.member.name} ({question.member.email})</EmailTo>
                            <EmailSubjectLine>
                              [{question.type === 'TRIAL' ? '무료체험' : '그로스 플랜'}]
                              {question.currentDay && question.totalDays ? ` Day ${question.currentDay}/${question.totalDays}` : ''} 질문
                            </EmailSubjectLine>
                            <EmailPreview>
                              {question.content.substring(0, 100)}{question.content.length > 100 ? '...' : ''}
                            </EmailPreview>
                          </EmailBody>
                          <EmailFooter>
                            <ActionButton
                              onClick={() => handleCancelQuestion(question.id)}
                              style={{ background: '#dc2626', color: 'white', border: 'none' }}
                            >
                              ❌ 취소
                            </ActionButton>
                          </EmailFooter>
                        </EmailDetailCard>
                      );
                    })}
                  </EmailGrid>
                </SplitColumn>
                <SplitColumn>
                  <SplitTitle>답변 예정</SplitTitle>
                  <EmailGrid>
                    {upcomingFiltered.filter(i => i.kind === 'answer').map(item => {
                      const answer = item.data as AnswerWithMember;
                      const answerTime = new Date(answer.scheduledAt + 'Z');
                      return (
                        <EmailDetailCard key={`sa-${answer.id}`}>
                          <EmailHeader>
                            <EmailTime>{answerTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}</EmailTime>
                            <EmailType type="answer_guide">답변</EmailType>
                          </EmailHeader>
                          <EmailBody>
                            <EmailTo>To: {answer.member.name} ({answer.member.email})</EmailTo>
                            <EmailSubjectLine>
                              [{answer.type === 'TRIAL' ? '무료체험' : '그로스 플랜'}]
                              {answer.currentDay && answer.totalDays ? ` Day ${answer.currentDay}/${answer.totalDays}` : ''} 답변 가이드
                            </EmailSubjectLine>
                            <EmailPreview>
                              {answer.questionContent ? answer.questionContent.substring(0, 100) + '...' : '질문 없음 (답변만 발송)'}
                            </EmailPreview>
                          </EmailBody>
                          <EmailFooter>
                            <ActionButton
                              $primary
                              onClick={() => handleResendAnswerGuide(answer.id)}
                            >
                              🔄 재발송
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleCancelAnswer(answer.id)}
                              style={{ background: '#dc2626', color: 'white', border: 'none' }}
                            >
                              ❌ 취소
                            </ActionButton>
                          </EmailFooter>
                        </EmailDetailCard>
                      );
                    })}
                  </EmailGrid>
                </SplitColumn>
              </SplitGrid>
            )
          )}
        </Section>
        )}
      </EmailSections>
    </EmailsContainer>
  );
  };

  // const handleEmailStatusChange = (emailId: string, status: 'sent' | 'cancelled') => {
  //   setScheduledEmails(emails =>
  //     emails.map(email =>
  //       email.id === emailId
  //         ? { ...email, status, sentAt: status === 'sent' ? new Date().toISOString() : undefined }
  //         : email
  //     )
  //   );
  // };

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
          className={activeTab === 'emails' ? 'active' : ''}
          onClick={() => setActiveTab('emails')}
        >
          📮 발송 센터
        </Tab>
        <Tab
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 사용자 관리
        </Tab>
        <Tab
          className={activeTab === 'purchases' ? 'active' : ''}
          onClick={() => setActiveTab('purchases')}
        >
          💳 구매 내역
        </Tab>
      </TabBar>

      <Content>
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'emails' && renderEmails()}
        {activeTab === 'purchases' && renderPurchases()}
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
                    <button
                      style={{
                        display: 'inline-flex',
                        gap: '8px',
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        border: 'none',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                      onClick={async () => {
                        if (!selectedUser.resumeAssetId) {
                          alert('이력서 파일을 불러올 수 없습니다.');
                          return;
                        }
                        try {
                          await queryDailyService.downloadAsset(
                            selectedUser.resumeAssetId,
                            selectedUser.resumeFileName || 'resume.pdf'
                          );
                        } catch (error) {
                          alert('이력서 다운로드 중 오류가 발생했습니다.');
                        }
                      }}
                    >
                      📄 이력서 다운로드
                    </button>
                  </DetailRow>
                </DetailContent>
              </DetailSection>

              <DetailSection>
                <DetailLabel>담당자 관리</DetailLabel>
                <DetailContent>
                  <DetailRow>
                    <span>현재 담당자:</span>
                    <OperatorSelect
                      value={selectedUser.assignedTo || ''}
                      onChange={(e) => {
                        handleOperatorChange(selectedUser.id, e.target.value);
                        setSelectedUser({...selectedUser, assignedTo: e.target.value || undefined});
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      <option value="">미지정</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </OperatorSelect>
                  </DetailRow>
                  {selectedUser.assignedTo && (
                    <DetailRow>
                      <span>담당자 정보:</span>
                      {operators.find(op => op.id === selectedUser.assignedTo)?.email}
                    </DetailRow>
                  )}
                </DetailContent>
              </DetailSection>

              <DetailSection>
                <DetailLabel>상태 관리</DetailLabel>
                <DetailContent>
                  <DetailRow>
                    <span>현재 상태:</span>
                    <StatusBadge $userType={selectedUser.type}>
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
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 이메일 발송 모달 */}
      {showEmailModal && (
        <EmailSendModal
          showEmailModal={showEmailModal}
          setShowEmailModal={setShowEmailModal}
          emailModalType={emailModalType}
          selectedUserEmail={selectedUser?.email}
          selectedPurchaseId={selectedPurchaseId}
        />
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
                      <SubLabel>네카라쿠배 지원자</SubLabel>
                      <Textarea rows={4} placeholder="대규모 트래픽 처리, 안정성 중심의 답변" />
                    </div>
                    <div>
                      <SubLabel>당근/토스 (유니콘 스타트업) 지원자</SubLabel>
                      <Textarea rows={4} placeholder="빠른 실행력, 주도적 문제 해결 중심의 답변" />
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
// const DashboardContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 32px;
// `;

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

const EmailTime = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 60px;
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

const OperatorCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ChangeInfoWrapper = styled.div`
  position: relative;

  &:hover .history-tooltip {
    display: block;
  }
`;

const ChangeInfo = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  cursor: help;
`;

const HistoryTooltip = styled.div`
  display: none;
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 300px;
  margin-bottom: 8px;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 20px;
    border: 8px solid transparent;
    border-top-color: white;
  }

  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 20px;
    border: 8px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.gray[300]};
    margin-top: 1px;
  }
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

const OperatorSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  min-width: 80px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
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

const StatusBadge = styled.span<{ $userType: 'LEAD' | 'MEMBER' }>`
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

// const ActionButtons = styled.div`
//   display: flex;
//   gap: 4px;
// `;

const ActionButton = styled.button<{ $primary?: boolean; $large?: boolean }>`
  padding: ${({ $large }) => $large ? '12px 24px' : '6px 10px'};
  border-radius: 4px;
  font-size: ${({ $large }) => $large ? '14px' : '12px'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ $primary, theme }) => $primary ? theme.colors.primary : 'white'};
  color: ${({ $primary, theme }) => $primary ? 'white' : theme.colors.text.primary};

  &:hover {
    background: ${({ $primary, theme }) => $primary ? theme.colors.primaryDark : theme.colors.gray[50]};
  }
`;

// Content Components
// const ContentContainer = styled.div``;

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

// const ContentTabs = styled.div`
//   display: flex;
//   gap: 16px;
//   margin-bottom: 24px;
//   border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
//   padding-bottom: 16px;
// `;

// const ContentTab = styled.button`
//   padding: 8px 16px;
//   background: transparent;
//   border: none;
//   color: ${({ theme }) => theme.colors.text.secondary};
//   font-size: 14px;
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s;

//   &:hover {
//     color: ${({ theme }) => theme.colors.primary};
//   }

//   &.active {
//     color: ${({ theme }) => theme.colors.primary};
//     font-weight: 600;
//   }
// `;

// const AnswerGuideSection = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
//   gap: 20px;
// `;

// Unused styled components - commented for future use
// const GuideCard = styled.div`
//   background: white;
//   border-radius: 8px;
//   padding: 20px;
//   border: 1px solid ${({ theme }) => theme.colors.gray[200]};
// `;

// const GuideHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: start;
//   margin-bottom: 16px;
//
//   h4 {
//     font-size: 16px;
//     font-weight: 600;
//   }
// `;

// const GuideDate = styled.span`
//   font-size: 12px;
//   color: ${({ theme }) => theme.colors.text.secondary};
// `;

// const GuidePreview = styled.div`
//   margin-bottom: 16px;
// `;

// const GuideSection = styled.div`
//   margin-bottom: 12px;
// `;

// const SectionLabel = styled.div`
//   font-size: 13px;
//   font-weight: 600;
//   color: ${({ theme }) => theme.colors.text.secondary};
//   margin-bottom: 8px;
// `;

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

// const GuideActions = styled.div`
//   display: flex;
//   gap: 8px;
//
//   button {
//     flex: 1;
//     padding: 8px;
//     background: white;
//     border: 1px solid ${({ theme }) => theme.colors.gray[300]};
//     border-radius: 4px;
//     font-size: 13px;
//     cursor: pointer;
//     transition: all 0.2s;
//
//     &:hover {
//       background: ${({ theme }) => theme.colors.gray[50]};
//     }
//   }
// `;

// Question Bank Components
// const QuestionBankSection = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
//   gap: 20px;
// `;

// const QuestionCard = styled.div`
//   background: white;
//   border-radius: 8px;
//   padding: 20px;
//   border: 1px solid ${({ theme }) => theme.colors.gray[200]};
// `;

// const QuestionType = styled.div`
//   display: inline-block;
//   padding: 4px 10px;
//   background: #e0f2fe;
//   color: #0369a1;
//   border-radius: 4px;
//   font-size: 12px;
//   font-weight: 600;
//   margin-bottom: 12px;
// `;

// const QuestionText = styled.h4`
//   font-size: 16px;
//   font-weight: 600;
//   color: ${({ theme }) => theme.colors.text.primary};
//   margin-bottom: 12px;
//   line-height: 1.4;
// `;

// const QuestionTags = styled.div`
//   display: flex;
//   gap: 8px;
//   flex-wrap: wrap;
// `;

// const Tag = styled.span`
//   padding: 4px 10px;
//   background: ${({ theme }) => theme.colors.gray[100]};
//   border-radius: 4px;
//   font-size: 12px;
//   color: ${({ theme }) => theme.colors.text.secondary};
// `;

// Template Components
// const TemplateSection = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
//   gap: 20px;
// `;

// const TemplateCard = styled.div`
//   background: white;
//   border-radius: 8px;
//   padding: 20px;
//   border: 1px solid ${({ theme }) => theme.colors.gray[200]};
// `;

// const TemplateHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 16px;
//
//   h4 {
//     font-size: 16px;
//     font-weight: 600;
//   }
// `;

// const TemplateType = styled.span`
//   padding: 4px 10px;
//   background: #f0fdf4;
//   color: #166534;
//   border-radius: 4px;
//   font-size: 12px;
//   font-weight: 500;
// `;

// const TemplatePreview = styled.div`
//   font-size: 14px;
//   color: ${({ theme }) => theme.colors.text.secondary};
//   line-height: 1.5;
//   margin-bottom: 16px;
//   overflow: hidden;
//   text-overflow: ellipsis;
//   display: -webkit-box;
//   -webkit-line-clamp: 3;
//   -webkit-box-orient: vertical;
// `;

// const TemplateActions = styled.div`
//   display: flex;
//   gap: 8px;
//
//   button {
//     flex: 1;
//     padding: 8px;
//     background: white;
//     border: 1px solid ${({ theme }) => theme.colors.gray[300]};
//     border-radius: 4px;
//     font-size: 13px;
//     cursor: pointer;
//     transition: all 0.2s;
//
//     &:hover {
//       background: ${({ theme }) => theme.colors.gray[50]};
//     }
//   }
// `;

// Email Tab Components
const EmailsContainer = styled.div``;

const EmailSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const EmailSubTabs = styled.div`
  display: flex;
  gap: 8px;
  margin: 12px 0 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const EmailSubTab = styled.button`
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  &.active {
    color: ${({ theme }) => theme.colors.primary};
    border-bottom-color: ${({ theme }) => theme.colors.primary};
  }
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

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
  margin: 12px 0 16px;
`;

const ToggleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-right: 4px;
`;

const ToggleButton = styled.button`
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: white;
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SplitColumn = styled.div``;

const SplitTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 10px;
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

// const EmailStatus = styled.span<{ sent?: boolean }>`
//   padding: 4px 10px;
//   border-radius: 4px;
//   font-size: 12px;
//   font-weight: 500;
//   background: ${({ sent }) => sent ? '#e0f2fe' : '#fef3c7'};
//   color: ${({ sent }) => sent ? '#0369a1' : '#a16207'};
// `;

// const EmailSentTime = styled.span`
//   font-size: 12px;
//   color: ${({ theme }) => theme.colors.text.tertiary};
// `;

// Analytics Components
// const AnalyticsContainer = styled.div``;

// const AnalyticsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 24px;

//   @media (max-width: 1200px) {
//     grid-template-columns: 1fr;
//   }
// `;

// const ChartCard = styled.div`
//   background: white;
//   border-radius: 8px;
//   padding: 24px;
//   border: 1px solid ${({ theme }) => theme.colors.gray[200]};

//   h3 {
//     font-size: 16px;
//     font-weight: 600;
//     margin-bottom: 20px;
//   }
// `;

// const ChartPlaceholder = styled.div`
//   height: 200px;
//   background: ${({ theme }) => theme.colors.gray[50]};
//   border-radius: 8px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 24px;
//   color: ${({ theme }) => theme.colors.text.tertiary};
// `;

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

// const NextActionBox = styled.div`
//   padding: 16px;
//   background: ${({ theme }) => theme.colors.gray[50]};
//   border-radius: 8px;
//   text-align: center;
// `;

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

// const EmailTypeSelector = styled.div`
//   display: flex;
//   gap: 12px;
//   margin-bottom: 24px;
// `;

// const EmailTypeButton = styled.button<{ active: boolean }>`
//   flex: 1;
//   padding: 12px;
//   background: ${({ active, theme }) => active ? theme.colors.primary : 'white'};
//   color: ${({ active, theme }) => active ? 'white' : theme.colors.text.primary};
//   border: 1px solid ${({ theme }) => theme.colors.primary};
//   border-radius: 6px;
//   font-size: 14px;
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s;
//
//   &:hover {
//     opacity: 0.9;
//   }
// `;

// const RecipientsList = styled.div`
//   max-height: 200px;
//   overflow-y: auto;
//   border: 1px solid ${({ theme }) => theme.colors.gray[200]};
//   border-radius: 6px;
//   padding: 12px;
//
//   label {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     padding: 8px;
//     cursor: pointer;
//     font-size: 14px;
//
//     &:hover {
//       background: ${({ theme }) => theme.colors.gray[50]};
//     }
//
//     input[type="checkbox"] {
//       cursor: pointer;
//     }
//   }
// `;

// const ErrorMessage = styled.div`
//   padding: 12px;
//   background: #fef2f2;
//   border: 1px solid #fecaca;
//   border-radius: 6px;
//   color: #dc2626;
//   font-size: 14px;
//   margin-top: 16px;
// `;

// const SuccessMessage = styled.div`
//   padding: 12px;
//   background: #f0fdf4;
//   border: 1px solid #86efac;
//   border-radius: 6px;
//   color: #16a34a;
//   font-size: 14px;
//   margin-top: 16px;
// `;

// const ModalFooter = styled.div`
//   display: flex;
//   gap: 12px;
//   justify-content: flex-end;
//   padding: 20px;
//   border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
// `;

// Answer History Table
const AnswerHistoryTable = styled.table`
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

      &:hover {
        background: ${({ theme }) => theme.colors.gray[50]};
      }
    }

    td {
      padding: 16px 12px;
      font-size: 14px;
      color: ${({ theme }) => theme.colors.text.primary};
    }
  }
`;

const TypeBadge = styled.span<{ type: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ type }) =>
    type === 'TRIAL' ? '#e0f2fe' : '#fef3c7'};
  color: ${({ type }) =>
    type === 'TRIAL' ? '#0369a1' : '#a16207'};
`;

const KindBadge = styled.span<{ kind: 'question' | 'answer' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: ${({ kind }) => kind === 'question' ? '#e0f2fe' : '#f0fdf4'};
  color: ${({ kind }) => kind === 'question' ? '#0369a1' : '#166534'};
`;

const ProgressBadge = styled.span<{ $empty?: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $empty }) => $empty ? '#f3f4f6' : '#dbeafe'};
  color: ${({ $empty }) => $empty ? '#9ca3af' : '#1e40af'};
  white-space: nowrap;
`;

export default QueryDailyManagement;