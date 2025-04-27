// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat()

module.exports = [
    ...compat.extends('eslint:recommended'),
    ...compat.extends('plugin:@typescript-eslint/recommended'),
    {
        languageOptions: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                tsconfigRootDir: path.resolve(process.cwd()),
            },
            globals: {
                node: true
            }
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
        },
        rules: {
            semi: ['error', 'never'], // No semicolons
            quotes: ['error', 'single'], // Single quotes for imports
            indent: ['error', 4],
            'no-extra-semi': 'error', // No unnecessary semicolons
            'no-multi-spaces': 'error', // No multiple spaces
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    }
]