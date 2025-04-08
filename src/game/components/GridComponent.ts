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
    this.graphics.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(COLORS.gridLines).color, 0.7);

    for (let x = 0; x <= GRID_SIZE; x++) {
      this.graphics.moveTo(GRID_X + x * CELL_SIZE, GRID_Y);
      this.graphics.lineTo(GRID_X + x * CELL_SIZE, GRID_Y + GRID_SIZE * CELL_SIZE);
    }

    for (let y = 0; y <= GRID_SIZE; y++) {
      this.graphics.moveTo(GRID_X, GRID_Y + y * CELL_SIZE);
      this.graphics.lineTo(GRID_X + GRID_SIZE * CELL_SIZE, GRID_Y + y * CELL_SIZE);
    }

    this.graphics.strokePath();

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

          if (block.data && block.data.has('effects')) {
            const effects = block.data.get('effects');
            effects.forEach((effect: Phaser.GameObjects.GameObject) => effect.destroy());
          }
          
          const highlight = this.scene.add.rectangle(
            block.x,
            block.y - block.height * 0.2,
            block.width * 0.7,
            block.height * 0.4,
            0xffffff,
            0.3
          );
          
          const shadow = this.scene.add.rectangle(
            block.x,
            block.y + block.height * 0.2,
            block.width * 0.9,
            block.height * 0.4,
            0x000000,
            0.2
          );
          
          if (!block.data) block.setDataEnabled();
          block.data.set('effects', [highlight, shadow]);
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
        this.scene.tweens.killTweensOf(block);
        block.setStrokeStyle(0);
        if (block.data && block.data.has('highlighted')) {
          block.data.remove('highlighted');
        }
      }
    }
  }

  /**
   * Анимирует очистку блока
   */
  public animateBlockClear(x: number, y: number): void {
    const block = this.blocks[y][x];
    if (!block || block.fillAlpha === 0) return;

    const originalColor = block.fillColor;
    
    if (block.data && block.data.has('effects')) {
      const effects = block.data.get('effects');
      effects.forEach((effect: Phaser.GameObjects.GameObject) => effect.destroy());
    }

    this.scene.tweens.add({
      targets: block,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => {
        block.setAlpha(1).setScale(1, 1).setFillStyle(0x000000, 0);
      }
    });

    const flash = this.scene.add.rectangle(
      block.x,
      block.y,
      block.width * 1.5,
      block.height * 1.5,
      0xffffff,
      0.8
    );
    flash.setDepth(block.depth + 1);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => flash.destroy()
    });

    const emitter = this.scene.add.particles(
      block.x,
      block.y,
      'pixel',
      {
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        lifespan: 800,
        tint: [originalColor, 0xffffff],
        blendMode: 'ADD',
        emitting: true
      }
    );

    this.scene.time.delayedCall(250, () => {
      emitter.stop();
      this.scene.time.delayedCall(150, () => {
        emitter.destroy();
      });
    });
  }

  public destroy(): void {
    this.graphics.destroy();
    this.blocks.forEach(row => row.forEach(block => block.destroy()));
  }
}