import Phaser from 'phaser';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GRID_SIZE = 8;
export const CELL_SIZE = 50; 

export const GRID_X = (GAME_WIDTH - GRID_SIZE * CELL_SIZE) / 2 + 100;
export const GRID_Y = (GAME_HEIGHT - GRID_SIZE * CELL_SIZE) / 2 + 30;

// Стильная тёмная цветовая схема с умеренным свечением
export const COLORS = {
  background: '#1a1a2e', // Глубокий тёмно-синий фон
  gridLines: '#457b9d', // Приглушенный голубой для линий сетки
  gridBackground: '#242440', // Тёмно-синий для фона сетки
  previewBackground: '#242440', // Фон для превью фигур
  previewBorder: '#457b9d', // Приглушенный голубой для рамки превью фигур
  selectedBorder: '#f9a826', // Тёплый оранжевый для выбранной фигуры
  ghostValid: '#43aa8b', // Приглушенный зелёный для валидного размещения
  ghostInvalid: '#c1121f', // Приглушенный красный для невалидного размещения
  textTitle: '#ffffff', // Белый для заголовков
  textNormal: '#e0e1dd', // Светло-серый для обычного текста
  textHighlight: '#f9a826', // Тёплый оранжевый для выделенного текста
  buttonBackground: '#385170', // Приглушенный синий для кнопок
  buttonHover: '#4d6a91', // Более светлый синий для кнопок при наведении
  buttonActive: '#2a3f5a', // Более тёмный синий для активных кнопок
  comboText: '#f9a826', // Тёплый оранжевый для текста комбо
  gridOverlay: 'rgba(69, 123, 157, 0.05)', // Полупрозрачный голубой для создания эффекта свечения сетки

  // Цвета фигур (яркие, но не неоновые)
  shapes: [
    '#457b9d', // Приглушенный голубой
    '#e07a5f', // Терракотовый
    '#f9a826', // Тёплый оранжевый
    '#43aa8b', // Приглушенный зелёный
    '#a7489b', // Пурпурный
    '#3d5a80', // Тёмно-синий
    '#588157', // Тёмно-зелёный
    '#d68c45'  // Янтарный
  ]
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