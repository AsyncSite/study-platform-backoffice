import React, { useState } from 'react';
import styled from 'styled-components';
import Button, { ButtonVariant, ButtonSize } from '../common/Button';
import type { StudyCreateRequest } from '../../types/api';
import { StudyType } from '../../types/api';
import { format } from 'date-fns';
import ScheduleInput from './ScheduleInput';
import DurationInput from './DurationInput';
import { 
  ScheduleFrequency, 
  DurationUnit,
  formatScheduleToKorean,
  formatDurationToKorean
} from '../../types/schedule';
import type { ScheduleData, DurationData } from '../../types/schedule';

interface StudyCreateModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudyCreateRequest) => Promise<void>;
  currentUserId?: string;
  customHeader?: React.ReactNode;
}

const StudyCreateModalEnhanced: React.FC<StudyCreateModalEnhancedProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUserId,
  customHeader,
}) => {
  // 기본 정보
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<StudyType>(StudyType.PARTICIPATORY);
  
  // 운영 정보
  const [generation, setGeneration] = useState<string>('');
  const [slug, setSlug] = useState('');
  const [schedule, setSchedule] = useState<ScheduleData>({
    daysOfWeek: [],
    startTime: '',
    endTime: '',
    frequency: ScheduleFrequency.WEEKLY,
    additionalInfo: ''
  });
  const [duration, setDuration] = useState<DurationData>({
    value: 8,
    unit: DurationUnit.WEEKS
  });
  const [capacity, setCapacity] = useState<string>('');
  
  // 모집 정보
  const [recruitDeadline, setRecruitDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // UI 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    operation: true,
    recruitment: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // 자동으로 slug 생성 (사용자가 slug를 직접 입력하지 않은 경우)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 필수 필드 검증
    if (!title.trim() || !description.trim()) {
      setError('제목과 설명은 필수입니다.');
      return;
    }

    // 날짜 유효성 검증
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('시작일은 종료일보다 빠를 수 없습니다.');
      return;
    }

    if (recruitDeadline && startDate && new Date(recruitDeadline) > new Date(startDate)) {
      setError('모집 마감일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      
      const requestData: StudyCreateRequest = {
        title: title.trim(),
        description: description.trim(),
        proposerId: currentUserId || 'admin',
        // Optional fields
        generation: generation ? parseInt(generation) : undefined,
        slug: slug || undefined,
        type: type,
        tagline: tagline || undefined,
        // Convert structured schedule to string
        schedule: (schedule.daysOfWeek.length > 0 && schedule.startTime && schedule.endTime) 
          ? formatScheduleToKorean(schedule) 
          : undefined,
        // Convert structured duration to string
        duration: duration.value > 0 
          ? formatDurationToKorean(duration) 
          : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        recruitDeadline: recruitDeadline || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      await onSubmit(requestData);
      
      // 성공 시 폼 초기화
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to create study:', err);
      
      // Axios 에러 처리
      if (err.response) {
        // 서버에서 응답을 받았지만 에러가 발생한 경우
        const errorData = err.response.data;
        if (errorData?.error?.message) {
          setError(errorData.error.message);
        } else if (errorData?.error?.details?.validationErrors) {
          // 검증 에러 처리
          const validationErrors = errorData.error.details.validationErrors;
          const errorMessages = Object.entries(validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setError(`검증 오류: ${errorMessages}`);
        } else {
          setError(`서버 오류: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        // 요청 설정 중 에러가 발생한 경우
        setError('요청 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTagline('');
    setDescription('');
    setType(StudyType.PARTICIPATORY);
    setGeneration('');
    setSlug('');
    setSchedule({
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      frequency: ScheduleFrequency.WEEKLY,
      additionalInfo: ''
    });
    setDuration({
      value: 8,
      unit: DurationUnit.WEEKS
    });
    setCapacity('');
    setRecruitDeadline('');
    setStartDate('');
    setEndDate('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>새 스터디 추가</ModalTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </ModalHeader>
        {customHeader}
        
        <Form onSubmit={handleSubmit}>
          <FormContent>
            {/* 기본 정보 섹션 */}
            <Section>
              <SectionHeader onClick={() => toggleSection('basic')}>
                <SectionTitle>
                  <SectionNumber>1</SectionNumber>
                  기본 정보
                </SectionTitle>
                <ToggleIcon $expanded={expandedSections.basic}>▼</ToggleIcon>
              </SectionHeader>
              
              {expandedSections.basic && (
                <SectionContent>
                  <FormGroup>
                    <Label htmlFor="title">
                      스터디 제목 <Required>*</Required>
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="예: 테코테코"
                      maxLength={100}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="tagline">한 줄 소개</Label>
                    <Input
                      id="tagline"
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="예: 함께 풀어가는 알고리즘의 즐거움"
                      maxLength={200}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="description">
                      스터디 설명 <Required>*</Required>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="스터디에 대한 상세한 설명을 입력하세요"
                      rows={5}
                      maxLength={1000}
                      required
                    />
                    <CharCount>{description.length}/1000</CharCount>
                  </FormGroup>

                  <FormGroup>
                    <Label>스터디 유형</Label>
                    <RadioGroup>
                      <RadioLabel>
                        <RadioInput
                          type="radio"
                          name="type"
                          value={StudyType.PARTICIPATORY}
                          checked={type === StudyType.PARTICIPATORY}
                          onChange={(e) => setType(e.target.value as StudyType)}
                        />
                        <RadioText>참여형</RadioText>
                        <RadioDescription>구성원이 적극적으로 참여하는 스터디</RadioDescription>
                      </RadioLabel>
                      <RadioLabel>
                        <RadioInput
                          type="radio"
                          name="type"
                          value={StudyType.EDUCATIONAL}
                          checked={type === StudyType.EDUCATIONAL}
                          onChange={(e) => setType(e.target.value as StudyType)}
                        />
                        <RadioText>교육형</RadioText>
                        <RadioDescription>강의나 학습 위주의 스터디</RadioDescription>
                      </RadioLabel>
                    </RadioGroup>
                  </FormGroup>
                </SectionContent>
              )}
            </Section>

            {/* 운영 정보 섹션 */}
            <Section>
              <SectionHeader onClick={() => toggleSection('operation')}>
                <SectionTitle>
                  <SectionNumber>2</SectionNumber>
                  운영 정보
                </SectionTitle>
                <ToggleIcon $expanded={expandedSections.operation}>▼</ToggleIcon>
              </SectionHeader>
              
              {expandedSections.operation && (
                <SectionContent>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="generation">기수</Label>
                      <Input
                        id="generation"
                        type="number"
                        value={generation}
                        onChange={(e) => setGeneration(e.target.value)}
                        placeholder="예: 3"
                        min="1"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="slug">URL 식별자</Label>
                      <Input
                        id="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="예: tecoteco"
                        pattern="[a-z0-9-]+"
                        title="소문자, 숫자, 하이픈만 사용 가능"
                      />
                      <HelperText>자동 생성됨. 필요시 수정 가능</HelperText>
                    </FormGroup>
                  </FormRow>

                  <FormGroup>
                    <Label>일정</Label>
                    <ScheduleInput
                      value={schedule}
                      onChange={setSchedule}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>기간</Label>
                    <DurationInput
                      value={duration}
                      onChange={setDuration}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="capacity">정원</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="예: 20"
                      min="1"
                      max="100"
                    />
                  </FormGroup>
                </SectionContent>
              )}
            </Section>

            {/* 모집 정보 섹션 */}
            <Section>
              <SectionHeader onClick={() => toggleSection('recruitment')}>
                <SectionTitle>
                  <SectionNumber>3</SectionNumber>
                  모집 정보
                </SectionTitle>
                <ToggleIcon $expanded={expandedSections.recruitment}>▼</ToggleIcon>
              </SectionHeader>
              
              {expandedSections.recruitment && (
                <SectionContent>
                  <FormGroup>
                    <Label htmlFor="recruitDeadline">모집 마감일</Label>
                    <Input
                      id="recruitDeadline"
                      type="date"
                      value={recruitDeadline}
                      onChange={(e) => setRecruitDeadline(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </FormGroup>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="startDate">시작일</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="endDate">종료일</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || format(new Date(), 'yyyy-MM-dd')}
                      />
                    </FormGroup>
                  </FormRow>
                </SectionContent>
              )}
            </Section>
          </FormContent>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <ButtonGroup>
            <Button
              type="button"
              variant={ButtonVariant.SECONDARY}
              size={ButtonSize.MEDIUM}
              onClick={handleClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant={ButtonVariant.PRIMARY}
              size={ButtonSize.MEDIUM}
              disabled={loading}
            >
              {loading ? '생성 중...' : '스터디 생성'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

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
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.large};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const FormContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 12px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SectionNumber = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
`;

const ToggleIcon = styled.span<{ $expanded: boolean }>`
  transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s ease;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const SectionContent = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  font-size: 14px;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}05;
  }
  
  &:has(input:checked) {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}10;
  }
`;

const RadioInput = styled.input`
  margin-right: 12px;
  margin-top: 2px;
`;

const RadioText = styled.span`
  display: block;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const RadioDescription = styled.span`
  display: block;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 4px;
`;

const HelperText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 4px;
`;

const ErrorMessage = styled.div`
  margin: 0 24px 24px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.error}10;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.error};
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

export default StudyCreateModalEnhanced;