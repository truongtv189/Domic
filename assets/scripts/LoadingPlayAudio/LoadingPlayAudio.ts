import { _decorator, Component, Node, resources, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingPlayAudio')
export class LoadingPlayAudio extends Component {

    @property(Sprite)
    targetSprite: Sprite = null;
    private spriteFrames: SpriteFrame[] = [];
    private currentIndex: number = 0;
    private timer: number = 0;
    private interval: number = 0.1;
    onLoad() {
        this.loadFrames();
    }

    private loadFrames() {
        resources.loadDir('Images/Icon/loading/fame1', SpriteFrame, (err, frames) => {
            if (err) {
                console.error('Error loading frames:', err);
                return;
            }

            // Sắp xếp tên tăng dần nếu cần (ví dụ frame1, frame2,...)
            this.spriteFrames = frames.sort((a, b) => a.name.localeCompare(b.name));

            if (this.spriteFrames.length > 0) {
                // Tính khoảng thời gian giữa các frame để vòng lặp hoàn thành trong 4.5 giây
                this.interval = 4.5 / this.spriteFrames.length;
            }
        });
    }

    update(deltaTime: number) {
        if (this.spriteFrames.length === 0) return;

        this.timer += deltaTime;
        if (this.timer >= this.interval) {
            this.timer = 0;

            this.targetSprite.spriteFrame = this.spriteFrames[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.spriteFrames.length;
        }
    }
}


