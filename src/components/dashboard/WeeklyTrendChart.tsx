import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';

interface ChartData {
  day: string;
  value: number;
}

interface WeeklyTrendChartProps {
  data: ChartData[];
  title?: string;
}

const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ 
  data, 
  title = '주간 참여 트렌드' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const getBarHeight = (value: number) => (value / maxValue) * 140;

  return (
    <StyledCard>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        <ChartOptions>
          <ChartOption>주간</ChartOption>
          <ChartOption className="active">월간</ChartOption>
        </ChartOptions>
      </ChartHeader>
      
      <BarChart>
        {data.map((item, index) => (
          <BarGroup key={index}>
            <BarContainer>
              <BarBg />
              <BarFill $height={getBarHeight(item.value)} />
            </BarContainer>
            <BarLabel>{item.day}</BarLabel>
          </BarGroup>
        ))}
      </BarChart>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  padding: 20px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const ChartOptions = styled.div`
  display: flex;
  gap: 10px;
`;

const ChartOption = styled.div`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  background: ${({ theme }) => theme.colors.gray[100]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
  
  &.active {
    background: #eff6ff;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const BarChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 40px;
  height: 140px;
  padding: 0 20px;
`;

const BarGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const BarContainer = styled.div`
  width: 40px;
  height: 100%;
  display: flex;
  align-items: flex-end;
  position: relative;
`;

const BarBg = styled.div`
  position: absolute;
  width: 100%;
  height: 40px;
  background: #e0e7ff;
  border-radius: 4px;
`;

const BarFill = styled.div<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  position: relative;
  z-index: 1;
  transition: height 0.3s ease;
`;

const BarLabel = styled.div`
  margin-top: 10px;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export default WeeklyTrendChart;