import Paragraph from '@tiptap/extension-paragraph';

/**
 * 커스텀 Paragraph Extension
 * 이메일 클라이언트(특히 네이버 메일) 호환을 위해 인라인 스타일 추가
 */
export const CustomParagraph = Paragraph.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      {
        ...HTMLAttributes,
        style: 'margin: 0 0 16px 0; line-height: 1.8;',
      },
      0,
    ];
  },
});
