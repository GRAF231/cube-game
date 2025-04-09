import Phaser from 'phaser';
import { GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y, COLORS } from '../config';

/**
 * Класс GridAnimations отвечает за анимацию ячеек сетки
 */
export class GridAnimations {
    private scene: Phaser.Scene;
    private blocks: Phaser.GameObjects.Rectangle[][];

    constructor(scene: Phaser.Scene, blocks: Phaser.GameObjects.Rectangle[][]) {
        this.scene = scene;
        this.blocks = blocks;
    }

    /**
     * Подсвечивает ячейки, которые будут очищены при размещении фигуры
     */
    public highlightCellsToBeCleaned(rows: number[], cols: number[]): void {
        const clearingHighlightColor = Phaser.Display.Color.HexStringToColor(
            COLORS.ghostInvalid
        ).color;

        for (const row of rows) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const block = this.blocks[row][x];
                if (block.data?.has('highlighted')) continue;

                block.setStrokeStyle(6, clearingHighlightColor, 0.9);
                if (!block.data) block.setDataEnabled();
                block.data.set('highlighted', true);

                const glow = this.scene.add.rectangle(
                    block.x,
                    block.y,
                    block.width + 10,
                    block.height + 10,
                    clearingHighlightColor,
                    0.3
                );
                glow.setDepth(block.depth - 1);

                // Помечаем эффект как эффект подсветки
                if (!glow.data) glow.setDataEnabled();
                glow.data.set('isHighlightEffect', true);

                if (!block.data.has('effects')) block.data.set('effects', []);
                const effects = block.data.get('effects');
                effects.push(glow);

                this.scene.tweens.add({
                    targets: [block, glow],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    strokeAlpha: 0.4,
                    yoyo: true,
                    repeat: -1,
                    duration: 400,
                    ease: 'Sine.easeInOut',
                });
            }
        }

        for (const col of cols) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const block = this.blocks[y][col];
                if (block.data?.has('highlighted')) continue;

                block.setStrokeStyle(6, clearingHighlightColor, 0.9);
                if (!block.data) block.setDataEnabled();
                block.data.set('highlighted', true);

                const glow = this.scene.add.rectangle(
                    block.x,
                    block.y,
                    block.width + 10,
                    block.height + 10,
                    clearingHighlightColor,
                    0.3
                );
                glow.setDepth(block.depth - 1);

                // Помечаем эффект как эффект подсветки
                if (!glow.data) glow.setDataEnabled();
                glow.data.set('isHighlightEffect', true);

                if (!block.data.has('effects')) block.data.set('effects', []);
                const effects = block.data.get('effects');
                effects.push(glow);

                this.scene.tweens.add({
                    targets: [block, glow],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    strokeAlpha: 0.4,
                    yoyo: true,
                    repeat: -1,
                    duration: 400,
                    ease: 'Sine.easeInOut',
                });
            }
        }
    }

    /**
     * Анимирует очистку линии (ряда или столбца)
     */
    public animateLineClear(coords: number[], isRow: boolean): void {
        // Создаем группу эффектов для линии
        const lineEffects = this.scene.add.group();

        // Задержка для каждого следующего блока (эффект волны)
        const delayPerBlock = 50;

        // Рассчитываем координаты начала и конца линии
        const startX = isRow ? GRID_X : GRID_X + coords[0] * CELL_SIZE;
        const startY = isRow ? GRID_Y + coords[0] * CELL_SIZE : GRID_Y;
        const endX = isRow
            ? GRID_X + GRID_SIZE * CELL_SIZE
            : GRID_X + coords[0] * CELL_SIZE + CELL_SIZE;
        const endY = isRow
            ? GRID_Y + coords[0] * CELL_SIZE + CELL_SIZE
            : GRID_Y + GRID_SIZE * CELL_SIZE;

        // Создаем линию для подсветки
        const lineColor = isRow ? 0xf9a826 : 0x457b9d; // Разные цвета для рядов и столбцов
        const highlightLine = this.scene.add.line(0, 0, startX, startY, endX, endY, lineColor, 0);
        highlightLine.setLineWidth(CELL_SIZE * 0.8);
        highlightLine.setAlpha(0);

        // Анимация появления линии
        this.scene.tweens.add({
            targets: highlightLine,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            onComplete: () => highlightLine.destroy(),
        });

        // Создаем эффект пульсации для линии
        const linePulse = this.scene.add.rectangle(
            isRow ? GRID_X + (GRID_SIZE * CELL_SIZE) / 2 : startX + CELL_SIZE / 2,
            isRow ? startY + CELL_SIZE / 2 : GRID_Y + (GRID_SIZE * CELL_SIZE) / 2,
            isRow ? GRID_SIZE * CELL_SIZE : CELL_SIZE,
            isRow ? CELL_SIZE : GRID_SIZE * CELL_SIZE,
            lineColor,
            0.2
        );
        linePulse.setBlendMode(Phaser.BlendModes.SCREEN);
        lineEffects.add(linePulse);

        // Анимация пульсации
        this.scene.tweens.add({
            targets: linePulse,
            alpha: { from: 0.2, to: 0.5 },
            scale: { from: 1, to: 1.1 },
            duration: 300,
            yoyo: true,
            repeat: 1,
            onComplete: () => linePulse.destroy(),
        });

        // Запускаем очистку блоков с эффектом волны
        const length = isRow ? GRID_SIZE : GRID_SIZE;
        const mid = Math.floor(length / 2);

        // Блоки исчезают от центра к краям
        for (let i = 0; i < length; i++) {
            // Рассчитываем позицию от центра к краям
            const distFromCenter = Math.abs(i - mid);
            const delay = distFromCenter * delayPerBlock;

            // Координаты блока
            const x = isRow ? i : coords[0];
            const y = isRow ? coords[0] : i;

            // Запускаем анимацию с задержкой
            this.scene.time.delayedCall(delay, () => {
                this.animateBlockClear(x, y);
            });
        }
    }

    /**
     * Анимирует очистку нескольких линий
     */
    public animateLinesClear(rows: number[], cols: number[]): void {
        // Анимируем очистку всех рядов
        rows.forEach((row, index) => {
            this.scene.time.delayedCall(index * 100, () => {
                this.animateLineClear([row], true);
            });
        });

        // Анимируем очистку всех столбцов с небольшой задержкой после рядов
        cols.forEach((col, index) => {
            this.scene.time.delayedCall(rows.length * 100 + index * 100, () => {
                this.animateLineClear([col], false);
            });
        });
    }

    /**
     * Анимирует очистку блока с эффектом распада на мелкие частицы
     * @param x - координата X блока
     * @param y - координата Y блока
     */
    public animateBlockClear(x: number, y: number, color?: string): void {
        console.log(`animateBlockClear вызван для блока ${x},${y}, с цветом:`, color);

        const block = this.blocks[y][x];
        if (!block) {
            console.log(`Block в позиции ${x},${y} не существует`);
            return;
        }

        // Если блок уже прозрачен, но цвет указан, используем указанный цвет
        // Иначе используем текущий цвет блока
        const originalColor =
            block.fillAlpha === 0 && color
                ? Phaser.Display.Color.HexStringToColor(color).color
                : block.fillColor;
        const blockX = block.x;
        const blockY = block.y;
        const blockWidth = block.width;
        const blockHeight = block.height;

        // Удаляем существующие эффекты
        if (block.data && block.data.has('effects')) {
            const effects = block.data.get('effects');
            effects.forEach((effect: Phaser.GameObjects.GameObject) => effect.destroy());
        }

        // Создаем группу для мини-блоков
        const miniBlocksGroup = this.scene.add.group();

        // Яркая вспышка при начале анимации
        const flash = this.scene.add.rectangle(
            blockX,
            blockY,
            blockWidth * 1.5,
            blockHeight * 1.5,
            0xffffff,
            0.7
        );
        flash.setDepth(block.depth + 1);
        flash.setBlendMode(Phaser.BlendModes.SCREEN);

        this.scene.tweens.add({
            targets: flash,
            alpha: { from: 0.7, to: 0 },
            scale: { from: 1, to: 1.5 },
            duration: 180,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy(),
        });

        // Создаем эффект свечения вокруг блока
        const glow = this.scene.add.rectangle(
            blockX,
            blockY,
            blockWidth * 1.8,
            blockHeight * 1.8,
            originalColor,
            0.4
        );
        glow.setDepth(block.depth);
        glow.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 2,
            duration: 300,
            ease: 'Sine.easeOut',
            onComplete: () => glow.destroy(),
        });

        // Количество мини-блоков по горизонтали и вертикали
        const gridSize = 5;
        const miniBlockSize = blockWidth / gridSize;

        // Создаем сетку мини-блоков
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Вычисляем позицию мини-блока внутри основного блока
                const offsetX = (i - (gridSize - 1) / 2) * miniBlockSize;
                const offsetY = (j - (gridSize - 1) / 2) * miniBlockSize;

                // Создаем мини-блок
                const miniBlock = this.scene.add.rectangle(
                    blockX + offsetX,
                    blockY + offsetY,
                    miniBlockSize * 0.9, // Немного меньше для создания зазоров
                    miniBlockSize * 0.9,
                    originalColor,
                    1
                );
                miniBlock.setDepth(block.depth + 1);

                // Добавляем мини-блок в группу
                miniBlocksGroup.add(miniBlock);

                // Рассчитываем расстояние от центра (для определения порядка анимации)
                const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

                // Задержка анимации в зависимости от расстояния от центра
                // Внешние блоки начнут анимацию раньше, создавая эффект "распада с краев"
                const delay = Math.max(0, 200 - distance * 10);

                // Добавляем случайность к параметрам анимации для более органичного эффекта
                const angle = Math.atan2(offsetY, offsetX);
                const speed = Phaser.Math.Between(50, 150);
                const destX = blockX + Math.cos(angle) * speed * (1 + Math.random() * 0.5);
                const destY = blockY + Math.sin(angle) * speed * (1 + Math.random() * 0.5);

                // Анимируем мини-блок
                this.scene.time.delayedCall(delay, () => {
                    this.scene.tweens.add({
                        targets: miniBlock,
                        x: destX,
                        y: destY,
                        scaleX: { from: 1, to: 0 },
                        scaleY: { from: 1, to: 0 },
                        angle: Phaser.Math.Between(-180, 180),
                        alpha: { from: 1, to: 0 },
                        duration: Phaser.Math.Between(300, 600),
                        ease: 'Cubic.easeOut',
                        onComplete: () => miniBlock.destroy(),
                    });
                });
            }
        }

        // Скрываем оригинальный блок
        block.setAlpha(0);

        // Возвращаем блок в исходное состояние после завершения анимации
        this.scene.time.delayedCall(800, () => {
            block.setAlpha(1).setScale(1, 1).setFillStyle(0x000000, 0);
        });

        // Добавляем систему частиц для дымки/пыли
        // Проверяем наличие текстуры для частиц и создаем ее при необходимости
        if (!this.scene.textures.exists('pixel')) {
            console.warn("Текстура 'pixel' не найдена для создания частиц. Создаем новую.");
            const particleSize = 4;
            const particleTexture = this.scene.make.graphics({ x: 0, y: 0 });
            particleTexture.fillStyle(0xffffff);
            particleTexture.fillRect(0, 0, particleSize, particleSize);
            particleTexture.generateTexture('pixel', particleSize, particleSize);
            particleTexture.destroy();
            console.log("Текстура 'pixel' создана.");
        }

        console.log(`Создаем систему частиц для блока ${x},${y}`);
        const particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

        // Основной эмиттер в центре
        const centerEmitter = this.scene.add.particles(blockX, blockY, 'pixel', {
            speed: { min: 20, max: 80 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            lifespan: { min: 300, max: 800 },
            quantity: 20,
            frequency: -1, // Одноразовый выброс
            tint: [originalColor, 0xffffff],
            blendMode: Phaser.BlendModes.SCREEN,
            emitting: false,
        });
        particleEmitters.push(centerEmitter);
        centerEmitter.setDepth(block.depth + 2);
        centerEmitter.explode(30);

        // Создаем несколько эмиттеров по краям для эффекта расползания
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const edgeX = blockX + Math.cos(angle) * (blockWidth / 2) * 0.7;
            const edgeY = blockY + Math.sin(angle) * (blockHeight / 2) * 0.7;

            const edgeEmitter = this.scene.add.particles(edgeX, edgeY, 'pixel', {
                speed: { min: 10, max: 60 },
                scale: { start: 0.6, end: 0 },
                lifespan: { min: 400, max: 700 },
                quantity: 8,
                frequency: -1,
                tint: [originalColor, 0xffffff],
                blendMode: Phaser.BlendModes.SCREEN,
                emitting: false,
            });
            particleEmitters.push(edgeEmitter);
            edgeEmitter.setDepth(block.depth + 2);

            // Отложенный выброс для создания каскадного эффекта
            this.scene.time.delayedCall(i * 50, () => {
                edgeEmitter.explode(15);
            });
        }

        // Добавляем медленно движущиеся частицы для "пыли"
        const dustEmitter = this.scene.add.particles(blockX, blockY, 'pixel', {
            speed: { min: 5, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: { min: 800, max: 1500 },
            quantity: 15,
            frequency: -1,
            tint: [originalColor, 0xffffff, 0xaaaaaa],
            blendMode: Phaser.BlendModes.ADD,
            emitting: false,
        });
        particleEmitters.push(dustEmitter);
        dustEmitter.setDepth(block.depth + 1);
        dustEmitter.explode(20);

        // Очищаем все эмиттеры через таймаут
        this.scene.time.delayedCall(1500, () => {
            particleEmitters.forEach(emitter => emitter.destroy());
        });

        // Добавляем несколько звездочек для дополнительного визуального эффекта
        for (let i = 0; i < 4; i++) {
            const size = Phaser.Math.Between(3, 6);
            const delay = Phaser.Math.Between(0, 300);

            this.scene.time.delayedCall(delay, () => {
                const star = this.scene.add.star(
                    blockX + Phaser.Math.Between(-10, 10),
                    blockY + Phaser.Math.Between(-10, 10),
                    5,
                    size / 2,
                    size,
                    originalColor
                );
                star.setAlpha(0.8);
                star.setDepth(block.depth + 3);
                star.setBlendMode(Phaser.BlendModes.SCREEN);

                this.scene.tweens.add({
                    targets: star,
                    x: blockX + Phaser.Math.Between(-70, 70),
                    y: blockY + Phaser.Math.Between(-70, 70),
                    angle: Phaser.Math.Between(-180, 180),
                    alpha: 0,
                    duration: Phaser.Math.Between(400, 800),
                    ease: 'Cubic.easeOut',
                    onComplete: () => star.destroy(),
                });
            });
        }
    }

    /**
     * Очищает подсветку
     */
    public clearHighlights(): void {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const block = this.blocks[y][x];
                block.setStrokeStyle(0); // Убираем обводку
                block.setScale(1, 1); // Сбрасываем масштаб блока к исходному
                this.scene.tweens.killTweensOf(block); // Останавливаем анимации блока

                if (block.data) {
                    // Удаляем только эффекты подсветки, сохраняя эффекты объема
                    if (block.data.has('effects')) {
                        const effects = block.data.get('effects');
                        // Создаем новый массив, куда будем сохранять только эффекты объема
                        const remainingEffects: Phaser.GameObjects.GameObject[] = [];

                        effects.forEach((effect: Phaser.GameObjects.GameObject) => {
                            if (effect.data && effect.data.has('isHighlightEffect')) {
                                // Это эффект подсветки - удаляем его
                                this.scene.tweens.killTweensOf(effect);
                                effect.destroy();
                            } else {
                                // Это эффект объема - сохраняем его
                                remainingEffects.push(effect);
                            }
                        });

                        // Обновляем массив эффектов только с оставшимися эффектами объема
                        block.data.set('effects', remainingEffects);
                    }

                    // Удаляем флаг подсветки
                    if (block.data.has('highlighted')) {
                        block.data.remove('highlighted');
                    }
                }
            }
        }
    }
}
