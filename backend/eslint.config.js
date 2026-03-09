import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended, // Applies to your .js files
  {
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'prefer-const': 'error',
    },
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    // We can add a separate block for your /tests folder later if needed
  },
];
