import { Cell, GridPosition, ClearResult } from '../types/game-types';
import { Shape } from '../types/shape-types';
import { GRID_SIZE } from '../../config';
import { StateUtils } from '../../../utils/StateUtils';

/**
 * Класс для игровой логики с иммутабельным подходом
 */
export class GameLogic {
    /**
     * Проверить, можно ли разместить фигуру в указанной позиции
     */
    public canPlaceShape(grid: Cell[][], shape: Shape, position: GridPosition): boolean {
        if (!shape) return false;

        for (const block of shape.blocks) {
            const x = position.x + block.x;
            const y = position.y + block.y;

            if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
                return false;
            }

            if (grid[y][x].filled) {
                return false;
            }
        }

        return true;
    }

    /**
     * Размещает фигуру на сетке и возвращает новую сетку
     */
    public placeShape(grid: Cell[][], shape: Shape, position: GridPosition): Cell[][] {
        const updates = shape.blocks.map(block => ({
            x: position.x + block.x,
            y: position.y + block.y,
            value: { filled: true, color: shape.color },
        }));

        return StateUtils.updateGridCells(grid, updates);
    }

    /**
     * Проверяет и очищает заполненные строки и столбцы
     */
    public checkAndClearLines(grid: Cell[][]): { grid: Cell[][]; clearResult: ClearResult } {
        const result: ClearResult = {
            rows: [],
            cols: [],
            cellsCleared: 0,
        };

        // Поиск заполненных строк
        for (let y = 0; y < GRID_SIZE; y++) {
            let rowFilled = true;
            for (let x = 0; x < GRID_SIZE; x++) {
                if (!grid[y][x].filled) {
                    rowFilled = false;
                    break;
                }
            }
            if (rowFilled) {
                result.rows.push(y);
            }
        }

        // Поиск заполненных столбцов
        for (let x = 0; x < GRID_SIZE; x++) {
            let colFilled = true;
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!grid[y][x].filled) {
                    colFilled = false;
                    break;
                }
            }
            if (colFilled) {
                result.cols.push(x);
            }
        }

        // Создание нового состояния сетки с очищенными ячейками
        let newGrid = [...grid];

        // Очистка строк
        for (const y of result.rows) {
            const emptyRow = Array(GRID_SIZE)
                .fill(null)
                .map(() => ({ filled: false, color: '' }));

            newGrid = StateUtils.updateArrayItem(newGrid, y, emptyRow);
            result.cellsCleared += GRID_SIZE;
        }

        // Очистка столбцов (только тех ячеек, которые не были очищены в строках)
        for (const x of result.cols) {
            const updates = [];
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!result.rows.includes(y) && newGrid[y][x].filled) {
                    updates.push({
                        x,
                        y,
                        value: { filled: false, color: '' },
                    });
                    result.cellsCleared++;
                }
            }
            if (updates.length > 0) {
                newGrid = StateUtils.updateGridCells(newGrid, updates);
            }
        }

        return { grid: newGrid, clearResult: result };
    }

    /**
     * Проверить, возможно ли разместить оставшиеся фигуры
     */
    public checkGameOver(grid: Cell[][], shapes: (Shape | null)[]): boolean {
        const hasShapes = shapes.some(shape => shape !== null);
        if (!hasShapes) return false;

        for (const shape of shapes) {
            if (shape === null) continue;

            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (this.canPlaceShape(grid, shape, { x, y })) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
}
