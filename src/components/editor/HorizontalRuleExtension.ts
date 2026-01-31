import HorizontalRule from '@tiptap/extension-horizontal-rule';

/**
 * 커스텀 HorizontalRule Extension
 * 이메일 클라이언트(특히 네이버 메일) 호환을 위해 인라인 스타일 추가
 */
export const CustomHorizontalRule = HorizontalRule.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'hr',
      {
        ...HTMLAttributes,
        style: 'border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;',
      },
    ];
  },
});
