import Phaser from 'phaser';
import { DEFAULT_GAME_CONFIG } from './config';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';

/**
 * Основной класс игры, который инициализирует Phaser и подключает все сцены
 */
export class Game {
    private game: Phaser.Game | null = null;

    /**
     * Создает экземпляр игры и запускает ее
     * @param parent - ID элемента DOM, в котором будет создана игра
     */
    constructor(parent: string) {
        const config: Phaser.Types.Core.GameConfig = {
            ...DEFAULT_GAME_CONFIG,
            parent,
            scene: [PreloadScene, MenuScene, GameScene, LeaderboardScene],
        };

        this.game = new Phaser.Game(config);
    }

    /**
     * Возвращает экземпляр игры
     */
    public getGame(): Phaser.Game | null {
        return this.game;
    }

    /**
     * Уничтожает экземпляр игры и освобождает ресурсы
     */
    public destroy(): void {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}
