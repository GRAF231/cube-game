import { Cell, GridPosition, GameEvents } from '../types/game-types';
import { Shape } from '../types/shape-types';
import { GameState } from '../types/state-types';
import { GameLogic } from '../logic/GameLogic';
import { GameStateManager } from './GameState';
import { ScoreSystem } from '../logic/ScoreSystem';
import { ShapeGenerator } from '../logic/ShapeGenerator';
import { StateUtils } from '../../../utils/StateUtils';

/**
 * Класс, управляющий игровым процессом.
 * Реализует композицию с использованием компонентов из директории core/
 * и применяет иммутабельный подход.
 */
export class GameManager {
    private stateManager: GameStateManager;
    private gameLogic: GameLogic;
    private scoreSystem: ScoreSystem;
    private events: GameEvents;

    constructor(events: GameEvents) {
        this.events = events;
        this.stateManager = new GameStateManager();
        this.gameLogic = new GameLogic();
        this.scoreSystem = new ScoreSystem();

        // Инициализация начальных фигур
        const initialShapes = ShapeGenerator.generateRandomShapes(3);
        this.stateManager.updateShapes(initialShapes);

        // Обновляем UI событиями с начальными данными
        this.events.onScoreUpdate(this.scoreSystem.getScore());
        this.events.onComboUpdate(this.scoreSystem.getCombo());
        this.events.onShapesUpdate(initialShapes);
    }

    /**
     * Получить текущее состояние игры
     */
    public getState(): GameState {
        return this.stateManager.getState();
    }

    /**
     * Выбрать фигуру из доступных
     */
    public selectShape(index: number): void {
        const state = this.stateManager.getState();
        if (index >= 0 && index < state.availableShapes.length) {
            const shape = state.availableShapes[index];
            if (shape !== null) {
                this.stateManager.selectShape(shape);
            }
        }
    }

    /**
     * Проверить, можно ли разместить фигуру в указанной позиции
     */
    public canPlaceShape(shape: Shape, position: GridPosition): boolean {
        return this.gameLogic.canPlaceShape(this.stateManager.getState().grid, shape, position);
    }

    /**
     * Разместить выбранную фигуру на доске
     */
    public placeShape(position: GridPosition): boolean {
        const state = this.stateManager.getState();
        const selectedShape = state.selectedShape;

        if (!selectedShape || !this.canPlaceShape(selectedShape, position)) {
            return false;
        }

        // Размещаем фигуру на доске (иммутабельно)
        const gridWithShape = this.gameLogic.placeShape(state.grid, selectedShape, position);

        // Сохраняем копию сетки с размещенной фигурой, но до очистки линий
        // для анимации очистки
        this.stateManager.updateState({
            gridBeforeClear: gridWithShape,
        });

        // Проверяем и очищаем линии
        const { grid: clearedGrid, clearResult } = this.gameLogic.checkAndClearLines(gridWithShape);

        // Обновляем сетку
        this.stateManager.updateGrid(clearedGrid);

        // Обновляем счет и комбо
        if (clearResult.cellsCleared > 0) {
            const pointsEarned = this.scoreSystem.updateScore(clearResult);
            this.stateManager.updateScore(this.scoreSystem.getScore());
            this.stateManager.updateCombo(this.scoreSystem.getCombo());

            this.events.onScoreUpdate(this.scoreSystem.getScore());
            this.events.onComboUpdate(this.scoreSystem.getCombo());

            const centerPosition = this.scoreSystem.calculateCenterPosition(clearResult);
            this.events.onPointsEarned(pointsEarned, centerPosition);
        } else {
            this.scoreSystem.resetCombo();
            this.stateManager.updateCombo(0);
            this.events.onComboUpdate(0);
        }

        // Обновляем доступные фигуры - создаем новый массив с заменой выбранной фигуры на null
        const shapes = state.availableShapes.map(shape => (shape === selectedShape ? null : shape));

        this.stateManager.updateShapes(shapes);
        this.stateManager.selectShape(null);

        // Генерируем новые фигуры если все слоты пусты
        if (shapes.every(shape => shape === null)) {
            this.generateNewShapes();
        } else {
            this.events.onShapesUpdate(shapes, false);
        }

        // Проверяем завершение игры
        this.checkGameOver();

        return true;
    }

    /**
     * Генерирует новый набор фигур
     */
    private generateNewShapes(): void {
        const state = this.stateManager.getState();
        const emptySlots = state.availableShapes.filter(shape => shape === null).length;

        if (emptySlots === 3 || state.availableShapes.length === 0) {
            // Если все слоты пусты или массив пуст, генерируем полный набор фигур
            const newShapes = ShapeGenerator.generateRandomShapes(3);
            this.stateManager.updateShapes(newShapes);
        } else {
            // Иначе заполняем только пустые слоты
            const shapes = [...state.availableShapes];
            const newShapes = ShapeGenerator.generateRandomShapes(emptySlots);

            // Иммутабельно заменяем null на новые фигуры
            const updatedShapes = shapes.map((shape, index) => {
                if (shape === null && newShapes.length > 0) {
                    return newShapes.shift() as Shape;
                }
                return shape;
            });

            this.stateManager.updateShapes(updatedShapes);
        }

        this.events.onShapesUpdate(this.stateManager.getState().availableShapes);
    }

    /**
     * Проверяет, возможно ли разместить оставшиеся фигуры на поле
     */
    private checkGameOver(): void {
        const state = this.stateManager.getState();

        // Проверяем есть ли фигуры для размещения
        const hasShapes = state.availableShapes.some(shape => shape !== null);
        if (!hasShapes) {
            return;
        }

        // Проверяем возможность размещения фигур
        const isGameOver = this.gameLogic.checkGameOver(state.grid, state.availableShapes);

        if (isGameOver) {
            console.log('Игра окончена! Невозможно разместить ни одну фигуру.');
            this.stateManager.setGameOver(true);

            // Используем setTimeout для визуального восприятия
            setTimeout(() => {
                this.events.onGameOver();
            }, 500);
        }
    }

    /**
     * Добавляет бонусные блоки после просмотра рекламы
     */
    public addBonusShapes(count: number): void {
        const state = this.stateManager.getState();
        const emptySlots = state.availableShapes.filter(shape => shape === null).length;
        const availableSlots = Math.max(3 - (state.availableShapes.length - emptySlots), 0);

        const bonusToAdd = Math.min(count, availableSlots + emptySlots);

        // Создаем бонусные фигуры
        const bonusShapes = Array(bonusToAdd)
            .fill(null)
            .map(() => ShapeGenerator.createBonusShape());

        // Заполняем пустые слоты
        let updatedShapes = state.availableShapes.map(shape => {
            if (shape === null && bonusShapes.length > 0) {
                return bonusShapes.shift() as Shape;
            }
            return shape;
        });

        // Добавляем оставшиеся фигуры, если есть
        updatedShapes = [...updatedShapes, ...bonusShapes];

        this.stateManager.updateShapes(updatedShapes);

        // Сбрасываем флаг окончания игры
        if (state.isGameOver) {
            this.stateManager.setGameOver(false);
        }

        this.events.onShapesUpdate(this.stateManager.getState().availableShapes);
    }

    /**
     * Сбрасывает игру к начальному состоянию
     */
    public resetGame(): void {
        this.stateManager.reset();
        this.scoreSystem.reset();

        const initialShapes = ShapeGenerator.generateRandomShapes(3);
        this.stateManager.updateShapes(initialShapes);

        this.events.onScoreUpdate(0);
        this.events.onComboUpdate(0);
        this.events.onShapesUpdate(initialShapes);
    }
}
