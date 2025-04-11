import { Cell, GridPosition } from '../types/game-types';
import { Shape } from '../types/shape-types';
import { GameState } from '../types/state-types';
import { GRID_SIZE } from '../../config';
import { StateUtils } from '../../../utils/StateUtils';

/**
 * Класс для управления состоянием игры с использованием иммутабельного подхода
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
        const grid: Cell[][] = Array(GRID_SIZE)
            .fill(null)
            .map(() =>
                Array(GRID_SIZE)
                    .fill(null)
                    .map(() => ({ filled: false, color: '' }))
            );

        return {
            score: 0,
            combo: 0,
            isGameOver: false,
            grid,
            availableShapes: [],
            selectedShape: null,
            gridBeforeClear: undefined,
        };
    }

    /**
     * Получить текущее состояние игры
     */
    public getState(): GameState {
        return this.state;
    }

    /**
     * Обновить все состояние игры
     */
    public updateState(newState: Partial<GameState>): void {
        this.state = StateUtils.update(this.state, newState);
    }

    /**
     * Обновить состояние сетки
     */
    public updateGrid(grid: Cell[][]): void {
        this.state = StateUtils.update(this.state, { grid });
    }

    /**
     * Обновить доступные фигуры
     */
    public updateShapes(shapes: (Shape | null)[]): void {
        this.state = StateUtils.update(this.state, { availableShapes: shapes });
    }

    /**
     * Выбрать фигуру
     */
    public selectShape(shape: Shape | null): void {
        this.state = StateUtils.update(this.state, { selectedShape: shape });
    }

    /**
     * Обновить счет
     */
    public updateScore(score: number): void {
        this.state = StateUtils.update(this.state, { score });
    }

    /**
     * Обновить комбо
     */
    public updateCombo(combo: number): void {
        this.state = StateUtils.update(this.state, { combo });
    }

    /**
     * Установить флаг окончания игры
     */
    public setGameOver(isGameOver: boolean): void {
        this.state = StateUtils.update(this.state, { isGameOver });
    }

    /**
     * Сбросить состояние игры
     */
    public reset(): void {
        this.state = this.getInitialState();
    }
}
