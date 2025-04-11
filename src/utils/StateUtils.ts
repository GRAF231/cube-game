/**
 * Утилиты для управления иммутабельным состоянием
 */
export class StateUtils {
    /**
     * Создает глубокую копию объекта без использования JSON.stringify/parse
     */
    static deepCopy<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepCopy(item)) as unknown as T;
        }

        const copy = {} as T;

        Object.keys(obj).forEach(key => {
            copy[key as keyof T] = this.deepCopy(obj[key as keyof T]);
        });

        return copy;
    }

    /**
     * Создает новый объект с обновленными свойствами
     */
    static update<T extends object>(obj: T, updates: Partial<T>): T {
        return { ...obj, ...updates };
    }

    /**
     * Создает новый массив с замененным элементом по индексу
     */
    static updateArrayItem<T>(array: T[], index: number, newItem: T): T[] {
        return [...array.slice(0, index), newItem, ...array.slice(index + 1)];
    }

    /**
     * Создает новую двумерную сетку с обновленной ячейкой
     */
    static updateGrid<T>(grid: T[][], x: number, y: number, value: T): T[][] {
        const newGrid = [...grid];
        newGrid[y] = [...newGrid[y]];
        newGrid[y][x] = value;
        return newGrid;
    }

    /**
     * Создает новую двумерную сетку с обновленными несколькими ячейками
     */
    static updateGridCells<T>(grid: T[][], updates: { x: number; y: number; value: T }[]): T[][] {
        let newGrid = [...grid];

        for (const update of updates) {
            newGrid = this.updateGrid(newGrid, update.x, update.y, update.value);
        }

        return newGrid;
    }
}
