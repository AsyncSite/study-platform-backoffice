import Highlight from '@tiptap/extension-highlight';

/**
 * 커스텀 Highlight Extension
 * 이메일 클라이언트(특히 네이버 메일) 호환을 위해 인라인 스타일 추가
 * 노란색 형광펜 효과
 */
export const CustomHighlight = Highlight.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      {
        ...HTMLAttributes,
        style: 'background: #fef08a; padding: 2px 4px; border-radius: 2px;',
      },
      0,
    ];
  },
});
