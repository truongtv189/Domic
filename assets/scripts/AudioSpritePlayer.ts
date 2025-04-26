import { _decorator, Component, Sprite, SpriteFrame, AudioSource, resources, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioSpritePlayer')
export class AudioSpritePlayer extends Component {

    @property(AudioSource)
    audioSource: AudioSource = null!;

    @property(Sprite)
    sprite: Sprite = null!;

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

        this._deltaTime = 0.15;
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;

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
                this.play();
            }
        }
    }
}
