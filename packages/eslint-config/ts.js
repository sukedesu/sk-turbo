const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
    ],
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'simple-import-sort',
        'react',
        'eslint-plugin-prettier',
        'unused-imports',
    ],
    rules: {
        // remove curly-brace if is not necessary
        'react/jsx-curly-brace-presence': 2,
        // do not need import React
        'react/react-in-jsx-scope': 0,
        // do not leave console
        'no-console': [2, { allow: ['warn', 'error'] }],
        // no require import
        '@typescript-eslint/no-var-requires': 0,
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error', { ignoreTypeValueShadow: true }],
        // define const after it used
        '@typescript-eslint/no-use-before-define': 0,
        'no-use-before-define': 'off',
        // only tsx, ts files are allowed
        'react/jsx-filename-extension': ['warn', { extensions: ['.tsx', '.ts'] }],
        // sort importss
        'simple-import-sort/exports': ['error'],
        'simple-import-sort/imports': [
            'error',
            {
                groups: [
                    ['^\\u0000'],
                    ['^react$', '^react-dom$'],
                    ['^@?\\w'],
                    ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                    ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                    ['^.+\\.s?css$'],
                ],
            },
        ],
        'no-unused-vars': 0,
        // remove unused imports
        'unused-imports/no-unused-imports': ['error'],
        'unused-imports/no-unused-vars': [
            1,
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
        // base prettier
        'prettier/prettier': [
            'error',
            {
                singleQuote: true,
                trailingComma: 'all',
                arrowParens: 'always',
                printWidth: 140,
                tabWidth: 2,
                useTabs: false,
                // tailwindFunctions: ['classnames', 'cn', 'classNames'],
                // plugins: ['prettier-plugin-tailwindcss'],
            },
        ],

        // `prefer ${template}`
        'prefer-template': 2,
        // attribute={"hi"} remove curly bracket
        'arrow-body-style': [2, 'as-needed'],
        '@typescript-eslint/no-unused-expressions': 2,
    },
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    settings: {
        react: {
            pragma: 'React',
        },
        "import/resolver": {
            typescript: {
                project,
            },
        },
    },
};
