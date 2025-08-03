import React from 'react';
import styled from 'styled-components';
import { 
  DayOfWeek, 
  ScheduleFrequency, 
  dayToKorean,
  frequencyToKorean,
  formatScheduleToKorean
} from '../../types/schedule';
import type { ScheduleData } from '../../types/schedule';

interface ScheduleInputProps {
  value: ScheduleData;
  onChange: (schedule: ScheduleData) => void;
  error?: string;
}

const ScheduleInput: React.FC<ScheduleInputProps> = ({ value, onChange, error }) => {
  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = value.daysOfWeek.includes(day)
      ? value.daysOfWeek.filter(d => d !== day)
      : [...value.daysOfWeek, day];
    
    onChange({ ...value, daysOfWeek: newDays });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', time: string) => {
    onChange({ ...value, [field]: time });
  };

  const handleFrequencyChange = (frequency: ScheduleFrequency) => {
    onChange({ ...value, frequency });
  };

  // 요일 순서대로 정렬
  const orderedDays = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
  ];

  return (
    <Container>
      {/* 요일 선택 */}
      <Section>
        <SectionTitle>요일 선택</SectionTitle>
        <DayGrid>
          {orderedDays.map((day) => (
            <DayButton
              key={day}
              type="button"
              $selected={value.daysOfWeek.includes(day)}
              onClick={() => handleDayToggle(day)}
            >
              {dayToKorean(day)}
            </DayButton>
          ))}
        </DayGrid>
      </Section>

      {/* 시간 선택 */}
      <Section>
        <SectionTitle>시간 설정</SectionTitle>
        <TimeRow>
          <TimeGroup>
            <TimeLabel>시작 시간</TimeLabel>
            <TimeInput
              type="time"
              value={value.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
            />
          </TimeGroup>
          <TimeSeparator>~</TimeSeparator>
          <TimeGroup>
            <TimeLabel>종료 시간</TimeLabel>
            <TimeInput
              type="time"
              value={value.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
            />
          </TimeGroup>
        </TimeRow>
      </Section>

      {/* 반복 주기 */}
      <Section>
        <SectionTitle>반복 주기</SectionTitle>
        <FrequencyGrid>
          {Object.values(ScheduleFrequency).map((freq) => (
            <FrequencyButton
              key={freq}
              type="button"
              $selected={value.frequency === freq}
              onClick={() => handleFrequencyChange(freq)}
            >
              {frequencyToKorean(freq)}
            </FrequencyButton>
          ))}
        </FrequencyGrid>
      </Section>

      {/* 미리보기 */}
      <Preview>
        <PreviewLabel>일정 미리보기</PreviewLabel>
        <PreviewText>
          {value.daysOfWeek.length > 0 && value.startTime && value.endTime
            ? formatScheduleToKorean(value)
            : '요일과 시간을 선택해주세요'}
        </PreviewText>
      </Preview>

      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 12px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
`;

const DayButton = styled.button<{ $selected: boolean }>`
  padding: 8px;
  border: 2px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.primary : theme.colors.gray[300]};
  background: ${({ $selected, theme }) => 
    $selected ? theme.colors.primary : 'white'};
  color: ${({ $selected, theme }) => 
    $selected ? 'white' : theme.colors.text.primary};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TimeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const TimeLabel = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TimeInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TimeSeparator = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 20px;
`;

const FrequencyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const FrequencyButton = styled.button<{ $selected: boolean }>`
  padding: 10px 16px;
  border: 2px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.primary : theme.colors.gray[300]};
  background: ${({ $selected, theme }) => 
    $selected ? theme.colors.primary : 'white'};
  color: ${({ $selected, theme }) => 
    $selected ? 'white' : theme.colors.text.primary};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const Preview = styled.div`
  padding: 16px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 8px;
`;

const PreviewLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const PreviewText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 12px;
  margin-top: 4px;
`;

export default ScheduleInput;