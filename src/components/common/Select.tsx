import React from 'react';
import styled from 'styled-components';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  fullWidth = false,
  className,
  ...props 
}) => {
  return (
    <SelectWrapper className={className} $fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      <StyledSelect $hasError={!!error} {...props} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </SelectWrapper>
  );
};

const SelectWrapper = styled.div<{ $fullWidth: boolean }>`
  display: inline-block;
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const StyledSelect = styled.select<{ $hasError: boolean }>`
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $hasError }) => 
    $hasError ? theme.colors.danger : theme.colors.border};
  border-radius: 8px;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg width='14' height='8' viewBox='0 0 14 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1L7 7L13 1' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 14px;

  &:hover {
    border-color: ${({ theme, $hasError }) => 
      $hasError ? theme.colors.danger : theme.colors.primary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.disabled};
    cursor: not-allowed;
    opacity: 0.6;
  }

  option {
    padding: 8px;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
  margin-top: 4px;
`;

export default Select;