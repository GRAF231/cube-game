import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { GameManager } from '../GameManager';
import { Shape, GameEvents, GridPosition } from '../types';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y, GAME_WIDTH, GAME_HEIGHT } from '../config';
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
    
    // Элементы фона
    private backgroundStars: Phaser.GameObjects.Sprite[] = [];
    private movingStars: Phaser.GameObjects.Sprite[] = [];
    private shootingStars: Phaser.GameObjects.Sprite[] = [];
    private nebulaEffect!: Phaser.GameObjects.Graphics;
    private shootingStarTimer!: Phaser.Time.TimerEvent;

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
        // Создаем анимированный фон перед остальными элементами
        this.createAnimatedBackground();
        
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

        // Размещаем фигуру - это также сохранит состояние сетки до очистки в this.gameManager.getState().gridBeforeClear
        const placed = this.gameManager.placeShape(position);

        if (placed) {
            const placedShape = selectedShape;
            this.selectedShapeIndex = -1;
            this.clearShapeGhost();
            
            // Сначала обновляем визуальное представление сетки, чтобы эффекты объема появились сразу
            this.updateVisualGrid();
            
            // Затем анимируем размещение фигуры и очистку линий
            if (this.animator) {
                this.animator.animateShapePlacement(position, placedShape, () => {
                    // Используем gridBeforeClear из GameManager для анимации очистки
                    this.triggerClearAnimation();
                    
                    // Обновляем сетку еще раз после очистки линий
                    this.updateVisualGrid();
                });
            } else {
                this.triggerClearAnimation();
                // Сетка уже была обновлена выше
            }
        } else {
            console.log(`GameScene: Failed to place shape at ${position.x}, ${position.y}`);
        }
        return placed;
    }

    /**
     * Проверяет и запускает анимацию очистки линий, используя состояние сетки до очистки.
     */
    private triggerClearAnimation(): void {
        if (!this.uiManager || !this.uiManager.gridComponent) {
            console.error("UIManager или GridComponent не инициализирован при вызове triggerClearAnimation");
            return;
        }

        // Получаем сохраненное состояние сетки до очистки
        const gridBeforeClear = this.gameManager.getState().gridBeforeClear;
        if (!gridBeforeClear) {
            console.error("gridBeforeClear не найден в состоянии GameManager");
            return;
        }

        const gridAfterClear = this.gameManager.getState().grid;

        const clearedRows: number[] = [];
        const clearedCols: number[] = [];

        // Находим очищенные строки
        for (let y = 0; y < GRID_SIZE; y++) {
            const wasFilled = gridBeforeClear[y].every(cell => cell.filled);
            const isFilledNow = gridAfterClear[y].every(cell => cell.filled);
            if (wasFilled && !isFilledNow) {
                clearedRows.push(y);
            }
        }

        // Находим очищенные столбцы
        for (let x = 0; x < GRID_SIZE; x++) {
            const wasFilled = gridBeforeClear.every(row => row[x].filled);
            const isFilledNow = gridAfterClear.every(row => row[x].filled);
            if (wasFilled && !isFilledNow) {
                clearedCols.push(x);
            }
        }

        console.log(`Очищено строк: ${clearedRows.length}, столбцов: ${clearedCols.length}`);

        // Запускаем анимацию для всех очищенных ячеек
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
        // Обновление анимаций фона
        this.updateBackgroundEffects(time, delta);
    }
    
    /**
     * Создает расширенный анимированный фон с различными эффектами
     */
    private createAnimatedBackground(): void {
        // Создаем базовый фон - темный градиент
        const backgroundGradient = this.add.graphics();
        const gradientRect = new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);
        backgroundGradient.fillGradientStyle(
            0x0a0a1e, 0x0a0a1e,
            0x1a1a3e, 0x1a1a3e,
            1
        );
        backgroundGradient.fillRectShape(gradientRect);
        
        // Создаем эффект туманности/свечения
        this.nebulaEffect = this.add.graphics();
        this.createNebulaEffect();
        
        // Создаем статичные звезды с пульсацией
        this.createStaticStars();
        
        // Создаем медленно движущиеся звезды фона
        this.createMovingStars();
        
        // Настраиваем таймер для падающих звезд
        this.shootingStarTimer = this.time.addEvent({
            delay: 4000,
            callback: this.createShootingStar,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Создает эффект туманности/облаков в космосе
     */
    private createNebulaEffect(): void {
        const nebulaCenters = [
            { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.3, radius: 150, color: 0x3d5a80, alpha: 0.05 },
            { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.7, radius: 180, color: 0x457b9d, alpha: 0.05 },
            { x: GAME_WIDTH * 0.6, y: GAME_HEIGHT * 0.2, radius: 120, color: 0xa7489b, alpha: 0.05 }
        ];
        
        nebulaCenters.forEach(nebula => {
            this.nebulaEffect.fillStyle(nebula.color, nebula.alpha);
            for (let i = 0; i < 5; i++) {
                const currentRadius = nebula.radius - i * 20;
                if (currentRadius > 0) {
                    this.nebulaEffect.fillCircle(nebula.x, nebula.y, currentRadius);
                }
            }
        });
    }
    
    /**
     * Создает статичные звезды с эффектом пульсации
     */
    private createStaticStars(): void {
        const starCount = 70;
        for (let i = 0; i < starCount; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const scale = Phaser.Math.FloatBetween(0.2, 0.6);
            const alpha = Phaser.Math.FloatBetween(0.4, 1);
            
            // Используем частицу в качестве звезды
            const star = this.add.sprite(x, y, 'pixel');
            star.setScale(scale * 2);
            star.setTint(0xffffff);
            star.setAlpha(alpha);
            
            // Случайный выбор цвета для некоторых звезд
            if (Phaser.Math.Between(0, 100) > 70) {
                const colors = [0xffdd99, 0x99ccff, 0xffcccc];
                star.setTint(colors[Phaser.Math.Between(0, colors.length - 1)]);
            }
            
            // Добавляем пульсацию с разными параметрами для разнообразия
            const pulseScale = Phaser.Math.FloatBetween(0.8, 1.2);
            const pulseDuration = Phaser.Math.Between(1500, 4000);
            
            this.tweens.add({
                targets: star,
                scale: scale * pulseScale,
                alpha: alpha - Phaser.Math.FloatBetween(0.1, 0.3),
                duration: pulseDuration,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 1000)
            });
            
            this.backgroundStars.push(star);
        }
    }
    /**
     * Создает медленно движущиеся звезды фона
     */
    private createMovingStars(): void {
        // Создаем звезды, которые медленно движутся сверху вниз
        for (let i = 0; i < 40; i++) {
            this.createMovingStar();
        }
    }
    
    /**
     * Создает одну движущуюся звезду
     */
    private createMovingStar(): void {
        const x = Phaser.Math.Between(0, GAME_WIDTH);
        const y = Phaser.Math.Between(-50, GAME_HEIGHT);
        const scale = Phaser.Math.FloatBetween(0.1, 0.3);
        const alpha = Phaser.Math.FloatBetween(0.3, 0.7);
        const speed = Phaser.Math.FloatBetween(5, 20);
        
        // Создаем звезду из пиксельной текстуры
        const star = this.add.sprite(x, y, 'pixel');
        star.setScale(scale);
        star.setAlpha(alpha);
        
        // Выбираем случайный цвет
        const colors = [0xffffff, 0xccccff, 0xffcccc];
        star.setTint(colors[Phaser.Math.Between(0, colors.length - 1)]);
        
        // Добавляем в массив для отслеживания
        this.movingStars.push(star);
        
        // Создаем движение звезды
        this.tweens.add({
            targets: star,
            y: GAME_HEIGHT + 50,
            duration: speed * 1000,
            ease: 'Linear',
            onComplete: () => {
                // Удаляем старую звезду
                star.destroy();
                const index = this.movingStars.indexOf(star);
                if (index > -1) this.movingStars.splice(index, 1);
                
                // Создаем новую на замену
                this.createMovingStar();
            }
        });
    }
    
    /**
     * Создает падающую звезду (метеор)
     */
    private createShootingStar(): void {
        // Генерируем случайную начальную позицию для падающей звезды
        const startX = Phaser.Math.Between(100, GAME_WIDTH);
        const startY = Phaser.Math.Between(0, GAME_HEIGHT * 0.3);
        
        // Создаем "голову" метеора
        const star = this.add.sprite(startX, startY, 'pixel');
        star.setScale(0.5);
        star.setAlpha(1);
        star.setTint(0xffffff);
        star.setBlendMode(Phaser.BlendModes.ADD);
        
        // Добавляем в массив для отслеживания
        this.shootingStars.push(star);
        
        // Создаем "хвост" метеора (5 частиц сзади)
        const trailParts: Phaser.GameObjects.Sprite[] = [];
        for (let i = 0; i < 5; i++) {
            const trailPart = this.add.sprite(startX, startY, 'pixel');
            trailPart.setScale(0.3 - i * 0.05);
            trailPart.setAlpha(0.7 - i * 0.1);
            trailPart.setTint(0xffffff);
            trailPart.setBlendMode(Phaser.BlendModes.ADD);
            trailParts.push(trailPart);
        }
        
        // Рассчитываем конечную позицию (диагональ вниз-влево)
        const endX = startX - Phaser.Math.Between(200, 400);
        const endY = startY + Phaser.Math.Between(200, 400);
        
        // Создаем анимацию движения метеора
        this.tweens.add({
            targets: star,
            x: endX,
            y: endY,
            alpha: 0,
            scale: 0.1,
            duration: 1000,
            ease: 'Linear',
            onUpdate: () => {
                // Обновляем позиции частиц хвоста с задержкой
                for (let i = 0; i < trailParts.length; i++) {
                    const delay = (i + 1) * 2; // задержка увеличивается для каждой части
                    const prevX = star.x + (i + 1) * (startX - star.x) / (delay * 5);
                    const prevY = star.y + (i + 1) * (startY - star.y) / (delay * 5);
                    trailParts[i].setPosition(prevX, prevY);
                }
            },
            onComplete: () => {
                // Удаляем все объекты
                star.destroy();
                trailParts.forEach(part => part.destroy());
                
                const index = this.shootingStars.indexOf(star);
                if (index > -1) this.shootingStars.splice(index, 1);
            }
        });
    }
    
    /**
     * Обновляет эффекты фона
     */
    private updateBackgroundEffects(time: number, delta: number): void {
        // Динамически изменяем туманность со временем
        if (time % 5000 < 20) { // Обновляем каждые 5 секунд
            this.nebulaEffect.clear();
            this.createNebulaEffect();
        }
    }
    shutdown(): void {
        console.log("Shutting down GameScene...");
        // Очищаем таймер падающих звезд
        this.shootingStarTimer?.remove();
        
        // Очищаем все объекты фона
        this.backgroundStars.forEach(star => star.destroy());
        this.movingStars.forEach(star => star.destroy());
        this.shootingStars.forEach(star => star.destroy());
        this.backgroundStars = [];
        this.movingStars = [];
        this.shootingStars = [];
        
        // Уничтожаем остальные компоненты
        this.uiManager?.destroy();
        this.inputHandler?.destroy();
        this.animator?.destroy();
        this.yandexHandler?.destroy();
        this.selectedShapeGraphics?.destroy();
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        console.log("GameScene shut down complete.");
    }
}