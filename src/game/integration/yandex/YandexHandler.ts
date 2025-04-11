import { GameScene } from '../../scenes/GameScene';

export class GameSceneYandexHandler {
    private scene: GameScene;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    /**
     * Показывает рекламу для получения бонусных блоков.
     * (Перенесено из GameSceneNew)
     */
    public showAdForBonusBlocks(onCloseCallback: () => void): void {
        if (!this.scene.yaSDK) {
            console.warn('Yandex SDK не инициализирован.');
            onCloseCallback();
            return;
        }

        if (!this.scene.yaSDK.isAvailableMethod('adv.showRewardedVideo')) {
            console.warn('Метод adv.showRewardedVideo недоступен.');
            onCloseCallback();
            return;
        }

        console.log('Попытка показать Rewarded Video Ad (через YandexHandler)');
        this.scene.yaSDK.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => console.log('Video ad opened.'),
                onRewarded: () => {
                    console.log('Video ad rewarded! Calling scene handler.');
                    this.scene.handleAdReward();
                },
                onClose: () => {
                    console.log('Video ad closed.');
                    onCloseCallback();
                },
                onError: error => {
                    console.error('Rewarded Video ad error:', error);
                    onCloseCallback();
                },
            },
        });
    }

    public destroy(): void {
        console.log('GameSceneYandexHandler destroyed');
    }
}
