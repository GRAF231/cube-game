/**
 * Типы для Яндекс Игры SDK
 */

declare namespace YaGames {
  interface LeaderboardDescription {
    appId: string;
    name: string;
    title?: {
      ru: string;
      en: string;
    };
    description?: {
      ru: string;
      en: string;
    };
    imageURI?: string;
    defaultSort: 'asc' | 'desc';
  }

  interface LeaderboardEntry {
    rank: number;
    score: number;
    extraData?: string;
    player: {
      id: string;
      publicName: string;
      uniqueID: string;
      avatarURL?: string;
      scopePermissions: {
        avatar: string;
        public_name: string;
      };
    };
    formattedScore: string;
  }

  interface Leaderboard {
    getDescription(): Promise<LeaderboardDescription>;
    getEntries(
      options: {
        includeUser?: boolean;
        quantityAround?: number;
        quantityTop?: number;
      }
    ): Promise<{ entries: LeaderboardEntry[]; userRank: number }>;
    setScore(
      score: number,
      extraData?: string
    ): Promise<void>;
  }

  interface Player {
    getName(): string | null;
    getUniqueID(): string;
    getPhoto(size: 'small' | 'medium' | 'large'): string;
    getMode(): 'lite' | 'player';
    getID(): string;
    getData(keys: string[]): Promise<{[key: string]: unknown}>;
    setData(data: {[key: string]: unknown}, flush?: boolean): Promise<void>;
  }

  interface Adv {
    showFullscreenAdv(options?: { callbacks?: { onClose?: (wasShown: boolean) => void } }): void;
    showRewardedVideo(options: { callbacks: { onOpen?: () => void; onRewarded?: () => void; onClose?: () => void; onError?: (error: Error) => void; } }): void;
  }
  
  interface YandexGames {
    init(): Promise<void>;
    features: {
      LoadingAPI: {
        ready(): void;
      };
    };
    getPlayer(options?: { scopes?: boolean; signed?: boolean }): Promise<Player | null>;
    getLeaderboards(): Promise<{ getLeaderboardEntries(leaderboardName: string): Promise<Leaderboard> }>;
    isAvailableMethod(methodName: string): boolean;
    adv: Adv;
    deviceInfo: {
      type: 'desktop' | 'mobile' | 'tablet';
      isDesktop(): boolean;
      isMobile(): boolean;
      isTablet(): boolean;
    };
  }
}

declare var YaGames: {
  init(): Promise<YaGames.YandexGames>;
};