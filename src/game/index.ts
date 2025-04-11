/**
 * Корневой индексный файл игры
 * Единая точка входа для всех основных компонентов
 */

// Ядро игры
export * from './core';

// UI компоненты
export * from './ui';

// Обработчики ввода
export * from './input';

// Интеграции
export * from './integration';

// Прямые экспорты для обратной совместимости
export { GameManager } from './core/state/GameManager';
export { GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y } from './config';
