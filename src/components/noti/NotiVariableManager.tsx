import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Plus, Trash2 } from 'lucide-react';

interface VariableItem {
  id: string;
  key: string;
  value: string;
}

interface NotiVariableManagerProps {
  variables: Record<string, string>;
  onVariablesChange: (variables: Record<string, string>) => void;
}

const NotiVariableManager: React.FC<NotiVariableManagerProps> = ({
  variables,
  onVariablesChange
}) => {
  // 내부적으로 배열로 관리하여 순서와 고유성 보장
  const [variableItems, setVariableItems] = useState<VariableItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  // 초기화 시에만 props에서 state로 변환
  useEffect(() => {
    if (!isInitialized && Object.keys(variables).length > 0) {
      const items = Object.entries(variables).map(([key, value], index) => ({
        id: `var-${index}-${Date.now()}-${Math.random()}`, // 고유 ID 생성
        key,
        value
      }));
      setVariableItems(items);
      setIsInitialized(true);
    } else if (!isInitialized && Object.keys(variables).length === 0) {
      setIsInitialized(true);
    }
  }, [variables, isInitialized]);

  // 디바운싱된 parent sync 함수
  const syncToParent = useCallback((items: VariableItem[]) => {
    // 기존 timeout 클리어
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // 새로운 timeout 설정
    timeoutRef.current = window.setTimeout(() => {
      const newVariables: Record<string, string> = {};
      items.forEach(item => {
        if (item.key.trim()) { // 빈 키는 제외
          newVariables[item.key] = item.value;
        }
      });
      onVariablesChange(newVariables);
    }, 300); // 300ms 디바운스
  }, [onVariablesChange]);

  // 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAddVariable = () => {
    // 고유한 변수명 생성
    let newVariableName = '변수1';
    let counter = 1;
    while (variableItems.some(item => item.key === newVariableName)) {
      counter++;
      newVariableName = `변수${counter}`;
    }

    const newItem: VariableItem = {
      id: `var-${Date.now()}-${Math.random()}`,
      key: newVariableName,
      value: '샘플값'
    };
    
    const newItems = [...variableItems, newItem];
    setVariableItems(newItems);
    syncToParent(newItems);
  };

  const handleUpdateVariableKey = (id: string, newKey: string) => {
    const updatedItems = variableItems.map(item => 
      item.id === id ? { ...item, key: newKey } : item
    );
    setVariableItems(updatedItems);
    syncToParent(updatedItems);
  };

  const handleUpdateVariableValue = (id: string, newValue: string) => {
    const updatedItems = variableItems.map(item => 
      item.id === id ? { ...item, value: newValue } : item
    );
    setVariableItems(updatedItems);
    syncToParent(updatedItems);
  };

  const handleDeleteVariable = (id: string) => {
    const updatedItems = variableItems.filter(item => item.id !== id);
    setVariableItems(updatedItems);
    syncToParent(updatedItems);
  };

  // 키 중복 검사
  const isDuplicateKey = (currentId: string, key: string) => {
    return variableItems.some(item => item.id !== currentId && item.key === key && key.trim() !== '');
  };

  return (
    <VariableSection>
      <VariableHeader>
        <Label>변수 관리</Label>
        <AddButton type="button" onClick={handleAddVariable}>
          <Plus style={{ width: '14px', height: '14px' }} />
          변수 추가
        </AddButton>
      </VariableHeader>
      
      <VariableContainer>
        {variableItems.map((item) => {
          const hasError = !item.key.trim() || isDuplicateKey(item.id, item.key);
          
          return (
            <VariableRow key={item.id}>
              <VariableInputWrapper>
                <VariableInput
                  type="text"
                  placeholder="변수명"
                  value={item.key}
                  hasError={hasError}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleUpdateVariableKey(item.id, e.target.value);
                  }}
                />
                {hasError && (
                  <ErrorMessage>
                    {!item.key.trim() ? '변수명을 입력하세요' : '중복된 변수명입니다'}
                  </ErrorMessage>
                )}
              </VariableInputWrapper>
              <VariableInput
                type="text"
                placeholder="샘플값"
                value={item.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleUpdateVariableValue(item.id, e.target.value);
                }}
              />
              <DeleteButton
                type="button"
                onClick={() => handleDeleteVariable(item.id)}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
              </DeleteButton>
            </VariableRow>
          );
        })}
        
        {variableItems.length === 0 && (
          <EmptyState>
            변수가 없습니다. 위 버튼을 클릭하여 변수를 추가하세요.
          </EmptyState>
        )}
      </VariableContainer>
    </VariableSection>
  );
};

// Styled Components
const VariableSection = styled.div``;

const VariableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const VariableContainer = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const VariableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 24px; /* 에러 메시지 공간 확보 */
  align-items: start; /* 에러 메시지로 인한 높이 차이 조정 */
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const VariableInputWrapper = styled.div`
  position: relative;
`;

const VariableInput = styled.input<{ hasError?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme, hasError }) => hasError ? theme.colors.error + '20' : theme.colors.primary + '20'};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const ErrorMessage = styled.span`
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.error};
  margin-top: 2px;
  white-space: nowrap;
  z-index: 1;
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.error}10;
  color: ${({ theme }) => theme.colors.error};
  border: none;
  border-radius: ${({ theme }) => theme.radii.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.error}20;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 14px;
  padding: 24px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
`;

export default NotiVariableManager; 