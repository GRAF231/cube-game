import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GRID_Y } from '../../../config';
import { Shape } from '../../../core/types';
import { GameScene } from '../../../scenes/GameScene';
import { ShapeGenerator } from '../../../core/logic/ShapeGenerator';

/**
 * Класс для управления отображением и анимацией предпросмотра фигур
 */
export class GameSceneUIShapePreview {
    private scene: GameScene;
    private shapePreviews: Phaser.GameObjects.Container[] = [];

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    /**
     * Создает область для предпросмотра фигур
     */
    public createShapePreviewArea(): void {
        const previewTitle = this.scene.add.text(20, GRID_Y - 40, 'Фигуры', {
            fontFamily: '"Russo One", "Exo 2", sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#00ffe7',
            strokeThickness: 1,
        });

        const titleGlow = this.scene.add.rectangle(
            previewTitle.x + previewTitle.width / 2,
            previewTitle.y + previewTitle.height / 2,
            previewTitle.width + 20,
            previewTitle.height + 10,
            0x00ffe7,
            0.15
        );
        titleGlow.setDepth(previewTitle.depth - 1);

        this.scene.tweens.add({
            targets: titleGlow,
            alpha: { from: 0.15, to: 0.3 },
            scale: { from: 1, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        const previewWidth = 110;
        const previewHeight = 110;
        const padding = 15;
        const startX = 20;
        const startY = GRID_Y + 20;

        const previewPanelHeight = 3 * (previewHeight + padding) + padding;
        const previewPanel = this.scene.add
            .rectangle(
                startX - 10,
                startY - 10,
                previewWidth + 20,
                previewPanelHeight,
                Phaser.Display.Color.HexStringToColor(COLORS.background).color,
                0.5
            )
            .setOrigin(0);

        previewPanel.setStrokeStyle(
            2,
            Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color,
            0.7
        );

        const panelGlow = this.scene.add
            .rectangle(startX - 10, startY - 10, previewWidth + 20, previewPanelHeight, 0xffffff, 0)
            .setOrigin(0);
        panelGlow.setStrokeStyle(
            8,
            Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color,
            0.15
        );

        this.scene.tweens.add({
            targets: panelGlow,
            alpha: { from: 0, to: 0.2 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        for (let i = 0; i < 3; i++) {
            const y = startY + i * (previewHeight + padding);

            // Убираем номера слотов по просьбе пользователя

            // Вычисляем центр блока превью
            const centerX = startX + previewWidth / 2;
            const centerY = y + previewHeight / 2;

            // Создаем фон для превью с rounded corners (используем центрированное положение)
            const baseBg = this.scene.add
                .rectangle(
                    centerX,
                    centerY,
                    previewWidth,
                    previewHeight,
                    Phaser.Display.Color.HexStringToColor(COLORS.previewBackground).color,
                    0.9
                )
                .setOrigin(0.5); // Используем одинаковую точку привязки для всех элементов

            // Добавляем градиент сверху
            const topGradient = this.scene.add
                .rectangle(
                    centerX,
                    centerY - previewHeight * 0.2, // Смещаем выше центра для эффекта градиента
                    previewWidth,
                    previewHeight * 0.6,
                    0xffffff,
                    0.1
                )
                .setOrigin(0.5);

            // Создаем маску для закругленных углов, учитывая новое центрированное позиционирование
            const shapeMask = this.scene.make.graphics({});
            shapeMask.fillStyle(0xffffff);
            // Рассчитываем координаты для левого верхнего угла с учетом центрированных элементов
            shapeMask.fillRoundedRect(
                centerX - previewWidth / 2,
                centerY - previewHeight / 2,
                previewWidth,
                previewHeight,
                12
            );
            const mask = shapeMask.createGeometryMask();
            baseBg.setMask(mask);
            topGradient.setMask(mask);

            // Добавляем красивую обводку с неоновым эффектом - с корректировкой позиции вниз
            const border = this.scene.add
                .rectangle(
                    centerX,
                    centerY + 4, // Добавляем смещение вниз на 4 пикселя
                    previewWidth,
                    previewHeight,
                    0x000000,
                    0
                )
                .setOrigin(0.5);
            border.setStrokeStyle(
                2.5,
                Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color,
                0.8
            );

            // Добавляем внешнее свечение - с той же корректировкой
            const glow = this.scene.add
                .rectangle(
                    centerX,
                    centerY + 4, // Такое же смещение вниз на 4 пикселя
                    previewWidth + 10,
                    previewHeight + 10,
                    0xffffff,
                    0
                )
                .setOrigin(0.5);
            glow.setStrokeStyle(
                8,
                Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color,
                0.15
            );

            // Анимация пульсации свечения
            this.scene.tweens.add({
                targets: glow,
                alpha: { from: 0, to: 0.3 },
                duration: 1500 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // Создаем контейнер для всех элементов слота
            const container = this.scene.add.container(startX, y);
            container.setData('index', i);
            container.setData('initialX', startX);
            container.setData('initialY', y);
            container.setData('background', [baseBg, topGradient, border, glow, mask, shapeMask]);

            this.shapePreviews.push(container);
        }
    }

    /**
     * Обновляет отображение фигур в предпросмотре
     */
    public updateShapePreviews(shapes: (Shape | null)[], withAnimation = true): void {
        this.shapePreviews.forEach(container => {
            const childrenToRemove = container
                .getAll()
                .filter(child => !child.getData('isBackground'));
            childrenToRemove.forEach(child => child.destroy());

            container.setData('shape', null);
        });

        shapes.forEach((shape, index) => {
            if (index < this.shapePreviews.length) {
                const container = this.shapePreviews[index];
                if (shape) {
                    this.drawShapeInPreview(container, shape, withAnimation);
                    container.setData('shape', shape);
                }
            }
        });
        this.resetPreviewPositions();
    }

    /**
     * Рисует форму в контейнере предпросмотра
     */
    private drawShapeInPreview(
        container: Phaser.GameObjects.Container,
        shape: Shape,
        withAnimation = true
    ): void {
        const shapeSize = ShapeGenerator.getShapeSize(shape);

        const blockSize = 22;
        const previewWidth = 110;
        const previewHeight = 110;

        const dragGroup = this.scene.add.container(previewWidth / 2, previewHeight / 2);
        container.add(dragGroup);

        const groupOffsetX = -(shapeSize.width * blockSize) / 2;
        const groupOffsetY = -(shapeSize.height * blockSize) / 2;

        shape.blocks.forEach(block => {
            const rect = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize / 2,
                blockSize - 2,
                blockSize - 2,
                Phaser.Display.Color.HexStringToColor(shape.color).color
            );

            const highlight = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize * 0.3,
                blockSize * 0.7,
                blockSize * 0.4,
                0xffffff,
                0.3
            );

            const shadow = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize * 0.7,
                blockSize * 0.9,
                blockSize * 0.4,
                0x000000,
                0.2
            );

            const glow = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize / 2,
                blockSize + 4,
                blockSize + 4,
                Phaser.Display.Color.HexStringToColor(shape.color).color,
                0.2
            );
            glow.setDepth(-1);

            dragGroup.add([glow, rect, highlight, shadow]);
        });

        const hitArea = this.scene.add.rectangle(0, 0, previewWidth, previewHeight, 0xffffff, 0);
        hitArea.setDepth(-2);
        dragGroup.add(hitArea);

        if (withAnimation) {
            this.scene.animator.animatePreviewAppearance(container, dragGroup, shape);
        } else {
            dragGroup.setAlpha(1);
            dragGroup.setScale(1);
        }
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
