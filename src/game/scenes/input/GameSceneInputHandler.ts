import Phaser from 'phaser';
import { GameScene } from '../GameScene';
import { GridPosition } from '../../types';
import { GRID_X, GRID_Y, GRID_SIZE, CELL_SIZE } from '../../config';

export class GameSceneInputHandler {
    private scene: GameScene;
    private draggingObject: Phaser.GameObjects.Container | null = null;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public setupInputHandlers(): void {
        this.scene.input.off('dragstart', this.onDragStart, this);
        this.scene.input.off('drag', this.onDrag, this);
        this.scene.input.off('dragend', this.onDragEnd, this);

        this.scene.input.on('dragstart', this.onDragStart, this);
        this.scene.input.on('drag', this.onDrag, this);
        this.scene.input.on('dragend', this.onDragEnd, this);

        this.enablePreviewDragging();
    }

    public enablePreviewDragging(): void {
        const previewContainers = this.scene.uiManager.getShapePreviewContainers();
        previewContainers.forEach((container: Phaser.GameObjects.Container) => {
            const shape = container.getData('shape');
            if (shape) {
                try {
                    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);
                    this.scene.input.setDraggable(container);
                    console.log(`Draggable enabled for preview index: ${container.getData('index')}`);
                } catch (error) {
                    console.error(`Error setting interactive for preview index ${container.getData('index')}:`, error);
                }
            } else {
                 if (container.input?.enabled) {
                    this.scene.input.disable(container);
                    console.log(`Draggable disabled for empty preview index: ${container.getData('index')}`);
                 }
            }
        });
    }

    private onDragStart(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container): void {
        const index = gameObject.getData('index');
        const shape = gameObject.getData('shape');
        if (index === undefined || shape === null) return;

        console.log(`Drag Start: Index ${index}`);
        this.draggingObject = gameObject;

        this.scene.selectShape(index);

        gameObject.setDepth(100);

        const shadow = this.scene.add.rectangle(gameObject.x, gameObject.y + 5, 100, 100, 0x000000, 0.2)
            .setDepth(99)
            .setOrigin(0.5);
        gameObject.setData('shadow', shadow);

        this.scene.tweens.add({ targets: gameObject, scale: 1.15, y: gameObject.y - 10, duration: 200, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: shadow, alpha: 0.3, scale: 1.1, duration: 200, ease: 'Quad.easeOut' });

        const gridHighlight = this.scene.add.rectangle(
            GRID_X + GRID_SIZE * CELL_SIZE / 2, GRID_Y + GRID_SIZE * CELL_SIZE / 2,
            GRID_SIZE * CELL_SIZE + 10, GRID_SIZE * CELL_SIZE + 10,
            0xffffff, 0
        ).setStrokeStyle(5, 0x4cd964, 0).setDepth(50);
        gameObject.setData('gridHighlight', gridHighlight);

        this.scene.tweens.add({ targets: gridHighlight, strokeAlpha: 0.5, duration: 300, ease: 'Sine.easeOut' });
    }

    private onDrag(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number): void {
        if (!this.scene.scene.isActive(this.scene.scene.key) || gameObject !== this.draggingObject) return;

        gameObject.x = dragX;
        gameObject.y = dragY;

        const shadow = gameObject.getData('shadow') as Phaser.GameObjects.Rectangle;
        if (shadow) {
            shadow.x = dragX;
            shadow.y = dragY + 15;
        }

        const gridPos = this.getGridPositionFromPointer(pointer);
        const gridHighlight = gameObject.getData('gridHighlight') as Phaser.GameObjects.Rectangle;

        if (gridPos) {
            const canPlace = this.scene.showShapeGhost(gridPos);
            if (gridHighlight) {
                gridHighlight.setStrokeStyle(5, canPlace ? 0x4cd964 : 0xff3b30, 0.5);
            }
        } else {
            this.scene.clearShapeGhost();
            if (gridHighlight) {
                gridHighlight.setStrokeStyle(5, 0xffffff, 0.3);
            }
        }
    }

    private onDragEnd(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container): void {
        if (!this.scene.scene.isActive(this.scene.scene.key) || gameObject !== this.draggingObject) return;

        console.log(`Drag End: Index ${gameObject.getData('index')}`);
        this.draggingObject = null;

        const gridHighlight = gameObject.getData('gridHighlight') as Phaser.GameObjects.Rectangle;
        if (gridHighlight) {
            this.scene.tweens.add({
                targets: gridHighlight, strokeAlpha: 0, duration: 200,
                onComplete: () => gridHighlight.destroy()
            });
            gameObject.setData('gridHighlight', null);
        }

        const shadow = gameObject.getData('shadow') as Phaser.GameObjects.Rectangle;
        if (shadow) {
             this.scene.tweens.add({
                targets: shadow, alpha: 0, duration: 200,
                onComplete: () => shadow.destroy()
            });
            gameObject.setData('shadow', null);
        }

        const gridPos = this.getGridPositionFromPointer(pointer);

        if (gridPos) {
            const placed = this.scene.placeSelectedShape(gridPos);
            if (placed) {
                this.createPlacementParticles(pointer.x, pointer.y);
                if (gameObject.input) {
                    gameObject.input.enabled = false;
                }
            } else {
                this.returnShapeToOrigin(gameObject);
            }
        } else {
            this.returnShapeToOrigin(gameObject);
        }

        this.scene.clearShapeGhost();
        gameObject.setDepth(0);
    }

    private getGridPositionFromPointer(pointer: Phaser.Input.Pointer): GridPosition | null {
        if (
            pointer.x >= GRID_X && pointer.x <= GRID_X + GRID_SIZE * CELL_SIZE &&
            pointer.y >= GRID_Y && pointer.y <= GRID_Y + GRID_SIZE * CELL_SIZE
        ) {
            const gridX = Math.floor((pointer.x - GRID_X) / CELL_SIZE);
            const gridY = Math.floor((pointer.y - GRID_Y) / CELL_SIZE);
            return { x: gridX, y: gridY };
        }
        return null;
    }

    private returnShapeToOrigin(gameObject: Phaser.GameObjects.Container): void {
        const initialX = gameObject.getData('initialX');
        const initialY = gameObject.getData('initialY');

        const flash = this.scene.add.rectangle(gameObject.x, gameObject.y, 110, 110, 0xffffff, 0.6).setOrigin(0.5);
        this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.3, duration: 200, onComplete: () => flash.destroy() });

        this.scene.tweens.add({
            targets: gameObject,
            x: initialX,
            y: initialY,
            scale: 1,
            duration: 350,
            ease: 'Back.easeOut',
            onComplete: () => {
                 gameObject.setDepth(0);
            }
        });
    }

     private createPlacementParticles(x: number, y: number): void {
        const emitter = this.scene.add.particles(x, y, 'pixel', {
            speed: { min: 30, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 600,
            quantity: 20,
            tint: [0xffffff, 0x4cd964]
        });
        emitter.setDepth(200);

        this.scene.time.delayedCall(300, () => {
            emitter.stop();
            this.scene.time.delayedCall(600, () => emitter.destroy());
        });
    }

    public destroy(): void {
        this.scene.input.off('dragstart', this.onDragStart, this);
        this.scene.input.off('drag', this.onDrag, this);
        this.scene.input.off('dragend', this.onDragEnd, this);
        this.draggingObject = null;
        console.log("GameSceneInputHandler destroyed");
    }
}