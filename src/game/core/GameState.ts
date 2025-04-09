import { Cell, Shape, GameState } from '../types';
import { GRID_SIZE } from '../config';

/**
 * Класс для управления состоянием игры
 */
export class GameStateManager {
    private state: GameState;

    constructor() {
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

        return {
            score: 0,
            combo: 0,
            isGameOver: false,
            grid,
            availableShapes: [],
            selectedShape: null,
        };
    }

    /**
     * Получить текущее состояние игры
     */
    public getState(): GameState {
        return this.state;
    }

    /**
     * Обновить состояние сетки
     */
    public updateGrid(grid: Cell[][]): void {
        this.state.grid = grid;
    }

    /**
     * Обновить доступные фигуры
     */
    public updateShapes(shapes: (Shape | null)[]): void {
        this.state.availableShapes = shapes;
    }

    /**
     * Выбрать фигуру
     */
    public selectShape(shape: Shape | null): void {
        this.state.selectedShape = shape;
    }

    /**
     * Обновить счет
     */
    public updateScore(score: number): void {
        this.state.score = score;
    }

    /**
     * Обновить комбо
     */
    public updateCombo(combo: number): void {
        this.state.combo = combo;
    }

    /**
     * Установить флаг окончания игры
     */
    public setGameOver(isGameOver: boolean): void {
        this.state.isGameOver = isGameOver;
    }

    /**
     * Сбросить состояние игры
     */
    public reset(): void {
        this.state = this.getInitialState();
    }
}
