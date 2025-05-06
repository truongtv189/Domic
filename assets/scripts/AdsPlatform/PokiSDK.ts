import { BaseSDk } from "./BaseSDK";

export class PokiSDK extends BaseSDk {
    public init(cb: any): void {
        const loadPokiSDK = () => {
            return new Promise((resolve, reject) => {
                if ((window as any).PokiSDK) {
                    resolve((window as any).PokiSDK);
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://game-cdn.poki.com/scripts/v2/poki-sdk.js";
                script.onload = () => resolve((window as any).PokiSDK);
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        loadPokiSDK().then((Poki: any) => {
            Poki.init().then(() => {
                // get remote from poki ?
                this.SDK = Poki;
                cb && cb(this);
            }).catch((error: any) => {
                // console.error("❌ Lỗi khi khởi tạo Poki SDK:", error);
            });
        });
    }

    showInterstitialAds(callbacks) {
        callbacks.onOpen?.();
        this.SDK.commercialBreak().then(() => {
            callbacks.onClose?.();
        }).catch(() => {
            callbacks.onError?.();
        });
    }

    showRewardedAds(callbacks) {
        callbacks.onOpen?.();
        this.SDK.rewardedBreak().then(() => {
            callbacks.onRewarded?.();
            callbacks.onClose?.();
        }).catch(() => {
            callbacks.onError?.();
        });
    }
}
