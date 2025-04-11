import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config';

/**
 * Класс для управления фоновыми эффектами игровой сцены
 */
export class GameSceneBackground {
    private scene: Phaser.Scene;
    private backgroundStars: Phaser.GameObjects.GameObject[] = [];
    private movingStars: Phaser.GameObjects.GameObject[] = [];
    private shootingStars: Phaser.GameObjects.GameObject[] = [];
    private nebulaEffect!: Phaser.GameObjects.Graphics;
    private shootingStarTimer!: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Создает расширенный анимированный фон с различными эффектами
     */
    public createAnimatedBackground(): void {
        const backgroundGradient = this.scene.add.graphics().setDepth(-10);
        const gradientRect = new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);
        backgroundGradient.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e, 1);
        backgroundGradient.fillRectShape(gradientRect);

        this.nebulaEffect = this.scene.add.graphics().setDepth(-9);
        this.createNebulaEffect();

        this.createStaticStars();

        this.createMovingStars();

        this.shootingStarTimer = this.scene.time.addEvent({
            delay: 4000,
            callback: this.createShootingStar,
            callbackScope: this,
            loop: true,
        });
    }

    /**
     * Создает эффект туманности/облаков в космосе
     */
    private createNebulaEffect(): void {
        const nebulaCenters = [
            {
                x: GAME_WIDTH * 0.2,
                y: GAME_HEIGHT * 0.3,
                radius: 150,
                color: 0x3d5a80,
                alpha: 0.05,
            },
            {
                x: GAME_WIDTH * 0.7,
                y: GAME_HEIGHT * 0.2,
                radius: 120,
                color: 0x774c60,
                alpha: 0.04,
            },
            {
                x: GAME_WIDTH * 0.5,
                y: GAME_HEIGHT * 0.7,
                radius: 180,
                color: 0x2d545e,
                alpha: 0.06,
            },
        ];

        this.nebulaEffect.clear();

        nebulaCenters.forEach(nebula => {
            this.drawNebula(nebula.x, nebula.y, nebula.radius, nebula.color, nebula.alpha);
        });
    }

    /**
     * Рисует отдельное туманное облако
     */
    private drawNebula(x: number, y: number, radius: number, color: number, alpha: number): void {
        for (let i = 0; i < 5; i++) {
            const offsetX = Phaser.Math.Between(-30, 30);
            const offsetY = Phaser.Math.Between(-30, 30);
            const size = Phaser.Math.Between(radius * 0.5, radius * 1.2);

            this.nebulaEffect.fillStyle(color, alpha * Phaser.Math.FloatBetween(0.7, 1.3));
            this.nebulaEffect.fillCircle(x + offsetX, y + offsetY, size);
        }
    }

    /**
     * Создает статичные звезды с эффектом мерцания
     */
    private createStaticStars(): void {
        const numStars = 100;

        for (let i = 0; i < numStars; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.FloatBetween(1.5, 4);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.9);

            // Создаем звезду как группу графических элементов
            const star = this.scene.add.graphics().setDepth(-8);
            star.fillStyle(0xffffff, alpha);
            star.fillCircle(0, 0, size);
            star.x = x;
            star.y = y;

            const startDelay = Phaser.Math.Between(0, 2000);

            this.scene.time.delayedCall(startDelay, () => {
                this.scene.tweens.add({
                    targets: star,
                    alpha: { from: star.alpha, to: star.alpha * 0.3 },
                    duration: Phaser.Math.Between(1000, 2000),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                });
            });

            this.backgroundStars.push(star);
        }
    }

    /**
     * Создает медленно движущиеся звезды на фоне
     */
    private createMovingStars(): void {
        for (let i = 0; i < 15; i++) {
            this.createMovingStar();
        }
    }

    /**
     * Создает одну движущуюся звезду с анимацией
     */
    private createMovingStar(): void {
        const startSide = Phaser.Math.Between(0, 3);
        let x, y;

        switch (startSide) {
            case 0:
                x = Phaser.Math.Between(0, GAME_WIDTH);
                y = -20;
                break;
            case 1:
                x = GAME_WIDTH + 20;
                y = Phaser.Math.Between(0, GAME_HEIGHT);
                break;
            case 2:
                x = Phaser.Math.Between(0, GAME_WIDTH);
                y = GAME_HEIGHT + 20;
                break;
            case 3:
                x = -20;
                y = Phaser.Math.Between(0, GAME_HEIGHT);
                break;
            default:
                x = 0;
                y = 0;
        }

        // Создаем звезду как графический объект
        const star = this.scene.add.graphics().setDepth(-7);
        star.x = x;
        star.y = y;
        star.fillStyle(0xffffff, 0);
        const starSize = Phaser.Math.FloatBetween(1.5, 3.5);
        star.fillCircle(0, 0, starSize);

        const targetX = Phaser.Math.Between(0, GAME_WIDTH);
        const targetY = Phaser.Math.Between(0, GAME_HEIGHT);
        const travelTime = Phaser.Math.Between(15000, 30000);

        this.scene.tweens.add({
            targets: star,
            x: targetX,
            y: targetY,
            alpha: { from: 0, to: 0.8, duration: 2000 },
            scale: { from: 0.2, to: Phaser.Math.FloatBetween(0.4, 0.8) },
            duration: travelTime,
            onComplete: () => {
                star.destroy();
                this.createMovingStar();
            },
        });

        this.movingStars.push(star);
    }

    /**
     * Создает анимацию падающей звезды
     */
    private createShootingStar(): void {
        const startX = Phaser.Math.Between(-100, GAME_WIDTH * 0.3);
        const startY = Phaser.Math.Between(-100, GAME_HEIGHT * 0.3);

        const endX = startX + Phaser.Math.Between(GAME_WIDTH * 0.5, GAME_WIDTH * 1.2);
        const endY = startY + Phaser.Math.Between(GAME_HEIGHT * 0.5, GAME_HEIGHT * 1.2);

        // Используем конфигурацию вместо графики для лучшего контроля
        const starContainer = this.scene.add.container(startX, startY).setDepth(-6);

        // Визуальная часть звезды
        const starVisual = this.scene.add.graphics();
        starVisual.fillStyle(0xeaf7ff, 1);
        starVisual.fillCircle(0, 0, 3);
        starContainer.add(starVisual);

        // Создаем графику для следа отдельно
        const trailGfx = this.scene.add.graphics().setDepth(-6);

        const duration = Phaser.Math.Between(500, 900);
        let progress = 0;

        this.scene.tweens.add({
            targets: starContainer,
            x: endX,
            y: endY,
            duration: duration,
            onUpdate: tween => {
                // Обновляем прогресс анимации
                progress = tween.progress;

                // Меняем прозрачность звезды по анимации
                let alpha = 0;
                if (progress < 0.1) {
                    alpha = progress * 10; // От 0 до 1 за первые 10%
                } else if (progress > 0.8) {
                    alpha = (1 - progress) * 5; // От 1 до 0 за последние 20%
                } else {
                    alpha = 1;
                }

                // Обновляем визуальную часть звезды
                starVisual.clear();
                starVisual.fillStyle(0xeaf7ff, alpha);
                starVisual.fillCircle(0, 0, 3);

                // Обновляем след
                trailGfx.clear();
                if (alpha > 0.2) {
                    trailGfx.lineStyle(2, 0xeaf7ff, alpha * 0.6);
                    trailGfx.lineBetween(
                        starContainer.x,
                        starContainer.y,
                        starContainer.x - 40,
                        starContainer.y - 40
                    );
                }
            },
            onComplete: () => {
                starContainer.destroy();
                trailGfx.destroy();
            },
        });
        this.shootingStars.push(starContainer);
    }

    /**
     * Обновляет эффекты фона
     */
    public updateBackgroundEffects(time: number): void {
        if (time % 5000 < 20) {
            this.nebulaEffect.clear();
            this.createNebulaEffect();
        }
    }

    /**
     * Очищает ресурсы при закрытии сцены
     */
    public shutdown(): void {
        if (this.shootingStarTimer) {
            this.shootingStarTimer.destroy();
        }

        this.backgroundStars.forEach(star => star.destroy());
        this.movingStars.forEach(star => star.destroy());
        this.shootingStars.forEach(star => star.destroy());

        this.backgroundStars = [];
        this.movingStars = [];
        this.shootingStars = [];

        if (this.nebulaEffect) {
            this.nebulaEffect.clear();
            this.nebulaEffect.destroy();
        }
    }
}
