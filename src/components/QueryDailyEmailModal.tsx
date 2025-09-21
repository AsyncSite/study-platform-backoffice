import React, { useState, memo } from 'react';
import styled from 'styled-components';
import emailService from '../services/emailService';

interface EmailSendModalProps {
  showEmailModal: boolean;
  setShowEmailModal: (show: boolean) => void;
  emailModalType: 'question' | 'answerGuide';
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

  const [questionData, setQuestionData] = useState({
    question: '',
    hint: '',
    userName: '',
    currentDay: 1,
    totalDays: 3,
    tomorrowTopic: ''
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

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      if (emailModalType === 'question') {
        if (!questionData.question || !questionData.hint) {
          setEmailError('질문과 힌트는 필수 항목입니다.');
          setSendingEmail(false);
          return;
        }

        await emailService.sendQueryDailyQuestion(
          recipientEmail,
          questionData.question,
          questionData.hint,
          questionData.userName || recipientEmail.split('@')[0],
          questionData.currentDay,
          questionData.totalDays,
          questionData.tomorrowTopic || '다음 주제'
        );
        setEmailSuccess(`${recipientEmail}로 질문을 발송했습니다.`);
      } else {
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
          answerGuideData.followUpQuestions.filter(q => q)
        );
        setEmailSuccess(`${recipientEmail}로 답변 가이드를 발송했습니다.`);
      }

      // Clear form data only on success
      setRecipientEmail('');
      setQuestionData({
        question: '',
        hint: '',
        userName: '',
        currentDay: 1,
        totalDays: 3,
        tomorrowTopic: ''
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
      setEmailError(`이메일 발송 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  if (!showEmailModal) return null;

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h3>{emailModalType === 'question' ? 'QueryDaily 질문 발송' : 'QueryDaily 답변 가이드 발송'}</h3>
          <CloseButton onClick={() => {
            setShowEmailModal(false);
            setEmailError(null);
            setEmailSuccess(null);
          }}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label>받는 사람 이메일 *</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </FormGroup>

          {emailModalType === 'question' && (
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

              <FormGroup>
                <Label>힌트 *</Label>
                <Textarea
                  value={questionData.hint}
                  onChange={e => setQuestionData({...questionData, hint: e.target.value})}
                  placeholder="답변 작성에 도움이 될 힌트를 입력하세요"
                  rows={2}
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
                    max="3"
                    value={questionData.currentDay}
                    onChange={e => setQuestionData({...questionData, currentDay: parseInt(e.target.value) || 1})}
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>전체 일차</Label>
                  <Input
                    type="number"
                    min="1"
                    value={questionData.totalDays}
                    onChange={e => setQuestionData({...questionData, totalDays: parseInt(e.target.value) || 3})}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>내일 주제</Label>
                  <Input
                    value={questionData.tomorrowTopic}
                    onChange={e => setQuestionData({...questionData, tomorrowTopic: e.target.value})}
                    placeholder="다음 주제 (선택사항)"
                  />
                </FormGroup>
              </FormRow>
            </>
          )}

          {emailModalType === 'answerGuide' && (
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
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Input
                      value={question}
                      onChange={e => {
                        const newQuestions = [...answerGuideData.followUpQuestions];
                        newQuestions[index] = e.target.value;
                        setAnswerGuideData({...answerGuideData, followUpQuestions: newQuestions});
                      }}
                      placeholder="예상 꼬리 질문"
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