import Phaser from 'phaser';
import { GameScene } from '../../scenes/GameScene';
import { Shape, GridPosition } from '../../core/types';
import { GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y } from '../../config';

export class GameSceneAnimator {
    private scene: GameScene;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    /**
     * Показывает анимацию заработанных очков.
     */
    public showPointsAnimation(points: number, position: GridPosition): void {
        if (!this.scene.scene.isActive(this.scene.scene.key)) return;

        const x = GRID_X + position.x * CELL_SIZE + CELL_SIZE / 2;
        const y = GRID_Y + position.y * CELL_SIZE + CELL_SIZE / 2;

        let textColor = '#ffffff';
        let fontSize = 24;
        let prefix = '+';

        if (points >= 100) {
            textColor = '#ff9500';
            fontSize = 32;
            prefix = '+ ';
        } else if (points >= 50) {
            textColor = '#ffcc00';
            fontSize = 28;
            prefix = '+ ';
        }

        const pointsText = this.scene.add
            .text(x, y, `${prefix}${points}`, {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`,
                color: textColor,
                stroke: '#000000',
                strokeThickness: 3,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 2,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5);
        pointsText.setDepth(200);

        const glow = this.scene.add.graphics();
        glow.fillStyle(Phaser.Display.Color.HexStringToColor(textColor).color, 0.3);
        glow.fillCircle(x, y, fontSize * 1.5);
        glow.setDepth(199);

        this.scene.tweens.add({
            targets: pointsText,
            y: y - 60,
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.5 },
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                pointsText.destroy();
                glow.destroy();
            },
        });

        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0 },
            scale: { from: 1, to: 2.5 },
            duration: 1000,
            ease: 'Cubic.easeOut',
        });

        this.createStarsEffect(x, y, points);
    }

    /**
     * Создает эффект рассыпающихся звездочек.
     */
    private createStarsEffect(x: number, y: number, points: number): void {
        const starsCount = Math.min(Math.max(points / 10, 5), 30);
        const colors = [0xffcc00, 0xff9500, 0xff3b30, 0x4cd964, 0x007aff, 0x5856d6];

        for (let i = 0; i < starsCount; i++) {
            const size = Phaser.Math.Between(3, 8);
            const star = this.scene.add.star(x, y, 5, size / 2, size, 0xffffff);
            star.setAlpha(Phaser.Math.FloatBetween(0.7, 1));
            star.setFillStyle(Phaser.Utils.Array.GetRandom(colors), 1);
            star.setDepth(150);

            const angle = Phaser.Math.Between(0, 360);
            const distance = Phaser.Math.Between(50, 150);
            const duration = Phaser.Math.Between(700, 1500);

            this.scene.tweens.add({
                targets: star,
                x: x + Math.cos((angle * Math.PI) / 180) * distance,
                y: y + Math.sin((angle * Math.PI) / 180) * distance,
                alpha: 0,
                angle: Phaser.Math.Between(-180, 180),
                scale: { from: 1, to: 0.5 },
                duration: duration,
                ease: 'Cubic.easeOut',
                onComplete: () => star.destroy(),
            });
        }
    }

    /**
     * Создает эффект частиц при появлении фигуры в превью.
     */
    public createAppearanceParticles(
        container: Phaser.GameObjects.Container,
        colorHex: string
    ): void {
        if (!this.scene.textures.exists('pixel')) {
            console.warn("Текстура 'pixel' не найдена для создания частиц.");
            const particleSize = 4;
            const particleTexture = this.scene.make.graphics({ x: 0, y: 0 });
            particleTexture.fillStyle(0xffffff);
            particleTexture.fillRect(0, 0, particleSize, particleSize);
            particleTexture.generateTexture('pixel', particleSize, particleSize);
            particleTexture.destroy();
            console.log("Текстура 'pixel' создана.");
        }

        // Размеры ячейки превью
        const previewWidth = 110;
        const previewHeight = 110;

        // Рассчитываем центр ячейки превью
        const centerX = container.x + previewWidth / 2;
        const centerY = container.y + previewHeight / 2;

        // Создаем эффект частиц в центре ячейки
        const particleColor = Phaser.Display.Color.HexStringToColor(colorHex).color;
        const emitter = this.scene.add.particles(centerX, centerY, 'pixel', {
            speed: { min: 40, max: 120 }, // Увеличиваем скорость для более выраженного эффекта
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 }, // Увеличиваем начальный размер
            lifespan: 1000,
            quantity: 2, // Увеличиваем количество частиц
            frequency: 15,
            maxParticles: 30,
            tint: [0xffffff, particleColor, 0xffffff],
            blendMode: Phaser.BlendModes.ADD, // Добавляем режим смешивания для более яркого эффекта
            emitting: true,
        });
        emitter.setDepth(container.depth + 1);

        // Создаем вторую систему частиц для более яркого эффекта
        const glowEmitter = this.scene.add.particles(centerX, centerY, 'pixel', {
            speed: { min: 20, max: 60 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: 800,
            quantity: 1,
            frequency: 30,
            maxParticles: 15,
            tint: [particleColor],
            alpha: { start: 0.6, end: 0 },
            blendMode: Phaser.BlendModes.ADD,
            emitting: true,
        });
        glowEmitter.setDepth(container.depth + 2);

        this.scene.time.delayedCall(400, () => {
            emitter.stop();
            glowEmitter.stop();
            this.scene.time.delayedCall(800, () => {
                emitter.destroy();
                glowEmitter.destroy();
            });
        });
    }

    /**
     * Анимирует появление фигуры в области предпросмотра.
     */
    public animatePreviewAppearance(
        container: Phaser.GameObjects.Container,
        dragGroup: Phaser.GameObjects.Container,
        shape: Shape
    ): void {
        // Устанавливаем начальные свойства группы для анимации
        dragGroup.setAlpha(0);
        dragGroup.setScale(0.5);

        // Создаем эффект свечения в центре ячейки превью
        const glow = this.scene.add.rectangle(
            0, // позиция X уже центрирована, т.к. dragGroup в центре ячейки
            0, // позиция Y уже центрирована
            95, // немного увеличиваем размер свечения
            95,
            Phaser.Display.Color.HexStringToColor(shape.color).color,
            0.7
        );
        glow.setAlpha(0);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        dragGroup.add(glow); // Добавляем к dragGroup вместо container

        const index = container.getData('index') as number;

        // Анимация свечения
        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0, to: 0.7 },
            scale: { from: 1.5, to: 1 },
            ease: 'Sine.easeOut',
            duration: 300,
            delay: index * 150,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: glow,
                    alpha: 0,
                    scale: 1.2,
                    ease: 'Sine.easeIn',
                    duration: 400,
                    onComplete: () => glow.destroy(),
                });
                // Создаем частицы появления в центре ячейки
                this.createAppearanceParticles(container, shape.color);
            },
        });

        // Анимация появления фигуры без смещения по вертикали
        this.scene.tweens.add({
            targets: dragGroup,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.8, to: 1 },
            ease: 'Back.easeOut',
            duration: 500,
            delay: index * 150,
            onComplete: () => {
                // Добавляем небольшую "пульсирующую" анимацию после появления
                this.scene.tweens.add({
                    targets: dragGroup,
                    scaleX: { from: 1, to: 1.05, yoyo: true },
                    scaleY: { from: 1, to: 0.95, yoyo: true },
                    ease: 'Sine.easeInOut',
                    duration: 300,
                    repeat: 1,
                });
            },
        });
    }

    /**
     * Анимирует размещение фигуры на сетке.
     * (Извлечено из GameSceneNew)
     * @param position - Позиция размещения.
     * @param placedShape - Размещенная фигура.
     * @param onComplete - Колбэк после завершения основной анимации (перед обновлением сетки).
     */
    public animateShapePlacement(
        position: GridPosition,
        placedShape: Shape,
        onComplete?: () => void
    ): void {
        function blockAnimateComplete(scene: Phaser.Scene, effects: Phaser.GameObjects.Group) {
            animationsComplete++;

            if (animationsComplete === totalAnimations) {
                onComplete?.();

                scene.tweens.add({
                    targets: effects
                        .getChildren()
                        .filter(
                            (obj: Phaser.GameObjects.GameObject) =>
                                !(obj instanceof Phaser.GameObjects.Particles.ParticleEmitter)
                        ),
                    alpha: 0,
                    duration: 250,
                    onComplete: () => effects.clear(true, true),
                });
            }
        }

        const effectsGroup = this.scene.add.group();
        const blockPositions = placedShape.blocks
            .map(b => ({ x: position.x + b.x, y: position.y + b.y }))
            .filter(p => p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE);

        let animationsComplete = 0;
        const totalAnimations = blockPositions.length;

        // Вычисляем центр и размер фигуры
        if (blockPositions.length > 0) {
            const minX = Math.min(...blockPositions.map(p => p.x));
            const minY = Math.min(...blockPositions.map(p => p.y));
            const maxX = Math.max(...blockPositions.map(p => p.x));
            const maxY = Math.max(...blockPositions.map(p => p.y));

            // Координаты центра фигуры
            const centerX = GRID_X + ((minX + maxX) / 2 + 0.5) * CELL_SIZE;
            const centerY = GRID_Y + ((minY + maxY) / 2 + 0.5) * CELL_SIZE;
            const width = (maxX - minX + 1) * CELL_SIZE;
            const height = (maxY - minY + 1) * CELL_SIZE;

            // Создаем эффект внешнего свечения
            const glow = this.scene.add.rectangle(
                centerX,
                centerY,
                width + 12,
                height + 12,
                0xffffff,
                0.2
            );
            glow.setStrokeStyle(
                8,
                Phaser.Display.Color.HexStringToColor(placedShape.color).color,
                0.6
            );
            effectsGroup.add(glow);

            // Анимация для свечения
            this.scene.tweens.add({
                targets: glow,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0,
                duration: 350,
                ease: 'Sine.easeOut',
            });

            // Создаем эффект пульсации в центре фигуры
            const pulseBurst = this.scene.add.circle(
                centerX,
                centerY,
                Math.max(width, height) / 2,
                Phaser.Display.Color.HexStringToColor(placedShape.color).color,
                0.3
            );
            pulseBurst.setBlendMode(Phaser.BlendModes.SCREEN);
            effectsGroup.add(pulseBurst);

            this.scene.tweens.add({
                targets: pulseBurst,
                radius: Math.max(width, height) * 1.5,
                alpha: 0,
                duration: 400,
                ease: 'Quad.easeOut',
                onComplete: () => pulseBurst.destroy(),
            });
        }

        // Анимируем появление каждого блока с волновым эффектом
        const shapeColor = Phaser.Display.Color.HexStringToColor(placedShape.color).color;

        blockPositions.forEach((blockPos, index) => {
            const x = blockPos.x;
            const y = blockPos.y;

            // Добавляем задержку для эффекта волны (блоки появляются последовательно)
            const delay = index * 40; // Задержка для каждого следующего блока

            const gridX = GRID_X + x * CELL_SIZE + CELL_SIZE / 2;
            const gridY = GRID_Y + y * CELL_SIZE + CELL_SIZE / 2;

            // Основной блок
            const animBlock = this.scene.add.rectangle(
                gridX,
                gridY,
                CELL_SIZE - 4,
                CELL_SIZE - 4,
                shapeColor,
                1
            );
            animBlock.setStrokeStyle(3, 0xffffff, 0.7);
            animBlock.setScale(0);
            animBlock.setAlpha(0);
            effectsGroup.add(animBlock);

            // Внутреннее свечение блока
            const innerGlow = this.scene.add.rectangle(
                gridX,
                gridY,
                CELL_SIZE * 0.7,
                CELL_SIZE * 0.7,
                0xffffff,
                0.3
            );
            innerGlow.setScale(0);
            innerGlow.setAlpha(0);
            effectsGroup.add(innerGlow);

            // Система частиц для каждого блока
            if (this.scene.textures.exists('pixel')) {
                const particles = this.scene.add.particles(gridX, gridY, 'pixel', {
                    lifespan: 400,
                    scale: { start: 0.8, end: 0 },
                    quantity: 1,
                    frequency: 30,
                    speed: { min: 40, max: 100 },
                    angle: { min: 0, max: 360 },
                    alpha: { start: 0.6, end: 0 },
                    tint: [0xffffff, shapeColor],
                    blendMode: Phaser.BlendModes.SCREEN,
                    emitting: false,
                });
                particles.setDepth(100);
                effectsGroup.add(particles);

                // Запускаем эмиттер с задержкой
                this.scene.time.delayedCall(delay, () => {
                    particles.start();
                    this.scene.time.delayedCall(180, () => particles.stop());
                });
            }

            // Анимация появления блока
            this.scene.time.delayedCall(delay, () => {
                // Эффект "взрыва" перед появлением блока
                const burst = this.scene.add.circle(gridX, gridY, CELL_SIZE / 2, 0xffffff, 0.7);
                burst.setBlendMode(Phaser.BlendModes.SCREEN);
                effectsGroup.add(burst);

                this.scene.tweens.add({
                    targets: burst,
                    radius: CELL_SIZE * 1.5,
                    alpha: 0,
                    duration: 200,
                    ease: 'Quad.easeOut',
                    onComplete: () => burst.destroy(),
                });

                // Анимация блока
                this.scene.tweens.add({
                    targets: [animBlock, innerGlow],
                    scale: { from: 0, to: 1 },
                    alpha: { from: 0, to: 1 },
                    ease: 'Back.easeOut',
                    duration: 300,
                    onComplete: () => {
                        // Пульсация после появления
                        this.scene.tweens.add({
                            targets: innerGlow,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => innerGlow.destroy(),
                        });

                        // Сообщить о завершении анимации
                        blockAnimateComplete(this.scene, effectsGroup);
                    },
                });
            });
        });

        if (totalAnimations === 0) {
            onComplete?.();
            effectsGroup.clear(true, true);
        }
    }

    public destroy(): void {
        console.log('GameSceneAnimator destroyed');
    }
}
