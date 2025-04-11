import { GridPosition } from '../types/game-types';
import { Shape, ShapeType } from '../types/shape-types';

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
     * Поворачивает блоки фигуры на указанное количество градусов по часовой стрелке
     * @param blocks - блоки фигуры
     * @param rotation - угол поворота (0, 90, 180, 270)
     * @returns новый массив блоков с повернутыми координатами
     */
    private static rotateBlocks(blocks: GridPosition[], rotation: number): GridPosition[] {
        if (rotation === 0) {
            return blocks.map(block => ({ x: block.x, y: block.y }));
        }

        let maxX = 0;
        let maxY = 0;
        for (const block of blocks) {
            maxX = Math.max(maxX, block.x);
            maxY = Math.max(maxY, block.y);
        }

        const width = maxX + 1;
        const height = maxY + 1;

        return blocks.map(block => {
            const x = block.x;
            const y = block.y;

            if (rotation === 90) {
                return { x: block.y, y: width - 1 - block.x };
            } else if (rotation === 180) {
                return { x: width - 1 - block.x, y: height - 1 - block.y };
            } else if (rotation === 270) {
                return { x: height - 1 - block.y, y: block.x };
            }

            return { x, y };
        });
    }

    /**
     * Создает фигуру указанного типа с указанным углом поворота
     * @param type - тип фигуры
     * @param rotation - угол поворота (0, 90, 180, 270)
     */
    private static createShape(type: ShapeType, rotation = 0): Shape {
        const color = this.getRandomColor();
        let blocks: GridPosition[] = [];

        const canRotate = [
            ShapeType.LINE_2,
            ShapeType.LINE_3,
            ShapeType.L_SHAPE,
            ShapeType.T_SHAPE,
            ShapeType.CROSS,
            ShapeType.Z_SHAPE,
        ];

        if (!canRotate.includes(type)) {
            rotation = 0;
        }

        switch (type) {
            case ShapeType.SINGLE:
                blocks = [{ x: 0, y: 0 }];
                break;
            case ShapeType.LINE_2:
                blocks = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                ];
                break;
            case ShapeType.LINE_3:
                blocks = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 2, y: 0 },
                ];
                break;
            case ShapeType.L_SHAPE:
                blocks = [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                    { x: 1, y: 1 },
                ];
                break;
            case ShapeType.SQUARE:
                blocks = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 0, y: 1 },
                    { x: 1, y: 1 },
                ];
                break;
            case ShapeType.T_SHAPE:
                blocks = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 2, y: 0 },
                    { x: 1, y: 1 },
                ];
                break;
            case ShapeType.CROSS:
                blocks = [
                    { x: 1, y: 0 },
                    { x: 0, y: 1 },
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 1, y: 2 },
                ];
                break;
            case ShapeType.Z_SHAPE:
                blocks = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                ];
                break;
            default:
                blocks = [{ x: 0, y: 0 }];
        }

        if (rotation > 0) {
            blocks = this.rotateBlocks(blocks, rotation);
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
     * Возвращает случайный угол поворота (0, 90, 180, 270)
     */
    private static getRandomRotation(): number {
        const rotations = [0, 90, 180, 270];
        return rotations[Math.floor(Math.random() * rotations.length)];
    }

    /**
     * Генерирует указанное количество случайных фигур с разными ориентациями
     */
    public static generateRandomShapes(count: number): Shape[] {
        const shapes: Shape[] = [];
        for (let i = 0; i < count; i++) {
            const type = this.getRandomShapeType();
            const rotation = this.getRandomRotation();
            shapes.push(this.createShape(type, rotation));
        }
        return shapes;
    }

    /**
     * Создает бонусную фигуру (одиночный блок)
     */
    public static createBonusShape(): Shape {
        return this.createShape(ShapeType.SINGLE, 0);
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
            height: maxY + 1,
        };
    }
}
