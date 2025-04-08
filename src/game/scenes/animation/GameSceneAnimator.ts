import Phaser from 'phaser';
import { GameScene } from '../GameScene';
import { Shape, GridPosition } from '../../types';
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

        if (points >= 100) { textColor = '#ff9500'; fontSize = 32; prefix = '+ '; }
        else if (points >= 50) { textColor = '#ffcc00'; fontSize = 28; prefix = '+ '; }

        const pointsText = this.scene.add.text(x, y, `${prefix}${points}`, {
            fontFamily: 'Arial', fontSize: `${fontSize}px`, color: textColor,
            stroke: '#000000', strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, stroke: true, fill: true }
        }).setOrigin(0.5);
        pointsText.setDepth(200);

        const glow = this.scene.add.graphics();
        glow.fillStyle(Phaser.Display.Color.HexStringToColor(textColor).color, 0.3);
        glow.fillCircle(x, y, fontSize * 1.5);
        glow.setDepth(199);

        this.scene.tweens.add({
            targets: pointsText, y: y - 60,
            alpha: { from: 1, to: 0 }, scale: { from: 1, to: 1.5 },
            duration: 1500, ease: 'Cubic.easeOut',
            onComplete: () => { pointsText.destroy(); glow.destroy(); }
        });

        this.scene.tweens.add({
            targets: glow, alpha: { from: 0.3, to: 0 }, scale: { from: 1, to: 2.5 },
            duration: 1000, ease: 'Cubic.easeOut'
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
                x: x + Math.cos(angle * Math.PI / 180) * distance,
                y: y + Math.sin(angle * Math.PI / 180) * distance,
                alpha: 0, angle: Phaser.Math.Between(-180, 180), scale: { from: 1, to: 0.5 },
                duration: duration, ease: 'Cubic.easeOut',
                onComplete: () => star.destroy()
            });
        }
    }

    /**
     * Создает эффект частиц при появлении фигуры в превью.
     */
    public createAppearanceParticles(container: Phaser.GameObjects.Container, colorHex: string): void {
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

        const particleColor = Phaser.Display.Color.HexStringToColor(colorHex).color;
        const emitter = this.scene.add.particles(
            container.x + 50, container.y + 50, 'pixel', {
            speed: { min: 30, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            lifespan: 800,
            quantity: 1,
            frequency: 20,
            maxParticles: 20,
            tint: [0xffffff, particleColor],
            emitting: true
        });
        emitter.setDepth(container.depth + 1);

        this.scene.time.delayedCall(400, () => {
            emitter.stop();
            this.scene.time.delayedCall(800, () => emitter.destroy());
        });
    }

    /**
     * Анимирует появление фигуры в области предпросмотра.
     */
    public animatePreviewAppearance(container: Phaser.GameObjects.Container, dragGroup: Phaser.GameObjects.Container, shape: Shape): void {
        dragGroup.setAlpha(0);
        dragGroup.setScale(0.5);

        const glow = this.scene.add.rectangle(50, 50, 85, 85, Phaser.Display.Color.HexStringToColor(shape.color).color, 0.7);
        glow.setAlpha(0);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        container.add(glow);

        const index = container.getData('index') as number;

        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0, to: 0.7 },
            scale: { from: 1.5, to: 1 },
            ease: 'Sine.easeOut',
            duration: 300,
            delay: index * 150,
            onComplete: () => {
                this.scene.tweens.add({ targets: glow, alpha: 0, scale: 1.2, ease: 'Sine.easeIn', duration: 400, onComplete: () => glow.destroy() });
                this.createAppearanceParticles(container, shape.color);
            }
        });

        this.scene.tweens.add({
            targets: dragGroup,
            alpha: 1,
            scale: { from: 0.5, to: 1 },
            y: { from: -10, to: 0 },
            ease: 'Back.easeOut',
            duration: 600,
            delay: index * 150,
            onComplete: () => {
                this.scene.tweens.add({ targets: dragGroup, scaleX: { from: 1, to: 1.05, yoyo: true }, scaleY: { from: 1, to: 0.95, yoyo: true }, ease: 'Sine.easeInOut', duration: 300, repeat: 1 });
            }
        });
    }

     /**
     * Анимирует размещение фигуры на сетке.
     * (Извлечено из GameSceneNew)
     * @param position - Позиция размещения.
     * @param placedShape - Размещенная фигура.
     * @param onComplete - Колбэк после завершения основной анимации (перед обновлением сетки).
     */
    public animateShapePlacement(position: GridPosition, placedShape: Shape, onComplete?: () => void): void {
        function blockAnimateComplete(scene: Phaser.Scene, effects: any) {
            animationsComplete++;

            if (animationsComplete === totalAnimations) {
                onComplete?.();

                scene.tweens.add({
                    targets: effects.getChildren().filter((obj: any) => !(obj instanceof Phaser.GameObjects.Particles.ParticleEmitter)),
                    alpha: 0, duration: 150,
                    onComplete: () => effects.clear(true, true)
                });
            }
        }


        const effectsGroup = this.scene.add.group();
        const blockPositions = placedShape.blocks.map(b => ({ x: position.x + b.x, y: position.y + b.y }))
            .filter(p => p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE);

        let animationsComplete = 0;
        const totalAnimations = blockPositions.length;

        if (blockPositions.length > 0) {
            const minX = Math.min(...blockPositions.map(p => p.x));
            const minY = Math.min(...blockPositions.map(p => p.y));
            const maxX = Math.max(...blockPositions.map(p => p.x));
            const maxY = Math.max(...blockPositions.map(p => p.y));
            const glow = this.scene.add.rectangle(
                GRID_X + ((minX + maxX) / 2 + 0.5) * CELL_SIZE, GRID_Y + ((minY + maxY) / 2 + 0.5) * CELL_SIZE,
                (maxX - minX + 1) * CELL_SIZE + 12, (maxY - minY + 1) * CELL_SIZE + 12,
                0xffffff, 0.2
            );
            glow.setStrokeStyle(10, Phaser.Display.Color.HexStringToColor(placedShape.color).color, 0.8);
            effectsGroup.add(glow);
            this.scene.tweens.add({ targets: glow, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 250, ease: 'Sine.easeOut' });
        }

        for (const block of placedShape.blocks) {
            const x = position.x + block.x;
            const y = position.y + block.y;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                const animBlock = this.scene.add.rectangle(
                    GRID_X + x * CELL_SIZE + CELL_SIZE / 2, GRID_Y + y * CELL_SIZE + CELL_SIZE / 2,
                    CELL_SIZE - 4, CELL_SIZE - 4,
                    Phaser.Display.Color.HexStringToColor(placedShape.color).color, 1
                );
                animBlock.setStrokeStyle(5, 0xffffff, 0.9);
                effectsGroup.add(animBlock);

                if (this.scene.textures.exists('pixel')) {
                    const particles = this.scene.add.particles(
                        GRID_X + x * CELL_SIZE + CELL_SIZE / 2, GRID_Y + y * CELL_SIZE + CELL_SIZE / 2, 'pixel', {
                        lifespan: 300, scale: { start: 0.7, end: 0 }, quantity: 1, frequency: 40,
                        speed: { min: 30, max: 80 }, angle: { min: 0, max: 360 }, alpha: { start: 0.7, end: 0 },
                        tint: [0xffffff, Phaser.Display.Color.HexStringToColor(placedShape.color).color], emitting: true
                    });
                    particles.setDepth(100);
                    effectsGroup.add(particles);
                    this.scene.time.delayedCall(180, () => particles.stop());
                }

                this.scene.tweens.add({
                    targets: animBlock,
                    scaleX: [0.5, 1.2, 1], scaleY: [0.5, 1.2, 1], alpha: [0.8, 1],
                    duration: 200, ease: 'Back.easeOut',
                    onComplete: () => blockAnimateComplete(this.scene, effectsGroup),
                });
            }
        }

         if (totalAnimations === 0) {
            onComplete?.();
            effectsGroup.clear(true, true);
        }
    }


    public destroy(): void {
        console.log("GameSceneAnimator destroyed");
    }
}