import antfu from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu({
  formatters: true,
  rules: {
    'jsdoc/check-param-names': 'off',
  },
}, oxlint.configs['flat/recommended'])
