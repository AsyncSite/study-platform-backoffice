import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge, { BadgeVariant } from '../common/Badge';

interface StudyCardProps {
  id?: string | number;
  title: string;
  schedule: string;
  participants: {
    current: number;
    max: number;
  };
  progress: number;
  nextMeeting: string;
  satisfaction: number;
  status: 'active' | 'recruiting';
  iconLetter: string;
  iconColor: string;
  barColor: string;
}

const StudyCard: React.FC<StudyCardProps> = ({
  id,
  title,
  schedule,
  participants,
  progress,
  nextMeeting,
  satisfaction,
  status,
  iconLetter,
  iconColor,
  barColor,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/studies');
  };

  return (
    <StyledStudyCard onClick={handleCardClick}>
      <StudyCardBar $color={barColor} />
      <StudyHeader>
        <StudyIcon $bgColor={iconColor}>
          {iconLetter}
        </StudyIcon>
        <div>
          <StudyTitle>{title}</StudyTitle>
          <StudySchedule>{schedule}</StudySchedule>
        </div>
        <StudyStatus>
          <Badge variant={status === 'active' ? BadgeVariant.SUCCESS : BadgeVariant.WARNING}>
            {status === 'active' ? '진행중' : '모집중'}
          </Badge>
        </StudyStatus>
      </StudyHeader>

      <StudyStats>
        <StudyStatItem>
          <StudyStatLabel>참여자</StudyStatLabel>
          <StudyStatValue>{participants.current}/{participants.max}명</StudyStatValue>
        </StudyStatItem>
        <StudyStatItem>
          <StudyStatLabel>진행률</StudyStatLabel>
          <StudyStatValue>{progress}%</StudyStatValue>
        </StudyStatItem>
        <StudyStatItem>
          <StudyStatLabel>다음 모임</StudyStatLabel>
          <StudyStatValue>{nextMeeting}</StudyStatValue>
        </StudyStatItem>
        <StudyStatItem>
          <StudyStatLabel>만족도</StudyStatLabel>
          <StudyStatValue>{satisfaction}/5.0</StudyStatValue>
        </StudyStatItem>
      </StudyStats>

      <ProgressBar>
        <ProgressFill $width={progress} $color={barColor} />
      </ProgressBar>
    </StyledStudyCard>
  );
};

const StyledStudyCard = styled(Card)`
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const StudyCardBar = styled.div<{ $color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 12px;
  background: ${({ $color }) => $color};
`;

const StudyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const StudyIcon = styled.div<{ $bgColor: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  background: ${({ $bgColor }) => $bgColor};
  color: ${({ $bgColor }) => $bgColor.includes('#eff6ff') ? '#6366f1' : '#10b981'};
`;

const StudyTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const StudySchedule = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StudyStatus = styled.div`
  margin-left: auto;
`;

const StudyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 20px 0;
`;

const StudyStatItem = styled.div`
  text-align: left;
`;

const StudyStatLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 5px;
`;

const StudyStatValue = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 10px;
`;

const ProgressFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  border-radius: 4px;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
  transition: width 0.3s ease;
`;

export default StudyCard;