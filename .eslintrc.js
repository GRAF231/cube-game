module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    plugins: ['react', '@typescript-eslint', 'prettier'],
    rules: {
        // Основные правила
        'no-console':
            process.env.NODE_ENV === 'production'
                ? ['error', { allow: ['warn', 'error'] }]
                : ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        'no-duplicate-imports': 'error',
        'max-lines': [
            'warn',
            {
                max: 400,
                skipBlankLines: true,
                skipComments: true,
            },
        ], // Ограничение количества строк в файле

        // Правила TypeScript
        '@typescript-eslint/explicit-module-boundary-types': 'off', // Позволяет не указывать типы возвращаемых значений для публичных методов
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Предупреждение о неиспользуемых переменных
        '@typescript-eslint/no-explicit-any': 'warn', // Предупреждение о использовании any
        '@typescript-eslint/no-non-null-assertion': 'warn', // Предупреждение о использовании оператора !
        '@typescript-eslint/ban-ts-comment': 'warn', // Предупреждение о использовании ts-комментариев

        // Правила React
        'react/prop-types': 'off', // Отключаем проверку PropTypes, так как используем TypeScript
        'react/react-in-jsx-scope': 'off', // React 17+ не требует импорта React для JSX
        'react/display-name': 'off', // Отключаем требование имени для компонентов
        'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }], // Не используем {} для строковых значений

        // Правила форматирования
        'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            rules: {
                // Специальные правила для TypeScript файлов
            },
        },
        {
            files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
            env: {
                jest: true,
            },
            rules: {
                // Специальные правила для тестовых файлов
            },
        },
    ],
};
