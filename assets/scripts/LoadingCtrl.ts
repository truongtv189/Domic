import { _decorator, Component, ProgressBar, Label, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {
    @property(ProgressBar)
    progressBar: ProgressBar = null!;
    @property(Label)
    progressLabel: Label = null!;

    async startLoading(targetScene: string) {
        let progress = 0;
        let loadingDone = false;

        const interval = setInterval(() => {
            if (progress < 0.98) {
                progress += 0.01;
                this.updateProgress(progress);
            } else if (!loadingDone) {
                // Gọi loadScene khi đạt ~98%
                loadingDone = true;
                this.updateProgress(0.98);
                director.loadScene(targetScene);
            }
        }, 20);

        // // Khi scene mới được load xong thì loading UI sẽ tự bị phá hủy hoặc ẩn
        // director.once(director.EVENT_AFTER_SCENE_LAUNCH, () => {
        //     clearInterval(interval);
        //     this.updateProgress(1);
        //     this.node.active = false;
        // });
    }

    updateProgress(value: number) {
        this.progressBar.progress = value;
        this.progressLabel.string = `${Math.floor(value * 100)}%`;
    }
}
