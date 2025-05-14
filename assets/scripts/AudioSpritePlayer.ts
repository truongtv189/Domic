import { _decorator, Component, Sprite, SpriteFrame, AudioSource } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('AudioSpritePlayer')
export class AudioSpritePlayer extends Component {
    @property(AudioSource)
    audioSource: AudioSource = null!;
    @property(Sprite)
    sprite: Sprite = null!;
    @property
    duration: number = 1.5; // Tổng thời gian chạy animation
    @property([SpriteFrame])
    spriteFrames: SpriteFrame[] = [];
    private _frameIndex = 0;
    private _deltaTime = 0;
    private _timer = 0;
    private _isPlaying = false;

    start() {
        this.play();
    }

    public play() {
        if (!this.audioSource || this.spriteFrames.length === 0) return;
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;

        // Tính thời gian giữa các frame
        this._deltaTime = this.duration / this.spriteFrames.length;
        this.audioSource.stop();
        this.audioSource.play();
        this.sprite.spriteFrame = this.spriteFrames[this._frameIndex];
    }

    update(dt: number) {
        if (!this._isPlaying) return;

        this._timer += dt;

        if (this._timer >= this._deltaTime) {
            this._timer -= this._deltaTime;
            this._frameIndex++;

            if (this._frameIndex < this.spriteFrames.length) {
                this.sprite.spriteFrame = this.spriteFrames[this._frameIndex];
            } else {
                this._isPlaying = false;
                // Nếu muốn lặp lại animation + audio:
                // this.play();
            }
        }
    }
}
