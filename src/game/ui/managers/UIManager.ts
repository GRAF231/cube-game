import Phaser from 'phaser';
import { GridComponent } from '../components/GridComponent';
import { Shape } from '../../types';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y, GAME_WIDTH } from '../../config';
import { GameSceneAnimator } from '../animation/Animator';
import { GameScene } from '../../scenes/GameScene';
import { GameSceneUIBackground } from './background/UIBackground';
import { GameSceneUIScoreDisplay } from './score/ScoreDisplay';
import { GameSceneUIShapePreview } from './preview/ShapePreview';

export class GameSceneUIManager {
    private scene: GameScene;
    private background: GameSceneUIBackground;
    private scoreDisplay!: GameSceneUIScoreDisplay;
    private shapePreview!: GameSceneUIShapePreview;
    public gridComponent!: GridComponent;
    public scoreText!: Phaser.GameObjects.Text;
    public comboText!: Phaser.GameObjects.Text;
    private shapePreviews: Phaser.GameObjects.Container[] = [];

    constructor(scene: GameScene, animator: GameSceneAnimator) {
        this.scene = scene;
        this.background = new GameSceneUIBackground(scene);
        this.scoreDisplay = new GameSceneUIScoreDisplay(scene);
        this.shapePreview = new GameSceneUIShapePreview(scene);
    }

    public createUI(): void {
        // Создаем фоновые элементы с помощью выделенного класса
        this.background.createBackground();

        // Создаем сетку
        this.createGrid();

        // Создаем элементы отображения счета и комбо
        this.scoreDisplay.createScoreDisplays();
        // Задаем ссылки на текстовые элементы для обратной совместимости
        this.scoreText = this.scoreDisplay.scoreText;
        this.comboText = this.scoreDisplay.comboText;

        // Создаем область предпросмотра фигур
        this.shapePreview.createShapePreviewArea();
    }

    private createGrid(): void {
        const gridBackground = this.scene.add.rectangle(
            GRID_X + (GRID_SIZE * CELL_SIZE) / 2,
            GRID_Y + (GRID_SIZE * CELL_SIZE) / 2,
            GRID_SIZE * CELL_SIZE + 10,
            GRID_SIZE * CELL_SIZE + 10,
            Phaser.Display.Color.HexStringToColor(COLORS.gridBackground).color,
            1
        );
        gridBackground.setStrokeStyle(
            3,
            Phaser.Display.Color.HexStringToColor(COLORS.gridLines).color,
            1
        );

        const outerGlow = this.scene.add.rectangle(
            GRID_X + (GRID_SIZE * CELL_SIZE) / 2,
            GRID_Y + (GRID_SIZE * CELL_SIZE) / 2,
            GRID_SIZE * CELL_SIZE + 20,
            GRID_SIZE * CELL_SIZE + 20,
            0xffffff,
            0
        );
        outerGlow.setStrokeStyle(
            15,
            Phaser.Display.Color.HexStringToColor(COLORS.gridLines).color,
            0.15
        );
        this.scene.tweens.add({
            targets: outerGlow,
            scaleX: 1.02,
            scaleY: 1.02,
            alpha: 0.2,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });

        this.gridComponent = new GridComponent(this.scene);
    }

    public updateScoreText(score: number): void {
        this.scoreDisplay.updateScoreText(score);
    }

    public updateComboText(combo: number): void {
        this.scoreDisplay.updateComboText(combo);
    }

    public updateShapePreviews(shapes: (Shape | null)[], withAnimation = true): void {
        this.shapePreview.updateShapePreviews(shapes, withAnimation);

        this.shapePreviews = this.shapePreview.getShapePreviewContainers();
    }

    public resetPreviewPositions(): void {
        this.shapePreview.resetPreviewPositions();
    }

    public getShapePreviewContainers(): Phaser.GameObjects.Container[] {
        return this.shapePreviews;
    }

    public destroy(): void {
        // Уничтожаем фоновые элементы
        this.background?.destroy();

        // Уничтожаем элементы отображения счета и комбо
        this.scoreDisplay?.destroy();

        this.gridComponent?.destroy();

        this.shapePreviews.forEach(container => {
            const backgrounds = container.getData('background') as Phaser.GameObjects.GameObject[];
            if (backgrounds) {
                backgrounds.forEach(bg => bg?.destroy());
            }
            container.destroy();
        });
        this.shapePreviews = [];

        console.log('GameSceneUIManager destroyed');
    }
}
