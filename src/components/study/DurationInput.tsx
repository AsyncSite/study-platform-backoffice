import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { 
  DurationUnit, 
  durationUnitToKorean,
  formatDurationToKorean
} from '../../types/schedule';
import type { DurationData } from '../../types/schedule';

interface DurationInputProps {
  value: DurationData;
  onChange: (duration: DurationData) => void;
  startDate?: string;
  endDate?: string;
  error?: string;
}

const DurationInput: React.FC<DurationInputProps> = ({ 
  value, 
  onChange, 
  startDate, 
  endDate,
  error 
}) => {
  const [totalDays, setTotalDays] = useState<number | null>(null);

  // 시작일과 종료일이 있을 때 총 일수 계산
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      setTotalDays(diffDays);
    } else {
      setTotalDays(null);
    }
  }, [startDate, endDate]);

  const handleValueChange = (newValue: string) => {
    const numValue = parseInt(newValue) || 0;
    if (numValue >= 0) {
      onChange({ ...value, value: numValue });
    }
  };

  const handleUnitChange = (unit: DurationUnit) => {
    onChange({ ...value, unit });
  };

  // 추정 일수 계산
  const getEstimatedDays = (): number => {
    if (value.unit === DurationUnit.WEEKS) {
      return value.value * 7;
    } else if (value.unit === DurationUnit.MONTHS) {
      return value.value * 30; // 대략적인 계산
    }
    return 0;
  };

  return (
    <Container>
      <MainInput>
        <InputGroup>
          <NumberInput
            type="number"
            min="1"
            max={value.unit === DurationUnit.WEEKS ? 52 : 12}
            value={value.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="0"
          />
          <UnitButtonGroup>
            {Object.values(DurationUnit).map((unit) => (
              <UnitButton
                key={unit}
                type="button"
                $selected={value.unit === unit}
                onClick={() => handleUnitChange(unit)}
              >
                {durationUnitToKorean(unit)}
              </UnitButton>
            ))}
          </UnitButtonGroup>
        </InputGroup>
      </MainInput>

      {/* 추가 정보 */}
      <InfoSection>
        {value.value > 0 && (
          <InfoRow>
            <InfoLabel>기간 표시:</InfoLabel>
            <InfoValue>{formatDurationToKorean(value)}</InfoValue>
          </InfoRow>
        )}
        
        {value.value > 0 && !totalDays && (
          <InfoRow>
            <InfoLabel>예상 일수:</InfoLabel>
            <InfoValue>약 {getEstimatedDays()}일</InfoValue>
          </InfoRow>
        )}

        {totalDays && (
          <InfoRow>
            <InfoLabel>실제 일수:</InfoLabel>
            <InfoValue>{totalDays}일간 진행</InfoValue>
          </InfoRow>
        )}
      </InfoSection>

      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MainInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NumberInput = styled.input`
  width: 80px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

const UnitButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const UnitButton = styled.button<{ $selected: boolean }>`
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

const InfoSection = styled.div`
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InfoValue = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 12px;
  margin-top: 4px;
`;

export default DurationInput;