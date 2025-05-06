
export class BaseSDk {
    public SDK: any = null;
    public playerData: any = null;


    public initSDK(cb): void { }
    public showInterstitialAds(cb) { };
    public showRewardedAds(cb) { };
    public getPlatformLanguage() { };
    public gameplayAPIStart() { };
    public gameplayAPIStop() { };

    public async loginPlayer() { };
    public async checkAuth(): Promise<boolean> { return false };

    public async checkShowShortcut(cb): Promise<void> { };
    public async checkShowRating(cb): Promise<void> { };

    public async getData(): Promise<any> { return false };
    public async setData(): Promise<any> { return false };

    public async getTopPlayers(): Promise<any> { };
    public async getPlayerRank(): Promise<any> { };
    public async updatePlayerScore(score): Promise<any> { };

    public hasPlatform(): boolean {
        if (typeof this.SDK == "undefined") {
            return false;
        }
        return true;
    }
}
