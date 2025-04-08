import { Cell, Shape, GridPosition, ClearResult } from '../types';
import { GRID_SIZE } from '../config';

/**
 * Класс для игровой логики
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
   * Проверить и очистить заполненные строки и столбцы
   */
  public checkAndClearLines(grid: Cell[][]): ClearResult {
    const result: ClearResult = {
      rows: [],
      cols: [],
      cellsCleared: 0
    };

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

    for (const y of result.rows) {
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = { filled: false, color: '' };
        result.cellsCleared++;
      }
    }

    for (const x of result.cols) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (grid[y][x].filled) {
          grid[y][x] = { filled: false, color: '' };
          result.cellsCleared++;
        }
      }
    }

    return result;
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