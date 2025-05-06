// import { GameDataManager } from "../GameDataManager";
import { BaseSDk } from "./BaseSDK";

export class YandexSDK extends BaseSDk {
    private static _instance: YandexSDK;
    public static get instance(): YandexSDK {
        if (!this._instance) {
            this._instance = new YandexSDK();
        }
        return this._instance;
    }
    private LeaderBoardKey = "LeaderBoardKey";
   
    public init(cb): void {
        const loadYandexSDK = () => {
            return new Promise((resolve, reject) => {
                if ((window as any).YaGames) {
                    resolve((window as any).YaGames);
                    return;
                }
                const script = document.createElement("script");
                script.src = "/sdk.js"; // Yandex sẽ tự cấp file này khi chạy trên Graft
                script.onload = () => resolve((window as any).YaGames);
                script.onerror = (err) => {
                    // console.error("❌ Lỗi khi tải Yandex SDK:", err);
                    reject(err);
                };
                document.head.appendChild(script);
            });
        };

        loadYandexSDK().then((YaGames: any) => {
            if (!YaGames) {
                // console.error("❌ YaGames không được định nghĩa!");
                return;
            }
            YaGames.init()
                .then(ysdk => {
                    this.SDK = ysdk;
                    // GameDataManager.fetchRemoteConfig(()=>{
                        cb && cb(this);
                        // console.log("✅ Yandex SDK đã sẵn sàng!");
                        this.showInterstitialAds({});
                        // ysdk.features.LoadingAPI?.ready();
                    // });
                })
                .catch((error: any) => {
                    // console.error("❌ Lỗi khi khởi tạo Yandex SDK:", error);
                });
        }).catch((error: any) => {
            // 
            // console.error("❌ Lỗi tải SDK:", error);
        });
        
    }
    public notifyLoadingReady(): void {
        if (this.SDK?.features?.LoadingAPI) {
            this.SDK.features.LoadingAPI.ready();
        }
    }
    public showInterstitialAds(cb) {
        if (this.isYandexPlatform()) {
            if (typeof this.SDK.adv != "undefined") {
                this.SDK.adv.showFullscreenAdv({
                    callbacks: {
                        onOpen: () => cb.onOpen?.(),
                        onClose: () => {
                            cb.onClose?.();
                        },
                        onError: (err: any) => cb.onError?.(),
                    }
                });
            } else {
                cb.onError?.();
            }
        } else {
            // local host
            setTimeout(() => {
                cb.onRewarded?.(); // for test in local
                cb.onClose?.();
            }, 3000);
        }
    }
    

    public showRewardedAds(cb) {
        if (this.isYandexPlatform()) {
            if (typeof this.SDK.adv != "undefined") {
                this.SDK.adv.showRewardedVideo({
                    callbacks: {
                        onOpen: () => cb.onOpen?.(),
                        onRewarded: () => cb.onRewarded?.(),
                        onClose: () => cb.onClose?.(),
                        onError: () => cb.onError?.()
                    }
                });
            } else {
                cb.onError?.();
            }
        } else {
            // local host
            setTimeout(() => {
                cb.onRewarded?.(); // for test in local
                cb.onClose?.();
            }, 3000);

        }
    }
    public isYandexPlatform(): boolean {
        return true;
    }

    public getPlatformLanguage(): any {
        if (typeof this.SDK != "undefined") {
            let language = this.SDK.environment.i18n.lang;
            // console.log("detect_ysdk_language " + language);
            return language;
        }
    }

    public gameplayAPIStart(): void {
        if (typeof this.SDK != "undefined") {
            this.SDK.features.GameplayAPI.start();
        }
    }

    public gameplayAPIStop(): void {
        this.SDK.features.GameplayAPI.stop();
    }
    public async getData(): Promise<any> {
        if (!this.SDK) return null;

        try {
            const player = await this.SDK.getPlayer();
            const data = await player.getData();
            // console.log("Dữ liệu tải về:", data);
            this.playerData = player;
            return data;
        } catch (error) {
            // console.log("Lỗi khi tải dữ liệu:", error);
            return null;
        }
    }

    public async setData(): Promise<any> {
        if (!this.SDK) return;

        try {
            const player = await this.SDK.getPlayer();
            await player.setData(this.playerData);
            // console.log("Dữ liệu đã lưu:", this.playerData);
        } catch (error) {
            // console.log("Lỗi khi lưu dữ liệu:", error);
        }
    }

    public async LoginPlayer(): Promise<void> {
        if (typeof this.SDK == "undefined") return;

        try {
            const player = await this.SDK.getPlayer({ scopes: true }); // Yêu cầu quyền truy cập
            // console.log("Đã đăng nhập:", player.getName());
            // console.log("ID:", player.getUniqueID());
            this.playerData = player;
            // console.log(this.playerData);
        } catch (error) {
            // console.log("Người chơi từ chối đăng nhập", error);
        }
    }

    public async checkAuth(): Promise<boolean> {
        if (!this.SDK) return false;

        try {
            const player = await this.SDK.getPlayer();
            if (player.isAuthorized()) {
                this.playerData = player;
            } else {
                this.LoginPlayer();
            }
        } catch (error) {
            return false;
        }
    }

    public async getTopPlayers(): Promise<any> {
        if (!this.SDK) return;
        try {
            const leaderboard = await this.SDK.getLeaderboards().getLeaderboardEntries(this.LeaderBoardKey, {
                quantityTop: 10, // Lấy top 10
            });

            // console.log("Bảng xếp hạng:", leaderboard.entries);
            return leaderboard.entries;
        } catch (error) {
            // console.log("Lỗi khi lấy leaderboard:", error);
            return [];
        }
    }
    public async getPlayerRank(): Promise<any> {
        if (!this.SDK) return;
        try {
            const playerEntry = await this.SDK.getLeaderboards().getLeaderboardPlayerEntry(this.LeaderBoardKey);
            // console.log(`Bạn đang xếp hạng #${playerEntry.rank} với ${playerEntry.score} sao`);
            return playerEntry;
        } catch (error) {
            // console.log("Lỗi khi lấy hạng của người chơi:", error);
            return null;
        }
    }

    public async updatePlayerScore(score: number): Promise<boolean> {
        if (!this.SDK) return false;

        try {
            const leaderboards = this.SDK.getLeaderboards();

            let playerEntry = await leaderboards.getLeaderboardPlayerEntry(this.LeaderBoardKey).catch(() => null);

            if (playerEntry) {
                if (score <= playerEntry.score) {
                    return false;
                }
            }
            await leaderboards.setLeaderboardScore(this.LeaderBoardKey, score);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async checkShowShortcut(cb): Promise<void> {
        if (!this.SDK) return;

        try {
            const result = await this.SDK.shortcut.canShowPrompt();
            // console.log("Có thể hiển thị yêu cầu tạo shortcut:", result);
            if (result) {
                try {
                    const result = await this.SDK.shortcut.showPrompt();
                    if (result) {
                        // console.log("Shortcut đã được tạo thành công!");
                    } else {
                        // console.log("Người dùng đã từ chối tạo shortcut.");
                    }
                    cb?.();
                } catch (error) {
                    // console.log("Lỗi khi tạo shortcut:", error);
                }
            }
        } catch (error) {
            // console.log("Lỗi khi kiểm tra shortcut:", error);
        }
    }

    public async checkShowRating(cb): Promise<void> {
        if (!this.SDK) return;

        try {
            const result = await this.SDK.feedback.canReview();
            if (result) {
                // console.log("Có thể hiển thị đánh giá:", result);
                try {
                    const result = await this.SDK.feedback.requestReview();
                    if (result) {
                        // console.log("Người chơi đã đánh giá game!");
                    } else {
                        // console.log("Người chơi đã từ chối đánh giá.");
                    }
                    cb?.();
                } catch (error) {
                    // console.log("Lỗi khi hiển thị đánh giá:", error);
                }
            }
        } catch (error) {
            // console.log("Lỗi khi kiểm tra rating:", error);
        }
    }
}