import { ClearResult, GridPosition } from '../types/game-types';
import { GRID_SIZE } from '../../config';

/**
 * Класс для управления системой очков
 */
export class ScoreSystem {
    private score = 0;
    private combo = 0;

    /**
     * Получить текущий счет
     */
    public getScore(): number {
        return this.score;
    }

    /**
     * Получить текущее комбо
     */
    public getCombo(): number {
        return this.combo;
    }

    /**
     * Обновить счет на основе результатов очистки
     * @returns количество заработанных очков
     */
    public updateScore(clearResult: ClearResult): number {
        const basePoints = clearResult.cellsCleared * 10;
        const areaBonus = clearResult.rows.length + clearResult.cols.length > 1 ? 1.5 : 1;
        const comboBonus = this.combo > 0 ? 1 + this.combo * 0.1 : 1;

        const totalPoints = Math.floor(basePoints * areaBonus * comboBonus);
        this.score += totalPoints;

        if (clearResult.cellsCleared > 0) {
            this.combo++;
        } else {
            this.combo = 0;
        }

        return totalPoints;
    }

    /**
     * Вычислить центральную позицию для анимации очков
     */
    public calculateCenterPosition(clearResult: ClearResult): GridPosition {
        const allRows = clearResult.rows;
        const allCols = clearResult.cols;

        if (allRows.length > 0 && allCols.length > 0) {
            return {
                x: allCols[Math.floor(allCols.length / 2)],
                y: allRows[Math.floor(allRows.length / 2)],
            };
        }

        if (allRows.length > 0) {
            return {
                x: Math.floor(GRID_SIZE / 2),
                y: allRows[Math.floor(allRows.length / 2)],
            };
        }

        if (allCols.length > 0) {
            return {
                x: allCols[Math.floor(allCols.length / 2)],
                y: Math.floor(GRID_SIZE / 2),
            };
        }

        return {
            x: Math.floor(GRID_SIZE / 2),
            y: Math.floor(GRID_SIZE / 2),
        };
    }

    /**
     * Сбросить комбо
     */
    public resetCombo(): void {
        this.combo = 0;
    }

    /**
     * Сбросить счет и комбо
     */
    public reset(): void {
        this.score = 0;
        this.combo = 0;
    }
}
