// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  {
    ignores: ['dist/**', 'dist-server/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      prettierConfig,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // The published library uses a "lib" prefix (see projects/ng-image-slider/eslint.config.js
    // for the actual per-project override `ng lint` runs with - the public `ng-image-slider`
    // selector is exempted there since renaming it would break every consumer's template).
    files: ['projects/ng-image-slider/src/lib/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'lib',
          style: 'kebab-case',
        },
      ],
      // Slider image items are heterogeneous ({image}/{video}/{thumbImage,posterImage} shapes),
      // and dot-notation property access in templates needs `any` (not `object`/`unknown`) for
      // strictTemplates to pass. Scoped to the lib only - app/service code stays fully typed.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    // Public API selector - renaming it to the "lib" prefix required above would break every
    // consumer's template (`<ng-image-slider>`), so this one file is exempt from that rule.
    files: ['**/ng-image-slider.component.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: [],
          style: 'kebab-case',
        },
      ],
    },
  },
]);
