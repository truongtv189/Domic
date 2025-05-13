import { _decorator, Component, Sprite, SpriteFrame, AudioSource, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioSpritePlayer')
export class AudioSpritePlayer extends Component {
    @property(Sprite)
    sprite: Sprite = null!;

    @property
    duration: number = 1.5;

    @property([SpriteFrame])
    spriteFrames: SpriteFrame[] = [];

    private _audioSource: AudioSource | null = null;
    private _frameIndex = 0;
    private _deltaTime = 0;
    private _timer = 0;
    private _isPlaying = false;

    start() {
        // Nếu đã gán audioSource động trước khi start
        if (this._audioSource) {
            this.play();
        }
    }

    public setAudioSource(source: AudioSource) {
        this._audioSource = source;
    }

    public play() {
        if (!this._audioSource || this.spriteFrames.length === 0) return;

        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;
        this._deltaTime = this.duration / this.spriteFrames.length;

        this._audioSource.stop();
        this._audioSource.play();
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
                // Lặp lại nếu muốn
                // this.play();
            }
        }
    }
}
