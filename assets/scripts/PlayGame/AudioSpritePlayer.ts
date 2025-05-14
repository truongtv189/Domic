import { _decorator, Component, Sprite, SpriteFrame, AudioSource, Node, AudioClip, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioSpritePlayer')
export class AudioSpritePlayer extends Component {
    @property(Sprite)
    sprite: Sprite = null!;

    private _audioSource: AudioSource | null = null;
    private _frameIndex = 0;
    private _deltaTime = 0;
    private _timer = 0;
    private _isPlaying = false;
    private _spriteFrames: SpriteFrame[] = [];
    private _duration: number = 1.5;

    start() {
        if (this._audioSource) {
            this.play();
        }
    }

    public setAudioSource(source: AudioSource) {
        this._audioSource = source;
    }

    public setData(spriteFrames: SpriteFrame[], audioClip: AudioClip, duration: number = 1.5) {
        debugger
        this._spriteFrames = spriteFrames;
        this._duration = duration;

        // If there's no AudioSource, add one
        if (!this._audioSource) {
            this._audioSource = this.node.getComponent(AudioSource) || this.node.addComponent(AudioSource);
        }
        this._audioSource.clip = audioClip;

        // Ensure the sprite starts with the first frame
        this.sprite.spriteFrame = this._spriteFrames[0];
    }

    public play() {
        if (!this._audioSource || this._spriteFrames.length === 0) return;
        this._frameIndex = 0;
        this._timer = 0;
        this._isPlaying = true;
        this._deltaTime = this._duration / this._spriteFrames.length;
        this._audioSource.stop();
        this._audioSource.play();
        this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
    }

    update(dt: number) {
        if (!this._isPlaying) return;

        this._timer += dt;

        if (this._timer >= this._deltaTime) {
            this._timer -= this._deltaTime;
            this._frameIndex++;

            if (this._frameIndex < this._spriteFrames.length) {
                this.sprite.spriteFrame = this._spriteFrames[this._frameIndex];
            } else {
                this._isPlaying = false;
                // Loop if you want it to repeat
                this.play();
            }
        }
    }
}
