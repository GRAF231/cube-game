# Интеграция с Яндекс.Играми

## Обзор

Проект "Тетрис-блоки" интегрирован с платформой Яндекс.Игры, что обеспечивает доступ к таким функциям, как таблицы лидеров, реклама, аналитика и получение данных игрока. Интеграция реализована с использованием официального SDK Яндекс.Игр, который загружается и инициализируется при запуске игры.

## Интеграция с SDK Яндекс.Игр

### Инициализация SDK

Инициализация SDK происходит в `PreloadScene.ts`. Процесс инициализации включает:

1. Проверку доступности объекта `YaGames`
2. Загрузку и инициализацию SDK
3. Вызов `LoadingAPI.ready()` для сигнализации о готовности игры
4. Передачу инициализированного SDK в другие сцены

```typescript
// Пример из PreloadScene.ts
private initYandexSDK(): void {
  if (typeof YaGames !== 'undefined') {
    YaGames.init()
      .then((yaGames) => {
        this.yaSDK = yaGames;
        // Сигнализируем, что игра загружена
        yaGames.features.LoadingAPI?.ready();
        // Переходим в меню с передачей SDK
        this.scene.start('MenuScene', { yaSDK: this.yaSDK });
      })
      .catch((error) => {
        console.error('Ошибка инициализации Яндекс SDK:', error);
        // Переходим в меню без SDK
        this.scene.start('MenuScene');
      });
  } else {
    console.warn('YaGames не определен, запуск в режиме разработки');
    // Переходим в меню без SDK
    this.scene.start('MenuScene');
  }
}
```

### Получение данных игрока

В `MenuScene.ts` происходит получение данных о пользователе для персонализации игры:

1. Проверка доступности метода `getPlayer`
2. Получение имени игрока и других данных
3. Отображение этих данных в интерфейсе

### Показ рекламы

В проекте используются два типа рекламы:

1. **Полноэкранная реклама** в `MenuScene.ts`:
   - Показывается между раундами или при переходе между сценами
   - Используется метод `adv.showFullscreenAdv()`

2. **Rewarded-реклама** в `GameSceneYandexHandler.ts`:
   - Показывается по запросу игрока для получения бонусных фигур
   - Используется метод `adv.showRewardedVideo()`
   - После успешного просмотра игрок получает 3 бонусных одиночных блока

```typescript
// Пример показа rewarded-рекламы
public showAdForBonusBlocks(callback?: () => void): void {
  if (!this.gameScene.yaSDK || !this.gameScene.yaSDK.adv) {
    console.warn('YaSDK или adv API недоступны');
    return;
  }

  this.gameScene.yaSDK.adv.showRewardedVideo({
    callbacks: {
      onOpen: () => {
        console.log('Видеореклама открыта');
      },
      onRewarded: () => {
        console.log('Награда за рекламу получена');
      },
      onClose: () => {
        console.log('Видеореклама закрыта');
        this.gameScene.handleAdReward();
        if (callback) callback();
      },
      onError: (e) => {
        console.error('Ошибка при показе видеорекламы:', e);
      }
    }
  });
}
```

## Таблицы лидеров

Интеграция с таблицами лидеров реализована в `LeaderboardScene.ts`:

1. Загрузка данных таблицы лидеров с использованием `getLeaderboards` и `getLeaderboardEntries`
2. Отображение результатов в виде таблицы
3. Обработка возможных ошибок при загрузке данных
4. Возможность обновления таблицы

```typescript
// Пример загрузки таблицы лидеров
private loadLeaderboard(): void {
  if (!this.yaSDK || !this.yaSDK.leaderboards) {
    this.showError('Таблица лидеров недоступна');
    return;
  }

  this.yaSDK.leaderboards.getLeaderboards()
    .then(data => {
      // Используем стандартную таблицу лидеров
      const leaderboardName = 'some_leaderboard_name';
      
      this.yaSDK?.leaderboards.getLeaderboardEntries(leaderboardName, {
        includeUser: true,
        quantityTop: 10,
        quantityAround: 3
      })
      .then(entries => {
        this.displayLeaderboard(entries);
      })
      .catch(error => {
        this.showError('Ошибка загрузки данных');
        console.error(error);
      });
    })
    .catch(error => {
      this.showError('Ошибка загрузки таблицы лидеров');
      console.error(error);
    });
}
```

## Аналитика

Игра отправляет события аналитики в Яндекс.Метрику для отслеживания игрового процесса и поведения пользователей:

1. Отслеживание начала и завершения игры
2. Отслеживание просмотра рекламы
3. Отслеживание получения бонусов
4. Сбор статистики по очкам и времени игры

## Модуль GameSceneYandexHandler

Для удобства работы с Яндекс SDK в основной игровой сцене выделен отдельный класс `GameSceneYandexHandler`, который инкапсулирует всю логику взаимодействия с SDK:

1. Показ rewarded-рекламы
2. Обработка получения награды
3. Сохранение и загрузка данных игрока

```typescript
// Структура GameSceneYandexHandler
export class GameSceneYandexHandler {
  private gameScene: GameScene;
  
  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
  }
  
  // Метод для показа рекламы
  public showAdForBonusBlocks(callback?: () => void): void {
    // ...
  }
  
  // Другие методы для работы с SDK
  
  // Освобождение ресурсов
  public destroy(): void {
    // ...
  }
}
```

## Особенности реализации

1. **Обработка отсутствия SDK**: Игра корректно работает даже при отсутствии Яндекс SDK, что важно для локальной разработки и тестирования
2. **Проверка доступности методов**: Перед вызовом любых методов SDK проводится проверка их доступности через `isAvailableMethod`
3. **Обработка ошибок**: Все взаимодействия с SDK обернуты в try-catch блоки для корректной обработки возможных ошибок
4. **Разделение ответственности**: Логика взаимодействия с SDK выделена в отдельные классы и методы, что улучшает поддерживаемость кода

## Рекомендации по расширению интеграции

1. Добавить более детальную аналитику игрового процесса
2. Реализовать сохранение прогресса игрока через Яндекс.SDK
3. Внедрить социальные функции (приглашение друзей, поделиться результатом)
4. Настроить события для управления рекламой (не показывать рекламу слишком часто)
5. Реализовать мультиязычность с автоопределением языка через Яндекс.SDK