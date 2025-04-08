import Phaser from 'phaser';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GRID_SIZE = 8;
export const CELL_SIZE = 50; 

export const GRID_X = (GAME_WIDTH - GRID_SIZE * CELL_SIZE) / 2 + 100;
export const GRID_Y = (GAME_HEIGHT - GRID_SIZE * CELL_SIZE) / 2 + 30;

export const COLORS = {
  background: '#1e1e3f', // Глубокий индиго фон
  gridLines: '#7c8cde', // Яркий синий для линий сетки
  gridBackground: '#2d2b55', // Темно-фиолетовый для фона сетки
  previewBackground: '#2d2b55', // Фон для превью фигур
  previewBorder: '#7c8cde', // Рамка для превью фигур
  selectedBorder: '#ffcc00', // Яркий золотой для выбранной фигуры
  ghostValid: '#5edc1f', // Яркий зеленый для валидного размещения
  ghostInvalid: '#ff5252', // Яркий красный для невалидного размещения
  textTitle: '#ffffff', // Белый для заголовков
  textNormal: '#ffffff', // Белый для обычного текста
  textHighlight: '#ffcc00', // Яркий золотой для выделенного текста
  buttonBackground: '#4d8bf0', // Яркий синий для кнопок
  buttonHover: '#3d70cc', // Синий для кнопок при наведении
  buttonActive: '#2e5cb8', // Темно-синий для активных кнопок
  comboText: '#ffcc00', // Яркий золотой для текста комбо
  gridOverlay: 'rgba(124, 140, 222, 0.05)', // Полупрозрачный цвет для создания эффекта свечения сетки
};

export const DEFAULT_GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  parent: 'phaser-game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: []
};