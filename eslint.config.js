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

      // ── Complexity & size guards ──────────────────────────────
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 4 }],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-params': ['error', { max: 3 }],
      'max-nested-callbacks': ['error', { max: 2 }],
    },
  },

  // ── Overrides ─────────────────────────────────────────

  // Engine: read-only upstream code — all complexity rules off
  {
    files: ['src/engine/**'],
    rules: {
      complexity: 'off',
      'max-depth': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-params': 'off',
      'max-nested-callbacks': 'off',
    },
  },

  // Datasets: data-only files — max-lines off
  {
    files: ['src/datasets/**'],
    rules: {
      'max-lines': 'off',
    },
  },

  // Dev scripts — all complexity rules off
  {
    files: ['scripts/**'],
    rules: {
      complexity: 'off',
      'max-depth': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-params': 'off',
      'max-nested-callbacks': 'off',
    },
  },

  // Tests: nested callbacks off (describe/it/expect), function size relaxed to 80
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'max-nested-callbacks': 'off',
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },
])
