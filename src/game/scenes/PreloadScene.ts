import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class PreloadScene extends Phaser.Scene {
    private yaSDK: YaGames.YandexGames | null = null;
    private loadingBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        this.createLoadingUI();

        this.loadingText.setText('Инициализация...');
        this.progressText.setText('0%');

        this.load.on('progress', (value: number) => {
            this.updateProgressBar(value);
            this.progressText.setText(`${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            this.loadingText.setText('Загрузка завершена!');
            this.progressText.setText('100%');
        });

        this.createGameResources();

        this.time.delayedCall(500, () => {
            this.initYandexSDK();
        });
    }

    /**
     * Создает необходимые игровые ресурсы
     */
    private createGameResources(): void {
        const particleSize = 4;
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, particleSize, particleSize);
        graphics.generateTexture('pixel', particleSize, particleSize);
    }

    /**
     * Создает интерфейс для отображения процесса загрузки
     */
    private createLoadingUI(): void {
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x2c3e50).setOrigin(0);

        this.add
            .text(GAME_WIDTH / 2, 150, 'Тетрис-блоки', {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
            })
            .setOrigin(0.5);

        this.add
            .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 30, 0x000000)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);

        this.loadingBar = this.add.graphics();
        this.loadingBar.x = GAME_WIDTH / 2 - 200;
        this.loadingBar.y = GAME_HEIGHT / 2 - 15;

        this.loadingText = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'Загрузка...', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.progressText = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '0%', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.statusText = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#e74c3c',
            })
            .setOrigin(0.5);
    }

    /**
     * Обновляет отображение прогресс-бара
     */
    private updateProgressBar(value: number): void {
        this.loadingBar.clear();
        this.loadingBar.fillStyle(0x3498db, 1);
        this.loadingBar.fillRect(0, 0, 400 * value, 30);
    }

    /**
     * Инициализирует SDK Яндекс.Игр
     */
    private initYandexSDK(): void {
        this.loadingText.setText('Инициализация Яндекс.Игр...');

        if (typeof YaGames !== 'undefined') {
            YaGames.init()
                .then(ysdk => {
                    this.yaSDK = ysdk;
                    this.loadingText.setText('SDK Яндекс.Игр инициализирован');
                    this.statusText.setText('');

                    ysdk.features.LoadingAPI?.ready();

                    this.time.delayedCall(500, () => {
                        this.startGame();
                    });
                })
                .catch(error => {
                    console.error('Ошибка инициализации SDK:', error);
                    this.statusText.setText(
                        'Ошибка инициализации SDK. Игра продолжится без интеграции.'
                    );

                    this.time.delayedCall(2000, () => {
                        this.startGame();
                    });
                });
        } else {
            this.statusText.setText(
                'SDK Яндекс.Игр не обнаружен. Игра запущена в локальном режиме.'
            );

            this.time.delayedCall(2000, () => {
                this.startGame();
            });
        }
    }

    /**
     * Запускает игру после загрузки
     */
    private startGame(): void {
        this.scene.start('MenuScene', { yaSDK: this.yaSDK });
    }
}
