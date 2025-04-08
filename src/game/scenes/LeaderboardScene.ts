import { BaseScene } from './BaseScene';
import { GAME_WIDTH } from '../config';

export class LeaderboardScene extends BaseScene {
  private yaSDK: YaGames.YandexGames | null = null;
  private leaderboardEntries: YaGames.LeaderboardEntry[] = [];
  private isLoading: boolean = true;
  private errorMessage: string = '';

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  init(data: { yaSDK?: YaGames.YandexGames }): void {
    this.yaSDK = data.yaSDK || null;
    this.errorMessage = '';
    this.leaderboardEntries = [];
  }

  create(): void {
    this.createTitle('Таблица лидеров');

    this.createTextButton(120, 40, 'Назад', () => {
      this.scene.start('MenuScene', { yaSDK: this.yaSDK });
    }, 20);

    this.loadLeaderboard();
  }

  /**
   * Загружает данные таблицы лидеров из Яндекс SDK
   */
  private async loadLeaderboard(): Promise<void> {
    const loadingText = this.add.text(
      GAME_WIDTH / 2,
      250,
      'Загрузка...',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    try {
      if (!this.yaSDK) {
        throw new Error('SDK не доступен');
      }

      const leaderboard = await this.yaSDK.getLeaderboards()
        .then(lb => lb.getLeaderboardEntries('tetris_score'));

      const data = await leaderboard.getEntries({
        includeUser: true,
        quantityTop: 10,
        quantityAround: 3
      });

      this.leaderboardEntries = data.entries;
      this.isLoading = false;
      loadingText.destroy();
      this.displayLeaderboard();
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      loadingText.destroy();
      this.displayError();
    }
  }

  /**
   * Отображает таблицу лидеров
   */
  private displayLeaderboard(): void {
    if (this.leaderboardEntries.length === 0) {
      this.add.text(
        GAME_WIDTH / 2,
        250,
        'Нет данных для отображения',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffffff'
        }
      ).setOrigin(0.5);
      return;
    }

    this.add.text(
      200,
      120,
      'Место',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#f1c40f',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.add.text(
      400,
      120,
      'Игрок',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#f1c40f',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.add.text(
      600,
      120,
      'Очки',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#f1c40f',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    const startY = 160;
    const rowHeight = 40;

    this.leaderboardEntries.forEach((entry, index) => {
      const y = startY + index * rowHeight;
      const isCurrentUser = entry.player.scopePermissions?.public_name === 'allow';
      const rowColor = isCurrentUser ? '#3498db' : '#ffffff';

      this.add.text(
        200,
        y,
        `${entry.rank || index + 1}`,
        {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: rowColor
        }
      ).setOrigin(0.5);

      const name = entry.player.publicName || 'Игрок';
      this.add.text(
        400,
        y,
        name,
        {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: rowColor
        }
      ).setOrigin(0.5);

      this.add.text(
        600,
        y,
        `${entry.score}`,
        {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: rowColor
        }
      ).setOrigin(0.5);
    });
  }

  /**
   * Отображает сообщение об ошибке
   */
  private displayError(): void {
    this.add.text(
      GAME_WIDTH / 2,
      250,
      `Ошибка загрузки: ${this.errorMessage}`,
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#e74c3c'
      }
    ).setOrigin(0.5);

    this.createTextButton(
      GAME_WIDTH / 2,
      320,
      'Повторить',
      () => {
        this.scene.restart({ yaSDK: this.yaSDK });
      }
    );
  }
}