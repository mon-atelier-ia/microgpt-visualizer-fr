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
      // DEBT: canvas components keep a "latest value" ref written during
      // render (xxxRef.current = value) for rAF/observer callbacks.
      // Enabling this rule reports 10 such writes (2026-10-19); fix = move
      // the writes into useLayoutEffect, then delete this override.
      'react-hooks/refs': 'off',
      // A missing dependency is a bug, not a style issue: fail the gate.
      'react-hooks/exhaustive-deps': 'error',
      // Only remaining any: app.config.ts PageDef.component (heterogeneous page props).
      '@typescript-eslint/no-explicit-any': 'warn',

      // ── Complexity & size guards ──────────────────────────────
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 4 }],
      'max-lines-per-function': [
        'error',
        { max: 100, skipBlankLines: true, skipComments: true },
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
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
    },
  },
])
