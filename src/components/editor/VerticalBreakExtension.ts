import { Node, mergeAttributes } from '@tiptap/core';
import { InputRule } from '@tiptap/core';

export interface VerticalBreakOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    verticalBreak: {
      setVerticalBreak: () => ReturnType;
    };
  }
}

export const VerticalBreak = Node.create<VerticalBreakOptions>({
  name: 'verticalBreak',

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div[data-vertical-break]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-vertical-break': '',
          class: 'vertical-break',
          style: 'text-align: center; margin: 24px 0;'
        },
        HTMLAttributes
      ),
      ['span', {
        class: 'vertical-break-line',
        style: 'display: inline-block; width: 1px; height: 40px; background-color: #d1d5db;'
      }],
    ];
  },

  addCommands() {
    return {
      setVerticalBreak:
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
      // ||| 입력 시 세로 브레이크로 변환
      new InputRule({
        find: /^\|\|\|\s$/,
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
