import { Shape, ShapeType, GridPosition } from './types';

/**
 * Класс, отвечающий за генерацию игровых фигур
 */
export class ShapeGenerator {
  private static readonly COLORS: string[] = [
    '#ff3b30',
    '#007aff',
    '#4cd964',
    '#ffcc00',
    '#af52de',
    '#ff9500',
    '#00d7be',
    '#ff375f',
    '#5856d6',
  ];

  /**
   * Возвращает случайный цвет из предопределенного набора
   */
  private static getRandomColor(): string {
    return this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
  }

  /**
   * Создает фигуру указанного типа
   */
  private static createShape(type: ShapeType): Shape {
    const color = this.getRandomColor();
    let blocks: GridPosition[] = [];

    switch (type) {
      case ShapeType.SINGLE:
        blocks = [{ x: 0, y: 0 }];
        break;
      case ShapeType.LINE_2:
        blocks = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
        break;
      case ShapeType.LINE_3:
        blocks = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
        break;
      case ShapeType.L_SHAPE:
        blocks = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
        break;
      case ShapeType.SQUARE:
        blocks = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
        break;
      case ShapeType.T_SHAPE:
        blocks = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }];
        break;
      case ShapeType.CROSS:
        blocks = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }];
        break;
      case ShapeType.Z_SHAPE:
        blocks = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }];
        break;
      default:
        blocks = [{ x: 0, y: 0 }];
    }

    return { type, blocks, color };
  }

  /**
   * Возвращает случайный тип фигуры
   */
  private static getRandomShapeType(): ShapeType {
    const types = Object.values(ShapeType);
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Генерирует указанное количество случайных фигур
   */
  public static generateRandomShapes(count: number): Shape[] {
    const shapes: Shape[] = [];
    for (let i = 0; i < count; i++) {
      const type = this.getRandomShapeType();
      shapes.push(this.createShape(type));
    }
    return shapes;
  }

  /**
   * Создает бонусную фигуру (одиночный блок)
   */
  public static createBonusShape(): Shape {
    return this.createShape(ShapeType.SINGLE);
  }

  /**
   * Возвращает размер (ширина и высота) указанной фигуры
   */
  public static getShapeSize(shape: Shape): { width: number; height: number } {
    let maxX = 0;
    let maxY = 0;

    for (const block of shape.blocks) {
      maxX = Math.max(maxX, block.x);
      maxY = Math.max(maxY, block.y);
    }

    return {
      width: maxX + 1,
      height: maxY + 1
    };
  }
}