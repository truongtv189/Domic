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
    private isLoaded: boolean = false;
    private hasCompletedOneCycle: boolean = false;
    private waitingCallbacks: (() => void)[] = [];
    private isProcessingCallbacks: boolean = false;

    onLoad() {
        this.loadFrames();
    }

    public setOnLoadComplete(callback: () => void) {
        console.log("setOnLoadComplete called, hasCompletedOneCycle:", this.hasCompletedOneCycle);
        // Luôn thêm callback vào queue, bất kể đã hoàn thành hay chưa
        this.waitingCallbacks.push(callback);
        
        // Nếu đã hoàn thành một vòng và không đang xử lý callbacks
        if (this.hasCompletedOneCycle && !this.isProcessingCallbacks) {
            this.processWaitingCallbacks();
        }
    }

    private processWaitingCallbacks() {
        if (this.waitingCallbacks.length === 0 || this.isProcessingCallbacks) return;

        this.isProcessingCallbacks = true;
        console.log("Processing callbacks, count:", this.waitingCallbacks.length);

        // Tạo một bản sao của callbacks để xử lý
        const callbacksToProcess = [...this.waitingCallbacks];
        this.waitingCallbacks = [];

        // Gọi tất cả callbacks
        callbacksToProcess.forEach(callback => {
            if (callback) {
                callback();
            }
        });

        this.isProcessingCallbacks = false;

        // Kiểm tra nếu có callbacks mới được thêm vào trong quá trình xử lý
        if (this.waitingCallbacks.length > 0) {
            this.processWaitingCallbacks();
        }
    }

    private loadFrames() {
        resources.loadDir('Images/Icon/LoadingIcon/fame1', SpriteFrame, (err, frames) => {
            if (err) {
                console.error('Error loading frames:', err);
                return;
            }

            this.spriteFrames = frames.sort((a, b) => a.name.localeCompare(b.name));

            if (this.spriteFrames.length > 0) {
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
                    console.log("Completed one cycle");
                    this.hasCompletedOneCycle = true;
                    this.processWaitingCallbacks();
                }
            }
        }
    }

    public resetLoadingState() {
        console.log("Resetting loading state");
        this.hasCompletedOneCycle = false;
        this.currentIndex = 0;
        this.timer = 0;
        this.isProcessingCallbacks = false;
        // Không xóa callbacks đang đợi khi reset
        // this.waitingCallbacks = [];
    }
}


