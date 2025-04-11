/**
 * Единая точка импорта для всех типов
 */

// Экспорт типов игровой логики
export type { GridPosition, Cell, ClearResult, GameEvents } from './game-types';

// Экспорт типов фигур
export type { Shape } from './shape-types';
export { ShapeType } from './shape-types';

// Экспорт типов состояния
export type { GameState } from './state-types';
