import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { gritMomentApi, type GritMomentPrice, type CreateGritMomentPriceRequest } from '../api/gritMoment';

// 이메일로 해시 기반 URL ID 생성
const generateUrlIdFromEmail = async (email: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // 앞 12자리 사용 (16^12 = 약 281조, 충돌 확률 극히 낮음)
  return hashHex.substring(0, 12);
};

const GritMomentManagement: React.FC = () => {
  const [prices, setPrices] = useState<GritMomentPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<GritMomentPrice | null>(null);
  const [formData, setFormData] = useState<CreateGritMomentPriceRequest>({
    email: '',
    urlId: '',
    name: '',
    amount: 1000000,
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const data = await gritMomentApi.getAll();
      setPrices(data);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (price?: GritMomentPrice) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        email: price.email,
        urlId: price.urlId,
        name: price.name,
        amount: price.amount,
      });
    } else {
      setEditingPrice(null);
      setFormData({
        email: '',
        urlId: '',
        name: '',
        amount: 1000000,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrice(null);
    setFormData({
      email: '',
      urlId: '',
      name: '',
      amount: 1000000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrice) {
        await gritMomentApi.update(editingPrice.id, formData);
      } else {
        await gritMomentApi.create(formData);
      }
      handleCloseModal();
      fetchPrices();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await gritMomentApi.delete(id);
      fetchPrices();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const copyLink = (urlId: string) => {
    const link = `https://teamgrit.asyncsite.com/grit-moments/${urlId}`;
    navigator.clipboard.writeText(link);
    alert('링크가 복사되었습니다.');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  return (
    <Container>
      <Header>
        <Title>그릿모먼츠 가격 설정</Title>
        <AddButton onClick={() => handleOpenModal()}>+ 새 가격 추가</AddButton>
      </Header>

      <Description>
        사용자별 결제 금액을 설정합니다. 각 사용자는 고유한 결제 링크를 받습니다.
      </Description>

      {loading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>이메일</Th>
              <Th>결제 URL</Th>
              <Th>금액</Th>
              <Th>생성일</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr key={price.id}>
                <Td>{price.name}</Td>
                <Td>{price.email}</Td>
                <Td>
                  <UrlContainer>
                    <UrlText>teamgrit.asyncsite.com/grit-moments/{price.urlId}</UrlText>
                    <CopyButton onClick={() => copyLink(price.urlId)} title="URL 복사">
                      📋
                    </CopyButton>
                  </UrlContainer>
                </Td>
                <Td>
                  <Amount>{formatAmount(price.amount)}</Amount>
                </Td>
                <Td>{formatDate(price.createdAt)}</Td>
                <Td>
                  <ActionButtons>
                    <ActionButton onClick={() => handleOpenModal(price)} title="수정">
                      ✏️
                    </ActionButton>
                    <ActionButton onClick={() => handleDelete(price.id)} title="삭제" $danger>
                      🗑️
                    </ActionButton>
                  </ActionButtons>
                </Td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <EmptyText>등록된 가격 설정이 없습니다.</EmptyText>
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingPrice ? '가격 수정' : '새 가격 추가'}</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>이름 *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>이메일 *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={async (e) => {
                    const email = e.target.value;
                    setFormData(prev => ({ ...prev, email }));
                    // 새 등록일 때만 자동 생성 (수정 시에는 기존 ID 유지)
                    if (!editingPrice && email.includes('@')) {
                      const generatedId = await generateUrlIdFromEmail(email);
                      setFormData(prev => ({ ...prev, urlId: generatedId }));
                    }
                  }}
                  placeholder="example@email.com"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>URL ID (자동 생성)</Label>
                <Input
                  type="text"
                  value={formData.urlId}
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <HelpText>결제 링크: teamgrit.asyncsite.com/grit-moments/{formData.urlId || 'id'}</HelpText>
              </FormGroup>
              <FormGroup>
                <Label>결제 금액 *</Label>
                <AmountSelect
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                >
                  <option value={1000000}>100만원</option>
                  <option value={1100000}>110만원</option>
                  <option value={1200000}>120만원</option>
                  <option value={1300000}>130만원</option>
                  <option value={1400000}>140만원</option>
                  <option value={1500000}>150만원</option>
                </AmountSelect>
              </FormGroup>
              <SubmitButton type="submit">
                {editingPrice ? '수정' : '추가'}
              </SubmitButton>
            </Form>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default GritMomentManagement;

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 24px;
`;

const AddButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #4338ca;
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
`;

const UrlContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UrlText = styled.code`
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #4f46e5;
  white-space: nowrap;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #f3f4f6;
  }

  &:active {
    background: #e5e7eb;
  }
`;

const Amount = styled.span`
  font-weight: 600;
  color: #059669;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: ${(props) => (props.$danger ? '#fee2e2' : '#f3f4f6')};
  }
`;

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 20px;
`;

const ModalOverlay = styled.div`
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

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;

  &:hover {
    color: #1f2937;
  }
`;

const Form = styled.form`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const AmountSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

const SubmitButton = styled.button`
  width: 100%;
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #4338ca;
  }
`;
