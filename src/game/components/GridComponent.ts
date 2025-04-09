import Phaser from 'phaser';
import { Cell, GridPosition, Shape } from '../types';
import { GRID_SIZE, CELL_SIZE, GRID_X, GRID_Y, COLORS } from '../config';

export class GridComponent {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private blocks: Phaser.GameObjects.Rectangle[][];
  private onClickCallback?: (position: GridPosition) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.blocks = [];
    this.graphics = scene.add.graphics();
    this.createGrid();
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
      ease: 'Sine.easeInOut'
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
            effects.forEach((effect: Phaser.GameObjects.GameObject) => effect.destroy());
          }
          
          // Создаем эффекты для блока с умеренным свечением
          const effects: Phaser.GameObjects.GameObject[] = [];
          
          // 1. Более заметное свечение вокруг блока
          const glow = this.scene.add.rectangle(
            block.x,
            block.y,
            block.width + 10, // Увеличиваем размер свечения
            block.height + 10,
            color,
            0.25 // Увеличиваем непрозрачность для более заметного эффекта
          ).setDepth(block.depth - 1);
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
            ease: 'Sine.easeInOut'
          });
          
          if (!block.data) block.setDataEnabled();
          block.data.set('effects', effects);
        } else {
          block.setFillStyle(0x000000, 0);
          if (block.data && block.data.has('effects')) {
            const effects = block.data.get('effects');
            effects.forEach((effect: Phaser.GameObjects.GameObject) => effect.destroy());
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
    this.clearHighlights();

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
    const clearingHighlightColor = Phaser.Display.Color.HexStringToColor(COLORS.ghostInvalid).color;
    
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
          ease: 'Sine.easeInOut'
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
          ease: 'Sine.easeInOut'
        });
      }
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
    const endX = isRow ? GRID_X + GRID_SIZE * CELL_SIZE : GRID_X + coords[0] * CELL_SIZE + CELL_SIZE;
    const endY = isRow ? GRID_Y + coords[0] * CELL_SIZE + CELL_SIZE : GRID_Y + GRID_SIZE * CELL_SIZE;
    
    // Создаем линию для подсветки
    const lineColor = isRow ? 0xf9a826 : 0x457b9d; // Разные цвета для рядов и столбцов
    const highlightLine = this.scene.add.line(
      0, 0, startX, startY, endX, endY, lineColor, 0
    );
    highlightLine.setLineWidth(CELL_SIZE * 0.8);
    highlightLine.setAlpha(0);
    
    // Анимация появления линии
    this.scene.tweens.add({
      targets: highlightLine,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      onComplete: () => highlightLine.destroy()
    });
    
    // Создаем эффект пульсации для линии
    const linePulse = this.scene.add.rectangle(
      isRow ? GRID_X + GRID_SIZE * CELL_SIZE / 2 : startX + CELL_SIZE / 2,
      isRow ? startY + CELL_SIZE / 2 : GRID_Y + GRID_SIZE * CELL_SIZE / 2,
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
      onComplete: () => linePulse.destroy()
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
   * Анимирует очистку нескольких линий (вызывается из GameScene)
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
   * Анимирует очистку блока
   */
  public animateBlockClear(x: number, y: number): void {
    const block = this.blocks[y][x];
    if (!block || block.fillAlpha === 0) return;

    const originalColor = block.fillColor;
    
    // Удаляем существующие эффекты
    if (block.data && block.data.has('effects')) {
      const effects = block.data.get('effects');
      effects.forEach((effect: Phaser.GameObjects.GameObject) => effect.destroy());
    }

    // 1. Сначала увеличим блок перед исчезновением для эффекта "взрыва"
    this.scene.tweens.add({
      targets: block,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // 2. Затем уменьшаем и исчезаем
        this.scene.tweens.add({
          targets: block,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 200,
          ease: 'Back.easeIn',
          onComplete: () => {
            block.setAlpha(1).setScale(1, 1).setFillStyle(0x000000, 0);
          }
        });
      }
    });

    // 3. Яркая вспышка при исчезновении
    const flash = this.scene.add.rectangle(
      block.x,
      block.y,
      block.width * 1.5,
      block.height * 1.5,
      0xffffff,
      0.7
    );
    flash.setDepth(block.depth + 1);
    flash.setBlendMode(Phaser.BlendModes.SCREEN);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: { from: 0.7, to: 0 },
      scale: { from: 1, to: 2 },
      duration: 250,
      ease: 'Sine.easeOut',
      onComplete: () => flash.destroy()
    });

    // 4. Свечение вокруг блока
    const glow = this.scene.add.rectangle(
      block.x,
      block.y,
      block.width * 1.8,
      block.height * 1.8,
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
      onComplete: () => glow.destroy()
    });

    // 5. Система частиц для эффекта "взрыва"
    if (this.scene.textures.exists('pixel')) {
      const emitter = this.scene.add.particles(
        block.x,
        block.y,
        'pixel',
        {
          speed: { min: 80, max: 220 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          lifespan: 600,
          quantity: 10,
          frequency: 30,
          maxParticles: 20,
          tint: [originalColor, 0xffffff],
          blendMode: Phaser.BlendModes.SCREEN,
          emitting: true
        }
      );
      emitter.setDepth(block.depth + 2);

      // Быстрее останавливаем эмиттер
      this.scene.time.delayedCall(150, () => {
        emitter.stop();
        this.scene.time.delayedCall(500, () => {
          emitter.destroy();
        });
      });
    }

    // 6. Добавляем звездочки
    for (let i = 0; i < 2; i++) {
      const size = Phaser.Math.Between(4, 7);
      const star = this.scene.add.star(block.x, block.y, 5, size / 2, size, originalColor);
      star.setAlpha(0.8);
      star.setDepth(block.depth + 3);
      star.setBlendMode(Phaser.BlendModes.SCREEN);
      
      this.scene.tweens.add({
        targets: star,
        x: block.x + Phaser.Math.Between(-70, 70),
        y: block.y + Phaser.Math.Between(-70, 70),
        angle: Phaser.Math.Between(0, 360),
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      });
    }
  }
  public destroy(): void {
    this.graphics.destroy();
    this.blocks.forEach(row => row.forEach(block => block.destroy()));
  }
}