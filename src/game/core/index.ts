/**
 * Единая точка входа для ядра игры
 */

// Экспорт типов
export * from './types';

// Экспорт логики
export { GameLogic } from './logic/GameLogic';
export { ScoreSystem } from './logic/ScoreSystem';
export { ShapeGenerator } from './logic/ShapeGenerator';

// Экспорт управления состоянием
export { GameStateManager } from './state/GameState';
export { GameManager } from './state/GameManager';
