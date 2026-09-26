// eslint.config.js
import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginJsdoc from 'eslint-plugin-jsdoc'
import pluginTypeScript from '@typescript-eslint/eslint-plugin'
import parserTypeScript from '@typescript-eslint/parser'

// Testing Plugins
import pluginJest from 'eslint-plugin-jest'
import pluginPlaywright from 'eslint-plugin-playwright' // Used for Playwright Test E2E tests

// Formatting/Parser Plugins
import babelParser from '@babel/eslint-parser'
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'

export default [
  // --- CORE CONFIGURATION (APPLIES TO ALL JS/JSX) ---

  // 1. Basic JavaScript Configuration & Parser Setup (using Babel)
  {
    ...pluginJs.configs.recommended,
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // Use Babel as the custom parser
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react', '@babel/preset-env'],
        },
        jsx: true,
      },
      globals: {
        ...globals.browser, // Standard React (browser) globals
        ...globals.node, // Standard Node.js globals (backend/config files)
      },
    },
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },

  // 2. TypeScript Configuration.
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: parserTypeScript,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': pluginTypeScript,
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

  // 3. React and React Hooks Configuration (for all JSX files)
  {
    files: ['**/*.jsx', '**/*.js', '**/*.tsx', '**/*.ts'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    settings: {
      react: { version: 'detect' },
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

  // 4. JSDoc Configuration
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      jsdoc: pluginJsdoc,
    },
    rules: {
      ...pluginJsdoc.configs['recommended-typescript-flavor'].rules,
      'jsdoc/require-description': 'warn',
    },
  },

  // --- TESTING CONFIGURATIONS (APPLIES ONLY TO TEST FILES) ---

  // 5. Jest (Unit/Integration Tests) Configuration
  {
    // Apply this to files matching Jest naming convention
    files: ['test/**/*.js', 'test/**/*.ts', '**/*.test.js', '**/*.spec.js', '**/*.test.ts', '**/*.spec.ts'],
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
    },
  },

  // 6. Playwright Test (E2E Tests) Configuration
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['test/e2e/**/*.ts'],
    rules: {
      ...pluginPlaywright.configs['flat/recommended'].rules,
      // Playwright fixtures receive a `use` callback that is not a React hook
      'react-hooks/rules-of-hooks': 'off',
      // helpers performing assertions
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectReportMessages', 'publishSurvey'] }],
    },
  },

  // --- FINAL FORMATTING & IGNORE ---

  // 7. Prettier Integration (Must be the LAST configuration)
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
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

  // 8. Ignore Configuration
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.cache/',
      'coverage/', // Ignore test coverage directories
      'webapp/components/Map/L.KML.js',
    ],
  },
]
