import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../../../config';
import { GameScene } from '../../../scenes/GameScene';

/**
 * Класс для управления отображением счета и комбо
 */
export class GameSceneUIScoreDisplay {
    private scene: GameScene;
    public scoreText!: Phaser.GameObjects.Text;
    public comboText!: Phaser.GameObjects.Text;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    /**
     * Создает все элементы для отображения счета и комбо
     */
    public createScoreDisplays(): void {
        this.createScoreDisplay();
        this.createComboDisplay();
    }

    /**
     * Создает отображение для счета
     */
    private createScoreDisplay(): void {
        // Создаем контейнер для текста и эффектов
        const scoreContainer = this.scene.add.container(GAME_WIDTH - 20, 20);
        scoreContainer.setDepth(100);

        // Создаем тень для текста
        const scoreShadow = this.scene.add
            .text(3, 3, 'Счет: 0', {
                fontFamily: '"Russo One", "Exo 2", sans-serif',
                fontSize: '26px',
                color: '#000000',
                fontStyle: 'bold',
            })
            .setOrigin(1, 0)
            .setAlpha(0.6);

        // Создаем основной текст с градиентом
        this.scoreText = this.scene.add
            .text(0, 0, 'Счет: 0', {
                fontFamily: '"Russo One", "Exo 2", sans-serif',
                fontSize: '26px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#00ffe7',
                strokeThickness: 1,
            })
            .setOrigin(1, 0);

        // Добавляем свечение вокруг текста
        const scoreGlow = this.scene.add.rectangle(
            -this.scoreText.width / 2 - 10,
            this.scoreText.height / 2,
            this.scoreText.width + 20,
            this.scoreText.height + 10,
            0x00ffe7,
            0.15
        );

        // Анимация пульсации свечения
        this.scene.tweens.add({
            targets: scoreGlow,
            alpha: { from: 0.15, to: 0.3 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Добавляем элементы в контейнер
        scoreContainer.add([scoreGlow, scoreShadow, this.scoreText]);
    }

    /**
     * Создает отображение для комбо
     */
    private createComboDisplay(): void {
        // Создаем контейнер для текста комбо и эффектов
        const comboContainer = this.scene.add.container(GAME_WIDTH - 20, 55);
        comboContainer.setDepth(100);

        // Создаем тень для текста
        const comboShadow = this.scene.add
            .text(2, 2, 'Комбо: 0', {
                fontFamily: '"Russo One", "Exo 2", sans-serif',
                fontSize: '22px',
                color: '#000000',
                fontStyle: 'bold',
            })
            .setOrigin(1, 0)
            .setAlpha(0.6);

        // Создаем основной текст с неоновым эффектом
        this.comboText = this.scene.add
            .text(0, 0, 'Комбо: 0', {
                fontFamily: '"Russo One", "Exo 2", sans-serif',
                fontSize: '22px',
                color: COLORS.comboText,
                fontStyle: 'bold',
                stroke: '#ffffff',
                strokeThickness: 1,
            })
            .setOrigin(1, 0);

        // Добавляем свечение вокруг текста
        const comboGlow = this.scene.add.rectangle(
            -this.comboText.width / 2 - 10,
            this.comboText.height / 2,
            this.comboText.width + 20,
            this.comboText.height + 10,
            Phaser.Display.Color.HexStringToColor(COLORS.comboText).color,
            0.25
        );

        // Добавляем элементы в контейнер
        comboContainer.add([comboGlow, comboShadow, this.comboText]);

        // Скрываем вначале
        comboContainer.setVisible(false);

        // Сохраняем ссылку на контейнер для дальнейшего использования
        this.comboText.setData('container', comboContainer);
        this.comboText.setVisible(false);
    }

    /**
     * Обновляет отображение счета
     */
    public updateScoreText(score: number): void {
        // Обновляем текст счета
        this.scoreText.setText(`Счет: ${score}`);

        // Получаем контейнер, в котором находится текст
        const container = this.scoreText.parentContainer as Phaser.GameObjects.Container;

        // Обновляем позицию свечения, так как ширина текста могла измениться
        if (container && container.list.length >= 3) {
            const glow = container.list[0] as Phaser.GameObjects.Rectangle;
            const shadow = container.list[1] as Phaser.GameObjects.Text;

            // Обновляем текст тени
            shadow.setText(`Счет: ${score}`);

            // Обновляем размер и позицию свечения
            glow.setSize(this.scoreText.width + 20, this.scoreText.height + 10);
            glow.setPosition(-this.scoreText.width / 2 - 10, this.scoreText.height / 2);
        }

        // Анимация изменения счета
        this.scene.tweens.add({
            targets: this.scoreText,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 100,
            yoyo: true,
            ease: 'Back.easeOut',
        });

        // Добавляем эффект вспышки при увеличении счета
        const flash = this.scene.add.rectangle(
            this.scoreText.getTopRight().x - this.scoreText.width / 2,
            this.scoreText.getTopRight().y + this.scoreText.height / 2,
            this.scoreText.width + 40,
            this.scoreText.height + 20,
            0xffffff,
            0.5
        );
        flash.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.3,
            duration: 300,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy(),
        });
    }

    /**
     * Обновляет отображение комбо
     */
    public updateComboText(combo: number): void {
        // Получаем контейнер комбо
        const container = this.comboText.getData('container') as Phaser.GameObjects.Container;

        if (combo > 0) {
            // Обновляем текст комбо
            this.comboText.setText(`Комбо: ${combo}x`);

            // Обновляем тень и свечение
            if (container && container.list.length >= 3) {
                const glow = container.list[0] as Phaser.GameObjects.Rectangle;
                const shadow = container.list[1] as Phaser.GameObjects.Text;

                shadow.setText(`Комбо: ${combo}x`);
                glow.setSize(this.comboText.width + 20, this.comboText.height + 10);
                glow.setPosition(-this.comboText.width / 2 - 10, this.comboText.height / 2);
            }

            // Показываем контейнер
            container.setVisible(true);
            this.comboText.setVisible(true);

            // Анимация комбо - более драматичная при больших значениях
            const scale = Math.min(1.2 + combo * 0.05, 1.6);
            const duration = Math.min(150 + combo * 10, 300);

            // Меняем цвет при высоких значениях комбо
            if (combo >= 5) {
                this.comboText.setColor('#ff00ff'); // Неоново-розовый для высокого комбо
                this.comboText.setStroke('#ffffff', 2);
            } else {
                this.comboText.setColor(COLORS.comboText);
                this.comboText.setStroke('#ffffff', 1);
            }

            this.scene.tweens.add({
                targets: this.comboText,
                scaleX: scale,
                scaleY: scale,
                duration: duration,
                yoyo: true,
                ease: 'Back.easeOut',
            });

            // Добавляем эффекты частиц при высоком комбо
            if (combo >= 3 && this.scene.textures.exists('pixel')) {
                const emitter = this.scene.add.particles(
                    this.comboText.getTopRight().x - this.comboText.width / 2,
                    this.comboText.getTopRight().y + this.comboText.height / 2,
                    'pixel',
                    {
                        speed: { min: 30, max: 80 },
                        angle: { min: 0, max: 360 },
                        scale: { start: 0.7, end: 0 },
                        lifespan: 600,
                        quantity: combo,
                        tint:
                            combo >= 5
                                ? [0xff00ff, 0xffffff]
                                : [
                                      Phaser.Display.Color.HexStringToColor(COLORS.comboText).color,
                                      0xffffff,
                                  ],
                    }
                );

                this.scene.time.delayedCall(300, () => {
                    emitter.stop();
                    this.scene.time.delayedCall(600, () => emitter.destroy());
                });
            }
        } else {
            // Скрываем контейнер при сбросе комбо
            this.scene.tweens.add({
                targets: container,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    container.setVisible(false);
                    container.setAlpha(1);
                    this.comboText.setVisible(false);
                },
            });
        }
    }

    /**
     * Очищает ресурсы при закрытии сцены
     */
    public destroy(): void {
        this.scoreText?.destroy();
        this.comboText?.destroy();
        const container = this.comboText?.getData('container') as Phaser.GameObjects.Container;
        container?.destroy();
    }
}
