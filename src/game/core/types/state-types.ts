/**
 * Типы, связанные с управлением состоянием игры
 */

import { Cell } from './game-types';
import { Shape } from './shape-types';

/**
 * Состояние игры
 */
export interface GameState {
    score: number;
    combo: number;
    isGameOver: boolean;
    availableShapes: (Shape | null)[];
    selectedShape: Shape | null;
    grid: Cell[][];
    gridBeforeClear?: Cell[][]; // Состояние сетки после размещения фигуры, но до очистки линий
}
