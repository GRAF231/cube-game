import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT } from '../../../config';
import { Shape } from '../../../types';
import { GameScene } from '../../GameScene';

/**
 * Класс для управления отображением и анимацией предпросмотра фигур
 */
export class GameSceneUIShapePreview {
    private scene: GameScene;
    private shapePreviews: Phaser.GameObjects.Container[] = [];
    private previewConfigs: {
        width: number;
        height: number;
        x: number;
        y: number;
        spacing: number;
    };

    constructor(scene: GameScene) {
        this.scene = scene;

        // Параметры области предпросмотра
        this.previewConfigs = {
            width: 80,
            height: 80,
            x: 40,
            y: GAME_HEIGHT - 100,
            spacing: 100,
        };
    }

    /**
     * Создает область для предпросмотра фигур
     */
    public createShapePreviewArea(): void {
        // Создаем контейнеры для фигур (всего 3)
        for (let i = 0; i < 3; i++) {
            const previewX = this.previewConfigs.x + i * this.previewConfigs.spacing;
            const previewY = this.previewConfigs.y;
            const previewWidth = this.previewConfigs.width;
            const previewHeight = this.previewConfigs.height;

            // Контейнер для каждой фигуры
            const shapeContainer = this.scene.add.container(previewX, previewY);
            shapeContainer.setData('index', i);
            shapeContainer.setData('initialX', previewX);
            shapeContainer.setData('initialY', previewY);
            shapeContainer.setSize(previewWidth, previewHeight);
            shapeContainer.setInteractive();
            this.shapePreviews.push(shapeContainer);

            // Сохраняем ссылки на фоновые элементы для последующего обновления
            const backgrounds: Phaser.GameObjects.GameObject[] = [];

            // Создаем контейнер для фона - с учетом нового центрированного дизайна
            const backgroundContainer = this.scene.add.container(0, 0);
            shapeContainer.add(backgroundContainer);

            // Фон для предпросмотра фигуры с увеличенной прозрачностью для лучшего эффекта
            const background = this.scene.add
                .rectangle(
                    0,
                    0,
                    previewWidth,
                    previewHeight,
                    Phaser.Display.Color.HexStringToColor(COLORS.previewBackground).color,
                    0.4
                )
                .setOrigin(0.5);
            backgroundContainer.add(background);
            backgrounds.push(background);

            // Добавляем внутреннюю подсветку для фона
            const innerGlow = this.scene.add
                .rectangle(0, 0, previewWidth * 0.8, previewHeight * 0.6, 0xffffff, 0.1)
                .setOrigin(0.5);
            backgroundContainer.add(innerGlow);
            backgrounds.push(innerGlow);

            // Создаем маску для закругленных углов, учитывая новое центрированное позиционирование
            const shapeMask = this.scene.make.graphics({});
            shapeMask.fillStyle(0xffffff);
            // Рассчитываем координаты для левого верхнего угла с учетом центрированных элементов
            shapeMask.fillRoundedRect(
                -previewWidth / 2,
                -previewHeight / 2,
                previewWidth,
                previewHeight,
                10
            );
            const mask = shapeMask.createGeometryMask();
            backgroundContainer.setMask(mask);
            backgrounds.push(shapeMask);

            // Добавляем внешнюю подсветку/ауру
            const glow = this.scene.add
                .rectangle(
                    0,
                    0,
                    previewWidth + 10,
                    previewHeight + 10,
                    Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color,
                    0.2
                )
                .setOrigin(0.5);
            backgroundContainer.add(glow);
            backgroundContainer.sendToBack(glow);
            backgrounds.push(glow);

            // Анимация для подсветки
            this.scene.tweens.add({
                targets: [glow, innerGlow],
                alpha: { from: glow.alpha, to: glow.alpha * 2 },
                duration: 1500 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // Сохраняем ссылки на фоновые элементы
            shapeContainer.setData('background', backgrounds);
        }
    }

    /**
     * Обновляет отображение фигур в предпросмотре
     */
    public updateShapePreviews(shapes: (Shape | null)[], withAnimation = true): void {
        // Очищаем предыдущие фигуры из контейнеров
        this.shapePreviews.forEach(container => {
            // Удаляем все дочерние элементы, кроме фона
            const childrenToRemove = container
                .getAll()
                .filter(child => !child.getData('isBackground'));
            childrenToRemove.forEach(child => child.destroy());
        });

        // Добавляем новые фигуры
        shapes.forEach((shape, index) => {
            if (index < this.shapePreviews.length) {
                const container = this.shapePreviews[index];
                if (shape) {
                    // Рисуем фигуру в контейнере
                    this.drawShapeInPreview(container, shape, withAnimation);
                }
            }
        });
    }

    /**
     * Рисует форму в контейнере предпросмотра
     */
    private drawShapeInPreview(
        container: Phaser.GameObjects.Container,
        shape: Shape,
        withAnimation = true
    ): void {
        // Используем непосредственно блоки из shape
        const blocks = shape.blocks;
        const previewScale = 0.8; // Масштаб фигуры внутри контейнера

        // Находим размер сетки для фигуры
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        blocks.forEach((block: { x: number; y: number }) => {
            minX = Math.min(minX, block.x);
            minY = Math.min(minY, block.y);
            maxX = Math.max(maxX, block.x);
            maxY = Math.max(maxY, block.y);
        });

        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;
        const blockSize = Math.min(
            (this.previewConfigs.width * previewScale) / gridWidth,
            (this.previewConfigs.height * previewScale) / gridHeight
        );

        // Центрирование сетки
        const gridCenterX = 0;
        const gridCenterY = 0;
        const gridOffsetX = gridCenterX - ((gridWidth - 1) * blockSize) / 2;
        const gridOffsetY = gridCenterY - ((gridHeight - 1) * blockSize) / 2;

        // Создаем блоки фигуры
        shape.blocks.forEach(block => {
            // Позиция блока в контейнере
            const blockX = gridOffsetX + (block.x - minX) * blockSize;
            const blockY = gridOffsetY + (block.y - minY) * blockSize;

            // Создаем блок с более интересным визуалом
            const blockGraphics = this.scene.add.graphics();
            container.add(blockGraphics);

            // Цвет блока из формы
            const blockColor = shape.color;
            const colorValue = Phaser.Display.Color.HexStringToColor(blockColor).color;

            // Отрисовка блока с эффектами объема
            blockGraphics.fillStyle(colorValue, 1);
            blockGraphics.fillRect(
                blockX - blockSize / 2 + 1,
                blockY - blockSize / 2 + 1,
                blockSize - 2,
                blockSize - 2
            );

            // Добавляем световой эффект сверху (блик)
            blockGraphics.fillStyle(0xffffff, 0.4);
            blockGraphics.fillRect(
                blockX - blockSize / 2 + 3,
                blockY - blockSize / 2 + 3,
                blockSize - 6,
                blockSize / 3
            );

            // Добавляем тень снизу
            blockGraphics.fillStyle(0x000000, 0.3);
            blockGraphics.fillRect(
                blockX - blockSize / 2 + 3,
                blockY + blockSize / 2 - blockSize / 3,
                blockSize - 6,
                blockSize / 3 - 3
            );

            // Применяем анимацию появления, если требуется
            if (withAnimation) {
                blockGraphics.setAlpha(0);
                blockGraphics.setScale(0.5);
                this.scene.tweens.add({
                    targets: blockGraphics,
                    alpha: 1,
                    scale: 1,
                    ease: 'Back.easeOut',
                    duration: 200,
                    delay: 100 * block.x, // Последовательное появление
                });
            }
        });
    }

    /**
     * Сбрасывает позиции контейнеров предпросмотра
     */
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

    /**
     * Возвращает массив контейнеров предпросмотра фигур
     */
    public getShapePreviewContainers(): Phaser.GameObjects.Container[] {
        return this.shapePreviews;
    }

    /**
     * Очищает ресурсы при закрытии сцены
     */
    public destroy(): void {
        this.shapePreviews.forEach(container => {
            const backgrounds = container.getData('background') as Phaser.GameObjects.GameObject[];
            if (backgrounds) {
                backgrounds.forEach(bg => bg?.destroy());
            }
            container.destroy();
        });
        this.shapePreviews = [];
    }
}
