import { _decorator, Component, ProgressBar, Label, director, Sprite, resources, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {
    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    @property(Label)
    progressLabel: Label = null!;

    @property(Sprite)
    targetSprite: Sprite = null!;

    private static instance: LoadingCtrl = null!;
    private currentSpriteFrame: SpriteFrame = null!;

    onLoad() {
        // Ensure only one instance exists
        if (LoadingCtrl.instance) {
            this.node.destroy();
            return;
        }
        LoadingCtrl.instance = this;
        this.loadRandomSprite();
    }

    loadRandomSprite() {
        resources.loadDir('Loading', SpriteFrame, (err, assets) => {
            if (err || !assets || assets.length === 0) {
                console.warn('[LoadingCtrl] Failed to load loading sprites');
                return;
            }

            // Chọn ngẫu nhiên một sprite frame
            const randomIndex = Math.floor(Math.random() * assets.length);
            const randomSprite = assets[randomIndex];
            
            if (this.targetSprite && randomSprite) {
                // Lưu sprite mới
                this.currentSpriteFrame = randomSprite;
                // Chỉ cập nhật sprite khi đã có sprite mới
                this.targetSprite.spriteFrame = this.currentSpriteFrame;
            }
        });
    }

    updateProgress(value: number) {
        if (this.progressBar) {
            this.progressBar.progress = value;
            this.progressLabel.string = `${Math.floor(value * 100)}%`;
        }
    }

    onDestroy() {
        if (LoadingCtrl.instance === this) {
            LoadingCtrl.instance = null!;
        }
        this.unscheduleAllCallbacks();
    }
}

