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
    private static frames: SpriteFrame[] = [];
    private static currentIndex: number = 0;

    onLoad() {
        this.startLoading();
        this.loadAndSetSprite();
    }
    loadAndSetSprite() {
        // Nếu đã load rồi thì lấy luôn spriteFrame từ static frames
        if (LoadingCtrl.frames.length > 0) {
            this.setSpriteByIndex();
            return;
        }
        // Nếu chưa load, load lần đầu
        resources.loadDir('Loading', SpriteFrame, (err, assets) => {
            if (err) {
                return;
            }
            LoadingCtrl.frames = assets;
            if (LoadingCtrl.frames.length === 0) {
                return;
            }
            this.setSpriteByIndex();
        });
    }
    startLoading() {
        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 1) {
                progress += 0.01;
                this.updateProgress(progress);
            } else {
                clearInterval(interval);
                this.updateProgress(1);
            }
        }, 20);
    }

    setSpriteByIndex() {
        if (!this.targetSprite || LoadingCtrl.frames.length === 0) return;
        // Lấy spriteFrame theo currentIndex, vòng lại đầu khi hết
        const spriteFrame = LoadingCtrl.frames[LoadingCtrl.currentIndex % LoadingCtrl.frames.length];
        this.targetSprite.spriteFrame = spriteFrame;  // <-- Gán ảnh cho targetSprite

        // Tăng index cho lần gọi tiếp theo
        LoadingCtrl.currentIndex++;
    }
    updateProgress(value: number) {
        if (this.progressBar) {
            this.progressBar.progress = value;
            this.progressLabel.string = `${Math.floor(value * 100)}%`;
        }
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
    }

}

