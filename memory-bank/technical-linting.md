# Система линтинга и форматирования кода

В проекте настроены инструменты для поддержания единого стиля кода и предотвращения типичных ошибок.

## Используемые инструменты

### ESLint

ESLint используется для статического анализа кода и выявления потенциальных проблем. Конфигурация находится в файле `.eslintrc.js`.

#### Основные правила:

- Правила использования `console`:
  - В разработке: предупреждения при использовании `console.log`, разрешены `console.warn`, `console.error`, `console.info`
  - В продакшене: ошибка при использовании `console.log`, разрешены только `console.warn`, `console.error`
- Предупреждения о неиспользуемых переменных
- Запрет дублирования импортов
- Ограничение количества строк в файле до 400 (не считая пустых строк и комментариев)
- Предупреждения о использовании `any` в TypeScript
- Отключение обязательного указания типов возвращаемых значений для публичных методов
- Специфические правила для React-компонентов

### Prettier

Prettier используется для автоматического форматирования кода. Конфигурация находится в файле `.prettierrc`.

#### Настройки форматирования:

- Точка с запятой в конце выражений
- Одинарные кавычки для строк
- Ширина табуляции - 4 пробела
- Максимальная длина строки - 100 символов
- Запятые в конце многострочных объектов и массивов (trailing commas)
- Пробелы внутри фигурных скобок объектов

## Запуск линтеров

В проекте настроены следующие скрипты npm:

- `npm run lint` - запуск ESLint для проверки кода
- `npm run lint:fix` - запуск ESLint с автоматическим исправлением проблем
- `npm run format` - запуск Prettier для форматирования кода
- `npm run prettier:check` - проверка форматирования без внесения изменений

## Интеграция с редактором кода

Для более удобной работы рекомендуется настроить ваш редактор кода для автоматического форматирования при сохранении файла:

### VSCode

1. Установите расширения ESLint и Prettier
2. Добавьте в настройки VSCode (settings.json):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### WebStorm / PhpStorm / IntelliJ IDEA

1. Включите ESLint в настройках: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Настройте Prettier: Settings → Languages & Frameworks → JavaScript → Prettier
3. Включите опцию "Run on save for files" в настройках Prettier

## Игнорирование линтинга

Если для некоторых файлов или участков кода необходимо отключить проверку, можно использовать:

1. Файлы `.eslintignore` и `.prettierignore` для исключения целых файлов
2. Комментарии в коде для отключения конкретных правил:

```javascript
// eslint-disable-next-line no-console
console.log('Этот console.log не вызовет предупреждения');

/* eslint-disable */
// Код с отключенными правилами ESLint
/* eslint-enable */

// prettier-ignore
const неформатированныйКод = {
    свойство1:       'значение1',
    свойство2:  'значение2'
};