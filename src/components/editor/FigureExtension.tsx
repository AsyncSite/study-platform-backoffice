import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useState, useCallback } from 'react';
import styled from 'styled-components';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

const FigureComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [captionValue, setCaptionValue] = useState(node.attrs.caption || '');

  const handleCaptionBlur = useCallback(() => {
    setIsEditing(false);
    updateAttributes({ caption: captionValue });
  }, [captionValue, updateAttributes]);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCaptionBlur();
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
        setCaptionValue(node.attrs.caption || '');
      }
    },
    [handleCaptionBlur, node.attrs.caption]
  );

  return (
    <NodeViewWrapper>
      <FigureContainer $selected={selected}>
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          draggable={false}
        />
        {isEditing ? (
          <CaptionInput
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={handleCaptionBlur}
            onKeyDown={handleCaptionKeyDown}
            placeholder="캡션을 입력하세요..."
            autoFocus
          />
        ) : (
          <CaptionText
            onClick={() => setIsEditing(true)}
            $hasCaption={!!node.attrs.caption}
          >
            {node.attrs.caption || '클릭하여 캡션 추가'}
          </CaptionText>
        )}
      </FigureContainer>
    </NodeViewWrapper>
  );
};

export const Figure = Node.create({
  name: 'figure',

  group: 'block',

  content: 'inline*',

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          const img = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            caption: figcaption?.textContent || null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption } = HTMLAttributes;
    return [
      'figure',
      { class: 'newsletter-figure' },
      [
        'img',
        mergeAttributes({
          src,
          alt: alt || '',
          class: 'newsletter-image',
        }),
      ],
      caption
        ? ['figcaption', { class: 'newsletter-caption' }, caption]
        : ['figcaption', { class: 'newsletter-caption newsletter-caption-empty' }],
    ];
  },

  addCommands() {
    return {
      setFigure:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureComponent);
  },
});

// Styled Components
const FigureContainer = styled.figure<{ $selected: boolean }>`
  margin: 1.5rem 0;
  padding: 0;
  text-align: center;
  outline: ${({ $selected }) => ($selected ? '2px solid #4f46e5' : 'none')};
  outline-offset: 4px;
  border-radius: 8px;

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
    margin: 0 auto;
  }
`;

const CaptionInput = styled.input`
  display: block;
  width: 100%;
  max-width: 500px;
  margin: 12px auto 0;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  color: #374151;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CaptionText = styled.figcaption<{ $hasCaption: boolean }>`
  margin-top: 12px;
  font-size: 14px;
  color: ${({ $hasCaption }) => ($hasCaption ? '#6b7280' : '#9ca3af')};
  font-style: ${({ $hasCaption }) => ($hasCaption ? 'italic' : 'normal')};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

export default Figure;
