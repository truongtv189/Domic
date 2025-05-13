import { _decorator, Component, ProgressBar, Label, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {
    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    @property(Label)
    progressLabel: Label = null!;

    start() {
        this.startLoading();
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

    updateProgress(value: number) {
        if (this.progressBar) {
            this.progressBar.progress = value;
            this.progressLabel.string = `${Math.floor(value * 100)}%`;
        } else {
        }
    }

    onDestroy() {
        // Dừng lại nếu component bị hủy
        this.unschedule(this.updateProgress);
    }
  
}
