import { BaseScene } from './BaseScene';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MenuScene extends BaseScene {
  private yaSDK: YaGames.YandexGames | null = null;
  private playerName: string = 'Игрок';

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data: { yaSDK?: YaGames.YandexGames, reset?: boolean }): void {
    this.yaSDK = data.yaSDK || null;

    if (this.yaSDK) {
      this.yaSDK.getPlayer()
        .then(player => {
          if (player) {
            this.playerName = player.getName() || 'Игрок';
          }
        })
        .catch(error => {
          console.error('Ошибка получения данных игрока:', error);
        });
    }
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1e1e3f, 1).setOrigin(0);
    
    const midLayer = this.add.rectangle(0, GAME_HEIGHT/2 - 150, GAME_WIDTH, 300,
      0x2d2b55, 0.7).setOrigin(0);
    
    this.tweens.add({
      targets: midLayer,
      alpha: { from: 0.7, to: 0.9 },
      duration: 3000,
      yoyo: true,
      repeat: -1
    });
    
    this.createStarryBackground();

    const title = this.createTitle('Тетрис-блоки');
    title.setY(120);
    
    title.setShadow(0, 0, '#ffcc00', 8, true, true);

    this.add.text(GAME_WIDTH / 2, 220, `Привет, ${this.playerName}!`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const buttonY = 300;
    const buttonSpacing = 70;

    const playButton = this.createTextButton(
      GAME_WIDTH / 2,
      buttonY,
      'Играть',
      () => {
        this.scene.start('GameScene', { yaSDK: this.yaSDK });
      }
    );

    let leaderboardButton;
    if (this.yaSDK && this.yaSDK.isAvailableMethod('getLeaderboards')) {
      leaderboardButton = this.createTextButton(
        GAME_WIDTH / 2,
        buttonY + buttonSpacing,
        'Таблица лидеров',
        () => {
          this.scene.start('LeaderboardScene', { yaSDK: this.yaSDK });
        }
      );
    }

    const howToPlayButton = this.createTextButton(
      GAME_WIDTH / 2,
      buttonY + buttonSpacing * (this.yaSDK ? 2 : 1),
      'Как играть',
      () => {
        this.showHowToPlayModal();
      }
    );

    this.add.text(
      GAME_WIDTH - 10,
      GAME_HEIGHT - 10,
      'Версия 1.0.0',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#95a5a6'
      }
    ).setOrigin(1, 1);

    const buttons = [playButton];
    if (leaderboardButton) buttons.push(leaderboardButton);
    buttons.push(howToPlayButton);
    
    buttons.forEach(button => {
      button.on('pointerover', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          ease: 'Sine.easeOut'
        });
      });
      
      button.on('pointerout', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: 'Sine.easeOut'
        });
      });
    });

    if (this.yaSDK && this.yaSDK.isAvailableMethod('adv.showFullscreenAdv')) {
      this.time.delayedCall(1000, () => {
        this.yaSDK?.adv.showFullscreenAdv({
          callbacks: {
            onClose: (wasShown: boolean) => {
              console.log('Баннерная реклама закрыта, показана:', wasShown);
            }
          }
        });
      });
    }

    const textButtons = this.children.list.filter(
      child => child instanceof Phaser.GameObjects.Text &&
      child.style &&
      child.style.backgroundColor
    );
    
    textButtons.forEach(button => {
      button.on('pointerover', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          ease: 'Sine.easeOut'
        });
      });
      
      button.on('pointerout', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: 'Sine.easeOut'
        });
      });
    });
  }

  /**
   * Создает звездное небо на фоне меню
   */
  private createStarryBackground(): void {
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 2);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.3),
        duration: Phaser.Math.Between(1000, 3000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
    
    for (let i = 0; i < 3; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const size = Phaser.Math.Between(80, 120);
      
      const circle = this.add.circle(x, y, size, 0x7c8cde, 0.05);
      
      this.tweens.add({
        targets: circle,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0.02,
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
    
    const glow = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0);
    glow.setStrokeStyle(30, 0x7c8cde, 0.1);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0, to: 0.2 },
      duration: 4000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Показывает модальное окно с инструкциями
   */
  private showHowToPlayModal(): void {
    const text = 
      '1. Выбирайте одну из трех доступных фигур.\n\n' +
      '2. Размещайте фигуры на игровом поле 8x8.\n\n' +
      '3. Заполняйте полностью ряды или столбцы, чтобы очистить их и получить очки.\n\n' +
      '4. Получайте бонусы за комбо и большие очищенные области.\n\n' +
      '5. Игра заканчивается, когда невозможно разместить ни одну из доступных фигур.';

    const modal = this.createModal('Как играть', text, [
      {
        text: 'Понятно',
        callback: () => {
          modal.close();
        }
      }
    ]);
  }
}