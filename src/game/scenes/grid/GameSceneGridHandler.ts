import Phaser from 'phaser';
import { Shape, GridPosition } from '../../types';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y } from '../../config';
import { GameManager } from '../../GameManager';
import { GameSceneAnimator } from '../animation/GameSceneAnimator';
import { GameScene } from '../GameScene';

/**
 * Класс для управления отображением фигур, их размещением и взаимодействием с сеткой
 */
export class GameSceneGridHandler {
    private scene: GameScene;
    private gameManager: GameManager;
    private animator: GameSceneAnimator;
    private selectedShapeGraphics: Phaser.GameObjects.Graphics;
    private selectedShapeIndex = -1;

    constructor(scene: GameScene, gameManager: GameManager, animator: GameSceneAnimator) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.animator = animator;
        this.selectedShapeGraphics = scene.add.graphics().setDepth(50);
    }

    /**
     * Выбирает фигуру по индексу из доступных
     */
    public selectShape(index: number): void {
        const { availableShapes } = this.gameManager.getState();
        if (index >= 0 && index < availableShapes.length && availableShapes[index] !== null) {
            this.selectedShapeIndex = index;
            this.gameManager.selectShape(index);
        } else {
            this.selectedShapeIndex = -1;
            this.gameManager.selectShape(-1);
        }
    }

    /**
     * Проверяет, какие линии будут очищены при размещении фигуры
     */
    private checkLinesToBeCleaned(
        shape: Shape,
        position: GridPosition
    ): { rows: number[]; cols: number[] } {
        const { grid } = this.gameManager.getState();

        const simulatedGrid = grid.map(row => row.map(cell => ({ ...cell })));

        shape.blocks.forEach(block => {
            const x = position.x + block.x;
            const y = position.y + block.y;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                simulatedGrid[y][x] = { filled: true, color: shape.color };
            }
        });

        const rowsToBeCleaned: number[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            if (simulatedGrid[y].every(cell => cell.filled)) {
                rowsToBeCleaned.push(y);
            }
        }

        const colsToBeCleaned: number[] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            if (simulatedGrid.every(row => row[x].filled)) {
                colsToBeCleaned.push(x);
            }
        }

        return { rows: rowsToBeCleaned, cols: colsToBeCleaned };
    }

    /**
     * Отображает предварительный просмотр выбранной фигуры в указанной позиции
     */
    public showShapeGhost(position: GridPosition): boolean {
        const { selectedShape } = this.gameManager.getState();
        if (!selectedShape) {
            this.selectedShapeGraphics.clear();
            if (this.scene.uiManager && this.scene.uiManager.gridComponent) {
                this.scene.uiManager.gridComponent.clearHighlights();
            }
            return false;
        }

        this.selectedShapeGraphics.clear();
        const canPlace = this.gameManager.canPlaceShape(selectedShape, position);

        if (this.scene.uiManager && this.scene.uiManager.gridComponent) {
            this.scene.uiManager.gridComponent.clearHighlights();

            if (canPlace) {
                const { rows, cols } = this.checkLinesToBeCleaned(selectedShape, position);
                if (rows.length > 0 || cols.length > 0) {
                    this.scene.uiManager.gridComponent.highlightCellsToBeCleaned(rows, cols);
                }
            }
        }

        const color = canPlace
            ? Phaser.Display.Color.HexStringToColor(COLORS.ghostValid).color
            : Phaser.Display.Color.HexStringToColor(COLORS.ghostInvalid).color;
        const alpha = 0.7;
        const glowColor = canPlace ? 0x4dffa6 : 0xff6b6b;

        this.selectedShapeGraphics.lineStyle(6, glowColor, 0.3);
        let minX = GRID_SIZE,
            minY = GRID_SIZE,
            maxX = 0,
            maxY = 0;
        let hasValidBlock = false;
        selectedShape.blocks.forEach(block => {
            const x = position.x + block.x;
            const y = position.y + block.y;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                hasValidBlock = true;
            }
        });
        if (hasValidBlock) {
            this.selectedShapeGraphics.strokeRect(
                GRID_X + minX * CELL_SIZE - 3,
                GRID_Y + minY * CELL_SIZE - 3,
                (maxX - minX + 1) * CELL_SIZE + 6,
                (maxY - minY + 1) * CELL_SIZE + 6
            );
        }

        selectedShape.blocks.forEach(block => {
            const x = position.x + block.x;
            const y = position.y + block.y;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                this.selectedShapeGraphics.fillStyle(color, alpha);
                this.selectedShapeGraphics.fillRect(
                    GRID_X + x * CELL_SIZE + 1,
                    GRID_Y + y * CELL_SIZE + 1,
                    CELL_SIZE - 2,
                    CELL_SIZE - 2
                );
                this.selectedShapeGraphics.fillStyle(0xffffff, 0.4);
                this.selectedShapeGraphics.fillRect(
                    GRID_X + x * CELL_SIZE + 5,
                    GRID_Y + y * CELL_SIZE + 5,
                    CELL_SIZE - 10,
                    CELL_SIZE * 0.3
                );
                this.selectedShapeGraphics.fillStyle(0x000000, 0.2);
                this.selectedShapeGraphics.fillRect(
                    GRID_X + x * CELL_SIZE + 5,
                    GRID_Y + y * CELL_SIZE + CELL_SIZE * 0.6,
                    CELL_SIZE - 10,
                    CELL_SIZE * 0.3
                );
            }
        });
        return canPlace;
    }

    /**
     * Очищает предварительный просмотр выбранной фигуры
     */
    public clearShapeGhost(): void {
        this.selectedShapeGraphics.clear();
        if (this.scene.uiManager && this.scene.uiManager.gridComponent) {
            this.scene.uiManager.gridComponent.clearHighlights();
        }
    }

    /**
     * Размещает выбранную фигуру в указанной позиции
     */
    public placeSelectedShape(position: GridPosition): boolean {
        const { selectedShape } = this.gameManager.getState();
        if (!selectedShape || this.selectedShapeIndex < 0) {
            console.log('GameSceneGridHandler: Попытка разместить невыбранную фигуру');
            return false;
        }

        const placed = this.gameManager.placeShape(position);

        if (placed) {
            const placedShape = selectedShape;
            this.selectedShapeIndex = -1;
            this.clearShapeGhost();

            this.updateVisualGrid();

            if (this.animator) {
                this.animator.animateShapePlacement(position, placedShape, () => {
                    this.triggerClearAnimation();
                    this.updateVisualGrid();
                });
            } else {
                this.triggerClearAnimation();
            }
        } else {
            console.log(
                `GameSceneGridHandler: Failed to place shape at ${position.x}, ${position.y}`
            );
        }
        return placed;
    }

    /**
     * Проверяет и запускает анимацию очистки линий, используя состояние сетки до очистки.
     */
    private triggerClearAnimation(): void {
        console.log('triggerClearAnimation вызван');
        if (!this.scene.uiManager || !this.scene.uiManager.gridComponent) {
            console.error(
                'UIManager или GridComponent не инициализирован при вызове triggerClearAnimation'
            );
            return;
        }

        const gridBeforeClear = this.gameManager.getState().gridBeforeClear;
        if (!gridBeforeClear) {
            console.error('gridBeforeClear не найден в состоянии GameManager');
            return;
        }

        const gridAfterClear = this.gameManager.getState().grid;

        const clearedRows: number[] = [];
        const clearedCols: number[] = [];

        for (let y = 0; y < GRID_SIZE; y++) {
            const wasFilled = gridBeforeClear[y].every(cell => cell.filled);
            const isFilledNow = gridAfterClear[y].every(cell => cell.filled);
            if (wasFilled && !isFilledNow) {
                clearedRows.push(y);
            }
        }

        for (let x = 0; x < GRID_SIZE; x++) {
            const wasFilled = gridBeforeClear.every(row => row[x].filled);
            const isFilledNow = gridAfterClear.every(row => row[x].filled);
            if (wasFilled && !isFilledNow) {
                clearedCols.push(x);
            }
        }

        console.log(`Очищено строк: ${clearedRows.length}, столбцов: ${clearedCols.length}`);
        console.log('Очищенные строки:', clearedRows);
        console.log('Очищенные столбцы:', clearedCols);

        if (clearedRows.length > 0 || clearedCols.length > 0) {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (
                        (clearedRows.includes(y) || clearedCols.includes(x)) &&
                        gridBeforeClear[y][x].filled
                    ) {
                        console.log(
                            `Вызываем анимацию для блока ${x},${y}, цвет: ${gridBeforeClear[y][x].color}`
                        );
                        this.scene.uiManager.gridComponent.animateBlockClear(
                            x,
                            y,
                            gridBeforeClear[y][x].color
                        );
                    }
                }
            }
        }
    }

    /**
     * Обновляет визуальное представление сетки.
     * Вызывается после завершения анимации очистки.
     */
    public updateVisualGrid(): void {
        if (!this.scene.uiManager || !this.scene.uiManager.gridComponent) {
            console.error(
                'UIManager или GridComponent не инициализирован при вызове updateVisualGrid'
            );
            return;
        }
        const { grid } = this.gameManager.getState();
        this.scene.uiManager.gridComponent.updateGrid(grid);
    }

    /**
     * Очищает ресурсы при закрытии сцены
     */
    public shutdown(): void {
        if (this.selectedShapeGraphics) {
            this.selectedShapeGraphics.clear();
            this.selectedShapeGraphics.destroy();
        }
    }

    /**
     * Возвращает текущий индекс выбранной фигуры
     */
    public getSelectedShapeIndex(): number {
        return this.selectedShapeIndex;
    }
}
