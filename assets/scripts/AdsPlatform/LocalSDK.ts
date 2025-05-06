import { BaseSDk } from "./BaseSDK";

export class LocalSDK extends BaseSDk {
    public init(cb: any): void {
        cb && cb(this);
    }

    showInterstitialAds(callbacks) {
        callbacks.onOpen?.();
        callbacks.onClose?.();
        return;
    }

    showRewardedAds(callbacks) {
        callbacks.onOpen?.();
        callbacks.onRewarded?.();
        callbacks.onClose?.();
    }
}