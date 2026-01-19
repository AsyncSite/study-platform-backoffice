import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCountExtension from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import styled from 'styled-components';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  maxLength = 50000,
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
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
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const characterCount = editor?.storage.characterCount.characters() || 0;

  const handleHeading = (level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  const handleBold = () => editor?.chain().focus().toggleBold().run();
  const handleItalic = () => editor?.chain().focus().toggleItalic().run();
  const handleStrike = () => editor?.chain().focus().toggleStrike().run();
  const handleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const handleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();

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

  return (
    <EditorWrapper $disabled={disabled}>
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
            title="굵게"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            type="button"
            onClick={handleItalic}
            $active={editor?.isActive('italic')}
            disabled={disabled}
            title="기울임"
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
            onClick={handleLink}
            $active={editor?.isActive('link')}
            disabled={disabled}
            title="링크"
          >
            링크
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>

      <EditorContentWrapper>
        <EditorContent editor={editor} />
      </EditorContentWrapper>

      <Footer>
        <CharacterCount>{characterCount.toLocaleString()} / {maxLength.toLocaleString()}</CharacterCount>
      </Footer>
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

const ToolbarButton = styled.button<{ $active?: boolean }>`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#e0e7ff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#4f46e5' : '#374151')};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? '#c7d2fe' : '#e5e7eb')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #9ca3af;
      pointer-events: none;
      height: 0;
    }
  }
`;

const Footer = styled.div`
  padding: 8px 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
`;

const CharacterCount = styled.span`
  font-size: 12px;
  color: #6b7280;
`;
