/**
 * Типы, связанные с основной игровой логикой
 */

// Импорт типов фигур
import { Shape } from './shape-types';

/**
 * Координаты для игрового поля или фигуры
 */
export interface GridPosition {
    x: number;
    y: number;
}

/**
 * Представление ячейки на игровой доске
 */
export interface Cell {
    filled: boolean;
    color: string;
}

/**
 * Результаты очистки строк/столбцов
 */
export interface ClearResult {
    rows: number[];
    cols: number[];
    cellsCleared: number;
}

/**
 * Интерфейс для событий игры
 */
export interface GameEvents {
    onScoreUpdate: (score: number) => void;
    onGameOver: () => void;
    onComboUpdate: (combo: number) => void;
    onShapesUpdate: (shapes: (Shape | null)[], withAnimation?: boolean) => void;
    onPointsEarned: (points: number, position: GridPosition) => void;
}
