import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../../config';
import { GameScene } from '../../../scenes/GameScene';

/**
 * Класс для управления фоновыми элементами пользовательского интерфейса
 */
export class GameSceneUIBackground {
    private scene: GameScene;
    private animatedElements: Phaser.GameObjects.GameObject[] = [];

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    /**
     * Создает все фоновые элементы пользовательского интерфейса
     */
    public createBackground(): void {
        // Создаем основной фон
        this.createGradientBackground();

        // Добавляем звездное небо
        this.createStarryBackground();

        // Добавляем световые лучи
        this.createLightBeams();
    }

    /**
     * Создает динамичный анимированный градиентный фон
     */
    private createGradientBackground(): void {
        // Создаем динамичный анимированный фон
        const bgGradient = this.scene.add.graphics().setDepth(-5);
        this.animatedElements.push(bgGradient);

        const gradientHeight = GAME_HEIGHT * 1.8;

        // Создаем фон с градиентом и более выразительными волнами
        const updateGradient = (offset: number) => {
            bgGradient.clear();

            // Вертикальный градиент с волновым эффектом
            for (let y = 0; y < gradientHeight; y++) {
                const t = y / gradientHeight;

                // Используем три цвета для более интересного градиента
                const topColor = Phaser.Display.Color.HexStringToColor('#1a1a2e');
                const midColor = Phaser.Display.Color.HexStringToColor('#20203a');
                const bottomColor = Phaser.Display.Color.HexStringToColor('#2e2a4f');

                // Добавляем несколько волн с разными частотами для эффекта глубины
                const primaryWave = Math.sin(t * 8 + offset) * 0.08;
                const secondaryWave = Math.cos(t * 4 + offset * 0.7) * 0.04;
                const combinedWave = primaryWave + secondaryWave;

                // Горизонтальное смещение для эффекта струящегося потока
                const horizontalOffset = Math.sin(y * 0.02 + offset * 2) * 10;

                let r, g, b;
                if (t < 0.4) {
                    // Переход от верхнего к среднему цвету
                    const lerpFactor = t / 0.4;
                    r = Phaser.Math.Linear(topColor.red, midColor.red, lerpFactor + combinedWave);
                    g = Phaser.Math.Linear(
                        topColor.green,
                        midColor.green,
                        lerpFactor + combinedWave
                    );
                    b = Phaser.Math.Linear(topColor.blue, midColor.blue, lerpFactor + combinedWave);
                } else {
                    // Переход от среднего к нижнему цвету
                    const lerpFactor = (t - 0.4) / 0.6;
                    r = Phaser.Math.Linear(
                        midColor.red,
                        bottomColor.red,
                        lerpFactor + combinedWave
                    );
                    g = Phaser.Math.Linear(
                        midColor.green,
                        bottomColor.green,
                        lerpFactor + combinedWave
                    );
                    b = Phaser.Math.Linear(
                        midColor.blue,
                        bottomColor.blue,
                        lerpFactor + combinedWave
                    );
                }

                const color = Phaser.Display.Color.GetColor(
                    Math.floor(r),
                    Math.floor(g),
                    Math.floor(b)
                );
                bgGradient.fillStyle(color, 1);

                // Применяем горизонтальное смещение для создания эффекта течения
                bgGradient.fillRect(horizontalOffset, y - offset * 100, GAME_WIDTH, 1);
            }
        };

        // Начальная отрисовка
        updateGradient(0);

        // Добавляем центральную область с акцентом и пульсацией
        const midLayer = this.scene.add
            .rectangle(
                0,
                GAME_HEIGHT / 2 - 150,
                GAME_WIDTH,
                300,
                Phaser.Display.Color.HexStringToColor(COLORS.background).color,
                0.6
            )
            .setOrigin(0)
            .setDepth(-4);
        this.animatedElements.push(midLayer);

        // Более интересная анимация для центральной области
        this.scene.tweens.add({
            targets: midLayer,
            alpha: { from: 0.6, to: 0.8 },
            scaleY: { from: 1, to: 1.05 },
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    /**
     * Метод для создания движущихся световых лучей
     */
    private createLightBeams(): void {
        // Группа для световых лучей
        const beamsGroup = this.scene.add.group();

        // Создаем несколько лучей с разными параметрами
        for (let i = 0; i < 8; i++) {
            // Случайная позиция по ширине экрана
            const x = Phaser.Math.Between(0, GAME_WIDTH);

            // Луч света с градиентом
            const beam = this.scene.add.graphics().setDepth(-4);
            beam.fillStyle(0x457b9d, 0.05);
            beam.fillTriangle(x, -50, x - 100, GAME_HEIGHT + 50, x + 100, GAME_HEIGHT + 50);

            // Добавляем в группу
            beamsGroup.add(beam);
            this.animatedElements.push(beam);

            // Анимируем движение луча
            this.scene.tweens.add({
                targets: beam,
                x: {
                    from: beam.x,
                    to: beam.x + Phaser.Math.Between(-GAME_WIDTH / 4, GAME_WIDTH / 4),
                },
                alpha: { from: 0.05, to: 0.1 },
                duration: Phaser.Math.Between(5000, 10000),
                yoyo: true,
                repeat: -1,
                delay: i * 500,
                onUpdate: () => {
                    beam.clear();
                    beam.fillStyle(0x457b9d, beam.alpha);
                    beam.fillTriangle(
                        x + beam.x,
                        -50,
                        x - 100 + beam.x,
                        GAME_HEIGHT + 50,
                        x + 100 + beam.x,
                        GAME_HEIGHT + 50
                    );
                },
            });
        }
    }

    /**
     * Создает звездное небо на фоне
     */
    private createStarryBackground(): void {
        // Группа для звезд
        const starsGroup = this.scene.add.group();

        // Создаем небольшие звездочки с более мягким мерцанием
        for (let i = 0; i < 100; i++) {
            // Уменьшено количество звезд
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.FloatBetween(0.6, 2); // Уменьшенный размер
            const alpha = Phaser.Math.FloatBetween(0.15, 0.4); // Уменьшенная яркость

            // Более мягкие цвета для звезд
            const color = Phaser.Utils.Array.GetRandom([
                0xd6d6d6, // Светло-серый
                0xc9d6df, // Светло-голубой
                0xd6c9df, // Светло-фиолетовый
                0xdfd9c9, // Светло-желтый
            ]);

            const star = this.scene.add.circle(x, y, size, color, alpha).setDepth(-3);
            starsGroup.add(star);
            this.animatedElements.push(star);

            // Более мягкая анимация мерцания
            if (Math.random() > 0.3) {
                // Только 70% звезд будут мерцать
                this.scene.tweens.add({
                    targets: star,
                    alpha: { from: alpha, to: alpha * 0.5 }, // Меньший диапазон мерцания
                    duration: Phaser.Math.Between(2000, 5000), // Более медленное мерцание
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 2000),
                });
            }
        }

        // Добавляем несколько больших звезд (меньше, чем раньше)
        for (let i = 0; i < 8; i++) {
            // Уменьшено с 15 до 8
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.Between(3, 6); // Уменьшенный размер

            const star = this.scene.add.star(x, y, 5, size / 2, size, 0xe0e1dd, 0.5).setDepth(-3); // Уменьшенная яркость
            starsGroup.add(star);
            this.animatedElements.push(star);

            // Более мягкая анимация пульсации
            if (Math.random() > 0.5) {
                // Только 50% звезд будут пульсировать
                this.scene.tweens.add({
                    targets: star,
                    scale: { from: 1, to: 1.15 }, // Меньший диапазон пульсации
                    alpha: { from: 0.5, to: 0.3 }, // Меньший диапазон изменения прозрачности
                    duration: Phaser.Math.Between(3000, 6000), // Более медленная пульсация
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 2000),
                });
            }

            // Добавляем мягкое свечение только для некоторых звезд
            if (Math.random() > 0.5) {
                // Только 50% звезд будут иметь свечение
                const glow = this.scene.add.circle(x, y, size * 1.5, 0xe0e1dd, 0.1).setDepth(-4); // Уменьшенное свечение
                glow.setBlendMode(Phaser.BlendModes.SCREEN); // Более мягкий режим смешивания
                starsGroup.add(glow);
                this.animatedElements.push(glow);

                this.scene.tweens.add({
                    targets: glow,
                    alpha: { from: 0.1, to: 0.2 }, // Меньший диапазон изменения прозрачности
                    scale: { from: 1, to: 1.1 }, // Меньший диапазон пульсации
                    duration: Phaser.Math.Between(3000, 5000),
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                });
            }
        }
    }

    /**
     * Очищает ресурсы при закрытии сцены
     */
    public destroy(): void {
        this.animatedElements.forEach(element => {
            if (element) {
                element.destroy();
            }
        });
        this.animatedElements = [];
    }
}
