import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Badge from '../components/common/Badge';
import { couponApi, type CouponResponse, type CreateCouponRequest } from '../api/coupon';

const generateCouponCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GRT-${seg(4)}-${seg(4)}`;
};

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: generateCouponCode(),
    description: '',
    type: 'PERCENTAGE',
    discountValue: 10,
    minimumOrderAmount: null,
    maximumDiscountAmount: null,
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    validFrom: '',
    validUntil: null,
    applicableProductIds: [],
    applicableTypes: [],
    issuedBy: 'PLATFORM',
  });
  const [productIdInput, setProductIdInput] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couponApi.getAll();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      alert('쿠폰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormData({
      code: generateCouponCode(),
      description: '',
      type: 'PERCENTAGE',
      discountValue: 10,
      minimumOrderAmount: null,
      maximumDiscountAmount: null,
      maxRedemptions: 100,
      maxRedemptionsPerUser: 1,
      validFrom: '',
      validUntil: null,
      applicableProductIds: [],
      applicableTypes: [],
      issuedBy: 'PLATFORM',
    });
    setProductIdInput('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.validFrom) {
      alert('유효 시작일을 입력해주세요.');
      return;
    }

    setCreating(true);
    try {
      await couponApi.create(formData);
      handleCloseCreateModal();
      fetchCoupons();
      alert('쿠폰이 생성되었습니다.');
    } catch (error: any) {
      console.error('Failed to create coupon:', error);
      const msg = error.response?.data?.message || error.response?.data?.data?.message || '쿠폰 생성에 실패했습니다.';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDisableCoupon = async (coupon: CouponResponse) => {
    const confirmed = window.confirm(
      `쿠폰을 비활성화하시겠습니까?\n\n코드: ${coupon.code}\n설명: ${coupon.description || '-'}`
    );
    if (!confirmed) return;

    try {
      await couponApi.disable(coupon.couponId);
      fetchCoupons();
      alert('쿠폰이 비활성화되었습니다.');
    } catch (error) {
      console.error('Failed to disable coupon:', error);
      alert('쿠폰 비활성화에 실패했습니다.');
    }
  };

  const handleCopyLink = (couponCode: string) => {
    const link = `https://teamgrit.kr/store/detail?coupon=${couponCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(couponCode);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAddProductId = () => {
    const trimmed = productIdInput.trim();
    if (trimmed && !formData.applicableProductIds.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        applicableProductIds: [...prev.applicableProductIds, trimmed],
      }));
      setProductIdInput('');
    }
  };

  const handleRemoveProductId = (id: string) => {
    setFormData(prev => ({
      ...prev,
      applicableProductIds: prev.applicableProductIds.filter(p => p !== id),
    }));
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'DISABLED') return 'error';
    if (status === 'EXPIRED') return 'default';
    return 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: '활성',
      DISABLED: '비활성',
      EXPIRED: '만료',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    return type === 'PERCENTAGE' ? '비율 할인' : '고정 금액 할인';
  };

  const getDiscountDisplay = (coupon: CouponResponse) => {
    if (coupon.type === 'PERCENTAGE') {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue.toLocaleString()}원`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateStr;
    }
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>쿠폰 관리</Title>
          <Subtitle>총 {coupons.length}건</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>+ 쿠폰 생성</AddButton>
      </Header>

      {loading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : coupons.length === 0 ? (
        <EmptyText>등록된 쿠폰이 없습니다.</EmptyText>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>코드</Th>
                <Th>설명</Th>
                <Th>할인 유형</Th>
                <Th>할인 값</Th>
                <Th>사용 현황</Th>
                <Th>유효 기간</Th>
                <Th>상태</Th>
                <Th>액션</Th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <Tr key={coupon.couponId}>
                  <Td>
                    <CodeText>{coupon.code}</CodeText>
                  </Td>
                  <Td>{coupon.description || '-'}</Td>
                  <Td>{getTypeLabel(coupon.type)}</Td>
                  <Td>
                    <DiscountValue>{getDiscountDisplay(coupon)}</DiscountValue>
                  </Td>
                  <Td>
                    <RedemptionInfo>
                      {coupon.currentRedemptions} / {coupon.maxRedemptions}
                    </RedemptionInfo>
                  </Td>
                  <Td>
                    <DateRange>
                      <span>{formatDate(coupon.validFrom)}</span>
                      <span>~</span>
                      <span>{formatDate(coupon.validUntil)}</span>
                    </DateRange>
                  </Td>
                  <Td>
                    <Badge variant={getStatusBadgeVariant(coupon.status)}>
                      {getStatusLabel(coupon.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <ActionButtons>
                      <CopyLinkButton
                        onClick={() => handleCopyLink(coupon.code)}
                        title="쿠폰 링크 복사"
                      >
                        {copiedId === coupon.code ? '복사됨' : '링크 복사'}
                      </CopyLinkButton>
                      {coupon.status === 'ACTIVE' && (
                        <DisableButton
                          onClick={() => handleDisableCoupon(coupon)}
                          title="비활성화"
                        >
                          비활성화
                        </DisableButton>
                      )}
                    </ActionButtons>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      {showCreateModal && (
        <ModalOverlay onClick={handleCloseCreateModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>쿠폰 생성</ModalTitle>
              <CloseButton onClick={handleCloseCreateModal}>x</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleCreateCoupon}>
              <FormGrid>
                <FormGroup>
                  <Label>쿠폰 코드 (자동 생성)</Label>
                  <ProductIdInputRow>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="자동 생성됨"
                      readOnly
                    />
                    <SmallButton type="button" onClick={() => setFormData({ ...formData, code: generateCouponCode() })}>
                      재생성
                    </SmallButton>
                  </ProductIdInputRow>
                </FormGroup>

                <FormGroup>
                  <Label>설명</Label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="신규 가입 할인 쿠폰"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>할인 유형 *</Label>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
                  >
                    <option value="PERCENTAGE">비율 할인 (%)</option>
                    <option value="FIXED_AMOUNT">고정 금액 할인 (원)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>할인 값 *</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    min={1}
                    required
                  />
                  <HelpText>
                    {formData.type === 'PERCENTAGE' ? '할인 비율 (예: 10 = 10%)' : '할인 금액 (원)'}
                  </HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>최소 주문 금액</Label>
                  <Input
                    type="number"
                    value={formData.minimumOrderAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                    min={0}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>최대 할인 금액</Label>
                  <Input
                    type="number"
                    value={formData.maximumDiscountAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: e.target.value ? Number(e.target.value) : null })}
                    placeholder="제한 없음"
                    min={0}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>최대 사용 횟수 *</Label>
                  <Input
                    type="number"
                    value={formData.maxRedemptions}
                    onChange={(e) => setFormData({ ...formData, maxRedemptions: Number(e.target.value) })}
                    min={1}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>유저당 최대 사용 횟수 *</Label>
                  <Input
                    type="number"
                    value={formData.maxRedemptionsPerUser}
                    onChange={(e) => setFormData({ ...formData, maxRedemptionsPerUser: Number(e.target.value) })}
                    min={1}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>유효 시작일 *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>유효 종료일</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil ?? ''}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || null })}
                  />
                  <HelpText>비워두면 무기한</HelpText>
                </FormGroup>

                <FormGroup $fullWidth>
                  <Label>적용 상품 ID</Label>
                  <ProductIdInputRow>
                    <Input
                      type="text"
                      value={productIdInput}
                      onChange={(e) => setProductIdInput(e.target.value)}
                      placeholder="상품 ID 입력 후 추가"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProductId();
                        }
                      }}
                    />
                    <SmallButton type="button" onClick={handleAddProductId}>추가</SmallButton>
                  </ProductIdInputRow>
                  {formData.applicableProductIds.length > 0 && (
                    <TagList>
                      {formData.applicableProductIds.map((id) => (
                        <Tag key={id}>
                          {id}
                          <TagRemove onClick={() => handleRemoveProductId(id)}>x</TagRemove>
                        </Tag>
                      ))}
                    </TagList>
                  )}
                  <HelpText>비워두면 전체 상품에 적용</HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>발급자</Label>
                  <Select
                    value={formData.issuedBy}
                    onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                  >
                    <option value="PLATFORM">PLATFORM</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PROMOTION">PROMOTION</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <FormActions>
                <CancelButton type="button" onClick={handleCloseCreateModal}>취소</CancelButton>
                <SubmitButton type="submit" disabled={creating}>
                  {creating ? '생성 중...' : '쿠폰 생성'}
                </SubmitButton>
              </FormActions>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default CouponManagement;

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const AddButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    background: #4338ca;
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 40px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e0e0e0;
  background: #f9f9f9;
  font-size: 13px;
  white-space: nowrap;
`;

const Tr = styled.tr`
  &:hover {
    background: #f5f5f5;
  }
`;

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #333;
`;

const CodeText = styled.code`
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #4f46e5;
  font-weight: 600;
  white-space: nowrap;
`;

const DiscountValue = styled.span`
  font-weight: 600;
  color: #059669;
`;

const RedemptionInfo = styled.span`
  font-size: 13px;
  color: #475569;
`;

const DateRange = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #6b7280;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const CopyLinkButton = styled.button`
  padding: 6px 12px;
  background: #eff6ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #dbeafe;
  }
`;

const DisableButton = styled.button`
  padding: 6px 12px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
  }
`;

// Modal styles
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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
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
  color: #1a1a1a;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px 8px;

  &:hover {
    color: #1f2937;
  }
`;

const Form = styled.form`
  padding: 24px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  ${({ $fullWidth }) => $fullWidth && 'grid-column: 1 / -1;'}
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
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  margin-bottom: 0;
`;

const ProductIdInputRow = styled.div`
  display: flex;
  gap: 8px;

  input {
    flex: 1;
  }
`;

const SmallButton = styled.button`
  padding: 10px 16px;
  background: #e5e7eb;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #d1d5db;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #eff6ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 12px;
`;

const TagRemove = styled.button`
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;

  &:hover {
    color: #dc2626;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #4338ca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
