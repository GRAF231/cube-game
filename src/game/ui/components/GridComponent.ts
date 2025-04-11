import Phaser from 'phaser';
import { Cell, GridPosition, Shape } from '../../types';
import { GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y, COLORS } from '../../config';
import { GridAnimations } from '../../components/GridAnimations';

/**
 * Класс GridComponent отвечает за управление игровой сеткой
 */
export class GridComponent {
    private scene: Phaser.Scene;
    private graphics: Phaser.GameObjects.Graphics;
    private blocks: Phaser.GameObjects.Rectangle[][];
    private onClickCallback?: (position: GridPosition) => void;
    private animations: GridAnimations;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.blocks = [];
        this.graphics = scene.add.graphics();
        this.createGrid();
        this.animations = new GridAnimations(scene, this.blocks);
    }

    /**
     * Инициализирует игровую сетку
     */
    private createGrid(): void {
        // Основные линии сетки с неоновым эффектом
        const gridColor = Phaser.Display.Color.HexStringToColor(COLORS.gridLines).color;
        this.graphics.lineStyle(2, gridColor, 0.8);

        // Рисуем вертикальные линии
        for (let x = 0; x <= GRID_SIZE; x++) {
            this.graphics.moveTo(GRID_X + x * CELL_SIZE, GRID_Y);
            this.graphics.lineTo(GRID_X + x * CELL_SIZE, GRID_Y + GRID_SIZE * CELL_SIZE);
        }

        // Рисуем горизонтальные линии
        for (let y = 0; y <= GRID_SIZE; y++) {
            this.graphics.moveTo(GRID_X, GRID_Y + y * CELL_SIZE);
            this.graphics.lineTo(GRID_X + GRID_SIZE * CELL_SIZE, GRID_Y + y * CELL_SIZE);
        }

        this.graphics.strokePath();

        // Создаем свечение линий (внутренний слой)
        const innerGlow = this.scene.add.graphics();
        innerGlow.lineStyle(4, gridColor, 0.2);

        for (let x = 0; x <= GRID_SIZE; x++) {
            innerGlow.moveTo(GRID_X + x * CELL_SIZE, GRID_Y);
            innerGlow.lineTo(GRID_X + x * CELL_SIZE, GRID_Y + GRID_SIZE * CELL_SIZE);
        }

        for (let y = 0; y <= GRID_SIZE; y++) {
            innerGlow.moveTo(GRID_X, GRID_Y + y * CELL_SIZE);
            innerGlow.lineTo(GRID_X + GRID_SIZE * CELL_SIZE, GRID_Y + y * CELL_SIZE);
        }

        innerGlow.strokePath();

        // Добавляем внешнее свечение вокруг сетки
        const glowGraphics = this.scene.add.graphics();
        glowGraphics.lineStyle(8, gridColor, 0.15);
        glowGraphics.strokeRect(
            GRID_X - 4,
            GRID_Y - 4,
            GRID_SIZE * CELL_SIZE + 8,
            GRID_SIZE * CELL_SIZE + 8
        );

        // Добавляем анимацию пульсации для внешнего свечения
        this.scene.tweens.add({
            targets: glowGraphics,
            alpha: { from: 0.15, to: 0.4 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        for (let y = 0; y < GRID_SIZE; y++) {
            this.blocks[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                const block = this.scene.add.rectangle(
                    GRID_X + x * CELL_SIZE + CELL_SIZE / 2,
                    GRID_Y + y * CELL_SIZE + CELL_SIZE / 2,
                    CELL_SIZE - 4,
                    CELL_SIZE - 4,
                    0x000000,
                    0
                );
                block.setInteractive();
                block.on('pointerdown', () => this.handleClick(x, y));
                this.blocks[y][x] = block;
            }
        }
    }

    /**
     * Обновляет отображение сетки
     */
    public updateGrid(grid: Cell[][]): void {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = grid[y][x];
                const block = this.blocks[y][x];

                if (cell.filled) {
                    const color = Phaser.Display.Color.HexStringToColor(cell.color).color;
                    block.setFillStyle(color);

                    // Очищаем существующие эффекты, если они есть
                    if (block.data && block.data.has('effects')) {
                        const effects = block.data.get('effects');
                        effects.forEach((effect: Phaser.GameObjects.GameObject) =>
                            effect.destroy()
                        );
                    }

                    // Создаем эффекты для блока с умеренным свечением
                    const effects: Phaser.GameObjects.GameObject[] = [];

                    // 1. Более заметное свечение вокруг блока
                    const glow = this.scene.add
                        .rectangle(
                            block.x,
                            block.y,
                            block.width + 10, // Увеличиваем размер свечения
                            block.height + 10,
                            color,
                            0.25 // Увеличиваем непрозрачность для более заметного эффекта
                        )
                        .setDepth(block.depth - 1);
                    effects.push(glow);

                    // 2. Более яркий блик сверху для эффекта объема
                    const highlight = this.scene.add.rectangle(
                        block.x,
                        block.y - block.height * 0.22,
                        block.width * 0.85, // Увеличиваем ширину блика
                        block.height * 0.3, // Увеличиваем высоту блика
                        0xffffff,
                        0.45 // Увеличиваем непрозрачность
                    );
                    highlight.setDepth(block.depth + 1); // Устанавливаем глубину над блоком
                    effects.push(highlight);

                    // 3. Более заметная тень снизу для эффекта объема
                    const shadow = this.scene.add.rectangle(
                        block.x,
                        block.y + block.height * 0.22,
                        block.width * 0.9,
                        block.height * 0.3,
                        0x000000,
                        0.3 // Увеличиваем непрозрачность
                    );
                    shadow.setDepth(block.depth + 1); // Устанавливаем глубину над блоком
                    effects.push(shadow);

                    // 4. Более заметный внутренний блик (для всех блоков)
                    const innerGlow = this.scene.add.rectangle(
                        block.x,
                        block.y,
                        block.width * 0.5,
                        block.height * 0.5,
                        0xffffff,
                        0.15 // Увеличиваем непрозрачность
                    );
                    innerGlow.setDepth(block.depth + 1); // Устанавливаем глубину над блоком
                    effects.push(innerGlow);

                    // 5. Добавляем пульсацию для всех блоков
                    this.scene.tweens.add({
                        targets: glow,
                        alpha: { from: 0.25, to: 0.4 }, // Увеличиваем диапазон для более заметной пульсации
                        duration: 1500 + Math.random() * 1000, // Более быстрая пульсация
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                    });

                    if (!block.data) block.setDataEnabled();
                    block.data.set('effects', effects);
                } else {
                    block.setFillStyle(0x000000, 0);
                    if (block.data && block.data.has('effects')) {
                        const effects = block.data.get('effects');
                        effects.forEach((effect: Phaser.GameObjects.GameObject) =>
                            effect.destroy()
                        );
                        block.data.set('effects', []);
                    }
                }
            }
        }
    }

    /**
     * Устанавливает обработчик кликов
     */
    public setOnClick(callback: (position: GridPosition) => void): void {
        this.onClickCallback = callback;
    }

    /**
     * Обрабатывает клик по ячейке
     */
    private handleClick(x: number, y: number): void {
        if (this.onClickCallback) {
            this.onClickCallback({ x, y });
        }
    }

    /**
     * Подсвечивает доступные позиции для фигуры
     */
    public highlightValidPositions(shape: Shape | null, validPositions: GridPosition[]): void {
        this.animations.clearHighlights();

        if (!shape) return;

        validPositions.forEach(pos => {
            const block = this.blocks[pos.y][pos.x];
            block.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.ghostValid).color);
            if (!block.data) block.setDataEnabled();
            block.data.set('highlighted', true);
        });
    }

    /**
     * Подсвечивает ячейки, которые будут очищены при размещении фигуры
     */
    public highlightCellsToBeCleaned(rows: number[], cols: number[]): void {
        this.animations.highlightCellsToBeCleaned(rows, cols);
    }

    /**
     * Очищает подсветку
     */
    public clearHighlights(): void {
        this.animations.clearHighlights();
    }

    /**
     * Анимирует очистку линии (ряда или столбца)
     */
    public animateLineClear(coords: number[], isRow: boolean): void {
        this.animations.animateLineClear(coords, isRow);
    }

    /**
     * Анимирует очистку нескольких линий
     */
    public animateLinesClear(rows: number[], cols: number[]): void {
        this.animations.animateLinesClear(rows, cols);
    }

    /**
     * Анимирует очистку блока
     * @param x X-координата блока
     * @param y Y-координата блока
     * @param color Опциональный цвет блока (если блок уже очищен)
     */
    public animateBlockClear(x: number, y: number, color?: string): void {
        this.animations.animateBlockClear(x, y, color);
    }

    /**
     * Удаляет компонент сетки
     */
    public destroy(): void {
        this.graphics.destroy();
        this.blocks.forEach(row => row.forEach(block => block.destroy()));
    }
}
