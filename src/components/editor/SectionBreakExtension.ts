import { Node, mergeAttributes } from '@tiptap/core';
import { InputRule } from '@tiptap/core';

export interface SectionBreakOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionBreak: {
      setSectionBreak: () => ReturnType;
    };
  }
}

export const SectionBreak = Node.create<SectionBreakOptions>({
  name: 'sectionBreak',

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div[data-section-break]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-section-break': '', class: 'section-break' },
        HTMLAttributes
      ),
      ['span', { class: 'section-break-dots' }, '•  •  •'],
    ];
  },

  addCommands() {
    return {
      setSectionBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      // *** 입력 시 섹션 브레이크로 변환
      new InputRule({
        find: /^\*\*\*\s$/,
        handler: ({ range, chain }) => {
          chain()
            .deleteRange(range)
            .insertContent({ type: this.name })
            .run();
        },
      }),
      // ... 입력 시 섹션 브레이크로 변환
      new InputRule({
        find: /^\.\.\.\s$/,
        handler: ({ range, chain }) => {
          chain()
            .deleteRange(range)
            .insertContent({ type: this.name })
            .run();
        },
      }),
    ];
  },
});
