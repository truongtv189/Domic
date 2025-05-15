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
    private onLoadComplete: (() => void) | null = null;
    private isLoaded: boolean = false;
    private hasCompletedOneCycle: boolean = false;

    onLoad() {
        this.loadFrames();
    }

    public setOnLoadComplete(callback: () => void) {
        console.log("setOnLoadComplete called, hasCompletedOneCycle:", this.hasCompletedOneCycle);
        this.onLoadComplete = callback;
    }

    private loadFrames() {
        resources.loadDir('Images/Icon/LoadingIcon/fame1', SpriteFrame, (err, frames) => {
            if (err) {
                console.error('Error loading frames:', err);
                return;
            }

            // Sắp xếp tên tăng dần nếu cần (ví dụ frame1, frame2,...)
            this.spriteFrames = frames.sort((a, b) => a.name.localeCompare(b.name));

            if (this.spriteFrames.length > 0) {
                // Tính khoảng thời gian giữa các frame để vòng lặp hoàn thành trong 4.5 giây
                this.interval = 4.5 / this.spriteFrames.length;
                this.isLoaded = true;
                console.log("Frames loaded, count:", this.spriteFrames.length);
            }
        });
    }

    update(deltaTime: number) {
        if (!this.isLoaded || this.spriteFrames.length === 0) return;

        this.timer += deltaTime;
        if (this.timer >= this.interval) {
            this.timer = 0;
            if (this.targetSprite) {
                this.targetSprite.spriteFrame = this.spriteFrames[this.currentIndex];
            }
            this.currentIndex++;

            if (this.currentIndex >= this.spriteFrames.length) {
                this.currentIndex = 0;
                if (!this.hasCompletedOneCycle) {
                    console.log("Completed one cycle, calling callback");
                    this.hasCompletedOneCycle = true;
                    if (this.onLoadComplete) {
                        const callback = this.onLoadComplete;
                        this.onLoadComplete = null;
                        callback();
                    }
                }
            }
        }
    }

    public resetLoadingState() {
        console.log("Resetting loading state");
        this.hasCompletedOneCycle = false;
        this.currentIndex = 0;
        this.timer = 0;
        this.onLoadComplete = null;
    }
}


