import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Badge from '../components/common/Badge';
import { psychtestCouponApi, type PsychtestCouponResponse, type CreatePsychtestCouponRequest } from '../api/psychtestCoupon';

const TEST_SLUGS = [
  { value: 'mbti-persona', label: 'MBTI' },
  { value: 'enneagram-persona', label: 'Enneagram' },
  { value: 'saju-persona', label: 'Saju' },
  { value: 'chocolate-confession', label: 'Chocolate' },
  { value: 'wuthering-love', label: 'Wuthering Love' },
];

const PsychtestCouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<PsychtestCouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePsychtestCouponRequest>({
    couponType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: null,
    maxRedemptions: 100,
    applicableTestSlugs: null,
    issuedBy: 'ADMIN',
    validFrom: '',
    validUntil: null,
  });
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await psychtestCouponApi.list();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch psychtest coupons:', error);
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
      couponType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: null,
      maxRedemptions: 100,
      applicableTestSlugs: null,
      issuedBy: 'ADMIN',
      validFrom: '',
      validUntil: null,
    });
    setSelectedSlugs([]);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const request: CreatePsychtestCouponRequest = {
        ...formData,
        applicableTestSlugs: selectedSlugs.length > 0 ? selectedSlugs : null,
      };
      await psychtestCouponApi.create(request);
      setShowCreateModal(false);
      resetForm();
      fetchCoupons();
      alert('쿠폰이 생성되었습니다.');
    } catch (error: any) {
      console.error('Failed to create coupon:', error);
      const msg = error.response?.data?.message || '쿠폰 생성에 실패했습니다.';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDisableCoupon = async (coupon: PsychtestCouponResponse) => {
    const confirmed = window.confirm(
      `쿠폰을 비활성화하시겠습니까?\n\n코드: ${coupon.code}\n유형: ${coupon.couponType}`
    );
    if (!confirmed) return;
    try {
      await psychtestCouponApi.disable(coupon.id);
      fetchCoupons();
      alert('쿠폰이 비활성화되었습니다.');
    } catch (error) {
      console.error('Failed to disable coupon:', error);
      alert('쿠폰 비활성화에 실패했습니다.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleToggleSlug = (slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'DISABLED') return 'error';
    if (status === 'EXHAUSTED') return 'warning';
    return 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { ACTIVE: '활성', DISABLED: '비활성', EXHAUSTED: '소진' };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PERCENTAGE: '비율 할인',
      FIXED_AMOUNT: '고정 금액',
      FREE_ACCESS: '100% 무료',
    };
    return labels[type] || type;
  };

  const getDiscountDisplay = (coupon: PsychtestCouponResponse) => {
    if (coupon.couponType === 'FREE_ACCESS') return '무료';
    if (coupon.couponType === 'PERCENTAGE') return `${coupon.discountValue}%`;
    return `${Number(coupon.discountValue).toLocaleString()}원`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateStr;
    }
  };

  const getSlugLabels = (slugs: string[] | null) => {
    if (!slugs || slugs.length === 0) return '전체';
    return slugs.map(s => TEST_SLUGS.find(t => t.value === s)?.label || s).join(', ');
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>gyupgyup.me 쿠폰 관리</Title>
          <Subtitle>심리테스트 플랫폼 쿠폰 총 {coupons.length}건</Subtitle>
        </div>
        <AddButton onClick={() => { resetForm(); setShowCreateModal(true); }}>+ 쿠폰 생성</AddButton>
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
                <Th>ID</Th>
                <Th>코드</Th>
                <Th>유형</Th>
                <Th>할인</Th>
                <Th>적용 테스트</Th>
                <Th>사용 현황</Th>
                <Th>유효 기간</Th>
                <Th>발급자</Th>
                <Th>상태</Th>
                <Th>액션</Th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <Tr key={coupon.id}>
                  <Td>{coupon.id}</Td>
                  <Td>
                    <CodeText>{coupon.code}</CodeText>
                  </Td>
                  <Td>
                    <TypeBadge $type={coupon.couponType}>{getTypeLabel(coupon.couponType)}</TypeBadge>
                  </Td>
                  <Td>
                    <DiscountValue>{getDiscountDisplay(coupon)}</DiscountValue>
                  </Td>
                  <Td>
                    <SlugText>{getSlugLabels(coupon.applicableTestSlugs)}</SlugText>
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
                  <Td>{coupon.issuedBy}</Td>
                  <Td>
                    <Badge variant={getStatusBadgeVariant(coupon.status)}>
                      {getStatusLabel(coupon.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <ActionButtons>
                      <CopyButton
                        onClick={() => handleCopyCode(coupon.code)}
                        title="코드 복사"
                      >
                        {copiedId === coupon.code ? '복사됨' : '코드 복사'}
                      </CopyButton>
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
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>심리테스트 쿠폰 생성</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>x</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleCreateCoupon}>
              <FormGrid>
                <FormGroup>
                  <Label>쿠폰 코드</Label>
                  <Input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() || undefined })}
                    placeholder="비워두면 자동 생성"
                  />
                  <HelpText>비워두면 COUPON-XXXXXXXX 형태로 자동 생성</HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>할인 유형 *</Label>
                  <Select
                    value={formData.couponType}
                    onChange={(e) => setFormData({ ...formData, couponType: e.target.value as any })}
                  >
                    <option value="PERCENTAGE">비율 할인 (%)</option>
                    <option value="FIXED_AMOUNT">고정 금액 (원)</option>
                    <option value="FREE_ACCESS">100% 무료</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>할인 값 *</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    min={formData.couponType === 'FREE_ACCESS' ? 0 : 1}
                    required
                    disabled={formData.couponType === 'FREE_ACCESS'}
                  />
                  <HelpText>
                    {formData.couponType === 'PERCENTAGE' && '할인 비율 (예: 10 = 10%)'}
                    {formData.couponType === 'FIXED_AMOUNT' && '할인 금액 (원)'}
                    {formData.couponType === 'FREE_ACCESS' && '100% 무료 - 값 불필요'}
                  </HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>최소 주문 금액</Label>
                  <Input
                    type="number"
                    value={formData.minOrderAmount ?? 0}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    min={0}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>최대 할인 금액</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscount ?? ''}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : null })}
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
                  <Label>유효 시작일</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom || ''}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || undefined })}
                  />
                  <HelpText>비워두면 즉시 시작</HelpText>
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
                  <Label>적용 테스트</Label>
                  <SlugGrid>
                    {TEST_SLUGS.map((test) => (
                      <SlugCheckbox key={test.value}>
                        <input
                          type="checkbox"
                          checked={selectedSlugs.includes(test.value)}
                          onChange={() => handleToggleSlug(test.value)}
                        />
                        <span>{test.label}</span>
                      </SlugCheckbox>
                    ))}
                  </SlugGrid>
                  <HelpText>선택하지 않으면 전체 테스트에 적용</HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>발급자</Label>
                  <Select
                    value={formData.issuedBy || 'ADMIN'}
                    onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PROMOTION">PROMOTION</option>
                    <option value="INFLUENCER">INFLUENCER</option>
                    <option value="REFERRAL">REFERRAL</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <FormActions>
                <CancelButton type="button" onClick={() => setShowCreateModal(false)}>취소</CancelButton>
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

export default PsychtestCouponManagement;

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
  background: #7c3aed;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  &:hover { background: #6d28d9; }
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
  &:hover { background: #f5f5f5; }
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
  color: #7c3aed;
  font-weight: 600;
  white-space: nowrap;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $type }) =>
    $type === 'FREE_ACCESS' ? '#fef3c7' :
    $type === 'PERCENTAGE' ? '#dbeafe' : '#d1fae5'};
  color: ${({ $type }) =>
    $type === 'FREE_ACCESS' ? '#92400e' :
    $type === 'PERCENTAGE' ? '#1e40af' : '#065f46'};
`;

const DiscountValue = styled.span`
  font-weight: 600;
  color: #059669;
`;

const SlugText = styled.span`
  font-size: 13px;
  color: #475569;
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

const CopyButton = styled.button`
  padding: 6px 12px;
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #c4b5fd;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  &:hover { background: #ede9fe; }
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
  &:hover { background: #fecaca; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  &:hover { color: #1f2937; }
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
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
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
    border-color: #7c3aed;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  margin-bottom: 0;
`;

const SlugGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
`;

const SlugCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  input { cursor: pointer; }
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
  &:hover { background: #e5e7eb; }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #6d28d9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
