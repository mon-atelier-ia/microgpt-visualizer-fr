import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'upstream-ref']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Upstream uses modelRef.current in render (intentional: mutable model
      // state shared across pages, re-render triggered by forceUpdate counter).
      'react-hooks/refs': 'off',
      // Upstream useMemo deps don't match React Compiler inference.
      // Not fixing: upstream code, no behavior change needed.
      'react-hooks/preserve-manual-memoization': 'off',
      // Upstream uses `as any[]` in engine-adjacent code.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
