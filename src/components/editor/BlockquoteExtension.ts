import Blockquote from '@tiptap/extension-blockquote';

/**
 * 커스텀 Blockquote Extension
 * 이메일 클라이언트(특히 네이버 메일) 호환을 위해 인라인 스타일 추가
 * 초록색 왼쪽 테두리와 연한 초록 배경으로 인용문 스타일링
 */
export const CustomBlockquote = Blockquote.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      {
        ...HTMLAttributes,
        style: 'border-left: 4px solid #16a34a; padding: 12px 20px; margin: 20px 0; background: #f0fdf4; font-style: italic; color: #374151;',
      },
      0,
    ];
  },
});
