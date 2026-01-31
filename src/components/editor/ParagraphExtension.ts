import Paragraph from '@tiptap/extension-paragraph';

/**
 * 커스텀 Paragraph Extension
 * 이메일 클라이언트(특히 네이버 메일) 호환을 위해 인라인 스타일 추가
 * 모든 paragraph에 min-height 설정하여 빈 줄도 여백 유지
 */
export const CustomParagraph = Paragraph.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      {
        ...HTMLAttributes,
        style: 'margin: 0 0 16px 0; line-height: 1.8; min-height: 1.5em;',
      },
      0,
    ];
  },
});
