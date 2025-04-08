import { Cell, Shape, GameState, GridPosition, ClearResult, GameEvents } from './types';
import { ShapeGenerator } from './ShapeGenerator';
import { GRID_SIZE } from './config';

/**
 * Класс, управляющий игровым процессом
 */
export class GameManager {
  private state: GameState;
  private events: GameEvents;

  constructor(events: GameEvents) {
    this.events = events;
    this.state = this.getInitialState();
  }

  /**
   * Инициализирует начальное состояние игры
   */
  private getInitialState(): GameState {
    const grid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = { filled: false, color: '' };
      }
    }

    const availableShapes = ShapeGenerator.generateRandomShapes(3);
    
    return {
      score: 0,
      combo: 0,
      isGameOver: false,
      grid,
      availableShapes,
      selectedShape: null
    };
  }

  /**
   * Получить текущее состояние игры
   */
  public getState(): GameState {
    return this.state;
  }

  /**
   * Выбрать фигуру из доступных
   */
  public selectShape(index: number): void {
    if (index >= 0 && index < this.state.availableShapes.length) {
      const shape = this.state.availableShapes[index];
      if (shape !== null) {
        this.state.selectedShape = shape;
      }
    }
  }

  /**
   * Проверить, можно ли разместить фигуру в указанной позиции
   */
  public canPlaceShape(shape: Shape, position: GridPosition): boolean {
    if (!shape) return false;

    for (const block of shape.blocks) {
      const x = position.x + block.x;
      const y = position.y + block.y;

      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return false;
      }

      if (this.state.grid[y][x].filled) {
        return false;
      }
    }

    return true;
  }

  /**
   * Разместить выбранную фигуру на доске
   */
  public placeShape(position: GridPosition): boolean {
    const { selectedShape, grid } = this.state;
    
    if (!selectedShape || !this.canPlaceShape(selectedShape, position)) {
      return false;
    }

    for (const block of selectedShape.blocks) {
      const x = position.x + block.x;
      const y = position.y + block.y;
      
      grid[y][x] = {
        filled: true,
        color: selectedShape.color
      };
    }

    const clearResult = this.checkAndClearLines();
    
    if (clearResult.cellsCleared > 0) {
      this.updateScore(clearResult);
      this.state.combo++;
    } else {
      this.state.combo = 0;
    }
    
    this.events.onComboUpdate(this.state.combo);
    
    const shapeIndex = this.state.availableShapes.indexOf(selectedShape);
    this.state.availableShapes[shapeIndex] = null;
    this.state.selectedShape = null;
    
    if (this.state.availableShapes.every(shape => shape === null)) {
      this.generateNewShapes();
    } else {
      this.events.onShapesUpdate(this.state.availableShapes, false);
    }
    
    this.checkGameOver();
    
    return true;
  }

  /**
   * Генерирует новый набор фигур
   */
  private generateNewShapes(): void {
    const emptySlots = this.state.availableShapes.filter(shape => shape === null).length;
    
    if (emptySlots === 3) {
      this.state.availableShapes = ShapeGenerator.generateRandomShapes(3);
    } else {
      const newShapes = ShapeGenerator.generateRandomShapes(emptySlots);
      let newShapeIndex = 0;
      
      for (let i = 0; i < this.state.availableShapes.length; i++) {
        if (this.state.availableShapes[i] === null && newShapeIndex < newShapes.length) {
          this.state.availableShapes[i] = newShapes[newShapeIndex];
          newShapeIndex++;
        }
      }
    }
    
    this.events.onShapesUpdate(this.state.availableShapes);
  }

  /**
   * Проверяет и очищает заполненные ряды и столбцы
   */
  private checkAndClearLines(): ClearResult {
    const { grid } = this.state;
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
   * Обновляет счет игрока на основе результатов очистки
   */
  private updateScore(clearResult: ClearResult): void {
    const basePoints = clearResult.cellsCleared * 10;
    const areaBonus = clearResult.rows.length + clearResult.cols.length > 1 ? 1.5 : 1;
    const comboBonus = this.state.combo > 0 ? (1 + this.state.combo * 0.1) : 1;
    
    const totalPoints = Math.floor(basePoints * areaBonus * comboBonus);
    this.state.score += totalPoints;
    
    this.events.onScoreUpdate(this.state.score);
    
    const position = this.calculateCenterPosition(clearResult);
    
    this.events.onPointsEarned(totalPoints, position);
  }
  
  /**
   * Вычисляет центральную позицию для отображения анимации очков
   */
  private calculateCenterPosition(clearResult: ClearResult): GridPosition {
    const allRows = clearResult.rows;
    const allCols = clearResult.cols;
    
    if (allRows.length > 0 && allCols.length > 0) {
      return {
        x: allCols[Math.floor(allCols.length / 2)],
        y: allRows[Math.floor(allRows.length / 2)]
      };
    }
    
    if (allRows.length > 0) {
      return {
        x: Math.floor(GRID_SIZE / 2),
        y: allRows[Math.floor(allRows.length / 2)]
      };
    }
    
    if (allCols.length > 0) {
      return {
        x: allCols[Math.floor(allCols.length / 2)],
        y: Math.floor(GRID_SIZE / 2)
      };
    }
    
    return {
      x: Math.floor(GRID_SIZE / 2),
      y: Math.floor(GRID_SIZE / 2)
    };
  }

  /**
   * Проверяет, возможно ли разместить оставшиеся фигуры на поле
   */
  private checkGameOver(): void {
    const hasShapes = this.state.availableShapes.some(shape => shape !== null);
    
    if (!hasShapes) {
      return;
    }

    let canPlaceAnyShape = false;

    for (const shape of this.state.availableShapes) {
      if (shape === null) continue;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (this.canPlaceShape(shape, { x, y })) {
            canPlaceAnyShape = true;
            break;
          }
        }
        if (canPlaceAnyShape) break;
      }
      if (canPlaceAnyShape) break;
    }

    if (!canPlaceAnyShape) {
      console.log('Игра окончена! Невозможно разместить ни одну фигуру.');
      this.state.isGameOver = true;
    
      setTimeout(() => {
        this.events.onGameOver();
      }, 500);
    }
  }

  /**
   * Добавляет бонусные блоки после просмотра рекламы
   */
  public addBonusShapes(count: number): void {
    const emptySlots = this.state.availableShapes.filter(shape => shape === null).length;
    const availableSlots = Math.max(3 - (this.state.availableShapes.length - emptySlots), 0);
    
    const bonusToAdd = Math.min(count, availableSlots + emptySlots);
    
    let added = 0;
    for (let i = 0; i < this.state.availableShapes.length && added < bonusToAdd; i++) {
      if (this.state.availableShapes[i] === null) {
        this.state.availableShapes[i] = ShapeGenerator.createBonusShape();
        added++;
      }
    }
    
    for (let i = added; i < bonusToAdd; i++) {
      this.state.availableShapes.push(ShapeGenerator.createBonusShape());
    }
    
    if (this.state.isGameOver) {
      this.state.isGameOver = false;
    }
    
    this.events.onShapesUpdate(this.state.availableShapes);
  }

  /**
   * Сбрасывает игру к начальному состоянию
   */
  public resetGame(): void {
    this.state = this.getInitialState();
    this.events.onScoreUpdate(this.state.score);
    this.events.onComboUpdate(this.state.combo);
    this.events.onShapesUpdate(this.state.availableShapes);
  }
}