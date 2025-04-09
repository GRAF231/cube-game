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
 * Тип фигуры в игре
 */
export enum ShapeType {
  SINGLE = 'SINGLE',
  LINE_2 = 'LINE_2',
  LINE_3 = 'LINE_3',
  L_SHAPE = 'L_SHAPE',
  SQUARE = 'SQUARE',
  T_SHAPE = 'T_SHAPE',
  CROSS = 'CROSS',
  Z_SHAPE = 'Z_SHAPE',
}

/**
 * Структура игровой фигуры
 */
export interface Shape {
  type: ShapeType;
  blocks: GridPosition[];
  color: string;
  previewPosition?: GridPosition;
}

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