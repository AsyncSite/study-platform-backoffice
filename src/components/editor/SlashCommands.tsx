import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor, Extension } from '@tiptap/core';
import type { Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import tippy from 'tippy.js';
import type { Instance as TippyInstance } from 'tippy.js';
import styled from 'styled-components';

interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

const getSuggestionItems = (onImageUpload: () => void): CommandItem[] => [
  {
    title: '제목 1',
    description: '큰 제목을 추가합니다',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: '제목 2',
    description: '중간 크기 제목을 추가합니다',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: '제목 3',
    description: '작은 제목을 추가합니다',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: '글머리 목록',
    description: '글머리 기호 목록을 생성합니다',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: '번호 목록',
    description: '번호가 매겨진 목록을 생성합니다',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: '인용문',
    description: '인용문 블록을 추가합니다',
    icon: '"',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: '코드 블록',
    description: '코드 블록을 추가합니다',
    icon: '</>',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: '구분선',
    description: '가로 구분선을 추가합니다',
    icon: '―',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: '이미지',
    description: '이미지를 업로드합니다',
    icon: '📷',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      onImageUpload();
    },
  },
  {
    title: '테이블',
    description: '3x3 테이블을 삽입합니다',
    icon: '▦',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
];

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  editor: Editor;
}

const CommandList = ({ items, command }: CommandListProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [items, command]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }

      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, selectItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const selectedElement = container.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <CommandListContainer>
        <EmptyState>결과가 없습니다</EmptyState>
      </CommandListContainer>
    );
  }

  return (
    <CommandListContainer ref={containerRef}>
      {items.map((item, index) => (
        <CommandItem
          key={item.title}
          $active={index === selectedIndex}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <CommandIcon>{item.icon}</CommandIcon>
          <CommandContent>
            <CommandTitle>{item.title}</CommandTitle>
            <CommandDescription>{item.description}</CommandDescription>
          </CommandContent>
        </CommandItem>
      ))}
    </CommandListContainer>
  );
};

interface SuggestionPluginProps {
  onImageUpload: () => void;
}

export const createSlashCommandsExtension = ({ onImageUpload }: SuggestionPluginProps) => {
  return Extension.create({
    name: 'slashCommands',

    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
            props.command({ editor, range });
          },
        } as Partial<SuggestionOptions>,
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => {
            const allItems = getSuggestionItems(onImageUpload);
            return allItems.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase())
            );
          },
          render: () => {
            let component: ReactRenderer | null = null;
            let popup: TippyInstance[] | null = null;

            return {
              onStart: (props: SuggestionProps<CommandItem>) => {
                component = new ReactRenderer(CommandList, {
                  props: {
                    ...props,
                    command: (item: CommandItem) => {
                      props.command(item);
                    },
                  },
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: SuggestionProps<CommandItem>) {
                component?.updateProps({
                  ...props,
                  command: (item: CommandItem) => {
                    props.command(item);
                  },
                });

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },

              onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }

                return false;
              },

              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        }),
      ];
    },
  });
};

// Styled Components
const CommandListContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  max-height: 320px;
  overflow-y: auto;
  min-width: 280px;
`;

const CommandItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#f3f4f6' : 'transparent')};
  transition: background 0.1s;

  &:hover {
    background: #f3f4f6;
  }
`;

const CommandIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const CommandContent = styled.div`
  flex: 1;
`;

const CommandTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`;

const CommandDescription = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const EmptyState = styled.div`
  padding: 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
`;
