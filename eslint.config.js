import { defineConfig } from 'eslint/config'
import js from '@eslint/js'

import babelParser from '@babel/eslint-parser'
import prettier from 'eslint-plugin-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import { jsdoc } from 'eslint-plugin-jsdoc'
import reactHooks from 'eslint-plugin-react-hooks'

import globals from 'globals'

export default defineConfig([
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    // Specifies the parser to be used by ESLint.
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
      },
      // Environment globals (browser, node, jest, mocha) are defined here
      globals: {
        ...globals.browser, // Adds all browser environment global variables
        ...globals.commonjs, // Adds all CommonJS global variables (like module, exports)
        ...globals.node, // Adds all Node.js global variables (like process, __dirname)
        ...globals.jest, // Adds all Jest global variables (like describe, it, expect)
        ...globals.mocha, // Adds all Mocha global variables (like describe, it, before)
        step: 'readonly', // "readonly" means the variable can't be reassigned.
      },
    },

    // Extends an array of configurations.
    // The configurations are applied in order, so later ones can override earlier ones.
    extends: ['react-hooks/recommended'],

    // Specifies an array of plugins to load.
    // Plugins can provide custom rules, environments, processors, and configurations.
    plugins: {
      prettier,
      jsdoc: jsdoc({
        config: 'flat/recommended',
      }),
      react: reactPlugin,
      'react-hooks': reactHooks,
    },

    // Configuration for individual rules.
    // Values are typically 0 (off), 1 (warn), or 2 (error).
    rules: {
      'no-console': 'error',
      'no-underscore-dangle': 0,
      'prettier/prettier': 'error',
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
      'react/display-name': 'off',
      'react/forbid-prop-types': 0,
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react-hooks/rules-of-hooks': 2,
      'react-hooks/exhaustive-deps': 1,
      // Note: The 'import/prefer-default-export' rule typically comes from the 'eslint-plugin-import' plugin,
      // which is often included in a shared config but not explicitly listed in your 'plugins' array.
      'import/prefer-default-export': 0,
      // 'jsdoc/check-alignment': 2,
      // 'jsdoc/check-examples': 0, //eslint 8 does not support this yet
      // 'jsdoc/check-indentation': 2,
      // 'jsdoc/check-param-names': 2,
      // 'jsdoc/check-syntax': 2,
      // 'jsdoc/check-tag-names': 2,
      // 'jsdoc/check-types': 2,
      // 'jsdoc/implements-on-classes': 2,
      // 'jsdoc/match-description': 2,
      // 'jsdoc/no-types': 0,
      // 'jsdoc/no-undefined-types': 1,
      // 'jsdoc/require-description': 1,
      // 'jsdoc/require-description-complete-sentence': 2,
      // 'jsdoc/require-example': 0,
      // 'jsdoc/require-hyphen-before-param-description': 2,
      // 'jsdoc/require-jsdoc': 0,
      // 'jsdoc/require-param': 2,
      // 'jsdoc/require-param-description': 2,
      // 'jsdoc/require-param-name': 2,
      // 'jsdoc/require-param-type': 2,
      // 'jsdoc/require-returns': 1,
      // 'jsdoc/require-returns-check': 2,
      // 'jsdoc/require-returns-description': 2,
      // 'jsdoc/require-returns-type': 2,
      // 'jsdoc/valid-types': 2,
    },

    // Settings are used by plugins (e.g., eslint-plugin-import, eslint-plugin-react)
    // to configure their behavior.
    settings: {
      'import/resolver': {
        node: {},
        webpack: {
          config: 'webpack.config.babel.js',
        },
      },
      react: {
        // Tells eslint-plugin-react to automatically detect the version of React being used.
        version: 'detect',
      },
    },

    ignores: ['webapp/components/Map/L.KML.js'],
  },
])
