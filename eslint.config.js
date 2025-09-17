import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // TypeScript 관련 규칙들을 모두 off로 설정
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      
      // JavaScript 기본 규칙들도 관대하게 설정
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      'no-empty': 'off',
      'no-constant-condition': 'off',
      'no-unreachable': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-dupe-keys': 'off',
      'no-duplicate-case': 'off',
      'no-empty-character-class': 'off',
      'no-ex-assign': 'off',
      'no-extra-boolean-cast': 'off',
      'no-extra-semi': 'off',
      'no-func-assign': 'off',
      'no-inner-declarations': 'off',
      'no-invalid-regexp': 'off',
      'no-irregular-whitespace': 'off',
      'no-obj-calls': 'off',
      'no-regex-spaces': 'off',
      'no-sparse-arrays': 'off',
      'no-unexpected-multiline': 'off',
      'use-isnan': 'off',
      'valid-typeof': 'off',
      
      // React Hooks 규칙들도 경고로만 설정
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      
      // React Refresh 규칙도 경고로만 설정
      'react-refresh/only-export-components': 'warn',
      
      // 기타 일반적인 규칙들
      'prefer-const': 'off',
      'no-var': 'off',
      'eqeqeq': 'off',
      'curly': 'off',
      'dot-notation': 'off',
      'no-else-return': 'off',
      'no-lonely-if': 'off',
      'no-multi-assign': 'off',
      'no-nested-ternary': 'off',
      'no-return-assign': 'off',
      'no-sequences': 'off',
      'no-unneeded-ternary': 'off',
      'no-useless-return': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-template': 'off',
      'yoda': 'off',
    },
  },
])
