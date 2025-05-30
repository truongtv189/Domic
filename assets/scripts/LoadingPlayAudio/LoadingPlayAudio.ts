import { _decorator, Component, Node, resources, Sprite, SpriteFrame, director } from 'cc';
import { GameDataManager } from '../GameDataManager';
const { ccclass, property } = _decorator;

// Define a constant for the event name
const RESET_AUDIO_FRAME_EVENT = 'reset-audio-frame';

@ccclass('LoadingPlayAudio')
export class LoadingPlayAudio extends Component {
    @property(Sprite)
    targetSprite: Sprite = null;
    @property(Node) ResetNode: Node = null;
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
        this.waitingCallbacks.push(callback);
        if (this.hasCompletedOneCycle && !this.isProcessingCallbacks) {
            this.processWaitingCallbacks();
        }
    }

    private processWaitingCallbacks() {
        if (this.waitingCallbacks.length === 0 || this.isProcessingCallbacks) return;
        this.isProcessingCallbacks = true;
        const callbacksToProcess = [...this.waitingCallbacks];
        this.waitingCallbacks = [];
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
        const gameData = GameDataManager.getInstance()?.data;
        const ResetPath = `${gameData.ItemSelect.loadingCategory}`;
        resources.loadDir(ResetPath, SpriteFrame, (err, frames) => {
            if (err) {
                return;
            }
            this.spriteFrames = frames.sort((a, b) => a.name.localeCompare(b.name));

            if (this.spriteFrames.length > 0) {
                this.interval = 4.5 / this.spriteFrames.length;
                this.isLoaded = true;
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
                    this.hasCompletedOneCycle = true;
                    this.processWaitingCallbacks();
                }
            }
        }
    }

    public resetLoadingState() {
        this.hasCompletedOneCycle = false;
        this.currentIndex = 0;
        this.timer = 0;
        this.isProcessingCallbacks = false;
        // Reset the sprite frame to the first frame
        if (this.targetSprite && this.spriteFrames.length > 0) {
            this.targetSprite.spriteFrame = this.spriteFrames[0];
        }
    }

    onClickReset() {
        this.resetLoadingState();
        // Emit global event for resetting audio and frames
        director.emit(RESET_AUDIO_FRAME_EVENT);
    }
}


