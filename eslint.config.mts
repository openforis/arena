import type { ESLint } from 'eslint'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginTypeScript from '@typescript-eslint/eslint-plugin'
import parserTypeScript from '@typescript-eslint/parser'

// Testing Plugins
import pluginJest from 'eslint-plugin-jest'
import pluginPlaywright from 'eslint-plugin-playwright' // Used for Playwright Test E2E tests

// Formatting Plugins
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'

// the rule types of these plugins don't match ESLint 10's yet
const pluginTypeScriptCompat = pluginTypeScript as unknown as ESLint.Plugin
const pluginReactHooksCompat = pluginReactHooks as unknown as ESLint.Plugin

export default defineConfig([
  // 1. TypeScript Configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: parserTypeScript,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // automatic JSX runtime: JSX does not use React, so an unused `import React` is reported
        jsxPragma: null,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': pluginTypeScriptCompat,
    },
    rules: {
      ...pluginTypeScript.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' type (can be relaxed later if needed)
    },
  },

  // 2. React and React Hooks Configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooksCompat,
    },
    settings: {
      // shortcut: 'detect' crashes on ESLint 10, restore it when eslint-plugin-react supports ESLint 10
      react: { version: '19.3' },
    },
    rules: {
      // Recommended React rules
      ...pluginReact.configs.recommended.rules,
      // Recommended React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,

      'react/display-name': 'off',

      // React 17+ Obsolete Rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
    },
  },

  // --- TESTING CONFIGURATIONS (APPLIES ONLY TO TEST FILES) ---

  // 3. Jest (Unit/Integration Tests) Configuration
  {
    // Apply this to files matching Jest naming convention
    files: ['test/**/*.ts', 'test/**/*.mts', '**/*.test.ts', '**/*.spec.ts'],
    // e2e tests run with Playwright Test (see below)
    ignores: ['test/e2e/**'],
    plugins: {
      jest: pluginJest,
    },
    languageOptions: {
      // Add Jest environment globals (describe, test, expect, etc.)
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Recommended Jest rules (e.g., no-focused-tests)
      ...pluginJest.configs.recommended.rules,
      'jest/prefer-to-be': 'warn', // Example Jest rule
      'jest/no-focused-tests': 'error',
      'jest/no-export': 'off',
      // helpers performing assertions
      'jest/expect-expect': ['warn', { assertFunctionNames: ['expect', 'expectSystemError', 'expectSystemErrorKey'] }],
    },
  },

  // 4. Playwright Test (E2E Tests) Configuration
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['test/e2e/**/*.ts'],
    rules: {
      ...pluginPlaywright.configs['flat/recommended'].rules,
      // Playwright fixtures receive a `use` callback that is not a React hook
      'react-hooks/rules-of-hooks': 'off',
      // helpers performing assertions
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectReportMessages', 'publishSurvey', 'validateAndImport'] },
      ],
    },
  },

  // --- FINAL FORMATTING & IGNORE ---

  // 5. Prettier Integration (Must be the LAST configuration)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    plugins: {
      prettier: pluginPrettier,
    },
    // Extends the config that turns off formatting rules
    ...configPrettier,
    rules: {
      // Runs Prettier and flags any formatting conflict as an ESLint error
      'prettier/prettier': 'error',
    },
  },

  // 6. Ignore Configuration
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.cache/',
      'coverage/', // Ignore test coverage directories
    ],
  },
])
