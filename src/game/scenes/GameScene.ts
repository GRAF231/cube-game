import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { GameManager } from '../core/state/GameManager';
import { Shape, GameEvents, GridPosition } from '../core/types';
import { GameSceneUIManager } from '../ui/managers/UIManager';
import { GameSceneInputHandler } from '../input/InputHandler';
import { GameSceneAnimator } from '../ui/animation/Animator';
import { GameSceneYandexHandler } from '../integration/yandex/YandexHandler';
import { GameSceneBackground } from '../ui/effects/Background';
import { GameSceneGridHandler } from '../input/GridHandler';

export class GameScene extends BaseScene {
    private gameManager!: GameManager;
    public uiManager!: GameSceneUIManager;
    private inputHandler!: GameSceneInputHandler;
    public animator!: GameSceneAnimator;
    private yandexHandler!: GameSceneYandexHandler;
    private background!: GameSceneBackground;
    private gridHandler!: GameSceneGridHandler;
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

                this.time.delayedCall(
                    50,
                    () => {
                        if (this.inputHandler) this.inputHandler.enablePreviewDragging();
                    },
                    [],
                    this
                );
            },
            onPointsEarned: (points: number, position: GridPosition) => {
                if (this.animator) this.animator.showPointsAnimation(points, position);
            },
        };

        this.gameManager = new GameManager(gameEvents);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    create(): void {
        // Создаем фоновые эффекты
        this.background = new GameSceneBackground(this);
        this.background.createAnimatedBackground();

        this.animator = new GameSceneAnimator(this);
        this.uiManager = new GameSceneUIManager(this, this.animator);
        this.inputHandler = new GameSceneInputHandler(this);
        this.yandexHandler = new GameSceneYandexHandler(this);
        this.gridHandler = new GameSceneGridHandler(this, this.gameManager, this.animator);

        this.uiManager.createUI();

        this.createTitle('Тетрис-блоки', 36).setY(40);
        this.createBackButton();

        if (this.uiManager.gridComponent) {
            this.uiManager.gridComponent.setOnClick(position => {
                this.gridHandler.placeSelectedShape(position);
            });
        } else {
            console.error('GridComponent не был инициализирован в UIManager');
        }

        this.inputHandler.setupInputHandlers();

        this.uiManager.updateShapePreviews(this.gameManager.getState().availableShapes, false);
        this.inputHandler.enablePreviewDragging();
    }

    private createBackButton(): void {
        this.createTextButton(
            120,
            40,
            'В меню',
            () => {
                this.scene.start('MenuScene', { yaSDK: this.yaSDK });
            },
            20
        );
    }

    /**
     * Выбор фигуры по индексу (делегируется в GridHandler)
     */
    public selectShape(index: number): void {
        this.gridHandler.selectShape(index);
    }

    /**
     * Отображает предварительный просмотр фигуры (делегируется в GridHandler)
     */
    public showShapeGhost(position: GridPosition): boolean {
        return this.gridHandler.showShapeGhost(position);
    }

    /**
     * Очищает предварительный просмотр фигуры (делегируется в GridHandler)
     */
    public clearShapeGhost(): void {
        this.gridHandler.clearShapeGhost();
    }

    /**
     * Размещает выбранную фигуру (делегируется в GridHandler)
     */
    public placeSelectedShape(position: GridPosition): boolean {
        return this.gridHandler.placeSelectedShape(position);
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
                    this.gridHandler.clearShapeGhost();
                    if (this.uiManager) {
                        this.uiManager.updateScoreText(0);
                        this.uiManager.updateComboText(0);
                        if (this.uiManager.gridComponent) {
                            this.uiManager.gridComponent.updateGrid(
                                this.gameManager.getState().grid
                            );
                        }
                        this.uiManager.updateShapePreviews(
                            this.gameManager.getState().availableShapes,
                            false
                        );
                    }
                    if (this.inputHandler) {
                        this.inputHandler.enablePreviewDragging();
                    }
                },
            },
        ];

        if (
            this.yandexHandler &&
            this.yaSDK &&
            this.yaSDK.isAvailableMethod('adv.showRewardedVideo')
        ) {
            buttons.push({
                text: 'Бонус (+3)',
                callback: () => {
                    modal.close();
                    this.yandexHandler.showAdForBonusBlocks(() => {
                        console.log('Колбэк после закрытия рекламы (из GameScene)');
                    });
                },
            });
        }

        buttons.push({
            text: 'В меню',
            callback: () => {
                modal.close();
                this.scene.start('MenuScene', { yaSDK: this.yaSDK });
            },
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
            this.time.delayedCall(
                50,
                () => {
                    if (this.inputHandler) this.inputHandler.enablePreviewDragging();
                },
                [],
                this
            );
        }
    }

    update(time: number, _delta: number): void {
        // Обновление анимаций фона
        if (this.background) {
            this.background.updateBackgroundEffects(time);
        }
    }

    shutdown(): void {
        if (this.background) {
            this.background.shutdown();
        }
        if (this.gridHandler) {
            this.gridHandler.shutdown();
        }
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }
}
