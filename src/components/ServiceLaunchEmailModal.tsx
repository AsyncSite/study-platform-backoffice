import { useState, memo, useEffect } from 'react';
import styled from 'styled-components';
import emailService from '../services/emailService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay, isBefore, startOfToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ServiceLaunchEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceLaunchEmailModal = memo(({
  isOpen,
  onClose
}: ServiceLaunchEmailModalProps) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper function to get current KST time
  const getKSTDate = (date: Date = new Date()): Date => {
    const utcTime = date.getTime();
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(utcTime + kstOffset);
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setRecipientEmail('');
      setUserName('');
      setEmailError(null);
      setEmailSuccess(null);
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
      setShowCalendar(false);
    }
  }, [isOpen]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.date-picker-wrapper')) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCalendar]);

  const handleScheduleModeChange = (mode: 'immediate' | 'scheduled') => {
    setIsScheduled(mode === 'scheduled');
    setScheduledDate('');
    setScheduledTime('');
  };

  const handleQuickSchedule = (type: 'hour' | 'tomorrow7' | 'tomorrow17') => {
    const now = getKSTDate();
    let targetDate: Date;

    if (type === 'hour') {
      targetDate = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (type === 'tomorrow7') {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(7, 0, 0, 0);
    } else {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(17, 0, 0, 0);
    }

    setScheduledDate(format(targetDate, 'yyyy-MM-dd'));
    setScheduledTime(format(targetDate, 'HH:mm'));
    console.log('📅 Quick schedule set:', format(targetDate, 'yyyy-MM-dd HH:mm'));
  };

  const handleCalendarDateSelect = (day: Date) => {
    setScheduledDate(format(day, 'yyyy-MM-dd'));
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);
    const today = startOfToday();

    return (
      <CalendarContainer className="date-picker-wrapper">
        <CalendarHeader>
          <MonthNavButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ←
          </MonthNavButton>
          <MonthTitle>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</MonthTitle>
          <MonthNavButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            →
          </MonthNavButton>
        </CalendarHeader>

        <CalendarGrid>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <DayHeader key={day}>{day}</DayHeader>
          ))}

          {Array.from({ length: startDay }).map((_, i) => (
            <EmptyDay key={`empty-${i}`} />
          ))}

          {days.map(day => {
            const isPast = isBefore(day, today);
            return (
              <DayCell
                key={day.toString()}
                $isToday={isToday(day)}
                $isPast={isPast}
                $isSelected={scheduledDate === format(day, 'yyyy-MM-dd')}
                onClick={() => !isPast && handleCalendarDateSelect(day)}
              >
                {format(day, 'd')}
              </DayCell>
            );
          })}
        </CalendarGrid>
      </CalendarContainer>
    );
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      setEmailError(null);
      setEmailSuccess(null);

      // Validation
      if (!recipientEmail || !userName) {
        setEmailError('수신자 이메일과 이름을 입력해주세요.');
        return;
      }

      if (isScheduled && (!scheduledDate || !scheduledTime)) {
        setEmailError('예약 날짜와 시간을 설정해주세요.');
        return;
      }

      let scheduledAt: string | undefined;
      if (isScheduled && scheduledDate && scheduledTime) {
        // KST 타임존을 명시적으로 지정 (+09:00)
        const kstDateTimeStr = `${scheduledDate}T${scheduledTime}:00+09:00`;
        const kstDateTime = new Date(kstDateTimeStr);
        scheduledAt = kstDateTime.toISOString(); // 자동으로 UTC로 변환됨

        console.log('📅 Scheduled send:', {
          kstInput: `${scheduledDate} ${scheduledTime} (KST)`,
          kstDateTime: kstDateTimeStr,
          utcResult: scheduledAt,
          parsedDate: kstDateTime.toString()
        });
      }

      await emailService.sendServiceLaunchEmail(
        recipientEmail,
        userName,
        scheduledAt
      );

      const successMsg = isScheduled
        ? `${userName}님께 ${scheduledDate} ${scheduledTime}에 발송 예약되었습니다!`
        : `${userName}님께 서비스 오픈 안내 메일을 발송했습니다!`;

      setEmailSuccess(successMsg);
      console.log('✅', successMsg);

      // Reset form after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Failed to send service launch email:', error);
      setEmailError(error.response?.data?.message || '이메일 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>🚀 서비스 오픈 안내 메일 발송</ModalTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* 수신자 정보 */}
          <FormSection>
            <SectionTitle>📧 수신자 정보</SectionTitle>

            <FormGroup>
              <Label>이메일 *</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </FormGroup>

            <FormGroup>
              <Label>이름 *</Label>
              <Input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="홍길동"
              />
            </FormGroup>
          </FormSection>

          {/* 발송 타이밍 */}
          <FormSection>
            <SectionTitle>⏰ 발송 타이밍</SectionTitle>

            <DeliveryModeSelector>
              <ModeButton
                $active={!isScheduled}
                onClick={() => handleScheduleModeChange('immediate')}
              >
                즉시 발송
              </ModeButton>
              <ModeButton
                $active={isScheduled}
                onClick={() => handleScheduleModeChange('scheduled')}
              >
                예약 발송
              </ModeButton>
            </DeliveryModeSelector>

            {isScheduled && (
              <ScheduleSection>
                <QuickScheduleButtons>
                  <QuickButton onClick={() => handleQuickSchedule('hour')}>
                    1시간 후
                  </QuickButton>
                  <QuickButton onClick={() => handleQuickSchedule('tomorrow7')}>
                    내일 오전 7시
                  </QuickButton>
                  <QuickButton onClick={() => handleQuickSchedule('tomorrow17')}>
                    내일 오후 5시
                  </QuickButton>
                </QuickScheduleButtons>

                <FormGroup>
                  <Label>날짜 선택</Label>
                  <DateInput
                    type="text"
                    value={scheduledDate}
                    placeholder="날짜 선택"
                    onClick={() => setShowCalendar(!showCalendar)}
                    readOnly
                  />
                  {showCalendar && renderCalendar()}
                </FormGroup>

                <FormGroup>
                  <Label>시간 선택 (KST)</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </FormGroup>
              </ScheduleSection>
            )}
          </FormSection>

          {/* 에러/성공 메시지 */}
          {emailError && <ErrorMessage>{emailError}</ErrorMessage>}
          {emailSuccess && <SuccessMessage>{emailSuccess}</SuccessMessage>}
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>취소</CancelButton>
          <SendButton
            onClick={handleSendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? '발송 중...' : isScheduled ? '예약하기' : '발송하기'}
          </SendButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
});

ServiceLaunchEmailModal.displayName = 'ServiceLaunchEmailModal';

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background-color: #f8f9fa;
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const FormSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const DateInput = styled(Input)`
  cursor: pointer;
`;

const DeliveryModeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid ${props => props.$active ? '#0066CC' : '#ddd'};
  background-color: ${props => props.$active ? '#0066CC' : 'white'};
  color: ${props => props.$active ? 'white' : '#666'};
  border-radius: 6px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$active ? '#0052A3' : '#f8f9fa'};
  }
`;

const ScheduleSection = styled.div`
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
`;

const QuickScheduleButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const QuickButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  background-color: white;
  color: #666;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
`;

const CalendarContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  width: 320px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MonthNavButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const MonthTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DayHeader = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 8px 0;
`;

const EmptyDay = styled.div``;

const DayCell = styled.div<{ $isToday: boolean; $isPast: boolean; $isSelected: boolean }>`
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  border-radius: 4px;
  cursor: ${props => props.$isPast ? 'not-allowed' : 'pointer'};
  background-color: ${props => {
    if (props.$isSelected) return '#0066CC';
    if (props.$isToday) return '#E3F2FD';
    return 'transparent';
  }};
  color: ${props => {
    if (props.$isSelected) return 'white';
    if (props.$isPast) return '#ccc';
    return '#333';
  }};
  font-weight: ${props => props.$isToday ? '600' : '400'};

  &:hover {
    background-color: ${props => {
      if (props.$isPast) return 'transparent';
      if (props.$isSelected) return '#0052A3';
      return '#f8f9fa';
    }};
  }
`;

const ErrorMessage = styled.div`
  background-color: #FFF3E0;
  border-left: 4px solid #FF9800;
  color: #E65100;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 16px;
`;

const SuccessMessage = styled.div`
  background-color: #E8F5E9;
  border-left: 4px solid #4CAF50;
  color: #2E7D32;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 16px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
`;

const CancelButton = styled.button`
  padding: 10px 24px;
  border: 1px solid #ddd;
  background-color: white;
  color: #666;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const SendButton = styled.button`
  padding: 10px 24px;
  border: none;
  background: linear-gradient(135deg, #0066CC 0%, #004999 100%);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0052A3 0%, #003770 100%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
