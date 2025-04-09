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
        // Создаем динамичный анимированный фон
        const bgGradient = this.scene.add.graphics();
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
                const primaryWave = Math.sin((t * 8) + offset) * 0.08;
                const secondaryWave = Math.cos((t * 4) + offset * 0.7) * 0.04;
                const combinedWave = primaryWave + secondaryWave;
                
                // Горизонтальное смещение для эффекта струящегося потока
                const horizontalOffset = Math.sin((y * 0.02) + offset * 2) * 10;
                
                let r, g, b;
                if (t < 0.4) {
                    // Переход от верхнего к среднему цвету
                    const lerpFactor = t / 0.4;
                    r = Phaser.Math.Linear(topColor.red, midColor.red, lerpFactor + combinedWave);
                    g = Phaser.Math.Linear(topColor.green, midColor.green, lerpFactor + combinedWave);
                    b = Phaser.Math.Linear(topColor.blue, midColor.blue, lerpFactor + combinedWave);
                } else {
                    // Переход от среднего к нижнему цвету
                    const lerpFactor = (t - 0.4) / 0.6;
                    r = Phaser.Math.Linear(midColor.red, bottomColor.red, lerpFactor + combinedWave);
                    g = Phaser.Math.Linear(midColor.green, bottomColor.green, lerpFactor + combinedWave);
                    b = Phaser.Math.Linear(midColor.blue, bottomColor.blue, lerpFactor + combinedWave);
                }
                
                const color = Phaser.Display.Color.GetColor(Math.floor(r), Math.floor(g), Math.floor(b));
                bgGradient.fillStyle(color, 1);
                
                // Применяем горизонтальное смещение для создания эффекта течения
                bgGradient.fillRect(horizontalOffset, y - offset * 100, GAME_WIDTH, 1);
            }
        };
        
        // Начальная отрисовка
        updateGradient(0);
        
        // Более активная анимация движения градиента
        let offset = 0;
        this.scene.time.addEvent({
            delay: 50, // Уменьшаем задержку для более плавной и быстрой анимации
            callback: () => {
                offset += 0.01; // Увеличиваем шаг для более заметного движения
                updateGradient(offset);
            },
            loop: true
        });
        
        // Добавляем динамичные световые эффекты
        this.createLightBeams();
        
        // Добавляем центральную область с акцентом и пульсацией
        const midLayer = this.scene.add.rectangle(0, GAME_HEIGHT / 2 - 150, GAME_WIDTH, 300,
            Phaser.Display.Color.HexStringToColor(COLORS.background).color, 0.6).setOrigin(0);

        // Более интересная анимация для центральной области
        this.scene.tweens.add({
            targets: midLayer,
            alpha: { from: 0.6, to: 0.8 },
            scaleY: { from: 1, to: 1.05 },
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    // Метод для создания движущихся световых лучей
    private createLightBeams(): void {
        // Группа для световых лучей
        const beamsGroup = this.scene.add.group();
        
        // Создаем несколько лучей с разными параметрами
        for (let i = 0; i < 8; i++) {
            // Случайная позиция по ширине экрана
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            
            // Луч света с градиентом
            const beam = this.scene.add.graphics();
            beam.fillStyle(0x457b9d, 0.05);
            beam.fillTriangle(
                x, -50,
                x - 100, GAME_HEIGHT + 50,
                x + 100, GAME_HEIGHT + 50
            );
            
            // Добавляем в группу
            beamsGroup.add(beam);
            
            // Анимируем движение луча
            this.scene.tweens.add({
                targets: beam,
                x: { from: beam.x, to: beam.x + Phaser.Math.Between(-GAME_WIDTH/4, GAME_WIDTH/4) },
                alpha: { from: 0.05, to: 0.1 },
                duration: Phaser.Math.Between(5000, 10000),
                yoyo: true,
                repeat: -1,
                delay: i * 500,
                onUpdate: () => {
                    beam.clear();
                    beam.fillStyle(0x457b9d, beam.alpha);
                    beam.fillTriangle(
                        x + beam.x, -50,
                        x - 100 + beam.x, GAME_HEIGHT + 50,
                        x + 100 + beam.x, GAME_HEIGHT + 50
                    );
                }
            });
        }
    }

    private createStarryBackground(): void {
        // Группа для звезд
        const starsGroup = this.scene.add.group();
        
        // Создаем небольшие звездочки с более мягким мерцанием
        for (let i = 0; i < 100; i++) { // Уменьшено количество звезд
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.FloatBetween(0.6, 2); // Уменьшенный размер
            const alpha = Phaser.Math.FloatBetween(0.15, 0.4); // Уменьшенная яркость
            
            // Более мягкие цвета для звезд
            const color = Phaser.Utils.Array.GetRandom([
                0xd6d6d6, // Светло-серый
                0xc9d6df, // Светло-голубой
                0xd6c9df, // Светло-фиолетовый
                0xdfd9c9  // Светло-желтый
            ]);

            const star = this.scene.add.circle(x, y, size, color, alpha);
            starsGroup.add(star);

            // Более мягкая анимация мерцания
            if (Math.random() > 0.3) { // Только 70% звезд будут мерцать
                this.scene.tweens.add({
                    targets: star,
                    alpha: { from: alpha, to: alpha * 0.5 }, // Меньший диапазон мерцания
                    duration: Phaser.Math.Between(2000, 5000), // Более медленное мерцание
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 2000)
                });
            }
        }
        
        // Добавляем несколько больших звезд (меньше, чем раньше)
        for (let i = 0; i < 8; i++) { // Уменьшено с 15 до 8
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.Between(3, 6); // Уменьшенный размер
            
            const star = this.scene.add.star(x, y, 5, size/2, size, 0xe0e1dd, 0.5); // Уменьшенная яркость
            starsGroup.add(star);
            
            // Более мягкая анимация пульсации
            if (Math.random() > 0.5) { // Только 50% звезд будут пульсировать
                this.scene.tweens.add({
                    targets: star,
                    scale: { from: 1, to: 1.15 }, // Меньший диапазон пульсации
                    alpha: { from: 0.5, to: 0.3 }, // Меньший диапазон изменения прозрачности
                    duration: Phaser.Math.Between(3000, 6000), // Более медленная пульсация
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 2000)
                });
            }
            
            // Добавляем мягкое свечение только для некоторых звезд
            if (Math.random() > 0.5) { // Только 50% звезд будут иметь свечение
                const glow = this.scene.add.circle(x, y, size*1.5, 0xe0e1dd, 0.1); // Уменьшенное свечение
                glow.setBlendMode(Phaser.BlendModes.SCREEN); // Более мягкий режим смешивания
                starsGroup.add(glow);
                
                this.scene.tweens.add({
                    targets: glow,
                    alpha: { from: 0.1, to: 0.2 }, // Меньший диапазон изменения прозрачности
                    scale: { from: 1, to: 1.1 }, // Меньший диапазон пульсации
                    duration: Phaser.Math.Between(3000, 5000),
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            }
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
        // Создаем контейнер для текста и эффектов
        const scoreContainer = this.scene.add.container(GAME_WIDTH - 20, 20);
        scoreContainer.setDepth(100);
        
        // Создаем тень для текста
        const scoreShadow = this.scene.add.text(3, 3, 'Счет: 0', {
            fontFamily: '"Russo One", "Exo 2", sans-serif',
            fontSize: '26px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setAlpha(0.6);
        
        // Создаем основной текст с градиентом
        this.scoreText = this.scene.add.text(0, 0, 'Счет: 0', {
            fontFamily: '"Russo One", "Exo 2", sans-serif',
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#00ffe7',
            strokeThickness: 1
        }).setOrigin(1, 0);
        
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
            ease: 'Sine.easeInOut'
        });
        
        // Добавляем элементы в контейнер
        scoreContainer.add([scoreGlow, scoreShadow, this.scoreText]);
    }

    private createComboDisplay(): void {
        // Создаем контейнер для текста комбо и эффектов
        const comboContainer = this.scene.add.container(GAME_WIDTH - 20, 55);
        comboContainer.setDepth(100);
        
        // Создаем тень для текста
        const comboShadow = this.scene.add.text(2, 2, 'Комбо: 0', {
            fontFamily: '"Russo One", "Exo 2", sans-serif',
            fontSize: '22px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setAlpha(0.6);
        
        // Создаем основной текст с неоновым эффектом
        this.comboText = this.scene.add.text(0, 0, 'Комбо: 0', {
            fontFamily: '"Russo One", "Exo 2", sans-serif',
            fontSize: '22px',
            color: COLORS.comboText,
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(1, 0);
        
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

    private createShapePreviewArea(): void {
        // Создаем заголовок для области предпросмотра
        const previewTitle = this.scene.add.text(20, GRID_Y - 40, 'Фигуры', {
            fontFamily: '"Russo One", "Exo 2", sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#00ffe7',
            strokeThickness: 1
        });
        
        // Добавляем неоновое свечение к заголовку
        const titleGlow = this.scene.add.rectangle(
            previewTitle.x + previewTitle.width / 2,
            previewTitle.y + previewTitle.height / 2,
            previewTitle.width + 20,
            previewTitle.height + 10,
            0x00ffe7,
            0.15
        );
        titleGlow.setDepth(previewTitle.depth - 1);
        
        // Анимация пульсации заголовка
        this.scene.tweens.add({
            targets: titleGlow,
            alpha: { from: 0.15, to: 0.3 },
            scale: { from: 1, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        const previewWidth = 110;
        const previewHeight = 110;
        const padding = 15;
        const startX = 20;
        const startY = GRID_Y + 20;

        // Создаем фоновую панель для всех превью
        const previewPanelHeight = 3 * (previewHeight + padding) + padding;
        const previewPanel = this.scene.add.rectangle(
            startX - 10,
            startY - 10,
            previewWidth + 20,
            previewPanelHeight,
            Phaser.Display.Color.HexStringToColor(COLORS.background).color,
            0.5
        ).setOrigin(0);
        
        // Добавляем обводку и эффект свечения к панели
        previewPanel.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color, 0.7);
        
        const panelGlow = this.scene.add.rectangle(
            startX - 10,
            startY - 10,
            previewWidth + 20,
            previewPanelHeight,
            0xffffff,
            0
        ).setOrigin(0);
        panelGlow.setStrokeStyle(8, Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color, 0.15);
        
        // Анимация пульсации панели
        this.scene.tweens.add({
            targets: panelGlow,
            alpha: { from: 0, to: 0.2 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        for (let i = 0; i < 3; i++) {
            const y = startY + i * (previewHeight + padding);
            
            // Убираем номера слотов по просьбе пользователя

            // Вычисляем центр блока превью
            const centerX = startX + previewWidth / 2;
            const centerY = y + previewHeight / 2;
            
            // Создаем фон для превью с rounded corners (используем центрированное положение)
            const baseBg = this.scene.add.rectangle(
                centerX,
                centerY,
                previewWidth,
                previewHeight,
                Phaser.Display.Color.HexStringToColor(COLORS.previewBackground).color,
                0.9
            ).setOrigin(0.5); // Используем одинаковую точку привязки для всех элементов
            
            // Добавляем градиент сверху
            const topGradient = this.scene.add.rectangle(
                centerX,
                centerY - previewHeight * 0.2, // Смещаем выше центра для эффекта градиента
                previewWidth,
                previewHeight * 0.6,
                0xffffff,
                0.1
            ).setOrigin(0.5);

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
            const border = this.scene.add.rectangle(
                centerX,
                centerY + 4, // Добавляем смещение вниз на 4 пикселя
                previewWidth,
                previewHeight,
                0x000000,
                0
            ).setOrigin(0.5);
            border.setStrokeStyle(2.5, Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color, 0.8);

            // Добавляем внешнее свечение - с той же корректировкой
            const glow = this.scene.add.rectangle(
                centerX,
                centerY + 4, // Такое же смещение вниз на 4 пикселя
                previewWidth + 10,
                previewHeight + 10,
                0xffffff,
                0
            ).setOrigin(0.5);
            glow.setStrokeStyle(8, Phaser.Display.Color.HexStringToColor(COLORS.previewBorder).color, 0.15);
            
            // Анимация пульсации свечения
            this.scene.tweens.add({
                targets: glow,
                alpha: { from: 0, to: 0.3 },
                duration: 1500 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
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
            ease: 'Back.easeOut'
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
            onComplete: () => flash.destroy()
        });
    }

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
            
            // Анимация комбо - более драматичная при больших значениях
            const scale = Math.min(1.2 + (combo * 0.05), 1.6);
            const duration = Math.min(150 + (combo * 10), 300);
            
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
                ease: 'Back.easeOut'
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
                        tint: combo >= 5 ? [0xff00ff, 0xffffff] : [Phaser.Display.Color.HexStringToColor(COLORS.comboText).color, 0xffffff]
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
        
        // Используем увеличенный размер блока и учитываем новые размеры превью
        const blockSize = 22; // Увеличиваем размер блока для лучшей видимости
        const previewWidth = 110; // Соответствует размеру превью, который мы обновили
        const previewHeight = 110;

        // Создаем контейнер для группы и центрируем его внутри ячейки
        const dragGroup = this.scene.add.container(previewWidth / 2, previewHeight / 2);
        container.add(dragGroup);
        
        // Смещаем группу для центрирования блоков
        const groupOffsetX = -(shapeSize.width * blockSize) / 2;
        const groupOffsetY = -(shapeSize.height * blockSize) / 2;

        shape.blocks.forEach(block => {
            // Рассчитываем позицию каждого блока относительно центра группы
            const rect = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize / 2,
                blockSize - 2, blockSize - 2,
                Phaser.Display.Color.HexStringToColor(shape.color).color
            );
            
            // Добавляем эффекты для блока
            const highlight = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize * 0.3,
                blockSize * 0.7, blockSize * 0.4,
                0xffffff, 0.3
            );
            
            const shadow = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize * 0.7,
                blockSize * 0.9, blockSize * 0.4,
                0x000000, 0.2
            );
            
            // Добавляем неоновое свечение для каждого блока
            const glow = this.scene.add.rectangle(
                groupOffsetX + block.x * blockSize + blockSize / 2,
                groupOffsetY + block.y * blockSize + blockSize / 2,
                blockSize + 4, blockSize + 4,
                Phaser.Display.Color.HexStringToColor(shape.color).color,
                0.2
            );
            glow.setDepth(-1);
            
            dragGroup.add([glow, rect, highlight, shadow]);
        });

        // Создаем область взаимодействия
        const hitArea = this.scene.add.rectangle(0, 0, previewWidth, previewHeight, 0xffffff, 0);
        hitArea.setDepth(-2);
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