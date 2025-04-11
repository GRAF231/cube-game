/**
 * Единая точка входа для UI компонентов
 */

// Компоненты
export { GridComponent } from './components/GridComponent';

// Менеджеры
export { GameSceneUIManager as UIManager } from './managers/UIManager';
export { GameSceneUIScoreDisplay as ScoreDisplay } from './managers/score/ScoreDisplay';
export { GameSceneUIShapePreview as ShapePreview } from './managers/preview/ShapePreview';
export { GameSceneUIBackground as UIBackground } from './managers/background/UIBackground';

// Анимация
export { GameSceneAnimator as Animator } from './animation/Animator';

// Эффекты
export { GameSceneBackground as Background } from './effects/Background';
