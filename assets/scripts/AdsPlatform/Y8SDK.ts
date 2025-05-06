import { BaseSDk } from "./BaseSDK";

export class Y8SDK extends BaseSDk {
    public init(cb): void {
        const loadY8SDK = () => {
            return new Promise((resolve, reject) => {
                if ((window as any).y8) {
                    resolve((window as any).y8);
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://cdn.y8.com/y8-stats.min.js";
                script.onload = () => resolve((window as any).y8);
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
        loadY8SDK().then((y8: any) => {
            // console.log("✅ Y8 SDK đã sẵn sàng!", y8);
            // load remote config from Y8
            this.SDK = y8;
            cb && cb(this);
            this.showInterstitialAds({});
        }).catch((error: any) => {
            // console.error("❌ Lỗi khi tải Y8 SDK:", error);
        });
    }

    showInterstitialAds(callbacks) {
        callbacks.onOpen?.();
        if (this.SDK) {
            this.SDK.ads.showInterstitial();
            callbacks.onClose?.();
        } else {
            callbacks.onError?.();
        }

    }
    showRewardedAds(callbacks) {
        if (this.SDK) {
            callbacks.onOpen?.();
            this.SDK.ads.showRewarded({
                onCompleted: () => callbacks.onRewarded?.(),
                onError: (error: any) => callbacks.onError?.(),
                onClose: () => callbacks.onClose?.(),
            });
        }
    }
}
