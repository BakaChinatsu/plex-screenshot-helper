import { antfu } from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  // 笔记文档里的代码块是示意用的，不参与 lint
  ignores: ['docs/**'],
  rules: {
    'no-console': 'off',
  },
})
