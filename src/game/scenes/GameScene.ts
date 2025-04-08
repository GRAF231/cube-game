import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { GameManager } from '../GameManager';
import { Shape, GameEvents, GridPosition } from '../types';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y } from '../config';
import { GameSceneUIManager } from './ui/GameSceneUIManager';
import { GameSceneInputHandler } from './input/GameSceneInputHandler';
import { GameSceneAnimator } from './animation/GameSceneAnimator';
import { GameSceneYandexHandler } from './sdk/GameSceneYandexHandler';

export class GameScene extends BaseScene {
    private gameManager!: GameManager;
    public uiManager!: GameSceneUIManager;
    private inputHandler!: GameSceneInputHandler;
    private animator!: GameSceneAnimator;
    private yandexHandler!: GameSceneYandexHandler;
    private selectedShapeGraphics!: Phaser.GameObjects.Graphics;
    private selectedShapeIndex: number = -1;
    public yaSDK: YaGames.YandexGames | null = null;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { yaSDK?: YaGames.YandexGames }): void {
        this.yaSDK = data.yaSDK || null;

        const gameEvents: GameEvents = {
            onScoreUpdate: (score: number) => {
                if (this.uiManager) this.uiManager.updateScoreText(score);
            },
            onGameOver: () => {
                this.showGameOverModal();
            },
            onComboUpdate: (combo: number) => {
                if (this.uiManager) this.uiManager.updateComboText(combo);
            },
            onShapesUpdate: (shapes: (Shape | null)[], withAnimation?: boolean) => {
                if (this.uiManager) this.uiManager.updateShapePreviews(shapes, withAnimation);

                this.time.delayedCall(50, () => {
                    if (this.inputHandler) this.inputHandler.enablePreviewDragging();
                }, [], this);
            },
            onPointsEarned: (points: number, position: GridPosition) => {
                if (this.animator) this.animator.showPointsAnimation(points, position);
            }
        };

        this.gameManager = new GameManager(gameEvents);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    create(): void {
        this.animator = new GameSceneAnimator(this);
        this.uiManager = new GameSceneUIManager(this, this.animator);
        this.inputHandler = new GameSceneInputHandler(this);
        this.yandexHandler = new GameSceneYandexHandler(this);

        this.uiManager.createUI();

        this.createTitle('Тетрис-блоки', 36).setY(40);
        this.createBackButton();

        if (this.uiManager.gridComponent) {
            this.uiManager.gridComponent.setOnClick((position) => {
                this.placeSelectedShape(position);
            });
        } else {
            console.error("GridComponent не был инициализирован в UIManager");
        }

        this.selectedShapeGraphics = this.add.graphics().setDepth(50);

        this.inputHandler.setupInputHandlers();

        this.uiManager.updateShapePreviews(this.gameManager.getState().availableShapes, false);
        this.inputHandler.enablePreviewDragging();
    }

    private createBackButton(): void {
        this.createTextButton(120, 40, 'В меню', () => {
            this.scene.start('MenuScene', { yaSDK: this.yaSDK });
        }, 20);
    }

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
    private checkLinesToBeCleaned(shape: Shape, position: GridPosition): { rows: number[], cols: number[] } {
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

    public showShapeGhost(position: GridPosition): boolean {
        const { selectedShape } = this.gameManager.getState();
        if (!selectedShape) {
            this.selectedShapeGraphics.clear();
            if (this.uiManager && this.uiManager.gridComponent) {
                this.uiManager.gridComponent.clearHighlights();
            }
            return false;
        }

        this.selectedShapeGraphics.clear();
        const canPlace = this.gameManager.canPlaceShape(selectedShape, position);
        
        if (this.uiManager && this.uiManager.gridComponent) {
            this.uiManager.gridComponent.clearHighlights();
            
            if (canPlace) {
                const { rows, cols } = this.checkLinesToBeCleaned(selectedShape, position);
                if (rows.length > 0 || cols.length > 0) {
                    this.uiManager.gridComponent.highlightCellsToBeCleaned(rows, cols);
                }
            }
        }
        
        const color = canPlace ?
            Phaser.Display.Color.HexStringToColor(COLORS.ghostValid).color :
            Phaser.Display.Color.HexStringToColor(COLORS.ghostInvalid).color;
        const alpha = 0.7;
        const glowColor = canPlace ? 0x4dffa6 : 0xff6b6b;

        this.selectedShapeGraphics.lineStyle(6, glowColor, 0.3);
        let minX = GRID_SIZE, minY = GRID_SIZE, maxX = 0, maxY = 0;
        let hasValidBlock = false;
        selectedShape.blocks.forEach(block => {
            const x = position.x + block.x;
            const y = position.y + block.y;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                minX = Math.min(minX, x); minY = Math.min(minY, y);
                maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                hasValidBlock = true;
            }
        });
        if (hasValidBlock) {
            this.selectedShapeGraphics.strokeRect(
                GRID_X + minX * CELL_SIZE - 3, GRID_Y + minY * CELL_SIZE - 3,
                (maxX - minX + 1) * CELL_SIZE + 6, (maxY - minY + 1) * CELL_SIZE + 6
            );
        }

        selectedShape.blocks.forEach(block => {
            const x = position.x + block.x;
            const y = position.y + block.y;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                this.selectedShapeGraphics.fillStyle(color, alpha);
                this.selectedShapeGraphics.fillRect(GRID_X + x * CELL_SIZE + 1, GRID_Y + y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                this.selectedShapeGraphics.fillStyle(0xffffff, 0.4);
                this.selectedShapeGraphics.fillRect(GRID_X + x * CELL_SIZE + 5, GRID_Y + y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE * 0.3);
                this.selectedShapeGraphics.fillStyle(0x000000, 0.2);
                this.selectedShapeGraphics.fillRect(GRID_X + x * CELL_SIZE + 5, GRID_Y + y * CELL_SIZE + CELL_SIZE * 0.6, CELL_SIZE - 10, CELL_SIZE * 0.3);
            }
        });
        return canPlace;
    }

    public clearShapeGhost(): void {
        this.selectedShapeGraphics.clear();
        if (this.uiManager && this.uiManager.gridComponent) {
            this.uiManager.gridComponent.clearHighlights();
        }
    }

    public placeSelectedShape(position: GridPosition): boolean {
        const { selectedShape } = this.gameManager.getState();
        if (!selectedShape || this.selectedShapeIndex < 0) {
            console.log("GameScene: Попытка разместить невыбранную фигуру");
            return false;
        }

        const gridBeforePlace = this.gameManager.getState().grid.map(row => row.map(cell => ({ ...cell })));

        const placed = this.gameManager.placeShape(position);

        if (placed) {
            const placedShape = selectedShape;
            this.selectedShapeIndex = -1;
            this.clearShapeGhost();
        if (this.animator) {
            this.animator.animateShapePlacement(position, placedShape, () => {
                this.triggerClearAnimation(gridBeforePlace);
                this.updateVisualGrid();
            });
        } else {
            this.triggerClearAnimation(gridBeforePlace);
            this.updateVisualGrid();
        }


        } else {
            console.log(`GameScene: Failed to place shape at ${position.x}, ${position.y}`);
        }
        return placed;
    }

    /**
     * Проверяет и запускает анимацию очистки линий, используя состояние сетки *до* очистки.
     */
    private triggerClearAnimation(gridBeforeClear: { filled: boolean, color: string }[][]): void {
        if (!this.uiManager || !this.uiManager.gridComponent) {
            console.error("UIManager или GridComponent не инициализирован при вызове triggerClearAnimation");
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

        if (clearedRows.length > 0 || clearedCols.length > 0) {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if ((clearedRows.includes(y) || clearedCols.includes(x)) && gridBeforeClear[y][x].filled) {
                        this.uiManager.gridComponent.animateBlockClear(x, y);
                    }
                }
            }
        }
    }

    /**
     * Обновляет визуальное представление сетки.
     * Вызывается после завершения анимации очистки.
     */
    private updateVisualGrid(): void {
        if (!this.uiManager || !this.uiManager.gridComponent) {
            console.error("UIManager или GridComponent не инициализирован при вызове updateVisualGrid");
            return;
        }
        const { grid } = this.gameManager.getState();
        this.uiManager.gridComponent.updateGrid(grid);
    }

    private showGameOverModal(): void {
        const score = this.gameManager.getState().score;
        const buttons = [
            {
                text: 'Заново',
                callback: () => {
                    modal.close();
                    console.log('Перезапуск игры');
                    this.gameManager.resetGame();
                    this.selectedShapeIndex = -1;
                    this.clearShapeGhost();
                    if (this.uiManager) {
                        this.uiManager.updateScoreText(0);
                        this.uiManager.updateComboText(0);
                        if (this.uiManager.gridComponent) {
                            this.uiManager.gridComponent.updateGrid(this.gameManager.getState().grid);
                        }
                        this.uiManager.updateShapePreviews(this.gameManager.getState().availableShapes, false);
                    }
                    if (this.inputHandler) {
                        this.inputHandler.enablePreviewDragging();
                    }
                }
            }
        ];

        if (this.yandexHandler && this.yaSDK && this.yaSDK.isAvailableMethod('adv.showRewardedVideo')) {
            buttons.push({
                text: 'Бонус (+3)',
                callback: () => {
                    modal.close();
                    this.yandexHandler.showAdForBonusBlocks(() => {
                        console.log("Колбэк после закрытия рекламы (из GameScene)");
                    });
                }
            });
        }

        buttons.push({
            text: 'В меню',
            callback: () => {
                modal.close();
                this.scene.start('MenuScene', { yaSDK: this.yaSDK });
            }
        });

        const modal = this.createModal(
            'Игра окончена',
            `Ваш счет: ${score}\nНет возможности разместить фигуры.`,
            buttons
        );
    }

    /**
     * Обрабатывает получение награды за рекламу.
     * Вызывается из GameSceneYandexHandler.
     */
    public handleAdReward(): void {
        console.log('GameScene: Handling ad reward.');
        this.gameManager.addBonusShapes(3);
        if (this.uiManager) {
            if (this.uiManager.gridComponent) {
                this.uiManager.gridComponent.updateGrid(this.gameManager.getState().grid);
            }
            this.uiManager.updateShapePreviews(this.gameManager.getState().availableShapes, true);
        }
        if (this.inputHandler) {
            this.time.delayedCall(50, () => {
                if (this.inputHandler) this.inputHandler.enablePreviewDragging();
            }, [], this);
        }
    }

    update(time: number, delta: number): void {
        // Логика обновления сцены
    }

    shutdown(): void {
        console.log("Shutting down GameScene...");
        this.uiManager?.destroy();
        this.inputHandler?.destroy();
        this.animator?.destroy();
        this.yandexHandler?.destroy();
        this.selectedShapeGraphics?.destroy();
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        console.log("GameScene shut down complete.");
    }
}