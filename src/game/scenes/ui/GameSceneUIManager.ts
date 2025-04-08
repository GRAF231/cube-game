import Phaser from 'phaser';
import { GridComponent } from '../../components/GridComponent';
import { ShapeGenerator } from '../../ShapeGenerator';
import { Shape } from '../../types';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { GameSceneAnimator } from '../animation/GameSceneAnimator';
import { GameScene } from '../GameScene';

export class GameSceneUIManager {
    private scene: GameScene;
    private animator: GameSceneAnimator;
    public gridComponent!: GridComponent;
    public scoreText!: Phaser.GameObjects.Text;
    public comboText!: Phaser.GameObjects.Text;
    private shapePreviews: Phaser.GameObjects.Container[] = [];

    constructor(scene: GameScene, animator: GameSceneAnimator) {
        this.scene = scene;
        this.animator = animator;
    }

    public createUI(): void {
        this.createBackground();
        this.createStarryBackground();
        this.createGrid();
        this.createScoreDisplay();
        this.createComboDisplay();
        this.createShapePreviewArea();
    }

    private createBackground(): void {
        this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x191638, 1).setOrigin(0);

        const midLayer = this.scene.add.rectangle(0, GAME_HEIGHT / 2 - 150, GAME_WIDTH, 300,
            Phaser.Display.Color.HexStringToColor(COLORS.background).color, 0.7).setOrigin(0);

        this.scene.tweens.add({
            targets: midLayer,
            alpha: { from: 0.7, to: 0.9 },
            duration: 3000,
            yoyo: true,
            repeat: -1
        });
    }

    private createStarryBackground(): void {
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.7);

            const star = this.scene.add.circle(x, y, size, 0xffffff, alpha);

            this.scene.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.1, 0.4),
                duration: Phaser.Math.Between(1000, 3000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    private createGrid(): void {
        const gridBackground = this.scene.add.rectangle(
            GRID_X + GRID_SIZE * CELL_SIZE / 2,
            GRID_Y + GRID_SIZE * CELL_SIZE / 2,
            GRID_SIZE * CELL_SIZE + 10,
            GRID_SIZE * CELL_SIZE + 10,
            Phaser.Display.Color.HexStringToColor(COLORS.gridBackground).color,
            1
        );
        gridBackground.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.gridLines).color, 1);

        const outerGlow = this.scene.add.rectangle(
            GRID_X + GRID_SIZE * CELL_SIZE / 2,
            GRID_Y + GRID_SIZE * CELL_SIZE / 2,
            GRID_SIZE * CELL_SIZE + 20,
            GRID_SIZE * CELL_SIZE + 20,
            0xffffff,
            0
        );
        outerGlow.setStrokeStyle(15, Phaser.Display.Color.HexStringToColor(COLORS.gridLines).color, 0.15);
        this.scene.tweens.add({
            targets: outerGlow,
            scaleX: 1.02,
            scaleY: 1.02,
            alpha: 0.2,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.gridComponent = new GridComponent(this.scene);
    }

    private createScoreDisplay(): void {
        this.scoreText = this.scene.add.text(GAME_WIDTH - 20, 20, 'Счет: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: COLORS.textTitle
        }).setOrigin(1, 0);
    }

    private createComboDisplay(): void {
        this.comboText = this.scene.add.text(GAME_WIDTH - 20, 50, 'Комбо: 0', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: COLORS.comboText
        }).setOrigin(1, 0);
        this.comboText.setVisible(false);
    }

    private createShapePreviewArea(): void {
        const previewWidth = 100;
        const previewHeight = 100;
        const padding = 15;
        const startX = 20;
        const startY = GRID_Y + 20;

        for (let i = 0; i < 3; i++) {
            const y = startY + i * (previewHeight + padding);

            const baseBg = this.scene.add.rectangle(startX, y, previewWidth, previewHeight, Phaser.Display.Color.HexStringToColor(COLORS.previewBackground).color, 1).setOrigin(0);
            const topGradient = this.scene.add.rectangle(startX, y, previewWidth, previewHeight * 0.6, 0xffffff, 0.1).setOrigin(0);

            const shapeMask = this.scene.make.graphics({});
            shapeMask.fillStyle(0xffffff);
            shapeMask.fillRoundedRect(startX, y, previewWidth, previewHeight, 8);
            const mask = shapeMask.createGeometryMask();
            baseBg.setMask(mask);
            topGradient.setMask(mask);

            const border = this.scene.add.rectangle(startX + previewWidth / 2, y + previewHeight / 2, previewWidth, previewHeight, 0x000000, 0).setOrigin(0.5);
            border.setStrokeStyle(2.5, Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color, 0.8);

            const glow = this.scene.add.rectangle(startX + previewWidth / 2, y + previewHeight / 2, previewWidth + 10, previewHeight + 10, 0xffffff, 0);
            glow.setStrokeStyle(8, Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color, 0.15);

            const container = this.scene.add.container(startX, y);
            container.setData('index', i);
            container.setData('initialX', startX);
            container.setData('initialY', y);
            container.setData('background', [baseBg, topGradient, border, glow, mask, shapeMask]);

            this.shapePreviews.push(container);
        }
    }

    public updateScoreText(score: number): void {
        this.scoreText.setText(`Счет: ${score}`);
        this.scene.tweens.add({
            targets: this.scoreText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    public updateComboText(combo: number): void {
        if (combo > 0) {
            this.comboText.setText(`Комбо: ${combo}x`).setVisible(true);
            this.comboText.setColor(COLORS.comboText);
            this.scene.tweens.add({
                targets: this.comboText,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: { from: 0.5, to: 1 },
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        } else {
            this.scene.tweens.add({
                targets: this.comboText,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.comboText.setVisible(false);
                    this.comboText.setAlpha(1);
                }
            });
        }
    }

    public updateShapePreviews(shapes: (Shape | null)[], withAnimation = true): void {
        console.log('UIManager: Обновление превью фигур:', shapes);

        this.shapePreviews.forEach(container => {
            if (container.input) {
                this.scene.input.disable(container);
            }
            const childrenToRemove = container.list.filter(child => child.type !== 'Rectangle' && child.type !== 'Graphics');
            childrenToRemove.forEach(child => child.destroy());

            container.setData('shape', null);
        });

        shapes.forEach((shape, index) => {
            if (index < this.shapePreviews.length) {
                const container = this.shapePreviews[index];
                if (shape !== null) {
                    this.drawShapeInPreview(container, shape, withAnimation);
                    container.setData('shape', shape);
                }
            }
        });
        this.resetPreviewPositions();
    }

    private drawShapeInPreview(container: Phaser.GameObjects.Container, shape: Shape, withAnimation: boolean): void {
        const shapeSize = ShapeGenerator.getShapeSize(shape);
        const blockSize = 20;
        const offsetX = (100 - shapeSize.width * blockSize) / 2;
        const offsetY = (100 - shapeSize.height * blockSize) / 2;

        const dragGroup = this.scene.add.container(0, 0);
        container.add(dragGroup);

        shape.blocks.forEach(block => {
            const rect = this.scene.add.rectangle(
                offsetX + block.x * blockSize + blockSize / 2,
                offsetY + block.y * blockSize + blockSize / 2,
                blockSize - 2, blockSize - 2,
                Phaser.Display.Color.HexStringToColor(shape.color).color
            );
            const highlight = this.scene.add.rectangle(
                offsetX + block.x * blockSize + blockSize / 2,
                offsetY + block.y * blockSize + blockSize * 0.3,
                blockSize * 0.7, blockSize * 0.4, 0xffffff, 0.3
            );
            const shadow = this.scene.add.rectangle(
                offsetX + block.x * blockSize + blockSize / 2,
                offsetY + block.y * blockSize + blockSize * 0.7,
                blockSize * 0.9, blockSize * 0.4, 0x000000, 0.2
            );
            dragGroup.add([rect, highlight, shadow]);
        });

        const hitArea = this.scene.add.rectangle(50, 50, 100, 100, 0xffffff, 0);
        dragGroup.add(hitArea);

        if (withAnimation) {
           this.animator.animatePreviewAppearance(container, dragGroup, shape);
        } else {
             dragGroup.setAlpha(1);
             dragGroup.setScale(1);
        }
    }

    public resetPreviewPositions(): void {
        this.shapePreviews.forEach(container => {
            const initialX = container.getData('initialX');
            const initialY = container.getData('initialY');
            if (initialX !== undefined && initialY !== undefined) {
                this.scene.tweens.killTweensOf(container);
                container.x = initialX;
                container.y = initialY;
                container.setScale(1);
                container.setAlpha(1);
            }
        });
    }

    public getShapePreviewContainers(): Phaser.GameObjects.Container[] {
        return this.shapePreviews;
    }

    public destroy(): void {
        this.scoreText?.destroy();
        this.comboText?.destroy();
        this.gridComponent?.destroy();

        this.shapePreviews.forEach(container => {
            const backgrounds = container.getData('background') as Phaser.GameObjects.GameObject[];
            if (backgrounds) {
                backgrounds.forEach(bg => bg?.destroy());
            }
            container.destroy();
        });
        this.shapePreviews = [];

        console.log("GameSceneUIManager destroyed");
    }
}