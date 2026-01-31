import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCountExtension from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { CustomHighlight } from './HighlightExtension';
import { CustomHorizontalRule } from './HorizontalRuleExtension';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import styled from 'styled-components';
import { newslettersApi } from '../../api/newsletters';
import { createSlashCommandsExtension } from './SlashCommands';
import { Figure } from './FigureExtension';
import { SectionBreak } from './SectionBreakExtension';
import { VerticalBreak } from './VerticalBreakExtension';
import { CustomParagraph } from './ParagraphExtension';
import { CustomBlockquote } from './BlockquoteExtension';
import EmailPreview from './EmailPreview';
import DraftRecoveryModal from './DraftRecoveryModal';

const lowlight = createLowlight(common);

interface AnnouncementItem {
  text: string;
  linkUrl?: string;
  linkText?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  title?: string;
  draftKey?: string;
  summary?: string;
  onSummaryChange?: (summary: string) => void;
  announcements?: AnnouncementItem[];
  onAnnouncementsChange?: (announcements: AnnouncementItem[]) => void;
}

const DRAFT_STORAGE_KEY = 'newsletter-draft';

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  maxLength = 50000,
  disabled = false,
  title = '',
  draftKey = DRAFT_STORAGE_KEY,
  summary = '',
  onSummaryChange,
  announcements = [],
  onAnnouncementsChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{ content: string; time: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedDraft = useRef(false);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        paragraph: false,
        blockquote: false,
        horizontalRule: false,
      }),
      CustomParagraph,
      CustomBlockquote,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCountExtension.configure({
        limit: maxLength,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'newsletter-image',
        },
      }),
      Figure,
      SectionBreak,
      VerticalBreak,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CustomHighlight.configure({
        multicolor: false,
      }),
      CustomHorizontalRule,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'newsletter-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      createSlashCommandsExtension({
        onImageUpload: handleImageButtonClick,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Auto-save indicator
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
        // Store draft to localStorage with timestamp
        localStorage.setItem(draftKey, html);
        localStorage.setItem(`${draftKey}-time`, new Date().toISOString());
      }, 1000);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // 드래프트 복구 체크
  useEffect(() => {
    if (hasCheckedDraft.current) return;
    hasCheckedDraft.current = true;

    const savedContent = localStorage.getItem(draftKey);
    const savedTime = localStorage.getItem(`${draftKey}-time`);

    if (savedContent && savedTime) {
      // 현재 값과 다른 경우에만 복구 제안
      const isContentDifferent = savedContent !== value && savedContent.length > 20;
      if (isContentDifferent) {
        const date = new Date(savedTime);
        const formattedTime = date.toLocaleString('ko-KR', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        setSavedDraft({ content: savedContent, time: formattedTime });
        setShowDraftRecovery(true);
      }
    }
  }, [draftKey, value]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleRecoverDraft = () => {
    if (savedDraft && editor) {
      editor.commands.setContent(savedDraft.content);
      onChange(savedDraft.content);
    }
    setShowDraftRecovery(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(`${draftKey}-time`);
    setShowDraftRecovery(false);
  };

  // 드래프트 미리보기 텍스트 생성
  const getDraftPreviewText = (): string => {
    if (!savedDraft) return '';
    const textOnly = savedDraft.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textOnly.substring(0, 150) + (textOnly.length > 150 ? '...' : '');
  };

  const characterCount = editor?.storage.characterCount.characters() || 0;
  const wordCount = editor?.storage.characterCount.words() || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleHeading = (level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  const handleBold = () => editor?.chain().focus().toggleBold().run();
  const handleItalic = () => editor?.chain().focus().toggleItalic().run();
  const handleStrike = () => editor?.chain().focus().toggleStrike().run();
  const handleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const handleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const handleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const handleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const handleHorizontalRule = () => editor?.chain().focus().setHorizontalRule().run();
  const handleSectionBreak = () => editor?.chain().focus().setSectionBreak().run();
  const handleVerticalBreak = () => editor?.chain().focus().setVerticalBreak().run();
  const handleHighlight = () => editor?.chain().focus().toggleHighlight().run();

  const handleTextAlign = (alignment: 'left' | 'center' | 'right') => {
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  const handleInsertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleAddColumnAfter = () => editor?.chain().focus().addColumnAfter().run();
  const handleDeleteColumn = () => editor?.chain().focus().deleteColumn().run();
  const handleAddRowAfter = () => editor?.chain().focus().addRowAfter().run();
  const handleDeleteRow = () => editor?.chain().focus().deleteRow().run();
  const handleDeleteTable = () => editor?.chain().focus().deleteTable().run();

  const handleLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL을 입력하세요:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP만 가능합니다.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일 크기가 너무 큽니다. 최대 5MB까지 가능합니다.');
      return;
    }

    setIsUploading(true);

    try {
      const response = await newslettersApi.uploadImage(file);
      editor.chain().focus().setFigure({ src: response.url, caption: '' }).run();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleImageUpload(imageFile);
    }
  }, [disabled, isUploading, handleImageUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <EditorWrapper $disabled={disabled}>
      {/* TL;DR 요약 입력 섹션 */}
      <SummarySection>
        <SummaryHeader>
          <SummaryLabel>
            <SummaryIcon>📌</SummaryIcon>
            핵심 요약 <SummaryOptional>(선택)</SummaryOptional>
          </SummaryLabel>
          <SummaryCount>{summary.length}/200</SummaryCount>
        </SummaryHeader>
        <SummaryTextarea
          placeholder="• 이번 뉴스레터의 핵심 포인트 1&#10;• 핵심 포인트 2&#10;• 핵심 포인트 3"
          value={summary}
          onChange={(e) => {
            const newValue = e.target.value.slice(0, 200);
            onSummaryChange?.(newValue);
          }}
          disabled={disabled}
          maxLength={200}
        />
        <SummaryHint>바쁜 독자를 위해 3줄 이내로 핵심만 요약해주세요</SummaryHint>
      </SummarySection>

      <Toolbar>
        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={() => handleHeading(1)}
            $active={editor?.isActive('heading', { level: 1 })}
            disabled={disabled}
            title="제목 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={() => handleHeading(2)}
            $active={editor?.isActive('heading', { level: 2 })}
            disabled={disabled}
            title="제목 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={() => handleHeading(3)}
            $active={editor?.isActive('heading', { level: 3 })}
            disabled={disabled}
            title="제목 3"
          >
            H3
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={handleBold}
            $active={editor?.isActive('bold')}
            disabled={disabled}
            title="굵게 (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleItalic}
            $active={editor?.isActive('italic')}
            disabled={disabled}
            title="기울임 (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleStrike}
            $active={editor?.isActive('strike')}
            disabled={disabled}
            title="취소선"
          >
            <s>S</s>
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleHighlight}
            $active={editor?.isActive('highlight')}
            disabled={disabled}
            title="형광펜"
            $highlight
          >
            H
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={() => handleTextAlign('left')}
            $active={editor?.isActive({ textAlign: 'left' })}
            disabled={disabled}
            title="왼쪽 정렬"
          >
            ≡←
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={() => handleTextAlign('center')}
            $active={editor?.isActive({ textAlign: 'center' })}
            disabled={disabled}
            title="가운데 정렬"
          >
            ≡↔
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={() => handleTextAlign('right')}
            $active={editor?.isActive({ textAlign: 'right' })}
            disabled={disabled}
            title="오른쪽 정렬"
          >
            ≡→
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={handleBulletList}
            $active={editor?.isActive('bulletList')}
            disabled={disabled}
            title="글머리 기호"
          >
            • 목록
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleOrderedList}
            $active={editor?.isActive('orderedList')}
            disabled={disabled}
            title="번호 목록"
          >
            1. 목록
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={handleBlockquote}
            $active={editor?.isActive('blockquote')}
            disabled={disabled}
            title="인용문 (>)"
          >
            " 인용
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleCodeBlock}
            $active={editor?.isActive('codeBlock')}
            disabled={disabled}
            title="코드 블록 (```)"
          >
            &lt;/&gt;
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleHorizontalRule}
            disabled={disabled}
            title="구분선 (---)"
          >
            ―
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleSectionBreak}
            disabled={disabled}
            title="섹션 브레이크 (***)"
          >
            •••
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleVerticalBreak}
            disabled={disabled}
            title="세로 구분선 (|||)"
          >
            │
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={handleLink}
            $active={editor?.isActive('link')}
            disabled={disabled}
            title="링크"
          >
            링크
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleImageButtonClick}
            disabled={disabled || isUploading}
            title="이미지 삽입"
            $loading={isUploading}
          >
            {isUploading ? '업로드 중...' : '이미지'}
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            type="button"
            onClick={handleInsertTable}
            disabled={disabled}
            title="테이블 삽입 (3x3)"
          >
            표
          </ToolbarButton>
          {editor?.isActive('table') && (
            <>
              <ToolbarButton
                type="button"
                onClick={handleAddColumnAfter}
                disabled={disabled}
                title="오른쪽에 열 추가"
              >
                +열
              </ToolbarButton>
              <ToolbarButton
                type="button"
                onClick={handleAddRowAfter}
                disabled={disabled}
                title="아래에 행 추가"
              >
                +행
              </ToolbarButton>
              <ToolbarButton
                type="button"
                onClick={handleDeleteColumn}
                disabled={disabled}
                title="열 삭제"
                $danger
              >
                -열
              </ToolbarButton>
              <ToolbarButton
                type="button"
                onClick={handleDeleteRow}
                disabled={disabled}
                title="행 삭제"
                $danger
              >
                -행
              </ToolbarButton>
              <ToolbarButton
                type="button"
                onClick={handleDeleteTable}
                disabled={disabled}
                title="테이블 삭제"
                $danger
              >
                삭제
              </ToolbarButton>
            </>
          )}
        </ToolbarGroup>

        <SlashHint>/ 입력으로 명령어 팔레트 열기</SlashHint>
      </Toolbar>

      <EditorContentWrapper onDrop={handleDrop} onDragOver={handleDragOver}>
        <EditorContent editor={editor} />
      </EditorContentWrapper>

      {/* 공지사항 섹션 */}
      <AnnouncementsSection>
        <AnnouncementsHeader>
          <AnnouncementsLabel>
            <AnnouncementsIcon>📢</AnnouncementsIcon>
            팀그릿 소식 <AnnouncementsOptional>(선택)</AnnouncementsOptional>
          </AnnouncementsLabel>
        </AnnouncementsHeader>

        {announcements.map((item, index) => (
          <AnnouncementRow key={index}>
            <AnnouncementInputGroup>
              <AnnouncementTextInput
                placeholder="공지 내용"
                value={item.text}
                onChange={(e) => {
                  const newAnnouncements = [...announcements];
                  newAnnouncements[index] = { ...item, text: e.target.value };
                  onAnnouncementsChange?.(newAnnouncements);
                }}
                disabled={disabled}
              />
              <AnnouncementLinkInput
                placeholder="링크 URL (선택)"
                value={item.linkUrl || ''}
                onChange={(e) => {
                  const newAnnouncements = [...announcements];
                  newAnnouncements[index] = { ...item, linkUrl: e.target.value };
                  onAnnouncementsChange?.(newAnnouncements);
                }}
                disabled={disabled}
              />
              <AnnouncementLinkTextInput
                placeholder="링크 텍스트 (선택)"
                value={item.linkText || ''}
                onChange={(e) => {
                  const newAnnouncements = [...announcements];
                  newAnnouncements[index] = { ...item, linkText: e.target.value };
                  onAnnouncementsChange?.(newAnnouncements);
                }}
                disabled={disabled}
              />
            </AnnouncementInputGroup>
            <AnnouncementDeleteButton
              type="button"
              onClick={() => {
                const newAnnouncements = announcements.filter((_, i) => i !== index);
                onAnnouncementsChange?.(newAnnouncements);
              }}
              disabled={disabled}
            >
              ✕
            </AnnouncementDeleteButton>
          </AnnouncementRow>
        ))}

        <AnnouncementAddButton
          type="button"
          onClick={() => {
            onAnnouncementsChange?.([...announcements, { text: '', linkUrl: '', linkText: '' }]);
          }}
          disabled={disabled}
        >
          + 소식 추가
        </AnnouncementAddButton>
        <AnnouncementsHint>뉴스레터 하단에 표시됩니다. 비워두면 표시되지 않습니다.</AnnouncementsHint>
      </AnnouncementsSection>

      <Footer>
        <FooterLeft>
          <FooterHint>이미지: 드래그 앤 드롭 또는 버튼 클릭 (최대 5MB)</FooterHint>
          {saveStatus && (
            <SaveStatus $status={saveStatus}>
              {saveStatus === 'saving' ? '저장 중...' : '저장됨'}
            </SaveStatus>
          )}
        </FooterLeft>
        <FooterRight>
          <ReadingTime>읽기 시간: 약 {readingTime}분</ReadingTime>
          <CharacterCount>{characterCount.toLocaleString()} / {maxLength.toLocaleString()}</CharacterCount>
          <PreviewButton type="button" onClick={() => setIsPreviewOpen(true)}>
            👁️ 미리보기
          </PreviewButton>
        </FooterRight>
      </Footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* 이메일 미리보기 모달 */}
      <EmailPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        content={editor?.getHTML() || ''}
        summary={summary}
        announcements={announcements.filter(a => a.text.trim() !== '')}
      />

      {/* 드래프트 복구 모달 */}
      <DraftRecoveryModal
        isOpen={showDraftRecovery}
        onRecover={handleRecoverDraft}
        onDiscard={handleDiscardDraft}
        savedAt={savedDraft?.time || ''}
        previewText={getDraftPreviewText()}
      />
    </EditorWrapper>
  );
};

export default RichTextEditor;

// Styled Components
const EditorWrapper = styled.div<{ $disabled?: boolean }>`
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  background: ${({ $disabled }) => ($disabled ? '#f3f4f6' : 'white')};
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 4px;
`;

const ToolbarGroup = styled.div`
  display: flex;
  gap: 2px;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: #d1d5db;
  margin: 0 8px;
`;

const ToolbarButton = styled.button<{ $active?: boolean; $loading?: boolean; $highlight?: boolean; $danger?: boolean }>`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: ${({ $active, $loading, $highlight, $danger }) =>
    $loading ? '#fef3c7' : $danger ? 'transparent' : $active ? ($highlight ? '#fef08a' : '#e0e7ff') : 'transparent'};
  color: ${({ $active, $loading, $danger }) =>
    $loading ? '#92400e' : $danger ? '#dc2626' : $active ? '#4f46e5' : '#374151'};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ $active, $highlight, $danger }) =>
      $danger ? '#fee2e2' : $active ? ($highlight ? '#fde047' : '#c7d2fe') : '#e5e7eb'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SlashHint = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: #9ca3af;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
`;

const EditorContentWrapper = styled.div`
  padding: 16px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;

  .tiptap {
    outline: none;
    min-height: 250px;

    > * + * {
      margin-top: 0.75em;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    p {
      line-height: 1.6;
    }

    ul, ol {
      padding-left: 1.5rem;
    }

    a {
      color: #4f46e5;
      text-decoration: underline;
    }

    /* 인용문 스타일 */
    blockquote {
      border-left: 4px solid #16a34a;
      padding: 12px 20px;
      margin: 20px 0;
      background: #f0fdf4;
      font-style: italic;
      color: #374151;
    }

    /* 코드 블록 스타일 */
    pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 14px;
      line-height: 1.5;

      code {
        background: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
      }
    }

    /* 인라인 코드 스타일 */
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 0.9em;
      color: #e11d48;
    }

    /* 구분선 스타일 */
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 32px 0;
    }

    /* 섹션 브레이크 스타일 */
    .section-break {
      text-align: center;
      margin: 24px 0;
      user-select: none;
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
      user-select: none;
    }

    .vertical-break-line {
      display: inline-block;
      width: 1px;
      height: 40px;
      background-color: #d1d5db;
    }

    /* 형광펜 스타일 */
    mark {
      background: #fef08a;
      padding: 2px 4px;
      border-radius: 2px;
    }

    /* 이미지 스타일 */
    img.newsletter-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1rem 0;
      display: block;
    }

    /* 테이블 스타일 */
    table.newsletter-table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      th, td {
        border: 1px solid #e5e7eb;
        padding: 12px 16px;
        text-align: left;
        vertical-align: top;
        min-width: 100px;
      }

      th {
        background: #f9fafb;
        font-weight: 600;
        color: #111827;
      }

      td {
        background: white;
      }

      tr:hover td {
        background: #f9fafb;
      }

      /* 선택된 셀 스타일 */
      .selectedCell {
        background: #e0e7ff !important;
      }

      /* 리사이즈 핸들 */
      .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #4f46e5;
        cursor: col-resize;
      }
    }

    /* Figure (이미지 + 캡션) 스타일 */
    figure.newsletter-figure {
      margin: 1.5rem 0;
      padding: 0;
      text-align: center;

      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        display: block;
        margin: 0 auto;
      }

      figcaption.newsletter-caption {
        margin-top: 12px;
        font-size: 14px;
        color: #6b7280;
        font-style: italic;
      }

      figcaption.newsletter-caption-empty {
        display: none;
      }
    }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #9ca3af;
      pointer-events: none;
      height: 0;
    }

    /* lowlight 구문 강조 스타일 */
    .hljs-comment,
    .hljs-quote {
      color: #6b7280;
    }

    .hljs-variable,
    .hljs-template-variable,
    .hljs-attribute,
    .hljs-tag,
    .hljs-name,
    .hljs-regexp,
    .hljs-link,
    .hljs-selector-id,
    .hljs-selector-class {
      color: #f87171;
    }

    .hljs-number,
    .hljs-meta,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-literal,
    .hljs-type,
    .hljs-params {
      color: #fb923c;
    }

    .hljs-string,
    .hljs-symbol,
    .hljs-bullet {
      color: #4ade80;
    }

    .hljs-title,
    .hljs-section {
      color: #facc15;
    }

    .hljs-keyword,
    .hljs-selector-tag {
      color: #c084fc;
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-strong {
      font-weight: 700;
    }
  }
`;

const Footer = styled.div`
  padding: 8px 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const FooterHint = styled.span`
  font-size: 11px;
  color: #9ca3af;
`;

const SaveStatus = styled.span<{ $status: 'saved' | 'saving' }>`
  font-size: 11px;
  color: ${({ $status }) => ($status === 'saved' ? '#16a34a' : '#f59e0b')};
`;

const ReadingTime = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const CharacterCount = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const PreviewButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

// Summary Section Styles
const SummarySection = styled.div`
  padding: 16px;
  background: #f0fdf4;
  background-color: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
  position: relative;
  z-index: 1;
`;

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SummaryLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #166534;
`;

const SummaryIcon = styled.span`
  font-size: 16px;
`;

const SummaryOptional = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
`;

const SummaryCount = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const SummaryTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: white;
  background-color: white;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  cursor: text;
  pointer-events: auto;
  position: relative;
  z-index: 1;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const SummaryHint = styled.div`
  margin-top: 6px;
  font-size: 11px;
  color: #6b7280;
`;

// Announcements Section Styles
const AnnouncementsSection = styled.div`
  padding: 16px;
  background: #f9fafb;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  position: relative;
  z-index: 1;
`;

const AnnouncementsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AnnouncementsLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const AnnouncementsIcon = styled.span`
  font-size: 14px;
`;

const AnnouncementsOptional = styled.span`
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
`;

const AnnouncementRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
`;

const AnnouncementInputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AnnouncementTextInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  background-color: white;
  box-sizing: border-box;
  pointer-events: auto;
  position: relative;
  z-index: 1;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #6b7280;
    box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const AnnouncementLinkInput = styled.input`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #9ca3af;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const AnnouncementLinkTextInput = styled(AnnouncementLinkInput)``;

const AnnouncementDeleteButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const AnnouncementAddButton = styled.button`
  padding: 8px 12px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: transparent;
  background-color: transparent;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  pointer-events: auto;
  position: relative;
  z-index: 1;

  &:hover {
    border-color: #9ca3af;
    background: #f3f4f6;
    background-color: #f3f4f6;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const AnnouncementsHint = styled.div`
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
`;
