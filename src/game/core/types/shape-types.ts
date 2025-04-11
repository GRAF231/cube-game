/**
 * Типы, связанные с фигурами в игре
 */

import { GridPosition } from './game-types';

/**
 * Тип фигуры в игре
 */
export enum ShapeType {
    SINGLE = 'SINGLE',
    LINE_2 = 'LINE_2',
    LINE_3 = 'LINE_3',
    L_SHAPE = 'L_SHAPE',
    SQUARE = 'SQUARE',
    T_SHAPE = 'T_SHAPE',
    CROSS = 'CROSS',
    Z_SHAPE = 'Z_SHAPE',
}

/**
 * Структура игровой фигуры
 */
export interface Shape {
    type: ShapeType;
    blocks: GridPosition[];
    color: string;
    previewPosition?: GridPosition;
}
