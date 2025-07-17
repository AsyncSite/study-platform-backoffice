import React from 'react';
import styled from 'styled-components';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <PaginationWrapper>
      <PaginationContainer>
        <PageArrow
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          ◀
        </PageArrow>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <PageDots key={`dots-${index}`}>...</PageDots>
          ) : (
            <PageNumber
              key={page}
              className={currentPage === page ? 'active' : ''}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </PageNumber>
          )
        ))}
        
        <PageArrow
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          ▶
        </PageArrow>
      </PaginationContainer>
    </PaginationWrapper>
  );
};

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 5px 20px;
  border-radius: 20px;
`;

const PageArrow = styled.button<{ disabled: boolean }>`
  color: ${({ theme, disabled }) => 
    disabled ? theme.colors.gray[400] : theme.colors.gray[600]};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 12px;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PageNumber = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  font-size: 14px;
  transition: ${({ theme }) => theme.transitions.normal};
  color: ${({ theme }) => theme.colors.gray[600]};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
  
  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const PageDots = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: 14px;
`;

export default Pagination;