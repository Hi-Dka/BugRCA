import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1. 全局忽略构建产物和依赖目录
  {
    ignores: ['dist/**', 'node_modules/**', 'build/**'],
  },

  // 2. 引入 ESLint 官方基础 JS 推荐规则
  js.configs.recommended,

  // 3. 引入 TypeScript 官方推荐规则
  ...tseslint.configs.recommended,

  // 4. 自定义/微调规则
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 允许使用 console.log（默认某些预设可能警告）
      'no-console': 'off',
      // 未使用变量规则交给 TS 处理
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // 允许显式声明 any（按需配置，严格项目可设为 'warn' 或 'error'）
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
