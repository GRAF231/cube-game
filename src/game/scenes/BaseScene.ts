import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * Базовый класс сцены, от которого наследуются все остальные сцены
 */
export class BaseScene extends Phaser.Scene {
    /**
     * Создает кнопку с текстом
     */
    protected createTextButton(
        x: number,
        y: number,
        text: string,
        onClick: () => void,
        fontSize = 24
    ): Phaser.GameObjects.Text {
        const button = this.add
            .text(x, y, text, {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                align: 'center',
                backgroundColor: '#3498db',
                padding: { x: 20, y: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setStyle({ backgroundColor: '#2980b9' });
        });

        button.on('pointerout', () => {
            button.setStyle({ backgroundColor: '#3498db' });
        });

        button.on('pointerdown', () => {
            button.setStyle({ backgroundColor: '#1c6ea4' });
        });

        button.on('pointerup', () => {
            button.setStyle({ backgroundColor: '#2980b9' });
            onClick();
        });

        return button;
    }

    /**
     * Создает текст с заголовком
     */
    protected createTitle(text: string, fontSize = 48): Phaser.GameObjects.Text {
        return this.add
            .text(GAME_WIDTH / 2, 80, text, {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
            })
            .setOrigin(0.5);
    }

    /**
     * Создает затемненный фон для модального окна
     */
    protected createModalBackground(): Phaser.GameObjects.Rectangle {
        return this.add
            .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();
    }

    /**
     * Создает модальное окно с заданным текстом и кнопками
     */
    protected createModal(
        title: string,
        message: string,
        buttons: { text: string; callback: () => void }[]
    ): { container: Phaser.GameObjects.Container; close: () => void } {
        const bg = this.createModalBackground();
        const modalWidth = 400;
        const modalHeight = 300;
        const modalX = GAME_WIDTH / 2 - modalWidth / 2;
        const modalY = GAME_HEIGHT / 2 - modalHeight / 2;

        const modalBg = this.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x2c3e50, 1);
        modalBg.setOrigin(0);
        modalBg.setStrokeStyle(2, 0xffffff);

        const titleText = this.add
            .text(GAME_WIDTH / 2, modalY + 30, title, {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                align: 'center',
            })
            .setOrigin(0.5);

        const messageText = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, message, {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: modalWidth - 40 },
            })
            .setOrigin(0.5);

        const buttonObjects: Phaser.GameObjects.Text[] = [];
        const buttonWidth = (modalWidth - 60) / buttons.length;

        buttons.forEach((button, index) => {
            const x = modalX + 30 + buttonWidth * index + buttonWidth / 2;
            const y = modalY + modalHeight - 50;

            const buttonText = this.createTextButton(x, y, button.text, button.callback, 20);
            buttonObjects.push(buttonText);
        });

        const container = this.add
            .container(0, 0, [bg, modalBg, titleText, messageText, ...buttonObjects])
            .setDepth(1000);

        const close = () => {
            container.destroy();
        };

        return { container, close };
    }
}
