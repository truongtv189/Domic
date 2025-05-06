import { YandexSDK } from "./YandexSDK";
import { CrazyGamesSDK } from "./CrazyGamesSDK";
import { GameDistributionSDK } from "./GameDistributionSDK";
import { PokiSDK } from "./PokiSDK";
import { Y8SDK } from "./Y8SDK";
import { LocalSDK } from "./LocalSDK";
import { sys } from "cc";
import { GamePlatform } from "../GameDefines";

//import SharePopupController from "./SharePopupController";
declare const ysdk: any;
const AdsConfig = {
    timeLimitShowBanner: 30000,
};
declare const FBInstant: any;
declare global {
    interface Window {
        FBInstant: any
    }
}
var AdsManager = {
    platformSDK: null,
    type: -1,

    hasBannerAds: 0,
    allowShowFirstAds: false,
    showFistAds: false,
    loadedInterstitials: 0,
    loadedRewars: 0,
    lastShowAdsTime: 0,
    lastShowRewardTime: 0,
    _interstitialLevel: 0,
    _rewardedLevel: 0,

    initPlatform(type, cb: Function): void {
        let sdk = null;
        let initSDKComplete = function (sdk) {
            AdsManager.setAdsPlatform(sdk, type);
            cb?.();
        }

        switch (type) {
            case GamePlatform.YANDEX:
                sdk = new YandexSDK();
                break;
            case GamePlatform.CRAZYGAMES:
                sdk = new CrazyGamesSDK();
                break;
            case GamePlatform.GAMEDISTRIBUTION:
                sdk = new GameDistributionSDK();
                break;
            case GamePlatform.POKI:
                sdk = new PokiSDK();
                break;
            case GamePlatform.Y8:
                sdk = new Y8SDK();
                break;
            case GamePlatform.COOLMATHGAMES:
                break;
            case GamePlatform.FACEBOOK:
                break;
            case GamePlatform.LOCAL:
                sdk = new LocalSDK();
                break;
        }

        sdk.init(initSDKComplete);
    },

    setAdsPlatform: function (plf, type) {
        AdsManager.platformSDK = plf;
        AdsManager.type = type;
    },

    getPlatformType: function () {
        return AdsManager.type;
    },

    // BANNER
    isDisplayBanner: function () { // for setup UI game
        return false;
    },
    canShowBanner: function () {
        if ((!AdsManager.hasBannerAds || AdsManager.hasBannerAds + AdsConfig.timeLimitShowBanner < new Date().getTime())) {
            return true;
        }
        return false;
    },
    interBanner: 0,
    showBanner(cb: any = null, cberr: any = null) {

    },
    hideBannerAds(cb) {
        ysdk.adv.hideBannerAdv();
        if (cb) {
            cb();
        }
    },
    _currentCrossBanner: {
        home: null,
        game: null
    },
    loadCrossBanner() {

    },
    hideCrossBanner() {

    },
    handleBanner(callback: any = null) {
        if (AdsManager.platformSDK.hasPlatform()) {
            ysdk.adv.getBannerAdvStatus().then(({ stickyAdvIsShowing, reason }) => {
                if (stickyAdvIsShowing) {
                    // ad is shown
                    callback(true);
                } else if (reason) {
                    // ad isn't shown
                    // console.log(reason);
                    callback(false);
                } else {
                    ysdk.adv.showBannerAdv();
                    if (callback) {
                        callback(true);
                    }

                }
            })
        }
    },

    // INTERTIAL
    interTial: 0,
    attempLoadTial: 0,
    tryPreloadInterTime: [2000, 5000, 10000, 20000],
    isLoadingIntertial: false,
    preloadInterstitial: function (cb: any = null, cberr: any = null, trying = false) {

    },
    canShowInterstitial: function () {

        if (!AdsManager.platformSDK.hasPlatform()) return false;

        var currentTime = new Date().getTime();
        if (AdsManager.lastShowAdsTime <= currentTime) {
            return true;
        } else {
            return false;
        }
    },

    hasInterstitial: function () {
        return AdsManager.loadedInterstitials > 0;
    },

    showInterstitial: function (callback: Function = null) {
        //PopupController.instance.videoLoading.open(); // hide loading on open ads callback
        if (!AdsManager.canShowInterstitial()) {
            AdsManager.onShowing = true;
            setTimeout(function () {
                //PopupController.instance.videoLoading.close();
                AdsManager.onShowing = false;
                AdsManager.lastShowAdsTime = new Date().getTime() + 60000;
            }, 1000);
            return;
        }

        AdsManager.onShowing = true;
        const callbacks = {
            onOpen: () => {
                AdsManager.onShowing = true;
                //PopupController.instance.videoLoading.close();
            },
            onClose: () => {
                AdsManager.onShowing = false;
                //PopupController.instance.videoLoading.close();
                AdsManager.lastShowAdsTime = new Date().getTime() + 60000;
                if (callback) {
                    callback(true);
                }
            },
            onError: () => {
                //PopupController.instance.videoLoading.close();
                AdsManager.onShowing = false;
                if (callback) {
                    callback(false);
                }
            }
        }
        AdsManager.platformSDK.showInterstitialAds(callbacks);
    },

    // REWARD

    interReward: 0,
    attempLoadReward: 0,
    tryPreloadRewardTime: [2000, 5000, 10000, 20000],
    isLoadingReward: false,

    onShowing: false,
    _onRewarded: false,

    preloadReward: function (cb: any = null, cberr: any = null, trying = false) {

    },

    hasReward: function () {
        return AdsManager.loadedRewars > 0;
    },

    canShowReward: function () {
        if (!AdsManager.platformSDK.hasPlatform()) return false;
        var currentTime = new Date().getTime();
        if (AdsManager.lastShowRewardTime <= currentTime) {
            return true;
        } else {
            return false;
        }
    },
    getLanguage() {
        return AdsManager.platformSDK.getPlatformLanguage();
    },

    showRewarded: function (callback: Function = null) {
        AdsManager._onRewarded = false; // set true on open ads callback
        //PopupController.instance.videoLoading.open(); // hide loading on open ads callback
        if (!AdsManager.canShowReward()) {
            AdsManager.onShowing = true;
            setTimeout(function () {
                //PopupController.instance.videoLoading.close();
                AdsManager.onShowing = false;
                callback?.(false);
            },0);
            return;
        }
        // call show
        const callbacks = {
            onOpen: () => {
                AdsManager.onShowing = true;
                //PopupController.instance.videoLoading.close();
                // console.log('Video ad open.');
            },
            onRewarded: () => {
                // console.log('Video onRewarded');
                AdsManager._onRewarded = true;
            },
            onClose: () => {
                AdsManager.onShowing = false;
                //PopupController.instance.videoLoading.close();
                if (AdsManager._onRewarded) {
                    // AdsManager.lastShowAdsTime = new Date().getTime() + 10 * 1000;
                    // AdsManager.lastShowRewardTime = new Date().getTime() + 60000;
                    callback?.(true);
                } else {
                    callback?.(false);
                }
            },
            onError: () => {
                // PopupController.instance.videoLoading.close();
                AdsManager.onShowing = false;
                callback?.(false);
            }
        }
        AdsManager.platformSDK.showRewardedAds(callbacks);
    },

    GameplayAPIStart(): void {
        AdsManager.platformSDK.gameplayAPIStart();
    },
    GameplayAPIStop(): void {
        AdsManager.platformSDK.gameplayAPIStop();
    },
    CheckShowShortcut() {
        let logShowShortcut = function () {
            sys.localStorage.setItem("PTShowShortcuted", 1);
        }

        let isShowed = sys.localStorage.getItem("PTShowShortcuted", 0);
        if (isShowed == 1) return;
        AdsManager.platformSDK.checkShowShortcut(logShowShortcut);
    },

    CheckShowRating() {
        let logShowRating = function () {
            sys.localStorage.setItem("PTShowRating", 1);
        }

        let isShowed = sys.localStorage.getItem("PTShowRating", 0);
        if (isShowed == 1) return;
        AdsManager.platformSDK.checkShowRating().then((canCreate) => {
            if (canCreate) {
                AdsManager.platformSDK.checkShowRating(logShowRating);
            }
        });
    },

    GetDataLeaderboard() {
        if (!this.SDK) return;
        AdsManager.platformSDK.getTopPlayers().then((entries) => {
            entries.forEach((entry, index) => {
                // console.log(`#${index + 1} ${entry.player.publicName}: ${entry.score} sao`);
            });
        });
        let playerRank = AdsManager.platformSDK.getPlayerRank();

    }
};

export default AdsManager;
