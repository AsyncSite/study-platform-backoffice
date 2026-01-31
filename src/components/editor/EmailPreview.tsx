import { useState } from 'react';
import styled from 'styled-components';

interface AnnouncementItem {
  text: string;
  linkUrl?: string;
  linkText?: string;
}

interface EmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  summary?: string;
  announcements?: AnnouncementItem[];
}

type DeviceType = 'desktop' | 'mobile';

const EmailPreview: React.FC<EmailPreviewProps> = ({
  isOpen,
  onClose,
  title,
  content,
  summary = '',
  announcements = [],
}) => {
  const [device, setDevice] = useState<DeviceType>('desktop');

  if (!isOpen) return null;

  // 읽기 시간 계산
  const calculateReadingTime = (html: string): number => {
    const textOnly = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  // 목차 추출
  interface TocItem {
    level: number;
    id: string;
    text: string;
  }

  const extractToc = (html: string): TocItem[] => {
    const items: TocItem[] = [];
    const regex = /<h([12])(?:[^>]*)>(.*?)<\/h\1>/gi;
    let match;
    let counter = 0;

    while ((match = regex.exec(html)) !== null) {
      counter++;
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      items.push({
        level,
        id: `section-${counter}`,
        text,
      });
    }

    return items;
  };

  const readingTime = calculateReadingTime(content);
  const tocItems = extractToc(content);
  const showToc = tocItems.length >= 2;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()} $device={device}>
        <Header>
          <HeaderTitle>이메일 미리보기</HeaderTitle>
          <HeaderControls>
            <DeviceToggle>
              <DeviceButton
                $active={device === 'desktop'}
                onClick={() => setDevice('desktop')}
              >
                🖥️ 데스크톱
              </DeviceButton>
              <DeviceButton
                $active={device === 'mobile'}
                onClick={() => setDevice('mobile')}
              >
                📱 모바일
              </DeviceButton>
            </DeviceToggle>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </HeaderControls>
        </Header>

        <PreviewContainer $device={device}>
          <EmailFrame $device={device}>
            {/* 이메일 헤더 */}
            <EmailHeader>
              <BrandName>Team Grit</BrandName>
              <BrandTag>Newsletter</BrandTag>
            </EmailHeader>

            {/* TL;DR 요약 */}
            {summary && (
              <TldrBox>
                <TldrHeader>
                  <TldrIcon>📌</TldrIcon>
                  <TldrTitle>핵심 요약</TldrTitle>
                  <TldrReadingTime>📖 약 {readingTime}분</TldrReadingTime>
                </TldrHeader>
                <TldrContent>{summary}</TldrContent>
              </TldrBox>
            )}

            {/* 읽기 시간 (요약 없을 때만) */}
            {!summary && (
              <ReadingTimeBadge>
                📖 읽기 시간: 약 {readingTime}분
              </ReadingTimeBadge>
            )}

            {/* 목차 (2개 이상 헤딩이 있을 때만) */}
            {showToc && (
              <TocBox>
                <TocHeader>
                  <TocIcon>📋</TocIcon>
                  <TocTitle>목차</TocTitle>
                </TocHeader>
                <TocList>
                  {tocItems.map((item) => (
                    <TocListItem key={item.id} $level={item.level}>
                      {item.text}
                    </TocListItem>
                  ))}
                </TocList>
              </TocBox>
            )}

            {/* 제목 */}
            {title && <EmailTitle>{title}</EmailTitle>}

            {/* 본문 */}
            <EmailContent dangerouslySetInnerHTML={{ __html: content }} />

            {/* 팀그릿 소식 */}
            {announcements.length > 0 && (
              <AnnouncementsBox>
                <AnnouncementsDivider />
                <AnnouncementsTitle>📢 팀그릿 소식</AnnouncementsTitle>
                <AnnouncementsList>
                  {announcements.map((item, index) => (
                    <AnnouncementsItem key={index}>
                      <AnnouncementsBullet>•</AnnouncementsBullet>
                      <span>{item.text}</span>
                      {item.linkUrl && (
                        <AnnouncementsLink>
                          → {item.linkText || '자세히'}
                        </AnnouncementsLink>
                      )}
                    </AnnouncementsItem>
                  ))}
                </AnnouncementsList>
              </AnnouncementsBox>
            )}

            {/* 피드백 & 공유 섹션 */}
            <FeedbackBox>
              <FeedbackMainText>
                의견이 있으신가요?<br />
                이 메일에 <ReplyHighlight>답장</ReplyHighlight>해주세요!
              </FeedbackMainText>
              <FeedbackSubText>
                좋았던 점, 아쉬웠던 점, 다뤄줬으면 하는 주제 등<br />
                모든 피드백을 직접 읽고 있습니다.
              </FeedbackSubText>
              <FeedbackDivider />
              <ForwardText>
                이 뉴스레터가 마음에 드셨다면 지인에게 <strong>전달</strong>해주세요!
              </ForwardText>
              <SubscribeText>
                이 메일을 전달받으셨나요? <SubscribeLink>여기서 구독하세요</SubscribeLink>
              </SubscribeText>
            </FeedbackBox>

            {/* 푸터 */}
            <EmailFooter>
              <FooterText>이 메일은 Team Grit 뉴스레터 구독자에게 발송됩니다.</FooterText>
              <FooterCopyright>© 2025 Team Grit by AsyncSite. All rights reserved.</FooterCopyright>
              <UnsubscribeLink>구독 취소</UnsubscribeLink>
            </EmailFooter>
          </EmailFrame>
        </PreviewContainer>

        <Footer>
          <FooterHint>
            💡 실제 이메일 클라이언트에서는 약간 다르게 보일 수 있습니다
          </FooterHint>
          <CloseButtonBottom onClick={onClose}>닫기</CloseButtonBottom>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default EmailPreview;

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div<{ $device: DeviceType }>`
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: ${({ $device }) => ($device === 'mobile' ? '500px' : '900px')};
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: max-width 0.3s ease;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const DeviceToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
`;

const DeviceButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $active }) => ($active ? '#4f46e5' : 'transparent')};
  color: ${({ $active }) => ($active ? 'white' : '#6b7280')};

  &:hover {
    color: ${({ $active }) => ($active ? 'white' : '#111827')};
  }
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #111827;
  }
`;

const PreviewContainer = styled.div<{ $device: DeviceType }>`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f9fafb;
  display: flex;
  justify-content: center;
  color-scheme: light;
`;

const EmailFrame = styled.div<{ $device: DeviceType }>`
  background: white !important;
  background-color: white !important;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  width: 100%;
  max-width: ${({ $device }) => ($device === 'mobile' ? '375px' : '680px')};
  transition: max-width 0.3s ease;
  position: relative;
  z-index: 1;
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
  color-scheme: light;

  /* 다크 모드 미디어 쿼리 무시 */
  *, *::before, *::after {
    color-scheme: light;
  }

  .email-container {
    background-color: white !important;
  }

  table {
    background-color: white !important;
  }
`;

const EmailHeader = styled.div`
  padding: 30px 30px 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: white;
`;

const BrandName = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: #16a34a;
`;

const BrandTag = styled.span`
  font-size: 14px;
  color: #6b7280;
  margin-left: 8px;
`;

const ReadingTimeBadge = styled.div`
  padding: 20px 30px 0;
  background-color: white;

  &::before {
    content: '';
  }

  display: inline-block;
  margin: 20px 30px 0;
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  background-color: #f3f4f6;
  padding: 6px 12px;
  border-radius: 16px;
`;

const EmailTitle = styled.h1`
  padding: 20px 30px 0;
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  background-color: white;
`;

const EmailContent = styled.div`
  padding: 30px;
  font-size: 16px;
  color: #374151 !important;
  line-height: 1.8;
  background-color: white !important;
  color-scheme: light;

  /* 다크 모드 미디어 쿼리 무시 - 모든 자식 요소 */
  *, *::before, *::after {
    color-scheme: light;
  }

  /* 이메일 템플릿 다크 모드 스타일 오버라이드 */
  .email-container,
  .email-content,
  table,
  td,
  th,
  div {
    background-color: inherit;
    color: inherit;
  }

  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 24px 0 12px 0;
    color: #111827;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 20px 0 10px 0;
    color: #1f2937;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 16px 0 8px 0;
    color: #374151;
  }

  p {
    margin: 0 0 16px 0;
    line-height: 1.8;
  }

  ul, ol {
    margin: 0 0 16px 0;
    padding-left: 24px;
  }

  li {
    margin-bottom: 8px;
    line-height: 1.6;
  }

  a {
    color: #4f46e5;
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
  }

  blockquote {
    border-left: 4px solid #16a34a;
    padding: 12px 20px;
    margin: 20px 0;
    background: #f0fdf4;
    font-style: italic;
    color: #374151;
  }

  pre {
    background: #1f2937;
    color: #e5e7eb;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    margin: 16px 0;
  }

  code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #e11d48;
  }

  pre code {
    background: none;
    padding: 0;
    color: inherit;
  }

  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 32px 0;
  }

  /* 섹션 브레이크 스타일 */
  .section-break {
    text-align: center;
    margin: 24px 0;
  }

  .section-break-dots {
    font-size: 18px;
    color: #9ca3af;
    letter-spacing: 8px;
  }

  /* 세로 구분선 스타일 */
  .vertical-break {
    text-align: center;
    margin: 24px 0;
  }

  .vertical-break-line {
    display: inline-block;
    width: 1px;
    height: 40px;
    background-color: #d1d5db;
  }

  mark {
    background: #fef08a;
    padding: 2px 4px;
    border-radius: 2px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    border: 1px solid #e5e7eb;
  }

  th, td {
    border: 1px solid #e5e7eb;
    padding: 12px 16px;
    text-align: left;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #111827;
  }

  figure {
    margin: 24px 0;
    text-align: center;
  }

  figcaption {
    margin-top: 12px;
    font-size: 14px;
    color: #6b7280;
    font-style: italic;
  }
`;

const EmailFooter = styled.div`
  padding: 25px 30px;
  border-top: 1px solid #e9ecef;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  text-align: center;
`;

const FooterText = styled.p`
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #6b7280;
`;

const FooterCopyright = styled.p`
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
`;

const UnsubscribeLink = styled.a`
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  color: #9ca3af;
  text-decoration: underline;
  cursor: pointer;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
`;

const FooterHint = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const CloseButtonBottom = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #4f46e5;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

// TL;DR Box Styles
const TldrBox = styled.div`
  margin: 20px 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
`;

const TldrHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const TldrIcon = styled.span`
  font-size: 18px;
`;

const TldrTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #166534;
`;

const TldrReadingTime = styled.span`
  margin-left: auto;
  font-size: 13px;
  color: #6b7280;
  background: white;
  padding: 4px 10px;
  border-radius: 12px;
`;

const TldrContent = styled.div`
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
  white-space: pre-wrap;
`;

// TOC Box Styles
const TocBox = styled.div`
  margin: 20px 30px;
  padding: 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
`;

const TocHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const TocIcon = styled.span`
  font-size: 16px;
`;

const TocTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const TocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TocListItem = styled.div<{ $level: number }>`
  font-size: ${({ $level }) => ($level === 1 ? '14px' : '13px')};
  font-weight: ${({ $level }) => ($level === 1 ? '600' : '400')};
  color: #374151;
  padding-left: ${({ $level }) => ($level === 2 ? '16px' : '0')};
  line-height: 1.5;
  cursor: pointer;

  &:hover {
    color: #4f46e5;
  }
`;

// Announcements Section Styles
const AnnouncementsBox = styled.div`
  padding: 0 30px 24px;
  background-color: white;
`;

const AnnouncementsDivider = styled.div`
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
`;

const AnnouncementsTitle = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
`;

const AnnouncementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AnnouncementsItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
`;

const AnnouncementsBullet = styled.span`
  color: #9ca3af;
`;

const AnnouncementsLink = styled.span`
  color: #16a34a;
  margin-left: 4px;
`;

// Feedback & Share Section Styles
const FeedbackBox = styled.div`
  margin: 0 30px 30px;
  padding: 24px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
`;

const FeedbackMainText = styled.p`
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
`;

const ReplyHighlight = styled.strong`
  color: #16a34a;
`;

const FeedbackSubText = styled.p`
  margin: 0 0 20px 0;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
`;

const FeedbackDivider = styled.div`
  border-top: 1px solid #e5e7eb;
  margin: 20px 0;
`;

const ForwardText = styled.p`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;

  strong {
    font-weight: 600;
  }
`;

const SubscribeText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
`;

const SubscribeLink = styled.span`
  color: #16a34a;
  text-decoration: underline;
  cursor: pointer;
`;
