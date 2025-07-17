import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CategoryDistributionChartProps {
  data: CategoryData[];
  total: number;
  title?: string;
}

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ 
  data, 
  total,
  title = '카테고리별 분포' 
}) => {
  // Calculate stroke-dasharray for donut chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercentage = 0;

  return (
    <StyledCard>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
      </ChartHeader>
      
      <DonutSection>
        <DonutChart>
          <svg width="180" height="180">
            {/* Background circle */}
            <circle 
              cx="90" 
              cy="90" 
              r={radius} 
              fill="none" 
              stroke="#e2e8f0" 
              strokeWidth="30"
            />
            
            {/* Data segments */}
            {data.map((item, index) => {
              const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const dashOffset = -(cumulativePercentage / 100) * circumference;
              cumulativePercentage += item.percentage;
              
              return (
                <circle
                  key={index}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="30"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 90 90)"
                />
              );
            })}
          </svg>
          
          <DonutCenter>
            <DonutValue>{total}</DonutValue>
            <DonutLabel>총 스터디</DonutLabel>
          </DonutCenter>
        </DonutChart>
        
        <LegendList>
          {data.map((item, index) => (
            <LegendItem key={index}>
              <LegendDot $color={item.color} />
              <LegendText>{item.name} ({item.percentage}%)</LegendText>
              <LegendValue>{item.value}</LegendValue>
            </LegendItem>
          ))}
        </LegendList>
      </DonutSection>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  padding: 20px;
`;

const ChartHeader = styled.div`
  margin-bottom: 20px;
`;

const ChartTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const DonutSection = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;
`;

const DonutChart = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
`;

const DonutCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const DonutValue = styled.div`
  font-size: 20px;
  font-weight: bold;
`;

const DonutLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LegendDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;

const LegendText = styled.div`
  font-size: 12px;
  flex: 1;
`;

const LegendValue = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
`;

export default CategoryDistributionChart;