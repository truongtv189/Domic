import { _decorator, AudioClip, AudioSource, Component, game, Node } from 'cc';
const { ccclass, property } = _decorator;
import { GameDataManager } from './GameDataManager';
@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    bgmSource: AudioSource = null!;
    private bgmVolume: number = 1.0;
    private sfxVolume: number = 1.0;
    private masterVolume: number = 1.0;
    // @property(AudioSource)
    // sfxSource: AudioSource = null!;
    private static _instance: AudioManager;
    onLoad() {
        GameDataManager.getInstance().updateField("masterVolume", 1);
        GameDataManager.getInstance().updateField("bgmVolume", 1);
        GameDataManager.getInstance().updateField("sfxVolume", 1);
        if (AudioManager._instance) {
            this.node.destroy(); // Đảm bảo chỉ có một instance
            return;
        }
        AudioManager._instance = this;
        // Không bị destroy khi chuyển scene
        game.addPersistRootNode(this.node);
    }
    static get instance(): AudioManager {
        return AudioManager._instance;
    }
    playBGM(clip: AudioClip, loop: boolean = true) {
        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.loop = loop;
        this.bgmSource.play();
    }
    // playSFX(clip: AudioClip) {
    //     this.sfxSource.playOneShot(clip);
    // }

    stopBGM() {
        this.bgmSource.stop();
    }
}


