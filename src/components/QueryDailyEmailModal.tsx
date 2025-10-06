import { useState, memo, useEffect } from 'react';
import styled from 'styled-components';
import emailService from '../services/emailService';
import queryDailyService from '../services/queryDailyService';
import type { QueryApplication } from '../services/queryDailyService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay, isBefore, startOfToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EmailSendModalProps {
  showEmailModal: boolean;
  setShowEmailModal: (show: boolean) => void;
  emailModalType: 'question' | 'answerGuide' | 'welcome' | 'midFeedback' | 'complete' | 'purchaseConfirmation' | 'growthPlanQuestion' | 'growthPlanAnswerGuide';
  selectedUserEmail?: string;
}

export const EmailSendModal = memo(({
  showEmailModal,
  setShowEmailModal,
  emailModalType,
  selectedUserEmail = ''
}: EmailSendModalProps) => {
  const [recipientEmail, setRecipientEmail] = useState(selectedUserEmail);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [applicants, setApplicants] = useState<QueryApplication[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('');
  const [showApplicantDropdown, setShowApplicantDropdown] = useState(false);

  // Fetch applicants on component mount
  useEffect(() => {
    if (showEmailModal) {
      const loadApplicants = async () => {
        try {
          const applications = await queryDailyService.getAllApplications();
          setApplicants(applications);
          console.log('✅ Loaded applicants for dropdown:', applications.length);
        } catch (error: any) {
          console.error('Failed to load applicants:', error);
          // 401 에러는 apiClient에서 자동으로 리다이렉트 처리됨
          // 다른 에러의 경우 빈 배열로 fallback
          if (error.response?.status !== 401) {
            setApplicants([]);
          }
        }
      };
      loadApplicants();
    }
  }, [showEmailModal]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.date-picker-wrapper')) {
        setShowCalendar(false);
      }
      if (!target.closest('.applicant-dropdown-wrapper')) {
        setShowApplicantDropdown(false);
      }
    };

    if (showCalendar || showApplicantDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCalendar, showApplicantDropdown]);

  // Handle applicant selection
  const handleApplicantSelect = (applicant: QueryApplication) => {
    setSelectedApplicantId(String(applicant.id));
    setRecipientEmail(applicant.email);
    // Set userName for all email types
    setQuestionData(prev => ({
      ...prev,
      userName: applicant.name || applicant.email.split('@')[0]
    }));
    setShowApplicantDropdown(false);
    console.log('✅ Selected applicant:', applicant.name, applicant.email);
  };

  // Helper function to set quick schedule times
  const setQuickSchedule = (minutes: number) => {
    const now = new Date();
    const scheduled = new Date(now.getTime() + minutes * 60000);

    // Format date as YYYY-MM-DD
    const dateStr = scheduled.toISOString().split('T')[0];

    // Format time as HH:MM (rounded to nearest 15 minutes)
    const roundedMinutes = Math.ceil(scheduled.getMinutes() / 15) * 15;
    scheduled.setMinutes(roundedMinutes);
    scheduled.setSeconds(0);

    const hours = scheduled.getHours().toString().padStart(2, '0');
    const mins = scheduled.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    setScheduledDate(dateStr);
    setScheduledTime(timeStr);
    setIsScheduled(true);
  };

  // Get relative time string
  const getRelativeTime = (dateStr: string, timeStr: string): string => {
    if (!dateStr || !timeStr) return '';

    const scheduled = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) {
      return `(${diffMins}분 후)`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `(${hours}시간 ${mins}분 후)` : `(${hours}시간 후)`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `(${days}일 후)`;
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add empty cells for alignment
    const startDayOfWeek = getDay(start);
    const emptyDays = Array(startDayOfWeek).fill(null);

    return [...emptyDays, ...days];
  };


  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setScheduledDate(format(date, 'yyyy-MM-dd'));
    setShowCalendar(false);
  };


  // Format display date
  const getDisplayDate = () => {
    if (!scheduledDate) return '날짜를 선택하세요';
    const date = new Date(scheduledDate);
    return format(date, 'M월 d일 (EEEE)', { locale: ko });
  };


  const [questionData, setQuestionData] = useState({
    question: '',
    userName: '',
    currentDay: 1,
    totalDays: 20
  });

  const [challengeStartDate, setChallengeStartDate] = useState('');

  const [purchaseConfirmationData, setPurchaseConfirmationData] = useState({
    confirmDate: '',
    startDate: '',
    endDate: ''
  });

  const [answerGuideData, setAnswerGuideData] = useState({
    question: '',
    analysis: '',
    keywords: [''],
    starStructure: {
      situation: '',
      task: '',
      action: '',
      result: ''
    },
    personaAnswers: {
      bigTech: '',
      unicorn: ''
    },
    followUpQuestions: ['']
  });

  const handleSend = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    // Validate scheduled date/time if scheduling is enabled
    let scheduledAt: string | undefined;
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        setEmailError('예약 날짜와 시간을 모두 선택해주세요.');
        return;
      }

      // Parse as KST time
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();

      if (scheduledDateTime <= now) {
        setEmailError('예약 시간은 현재 시간 이후여야 합니다.');
        return;
      }

      // Convert to ISO string (will be handled as KST on server)
      // Add timezone information comment for clarity
      scheduledAt = scheduledDateTime.toISOString(); // Note: Server should interpret this as KST
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      if (emailModalType === 'question') {
        if (!questionData.question) {
          setEmailError('질문은 필수 항목입니다.');
          setSendingEmail(false);
          return;
        }

        await emailService.sendQueryDailyQuestion(
          recipientEmail,
          questionData.question,
          questionData.userName || recipientEmail.split('@')[0],
          questionData.currentDay,
          questionData.totalDays,
          undefined, // dayIntroMessage - emailService에서 자동 설정
          undefined, // dayMotivationMessage - emailService에서 자동 설정
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 발송 예약되었습니다.`
          : `${recipientEmail}로 질문을 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'answerGuide') {
        if (!answerGuideData.question || !answerGuideData.analysis) {
          setEmailError('질문과 질문 해부는 필수 항목입니다.');
          setSendingEmail(false);
          return;
        }

        await emailService.sendQueryDailyAnswerGuide(
          recipientEmail,
          answerGuideData.question,
          answerGuideData.analysis,
          answerGuideData.keywords.filter(k => k),
          answerGuideData.starStructure,
          answerGuideData.personaAnswers,
          answerGuideData.followUpQuestions.filter(q => q),
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 발송 예약되었습니다.`
          : `${recipientEmail}로 답변 가이드를 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'welcome') {
        await emailService.sendQueryDailyChallengeWelcome(
          recipientEmail,
          questionData.userName || recipientEmail.split('@')[0],
          challengeStartDate,
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 환영 메일 발송 예약되었습니다.`
          : `${recipientEmail}로 환영 메일을 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'midFeedback') {
        await emailService.sendQueryDailyChallengeMidFeedback(
          recipientEmail,
          questionData.userName || recipientEmail.split('@')[0],
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 중간 피드백 메일 발송 예약되었습니다.`
          : `${recipientEmail}로 중간 피드백 메일을 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'complete') {
        await emailService.sendQueryDailyChallengeComplete(
          recipientEmail,
          questionData.userName || recipientEmail.split('@')[0],
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 완료 메일 발송 예약되었습니다.`
          : `${recipientEmail}로 완료 메일을 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'purchaseConfirmation') {
        if (!purchaseConfirmationData.confirmDate || !purchaseConfirmationData.startDate || !purchaseConfirmationData.endDate) {
          setEmailError('모든 필수 항목을 입력해주세요.');
          setSendingEmail(false);
          return;
        }

        await emailService.sendGrowthPlanPurchaseConfirmation(
          recipientEmail,
          questionData.userName || recipientEmail.split('@')[0],
          purchaseConfirmationData.confirmDate,
          purchaseConfirmationData.startDate,
          purchaseConfirmationData.endDate,
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 그로스 플랜 구매 확인 메일 발송 예약되었습니다.`
          : `${recipientEmail}로 그로스 플랜 구매 확인 메일을 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'growthPlanQuestion') {
        if (!questionData.question) {
          setEmailError('질문은 필수 항목입니다.');
          setSendingEmail(false);
          return;
        }

        await emailService.sendGrowthPlanQuestion(
          recipientEmail,
          questionData.question,
          questionData.userName || recipientEmail.split('@')[0],
          questionData.currentDay,
          20, // totalDays: Growth Plan is 20 days
          undefined,
          undefined,
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 그로스 플랜 질문 발송 예약되었습니다.`
          : `${recipientEmail}로 그로스 플랜 질문을 발송했습니다.`;
        setEmailSuccess(successMessage);
      } else if (emailModalType === 'growthPlanAnswerGuide') {
        if (!answerGuideData.question || !answerGuideData.analysis) {
          setEmailError('질문과 질문 해부는 필수 항목입니다.');
          setSendingEmail(false);
          return;
        }

        await emailService.sendGrowthPlanAnswerGuide(
          recipientEmail,
          answerGuideData.question,
          answerGuideData.analysis,
          answerGuideData.keywords.filter(k => k),
          answerGuideData.starStructure,
          answerGuideData.personaAnswers,
          answerGuideData.followUpQuestions.filter(q => q),
          scheduledAt
        );
        const successMessage = isScheduled
          ? `${recipientEmail}로 ${scheduledDate} ${scheduledTime} ${getRelativeTime(scheduledDate, scheduledTime)} KST에 그로스 플랜 답변 가이드 발송 예약되었습니다.`
          : `${recipientEmail}로 그로스 플랜 답변 가이드를 발송했습니다.`;
        setEmailSuccess(successMessage);
      }

      // Clear form data only on success
      setRecipientEmail('');
      setQuestionData({
        question: '',
        userName: '',
        currentDay: 1,
        totalDays: 20
      });
      setAnswerGuideData({
        question: '',
        analysis: '',
        keywords: [''],
        starStructure: {
          situation: '',
          task: '',
          action: '',
          result: ''
        },
        personaAnswers: {
          bigTech: '',
          unicorn: ''
        },
        followUpQuestions: ['']
      });

      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('🔥 Email send error in component:', error);

      // Check if it's a notification disabled error (422)
      if (error.response?.status === 422 && error.response?.data?.error === 'Notification Disabled') {
        const userId = error.response.data.userId;
        setEmailError(`❌ ${userId}님이 이메일 알림을 비활성화했습니다. 해당 사용자는 이메일을 받지 않도록 설정했습니다.`);
      } else if (error.response?.data?.message) {
        // Use server's error message if available
        setEmailError(error.response.data.message);
      } else {
        // Fallback to generic error
        setEmailError(`이메일 발송 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSendingEmail(false);
    }
  };

  if (!showEmailModal) return null;

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h3>
            {emailModalType === 'question' ? 'QueryDaily 질문 발송' :
             emailModalType === 'answerGuide' ? 'QueryDaily 답변 가이드 발송' :
             emailModalType === 'welcome' ? 'QueryDaily 환영 메일 발송' :
             emailModalType === 'midFeedback' ? 'QueryDaily 중간 피드백 메일 발송' :
             emailModalType === 'complete' ? 'QueryDaily 완료 메일 발송' :
             emailModalType === 'purchaseConfirmation' ? '그로스 플랜 구매 확인 메일 발송' :
             emailModalType === 'growthPlanQuestion' ? '그로스 플랜 질문 발송' :
             emailModalType === 'growthPlanAnswerGuide' ? '그로스 플랜 답변 가이드 발송' : 'QueryDaily 메일 발송'}
          </h3>
          <CloseButton onClick={() => {
            setShowEmailModal(false);
            setEmailError(null);
            setEmailSuccess(null);
          }}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label>신청자 선택 (선택사항)</Label>
            <ApplicantDropdownWrapper className="applicant-dropdown-wrapper">
              <ApplicantSelectButton
                onClick={() => setShowApplicantDropdown(!showApplicantDropdown)}
                $hasSelection={!!selectedApplicantId}
              >
                {selectedApplicantId
                  ? applicants.find(a => String(a.id) === selectedApplicantId)?.name || '선택된 신청자'
                  : '신청자 목록에서 선택하기'}
                <DropdownArrow>▼</DropdownArrow>
              </ApplicantSelectButton>

              {showApplicantDropdown && (
                <ApplicantDropdown>
                  {applicants.length === 0 ? (
                    <ApplicantOption disabled>신청자가 없습니다</ApplicantOption>
                  ) : (
                    <>
                      <ApplicantOption
                        onClick={() => {
                          setSelectedApplicantId('');
                          setRecipientEmail('');
                          setQuestionData(prev => ({ ...prev, userName: '' }));
                          setShowApplicantDropdown(false);
                        }}
                        className="clear-option"
                      >
                        선택 해제
                      </ApplicantOption>
                      {applicants.map(applicant => (
                        <ApplicantOption
                          key={applicant.id}
                          onClick={() => handleApplicantSelect(applicant)}
                          selected={String(applicant.id) === selectedApplicantId}
                        >
                          <ApplicantName>{applicant.name}</ApplicantName>
                          <ApplicantEmail>{applicant.email}</ApplicantEmail>
                        </ApplicantOption>
                      ))}
                    </>
                  )}
                </ApplicantDropdown>
              )}
            </ApplicantDropdownWrapper>
            {selectedApplicantId && (
              <SelectedInfo>
                ✅ {applicants.find(a => String(a.id) === selectedApplicantId)?.name} ({applicants.find(a => String(a.id) === selectedApplicantId)?.email}) 선택됨
              </SelectedInfo>
            )}
          </FormGroup>

          <FormGroup>
            <Label>받는 사람 이메일 *</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={!!selectedApplicantId}
            />
            {selectedApplicantId && (
              <HelperText>신청자를 선택하면 이메일이 자동으로 입력됩니다</HelperText>
            )}
          </FormGroup>

          <FormGroup>
            <Label>발송 방식</Label>
            <ScheduleToggle>
              <ToggleOption selected={!isScheduled} onClick={() => setIsScheduled(false)}>
                <input
                  type="radio"
                  checked={!isScheduled}
                  onChange={() => setIsScheduled(false)}
                />
                <span>즉시 발송</span>
              </ToggleOption>
              <ToggleOption selected={isScheduled} onClick={() => setIsScheduled(true)}>
                <input
                  type="radio"
                  checked={isScheduled}
                  onChange={() => setIsScheduled(true)}
                />
                <span>예약 발송</span>
              </ToggleOption>
            </ScheduleToggle>
          </FormGroup>

          {isScheduled && (
            <>
              <FormGroup>
                <Label>빠른 선택</Label>
                <QuickSelectButtons>
                  <QuickButton onClick={() => setQuickSchedule(60)}>1시간 후</QuickButton>
                  <QuickButton onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(7, 0, 0, 0);
                    const now = new Date();
                    const diffMinutes = Math.floor((tomorrow.getTime() - now.getTime()) / 60000);
                    setQuickSchedule(diffMinutes);
                  }}>내일 오전 7시</QuickButton>
                  <QuickButton onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(17, 0, 0, 0);
                    const now = new Date();
                    const diffMinutes = Math.floor((tomorrow.getTime() - now.getTime()) / 60000);
                    setQuickSchedule(diffMinutes);
                  }}>내일 오후 5시</QuickButton>
                </QuickSelectButtons>
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label>발송 날짜 * (KST)</Label>
                  <DatePickerWrapper className="date-picker-wrapper">
                    <DateDisplay onClick={() => setShowCalendar(!showCalendar)}>
                      <CalendarIcon>📅</CalendarIcon>
                      <span>{getDisplayDate()}</span>
                      {scheduledDate && <TimeInfo>{getRelativeTime(scheduledDate, scheduledTime)}</TimeInfo>}
                    </DateDisplay>

                    {showCalendar && (
                      <CalendarDropdown>
                        <CalendarHeader>
                          <NavButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>‹</NavButton>
                          <MonthTitle>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</MonthTitle>
                          <NavButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>›</NavButton>
                        </CalendarHeader>

                        <WeekDaysRow>
                          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                            <WeekDay key={day}>{day}</WeekDay>
                          ))}
                        </WeekDaysRow>

                        <DaysGrid>
                          {generateCalendarDays().map((day, index) => {
                            if (!day) return <EmptyDay key={`empty-${index}`} />;

                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isSelected = scheduledDate === dateStr;
                            const isPast = isBefore(day, startOfToday());
                            const isCurrentDay = isToday(day);

                            return (
                              <DayCell
                                key={dateStr}
                                onClick={() => !isPast && handleDateSelect(day)}
                                $isSelected={isSelected}
                                $isToday={isCurrentDay}
                                $isPast={isPast}
                                disabled={isPast}
                              >
                                {format(day, 'd')}
                              </DayCell>
                            );
                          })}
                        </DaysGrid>
                      </CalendarDropdown>
                    )}
                  </DatePickerWrapper>
                </FormGroup>

                <FormGroup>
                  <Label>발송 시간 * (KST)</Label>
                  <TimeInputWrapper>
                    <TimeInput
                      type="time"
                      value={scheduledTime || ''}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      placeholder="HH:MM"
                    />
                    <TimeHelperText>24시간 형식으로 입력 (예: 14:30)</TimeHelperText>
                  </TimeInputWrapper>
                </FormGroup>
              </FormRow>
            </>
          )}

          {(emailModalType === 'question' || emailModalType === 'growthPlanQuestion') && (
            <>
              <FormGroup>
                <Label>질문 *</Label>
                <Textarea
                  value={questionData.question}
                  onChange={e => setQuestionData({...questionData, question: e.target.value})}
                  placeholder="오늘의 면접 질문을 입력하세요"
                  rows={3}
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label>사용자 이름</Label>
                  <Input
                    value={questionData.userName}
                    onChange={e => setQuestionData({...questionData, userName: e.target.value})}
                    placeholder="홍길동 (기본: 이메일 앞부분)"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>현재 일차</Label>
                  <Input
                    type="number"
                    min="1"
                    value={questionData.currentDay}
                    onChange={e => setQuestionData({...questionData, currentDay: parseInt(e.target.value) || 1})}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label>전체 일차</Label>
                <Input
                  type="number"
                  min="1"
                  value={questionData.totalDays}
                  onChange={e => setQuestionData({...questionData, totalDays: parseInt(e.target.value) || 20})}
                />
              </FormGroup>
            </>
          )}

          {(emailModalType === 'welcome' || emailModalType === 'midFeedback' || emailModalType === 'complete') && (
            <FormGroup>
              <Label>사용자 이름</Label>
              <Input
                value={questionData.userName}
                onChange={e => setQuestionData({...questionData, userName: e.target.value})}
                placeholder="홍길동 (기본: 이메일 앞부분)"
              />
              <HelperText>
                {emailModalType === 'welcome' && '환영 메일에 표시될 사용자 이름입니다.'}
                {emailModalType === 'midFeedback' && '중간 피드백 메일에 표시될 사용자 이름입니다.'}
                {emailModalType === 'complete' && '완료 메일에 표시될 사용자 이름입니다.'}
              </HelperText>
            </FormGroup>
          )}

          {emailModalType === 'welcome' && (
            <FormGroup>
              <Label>챌린지 시작일</Label>
              <Input
                type="date"
                value={challengeStartDate}
                onChange={e => setChallengeStartDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <HelperText>
                챌린지가 시작될 날짜를 선택하세요. 비어있으면 "오늘부터"로 표시됩니다.
              </HelperText>
            </FormGroup>
          )}

          {(emailModalType === 'answerGuide' || emailModalType === 'growthPlanAnswerGuide') && (
            <>
              <FormGroup>
                <Label>질문 *</Label>
                <Textarea
                  value={answerGuideData.question}
                  onChange={e => setAnswerGuideData({...answerGuideData, question: e.target.value})}
                  placeholder="예: JWT를 사용한 인증 방식의 장단점은?"
                  rows={2}
                />
              </FormGroup>

              <FormGroup>
                <Label>질문 해부 *</Label>
                <Textarea
                  value={answerGuideData.analysis}
                  onChange={e => setAnswerGuideData({...answerGuideData, analysis: e.target.value})}
                  placeholder="이 질문은 '트레이드오프형' 질문으로..."
                  rows={3}
                />
              </FormGroup>

              <FormGroup>
                <Label>핵심 키워드</Label>
                {answerGuideData.keywords.map((keyword, index) => (
                  <div key={`keyword-${index}-${keyword}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Input
                      value={keyword}
                      onChange={e => {
                        const newKeywords = [...answerGuideData.keywords];
                        newKeywords[index] = e.target.value;
                        setAnswerGuideData({...answerGuideData, keywords: newKeywords});
                      }}
                      placeholder="키워드 입력"
                    />
                    {answerGuideData.keywords.length > 1 && (
                      <ActionButton onClick={() => {
                        const newKeywords = answerGuideData.keywords.filter((_, i) => i !== index);
                        setAnswerGuideData({...answerGuideData, keywords: newKeywords});
                      }}>삭제</ActionButton>
                    )}
                  </div>
                ))}
                <ActionButton onClick={() => setAnswerGuideData({...answerGuideData, keywords: [...answerGuideData.keywords, '']})}>
                  + 키워드 추가
                </ActionButton>
              </FormGroup>

              <FormGroup>
                <Label>STAR 구조</Label>
                <Input
                  value={answerGuideData.starStructure.situation}
                  onChange={e => setAnswerGuideData({
                    ...answerGuideData,
                    starStructure: {...answerGuideData.starStructure, situation: e.target.value}
                  })}
                  placeholder="Situation: 상황 설명"
                  style={{ marginBottom: '8px' }}
                />
                <Input
                  value={answerGuideData.starStructure.task}
                  onChange={e => setAnswerGuideData({
                    ...answerGuideData,
                    starStructure: {...answerGuideData.starStructure, task: e.target.value}
                  })}
                  placeholder="Task: 과제 설명"
                  style={{ marginBottom: '8px' }}
                />
                <Input
                  value={answerGuideData.starStructure.action}
                  onChange={e => setAnswerGuideData({
                    ...answerGuideData,
                    starStructure: {...answerGuideData.starStructure, action: e.target.value}
                  })}
                  placeholder="Action: 행동 설명"
                  style={{ marginBottom: '8px' }}
                />
                <Input
                  value={answerGuideData.starStructure.result}
                  onChange={e => setAnswerGuideData({
                    ...answerGuideData,
                    starStructure: {...answerGuideData.starStructure, result: e.target.value}
                  })}
                  placeholder="Result: 결과 설명"
                />
              </FormGroup>

              <FormGroup>
                <Label>페르소나별 답변</Label>
                <Textarea
                  value={answerGuideData.personaAnswers.bigTech}
                  onChange={e => setAnswerGuideData({
                    ...answerGuideData,
                    personaAnswers: {...answerGuideData.personaAnswers, bigTech: e.target.value}
                  })}
                  placeholder="빅테크 지원자 답변 예시"
                  rows={2}
                  style={{ marginBottom: '8px' }}
                />
                <Textarea
                  value={answerGuideData.personaAnswers.unicorn}
                  onChange={e => setAnswerGuideData({
                    ...answerGuideData,
                    personaAnswers: {...answerGuideData.personaAnswers, unicorn: e.target.value}
                  })}
                  placeholder="유니콘 지원자 답변 예시"
                  rows={2}
                />
              </FormGroup>

              <FormGroup>
                <Label>예상 꼬리 질문</Label>
                {answerGuideData.followUpQuestions.map((question, index) => (
                  <div key={`question-${index}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Textarea
                      value={question}
                      onChange={e => {
                        const newQuestions = [...answerGuideData.followUpQuestions];
                        newQuestions[index] = e.target.value;
                        setAnswerGuideData({...answerGuideData, followUpQuestions: newQuestions});
                      }}
                      placeholder="예상 꼬리 질문 (예: 그 기술을 선택한 이유가 무엇인가요?)"
                      rows={2}
                    />
                    {answerGuideData.followUpQuestions.length > 1 && (
                      <ActionButton onClick={() => {
                        const newQuestions = answerGuideData.followUpQuestions.filter((_, i) => i !== index);
                        setAnswerGuideData({...answerGuideData, followUpQuestions: newQuestions});
                      }}>삭제</ActionButton>
                    )}
                  </div>
                ))}
                <ActionButton onClick={() => setAnswerGuideData({...answerGuideData, followUpQuestions: [...answerGuideData.followUpQuestions, '']})}>
                  + 질문 추가
                </ActionButton>
              </FormGroup>
            </>
          )}

          {emailModalType === 'purchaseConfirmation' && (
            <>
              <FormGroup>
                <Label>사용자 이름</Label>
                <Input
                  value={questionData.userName}
                  onChange={e => setQuestionData({...questionData, userName: e.target.value})}
                  placeholder="홍길동 (기본: 이메일 앞부분)"
                />
                <HelperText>구매 확인 메일에 표시될 사용자 이름입니다.</HelperText>
              </FormGroup>

              <FormGroup>
                <Label>입금 확인일 *</Label>
                <Input
                  value={purchaseConfirmationData.confirmDate}
                  onChange={e => setPurchaseConfirmationData({...purchaseConfirmationData, confirmDate: e.target.value})}
                  placeholder="2025년 10월 3일"
                />
                <HelperText>입금을 확인한 날짜를 입력하세요 (예: 2025년 10월 3일)</HelperText>
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label>서비스 시작일 *</Label>
                  <Input
                    value={purchaseConfirmationData.startDate}
                    onChange={e => setPurchaseConfirmationData({...purchaseConfirmationData, startDate: e.target.value})}
                    placeholder="2025년 10월 4일 (금)"
                  />
                  <HelperText>첫 발송일 (예: 2025년 10월 4일 (금))</HelperText>
                </FormGroup>

                <FormGroup>
                  <Label>서비스 종료일 *</Label>
                  <Input
                    value={purchaseConfirmationData.endDate}
                    onChange={e => setPurchaseConfirmationData({...purchaseConfirmationData, endDate: e.target.value})}
                    placeholder="2025년 10월 23일 (수)"
                  />
                  <HelperText>마지막 발송일 (예: 2025년 10월 23일 (수))</HelperText>
                </FormGroup>
              </FormRow>
            </>
          )}

          {emailError && <ErrorMessage>{emailError}</ErrorMessage>}
          {emailSuccess && <SuccessMessage>{emailSuccess}</SuccessMessage>}
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={() => {
            setShowEmailModal(false);
            setEmailError(null);
            setEmailSuccess(null);
          }} disabled={sendingEmail}>
            취소
          </CancelButton>
          <SaveButton onClick={handleSend} disabled={sendingEmail}>
            {sendingEmail ? '발송 중...' : '발송하기'}
          </SaveButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

// Styled Components
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

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 700px;
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
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 4px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
  margin-top: 16px;
`;

const SuccessMessage = styled.div`
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
  color: #16a34a;
  font-size: 14px;
  margin-top: 16px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  background: white;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ScheduleToggle = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
`;

const ToggleOption = styled.label<{ selected: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid ${({ theme, selected }) =>
    selected ? theme.colors.primary : theme.colors.gray[300]};
  border-radius: 6px;
  background: ${({ selected }) => selected ? 'rgba(99, 102, 241, 0.05)' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  input[type="radio"] {
    margin: 0;
  }

  span {
    font-size: 14px;
    font-weight: ${({ selected }) => selected ? '500' : '400'};
    color: ${({ theme, selected }) => selected ? theme.colors.primary : theme.colors.text.primary};
  }
`;

const QuickSelectButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const QuickButton = styled.button`
  padding: 10px 18px;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 10px;
  background: white;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    background: ${({ theme }) => theme.colors.primary};
    transition: width 0.3s ease;
    z-index: -1;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary}20;

    &::before {
      width: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const DatePickerWrapper = styled.div`
  position: relative;
`;


const TimeInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TimeInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TimeHelperText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  span {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text.primary};
    flex: 1;
  }
`;

const CalendarIcon = styled.span`
  font-size: 16px;
`;

const TimeInfo = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 12px;
  font-weight: 500;
`;

const CalendarDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 320px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  padding: 16px;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const NavButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const MonthTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const WeekDaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 4px;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const EmptyDay = styled.div``;

const DayCell = styled.button<{ $isSelected: boolean; $isToday: boolean; $isPast: boolean }>`
  aspect-ratio: 1;
  border: none;
  border-radius: 8px;
  background: ${({ $isSelected, $isToday, theme }) =>
    $isSelected ? theme.colors.primary : $isToday ? theme.colors.gray[100] : 'white'};
  color: ${({ $isSelected, $isPast, theme }) =>
    $isSelected ? 'white' : $isPast ? theme.colors.text.tertiary : theme.colors.text.primary};
  cursor: ${({ $isPast }) => ($isPast ? 'not-allowed' : 'pointer')};
  font-size: 14px;
  font-weight: ${({ $isToday }) => ($isToday ? '600' : '400')};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primaryDark : theme.colors.gray[100]};
  }
`;

// Applicant Dropdown Styled Components
const ApplicantDropdownWrapper = styled.div`
  position: relative;
`;

const ApplicantSelectButton = styled.button<{ $hasSelection: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${({ theme, $hasSelection }) =>
    $hasSelection ? theme.colors.primary : theme.colors.gray[300]};
  border-radius: 8px;
  background: ${({ $hasSelection }) => $hasSelection ? 'rgba(99, 102, 241, 0.05)' : 'white'};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 14px;
  font-weight: ${({ $hasSelection }) => $hasSelection ? '500' : '400'};
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ $hasSelection }) => $hasSelection ? 'rgba(99, 102, 241, 0.08)' : '#f9fafb'};
  }
`;

const DropdownArrow = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 12px;
  transition: transform 0.2s;
`;

const ApplicantDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const ApplicantOption = styled.div<{ selected?: boolean; disabled?: boolean }>`
  padding: 12px 16px;
  background: ${({ selected }) => selected ? 'rgba(99, 102, 241, 0.1)' : 'white'};
  cursor: ${({ disabled }) => disabled ? 'default' : 'pointer'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: background 0.2s;
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ disabled, selected }) =>
      disabled ? 'white' : selected ? 'rgba(99, 102, 241, 0.15)' : '#f9fafb'};
  }

  &.clear-option {
    background: #fef2f2;
    color: #dc2626;
    font-weight: 500;

    &:hover {
      background: #fee2e2;
    }
  }
`;

const ApplicantName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const ApplicantEmail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SelectedInfo = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
  color: #16a34a;
  font-size: 13px;
`;

const HelperText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;