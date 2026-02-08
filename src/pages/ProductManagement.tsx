import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Badge from '../components/common/Badge';
import {
  productApi,
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRICING_TYPE_LABELS,
  type ProductResponse,
  type ProductDetailResponse,
  type ProductAssetResponse,
  type CreateProductRequest,
  type UpdateProductRequest,
  type CreateVariantRequest,
  type ProductType,
  type ProductStatus,
  type PricingType,
} from '../api/product';
import { assetApi } from '../api/asset';

// ─── Sub-views ───
type ViewMode = 'list' | 'detail' | 'create';

const ProductManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailResponse | null>(null);
  const [assets, setAssets] = useState<ProductAssetResponse[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState<CreateProductRequest>({
    slug: '',
    title: '',
    description: '',
    shortDescription: '',
    type: 'EBOOK',
    sellerId: 'PLATFORM',
    thumbnailUrl: '',
    metadata: {},
  });

  // Edit form
  const [editForm, setEditForm] = useState<UpdateProductRequest>({
    title: '',
    description: '',
    shortDescription: '',
    thumbnailUrl: '',
    metadata: {},
  });
  const [editing, setEditing] = useState(false);

  // Variant form
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantForm, setVariantForm] = useState<CreateVariantRequest>({
    name: '',
    description: '',
    originalPrice: 0,
    salePrice: null,
    pricingType: 'ONE_TIME',
    features: {},
    isDefault: false,
    displayOrder: 0,
  });

  // Asset upload
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thumbnail upload
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);

  // Submitting flags
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productApi.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      alert('상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── Detail view ───
  const openDetail = async (product: ProductResponse) => {
    setDetailLoading(true);
    setViewMode('detail');
    try {
      const detail = await productApi.getProductBySlug(product.slug);
      setSelectedProduct(detail);
      setEditForm({
        title: detail.title,
        description: detail.description || '',
        shortDescription: detail.shortDescription || '',
        thumbnailUrl: detail.thumbnailUrl || '',
        metadata: detail.metadata || {},
      });
      // Load assets
      try {
        const assetData = await productApi.getAssets(detail.productId);
        setAssets(Array.isArray(assetData) ? assetData : []);
      } catch {
        setAssets([]);
      }
    } catch (error) {
      console.error('Failed to load product detail:', error);
      alert('상품 상세 정보를 불러오는데 실패했습니다.');
      setViewMode('list');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedProduct) return;
    try {
      const detail = await productApi.getProductBySlug(selectedProduct.slug);
      setSelectedProduct(detail);
      setEditForm({
        title: detail.title,
        description: detail.description || '',
        shortDescription: detail.shortDescription || '',
        thumbnailUrl: detail.thumbnailUrl || '',
        metadata: detail.metadata || {},
      });
      const assetData = await productApi.getAssets(detail.productId);
      setAssets(Array.isArray(assetData) ? assetData : []);
    } catch (error) {
      console.error('Failed to refresh product:', error);
    }
  };

  // ─── Product CRUD ───
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.slug.trim() || !createForm.title.trim()) {
      alert('slug와 제목은 필수입니다.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await productApi.createProduct(createForm);
      alert('상품이 생성되었습니다.');
      setCreateForm({
        slug: '', title: '', description: '', shortDescription: '',
        type: 'EBOOK', sellerId: 'PLATFORM', thumbnailUrl: '', metadata: {},
      });
      setViewMode('list');
      fetchProducts();
      // Open detail of newly created product
      setSelectedProduct(created);
      setEditForm({
        title: created.title,
        description: created.description || '',
        shortDescription: created.shortDescription || '',
        thumbnailUrl: created.thumbnailUrl || '',
        metadata: created.metadata || {},
      });
      setAssets([]);
      setViewMode('detail');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      const msg = error.response?.data?.message || error.response?.data?.data?.message || '상품 생성에 실패했습니다.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await productApi.updateProduct(selectedProduct.productId, editForm);
      alert('상품이 수정되었습니다.');
      setEditing(false);
      await refreshDetail();
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to update product:', error);
      alert(error.response?.data?.message || '상품 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (productId: string, status: ProductStatus) => {
    const statusLabel = PRODUCT_STATUS_LABELS[status];
    if (!window.confirm(`상태를 "${statusLabel}"(으)로 변경하시겠습니까?`)) return;
    try {
      await productApi.changeStatus(productId, status);
      alert(`상태가 "${statusLabel}"(으)로 변경되었습니다.`);
      if (viewMode === 'detail') {
        await refreshDetail();
      }
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to change status:', error);
      alert(error.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  };

  // ─── Variant ───
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !variantForm.name.trim()) return;
    setSubmitting(true);
    try {
      await productApi.addVariant(selectedProduct.productId, variantForm);
      alert('Variant가 추가되었습니다.');
      setShowVariantForm(false);
      setVariantForm({
        name: '', description: '', originalPrice: 0, salePrice: null, pricingType: 'ONE_TIME',
        features: {}, isDefault: false, displayOrder: 0,
      });
      await refreshDetail();
    } catch (error: any) {
      console.error('Failed to add variant:', error);
      alert(error.response?.data?.message || 'Variant 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Asset upload ───
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedProduct) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await productApi.uploadAsset(selectedProduct.productId, files[i]);
      }
      alert(`${files.length}개 파일이 업로드되었습니다.`);
      const assetData = await productApi.getAssets(selectedProduct.productId);
      setAssets(Array.isArray(assetData) ? assetData : []);
    } catch (error: any) {
      console.error('Failed to upload asset:', error);
      alert(error.response?.data?.message || '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (assetId: string, fileName: string) => {
    if (!selectedProduct) return;
    if (!window.confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) return;
    try {
      await productApi.deleteAsset(selectedProduct.productId, assetId);
      setAssets(prev => prev.filter(a => a.assetId !== assetId));
      alert('파일이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Thumbnail upload handler
  const handleThumbnailUpload = async (
    file: File | null,
    setUrl: (url: string) => void
  ) => {
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setThumbnailUploading(true);
    try {
      const result = await assetApi.upload(file, {
        visibility: 'PUBLIC',
        category: 'product-thumbnail',
      });
      setUrl(result.publicUrl);
      alert('썸네일이 업로드되었습니다.');
    } catch (error: any) {
      console.error('Failed to upload thumbnail:', error);
      alert(error.response?.data?.message || '썸네일 업로드에 실패했습니다.');
    } finally {
      setThumbnailUploading(false);
    }
  };

  // ─── Helpers ───
  const getStatusBadgeVariant = (status: string) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'DRAFT') return 'warning';
    if (status === 'ARCHIVED') return 'default';
    return 'default';
  };

  const getStatusActions = (status: ProductStatus): { label: string; target: ProductStatus }[] => {
    switch (status) {
      case 'DRAFT': return [
        { label: 'ACTIVE로 변경', target: 'ACTIVE' },
        { label: 'ARCHIVED로 변경', target: 'ARCHIVED' },
      ];
      case 'ACTIVE': return [
        { label: 'DRAFT로 변경', target: 'DRAFT' },
        { label: 'ARCHIVED로 변경', target: 'ARCHIVED' },
      ];
      case 'ARCHIVED': return [
        { label: 'DRAFT로 변경', target: 'DRAFT' },
      ];
      default: return [];
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ─── LIST VIEW ───
  if (viewMode === 'list') {
    return (
      <Container>
        <Header>
          <div>
            <Title>상품 관리</Title>
            <Subtitle>총 {products.length}건</Subtitle>
          </div>
          <AddButton onClick={() => setViewMode('create')}>+ 상품 생성</AddButton>
        </Header>

        {loading ? (
          <LoadingText>로딩 중...</LoadingText>
        ) : products.length === 0 ? (
          <EmptyText>등록된 상품이 없습니다.</EmptyText>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>상품명</Th>
                  <Th>유형</Th>
                  <Th>상태</Th>
                  <Th>시작 가격</Th>
                  <Th>생성일</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <Tr key={product.productId} onClick={() => openDetail(product)} style={{ cursor: 'pointer' }}>
                    <Td>
                      <ProductNameCell>
                        {product.thumbnailUrl && (
                          <Thumbnail src={product.thumbnailUrl} alt={product.title} />
                        )}
                        <div>
                          <ProductTitle>{product.title}</ProductTitle>
                          <ProductSlug>{product.slug}</ProductSlug>
                        </div>
                      </ProductNameCell>
                    </Td>
                    <Td>{PRODUCT_TYPE_LABELS[product.type] || product.type}</Td>
                    <Td>
                      <Badge variant={getStatusBadgeVariant(product.status)}>
                        {PRODUCT_STATUS_LABELS[product.status] || product.status}
                      </Badge>
                    </Td>
                    <Td>
                      {product.startingPrice != null
                        ? `${product.startingPrice.toLocaleString()}원`
                        : '-'}
                    </Td>
                    <Td>{formatDate(product.createdAt)}</Td>
                    <Td>
                      <ActionButtons onClick={(e) => e.stopPropagation()}>
                        {getStatusActions(product.status).map((action) => (
                          <StatusActionButton
                            key={action.target}
                            onClick={() => handleChangeStatus(product.productId, action.target)}
                          >
                            {action.label}
                          </StatusActionButton>
                        ))}
                      </ActionButtons>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Container>
    );
  }

  // ─── CREATE VIEW ───
  if (viewMode === 'create') {
    return (
      <Container>
        <Header>
          <div>
            <BackButton onClick={() => setViewMode('list')}>← 목록으로</BackButton>
            <Title>상품 생성</Title>
          </div>
        </Header>

        <FormCard>
          <Form onSubmit={handleCreateProduct}>
            <SectionTitle>기본 정보</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label>Slug *</Label>
                <Input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="my-product-slug"
                  required
                />
                <HelpText>URL에 사용될 고유 식별자 (영문 소문자, 하이픈)</HelpText>
              </FormGroup>

              <FormGroup>
                <Label>상품 유형 *</Label>
                <Select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as ProductType })}
                >
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup $fullWidth>
                <Label>제목 *</Label>
                <Input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="상품 제목"
                  required
                />
              </FormGroup>

              <FormGroup $fullWidth>
                <Label>짧은 설명</Label>
                <Input
                  type="text"
                  value={createForm.shortDescription}
                  onChange={(e) => setCreateForm({ ...createForm, shortDescription: e.target.value })}
                  placeholder="상품 목록에 표시될 짧은 설명"
                />
              </FormGroup>

              <FormGroup $fullWidth>
                <Label>상세 설명</Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="상품 상세 설명"
                  rows={5}
                />
              </FormGroup>

              <FormGroup>
                <Label>썸네일</Label>
                <ThumbnailUploadArea>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleThumbnailUpload(
                      e.target.files?.[0] || null,
                      (url) => setCreateForm({ ...createForm, thumbnailUrl: url })
                    )}
                  />
                  {createForm.thumbnailUrl ? (
                    <ThumbnailPreviewWrapper>
                      <ThumbnailPreview src={createForm.thumbnailUrl} alt="썸네일" />
                      <ThumbnailActions>
                        <ThumbnailButton type="button" onClick={() => thumbnailInputRef.current?.click()} disabled={thumbnailUploading}>
                          {thumbnailUploading ? '업로드 중...' : '변경'}
                        </ThumbnailButton>
                        <ThumbnailButton type="button" onClick={() => setCreateForm({ ...createForm, thumbnailUrl: '' })}>
                          삭제
                        </ThumbnailButton>
                      </ThumbnailActions>
                    </ThumbnailPreviewWrapper>
                  ) : (
                    <ThumbnailUploadButton type="button" onClick={() => thumbnailInputRef.current?.click()} disabled={thumbnailUploading}>
                      {thumbnailUploading ? '업로드 중...' : '+ 썸네일 이미지 업로드'}
                    </ThumbnailUploadButton>
                  )}
                </ThumbnailUploadArea>
              </FormGroup>

              <FormGroup>
                <Label>판매자 ID</Label>
                <Input
                  type="text"
                  value={createForm.sellerId}
                  onChange={(e) => setCreateForm({ ...createForm, sellerId: e.target.value })}
                  placeholder="PLATFORM"
                />
              </FormGroup>
            </FormGrid>

            <FormActions>
              <CancelButton type="button" onClick={() => setViewMode('list')}>취소</CancelButton>
              <SubmitButton type="submit" disabled={submitting}>
                {submitting ? '생성 중...' : '상품 생성'}
              </SubmitButton>
            </FormActions>
          </Form>
        </FormCard>
      </Container>
    );
  }

  // ─── DETAIL VIEW ───
  return (
    <Container>
      <Header>
        <div>
          <BackButton onClick={() => { setViewMode('list'); setSelectedProduct(null); setEditing(false); }}>
            ← 목록으로
          </BackButton>
          <Title>{selectedProduct?.title || '상품 상세'}</Title>
          {selectedProduct && (
            <StatusRow>
              <Badge variant={getStatusBadgeVariant(selectedProduct.status)}>
                {PRODUCT_STATUS_LABELS[selectedProduct.status]}
              </Badge>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {PRODUCT_TYPE_LABELS[selectedProduct.type]} | slug: {selectedProduct.slug}
              </span>
            </StatusRow>
          )}
        </div>
        {selectedProduct && (
          <ActionButtons>
            {getStatusActions(selectedProduct.status).map((action) => (
              <StatusActionButton
                key={action.target}
                onClick={() => handleChangeStatus(selectedProduct.productId, action.target)}
              >
                {action.label}
              </StatusActionButton>
            ))}
          </ActionButtons>
        )}
      </Header>

      {detailLoading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : selectedProduct ? (
        <>
          {/* ─── Basic Info Section ─── */}
          <FormCard>
            <SectionHeader>
              <SectionTitle>기본 정보</SectionTitle>
              {!editing ? (
                <EditButton onClick={() => setEditing(true)}>수정</EditButton>
              ) : (
                <ActionButtons>
                  <CancelButton type="button" onClick={() => { setEditing(false); setEditForm({
                    title: selectedProduct.title,
                    description: selectedProduct.description || '',
                    shortDescription: selectedProduct.shortDescription || '',
                    thumbnailUrl: selectedProduct.thumbnailUrl || '',
                    metadata: selectedProduct.metadata || {},
                  }); }}>취소</CancelButton>
                  <SubmitButton onClick={handleUpdateProduct} disabled={submitting}>
                    {submitting ? '저장 중...' : '저장'}
                  </SubmitButton>
                </ActionButtons>
              )}
            </SectionHeader>

            {editing ? (
              <FormGrid>
                <FormGroup $fullWidth>
                  <Label>제목</Label>
                  <Input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </FormGroup>
                <FormGroup $fullWidth>
                  <Label>짧은 설명</Label>
                  <Input
                    type="text"
                    value={editForm.shortDescription}
                    onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  />
                </FormGroup>
                <FormGroup $fullWidth>
                  <Label>상세 설명</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={5}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>썸네일</Label>
                  <ThumbnailUploadArea>
                    <input
                      ref={editThumbnailInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleThumbnailUpload(
                        e.target.files?.[0] || null,
                        (url) => setEditForm({ ...editForm, thumbnailUrl: url })
                      )}
                    />
                    {editForm.thumbnailUrl ? (
                      <ThumbnailPreviewWrapper>
                        <ThumbnailPreview src={editForm.thumbnailUrl} alt="썸네일" />
                        <ThumbnailActions>
                          <ThumbnailButton type="button" onClick={() => editThumbnailInputRef.current?.click()} disabled={thumbnailUploading}>
                            {thumbnailUploading ? '업로드 중...' : '변경'}
                          </ThumbnailButton>
                          <ThumbnailButton type="button" onClick={() => setEditForm({ ...editForm, thumbnailUrl: '' })}>
                            삭제
                          </ThumbnailButton>
                        </ThumbnailActions>
                      </ThumbnailPreviewWrapper>
                    ) : (
                      <ThumbnailUploadButton type="button" onClick={() => editThumbnailInputRef.current?.click()} disabled={thumbnailUploading}>
                        {thumbnailUploading ? '업로드 중...' : '+ 썸네일 이미지 업로드'}
                      </ThumbnailUploadButton>
                    )}
                  </ThumbnailUploadArea>
                </FormGroup>
              </FormGrid>
            ) : (
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>제목</InfoLabel>
                  <InfoValue>{selectedProduct.title}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>짧은 설명</InfoLabel>
                  <InfoValue>{selectedProduct.shortDescription || '-'}</InfoValue>
                </InfoItem>
                <InfoItem $fullWidth>
                  <InfoLabel>상세 설명</InfoLabel>
                  <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{selectedProduct.description || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>썸네일</InfoLabel>
                  <InfoValue>
                    {selectedProduct.thumbnailUrl ? (
                      <ThumbnailPreview src={selectedProduct.thumbnailUrl} alt="thumbnail" />
                    ) : '-'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>생성일</InfoLabel>
                  <InfoValue>{formatDate(selectedProduct.createdAt)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>발행일</InfoLabel>
                  <InfoValue>{formatDate(selectedProduct.publishedAt)}</InfoValue>
                </InfoItem>
              </InfoGrid>
            )}
          </FormCard>

          {/* ─── Variant Section ─── */}
          <FormCard>
            <SectionHeader>
              <SectionTitle>Variant ({selectedProduct.variants?.length || 0})</SectionTitle>
              <EditButton onClick={() => setShowVariantForm(true)}>+ Variant 추가</EditButton>
            </SectionHeader>

            {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
              <VariantTable>
                <thead>
                  <tr>
                    <Th>이름</Th>
                    <Th>정가</Th>
                    <Th>할인가</Th>
                    <Th>할인율</Th>
                    <Th>가격 유형</Th>
                    <Th>기본</Th>
                    <Th>순서</Th>
                    <Th>상태</Th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProduct.variants.map((variant) => {
                    const originalPrice = variant.originalPrice ?? (variant as any).basePrice ?? 0;
                    const effectivePrice = variant.effectivePrice ?? variant.salePrice ?? (variant as any).basePrice ?? 0;
                    const isOnSale = variant.onSale ?? (variant.salePrice != null && variant.salePrice < originalPrice);
                    const discountPercent = variant.discountPercent ?? (isOnSale && originalPrice > 0 ? Math.round((1 - effectivePrice / originalPrice) * 100) : 0);
                    return (
                      <tr key={variant.variantId}>
                        <Td>
                          <div>
                            <strong>{variant.name}</strong>
                            {variant.description && <div style={{ fontSize: '12px', color: '#6b7280' }}>{variant.description}</div>}
                          </div>
                        </Td>
                        <Td>{(originalPrice || 0).toLocaleString()}원</Td>
                        <Td>
                          {isOnSale ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>{(effectivePrice || 0).toLocaleString()}원</span>
                          ) : '-'}
                        </Td>
                        <Td>
                          {isOnSale ? (
                            <Badge variant="error">{discountPercent}%</Badge>
                          ) : '-'}
                        </Td>
                        <Td>{PRICING_TYPE_LABELS[variant.pricingType]}</Td>
                        <Td>{variant.isDefault ? 'Y' : 'N'}</Td>
                        <Td>{variant.displayOrder}</Td>
                        <Td>
                          <Badge variant={variant.active ? 'success' : 'default'}>
                            {variant.active ? '활성' : '비활성'}
                          </Badge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </VariantTable>
            ) : (
              <EmptySection>등록된 Variant가 없습니다. Variant를 추가해야 상품을 ACTIVE로 변경할 수 있습니다.</EmptySection>
            )}

            {showVariantForm && (
              <VariantFormSection>
                <SubSectionTitle>Variant 추가</SubSectionTitle>
                <Form onSubmit={handleAddVariant}>
                  <FormGrid>
                    <FormGroup>
                      <Label>이름 *</Label>
                      <Input
                        type="text"
                        value={variantForm.name}
                        onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                        placeholder="기본 패키지"
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>정가 (원) *</Label>
                      <Input
                        type="number"
                        value={variantForm.originalPrice}
                        onChange={(e) => setVariantForm({ ...variantForm, originalPrice: Number(e.target.value) })}
                        min={0}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>할인가 (원)</Label>
                      <Input
                        type="number"
                        value={variantForm.salePrice ?? ''}
                        onChange={(e) => setVariantForm({ ...variantForm, salePrice: e.target.value ? Number(e.target.value) : null })}
                        min={0}
                        placeholder="할인 없으면 비워두세요"
                      />
                      <HelpText>할인가를 입력하면 자동으로 할인율이 계산됩니다</HelpText>
                    </FormGroup>
                    <FormGroup>
                      <Label>가격 유형 *</Label>
                      <Select
                        value={variantForm.pricingType}
                        onChange={(e) => setVariantForm({ ...variantForm, pricingType: e.target.value as PricingType })}
                      >
                        {Object.entries(PRICING_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label>표시 순서</Label>
                      <Input
                        type="number"
                        value={variantForm.displayOrder}
                        onChange={(e) => setVariantForm({ ...variantForm, displayOrder: Number(e.target.value) })}
                        min={0}
                      />
                    </FormGroup>
                    <FormGroup $fullWidth>
                      <Label>설명</Label>
                      <Input
                        type="text"
                        value={variantForm.description}
                        onChange={(e) => setVariantForm({ ...variantForm, description: e.target.value })}
                        placeholder="Variant 설명"
                      />
                    </FormGroup>
                    <FormGroup>
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={variantForm.isDefault}
                          onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked })}
                        />
                        기본 Variant로 설정
                      </CheckboxLabel>
                    </FormGroup>
                  </FormGrid>
                  <FormActions>
                    <CancelButton type="button" onClick={() => setShowVariantForm(false)}>취소</CancelButton>
                    <SubmitButton type="submit" disabled={submitting}>
                      {submitting ? '추가 중...' : 'Variant 추가'}
                    </SubmitButton>
                  </FormActions>
                </Form>
              </VariantFormSection>
            )}
          </FormCard>

          {/* ─── Asset Section ─── */}
          <FormCard>
            <SectionHeader>
              <SectionTitle>디지털 파일 (Asset)</SectionTitle>
            </SectionHeader>

            <DropZone
              $dragOver={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              {uploading ? (
                <DropZoneText>업로드 중...</DropZoneText>
              ) : (
                <>
                  <DropZoneIcon>+</DropZoneIcon>
                  <DropZoneText>
                    파일을 드래그하거나 클릭하여 업로드
                  </DropZoneText>
                  <DropZoneHint>PDF, ZIP 등 디지털 파일</DropZoneHint>
                </>
              )}
            </DropZone>

            {assets.length > 0 ? (
              <AssetList>
                {assets.map((asset) => (
                  <AssetItem key={asset.assetId}>
                    <AssetInfo>
                      <AssetFileName>{asset.fileName}</AssetFileName>
                      <AssetMeta>
                        {asset.contentType} | {formatFileSize(asset.fileSize)}
                      </AssetMeta>
                    </AssetInfo>
                    <DeleteAssetButton onClick={() => handleDeleteAsset(asset.assetId, asset.fileName)}>
                      삭제
                    </DeleteAssetButton>
                  </AssetItem>
                ))}
              </AssetList>
            ) : (
              <EmptySection>등록된 파일이 없습니다.</EmptySection>
            )}
          </FormCard>
        </>
      ) : null}
    </Container>
  );
};

export default ProductManagement;

// ─── Styled Components ───

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

const BackButton = styled.button`
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
  display: block;

  &:hover {
    text-decoration: underline;
  }
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
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
  white-space: nowrap;

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

const EmptySection = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 24px;
  margin: 0;
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

const VariantTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
`;

const Th = styled.th`
  padding: 12px 16px;
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
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #333;
`;

const ProductNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Thumbnail = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
`;

const ThumbnailPreview = styled.img`
  max-width: 200px;
  max-height: 120px;
  border-radius: 6px;
  object-fit: cover;
`;

const ProductTitle = styled.div`
  font-weight: 600;
  color: #1a1a1a;
`;

const ProductSlug = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StatusActionButton = styled.button`
  padding: 5px 10px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

// ─── Form Card ───

const FormCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const SubSectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
`;

const EditButton = styled.button`
  padding: 6px 14px;
  background: #eff6ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #dbeafe;
  }
`;

const Form = styled.form``;

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

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;

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

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  padding-top: 24px;
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

// ─── Info display ───

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const InfoItem = styled.div<{ $fullWidth?: boolean }>`
  ${({ $fullWidth }) => $fullWidth && 'grid-column: 1 / -1;'}
`;

const InfoLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: #1f2937;
`;

// ─── Variant ───

const VariantFormSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

// ─── Asset upload ───

const DropZone = styled.div<{ $dragOver: boolean }>`
  border: 2px dashed ${({ $dragOver }) => ($dragOver ? '#4f46e5' : '#d1d5db')};
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $dragOver }) => ($dragOver ? '#eff6ff' : '#fafafa')};

  &:hover {
    border-color: #4f46e5;
    background: #eff6ff;
  }
`;

const DropZoneIcon = styled.div`
  font-size: 32px;
  color: #9ca3af;
  margin-bottom: 8px;
`;

const DropZoneText = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const DropZoneHint = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
`;

const AssetList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AssetItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const AssetInfo = styled.div``;

const AssetFileName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
`;

const AssetMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const DeleteAssetButton = styled.button`
  padding: 6px 12px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #fecaca;
  }
`;

// ─── Thumbnail Upload ───

const ThumbnailUploadArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ThumbnailPreviewWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ThumbnailActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ThumbnailButton = styled.button`
  padding: 6px 12px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #e5e7eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ThumbnailUploadButton = styled.button`
  padding: 20px;
  background: #fafafa;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #4f46e5;
    color: #4f46e5;
    background: #eff6ff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
