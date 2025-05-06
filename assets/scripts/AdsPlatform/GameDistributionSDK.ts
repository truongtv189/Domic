import { BaseSDk } from "./BaseSDK";

export class GameDistributionSDK extends BaseSDk {
    public init(cb: any): void {
        const loadGD_SDK = () => {
            return new Promise((resolve, reject) => {
                if ((window as any).gdsdk) {
                    resolve((window as any).gdsdk);
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://html5.api.gamedistribution.com/main.min.js";
                script.onload = () => resolve((window as any).gdsdk);
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
        loadGD_SDK().then((gdsdk: any) => {
            // console.log("✅ GameDistribution SDK đã sẵn sàng!", gdsdk);
            // load remote config from GD
            this.SDK = gdsdk;
            cb && cb(this);
        }).catch((error: any) => {
            console.error("❌ Lỗi khi tải GameDistribution SDK:", error);
        });
    }
    showInterstitialAds(callbacks) {
        if (this.isGameDistributionPlatform()) {
            if (typeof this.SDK !== "undefined" && typeof this.SDK.showAd === "function") {
                this.SDK.showAd(this.SDK.AdType.Interstitial)
                    .then(response => {
                        callbacks.onClose?.();
                    })
                    .catch(error => {
                        callbacks.onError?.();
                    });
            } else {
                callbacks.onError?.();
            }
        } else {
            // local host
            setTimeout(() => {
                callbacks.onRewarded?.(); // for test in local
                callbacks.onClose?.();
            }, 3000);
        }
    }
    showRewardedAds(callbacks) {
        if (this.isGameDistributionPlatform()) {
            if (typeof this.SDK !== "undefined" && typeof this.SDK.showAd === "function") {
                this.SDK.showAd(this.SDK.AdType.Rewarded)
                    .then((response) => {
                        callbacks.onRewarded?.();
                        callbacks.onClose?.();
                    })
                    .catch(error => {
                        callbacks.onError?.();
                    });
            } else {
                callbacks.onError?.();
            }
        } else {
            // local host
            setTimeout(() => {
                callbacks.onRewarded?.(); // for test in local
                callbacks.onClose?.();
            }, 3000);
        }
    }
    isGameDistributionPlatform(): boolean {
        return typeof this !== "undefined" && window.location.href.includes("gamedistribution");
    }
}
