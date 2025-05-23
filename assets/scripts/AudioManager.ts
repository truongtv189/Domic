import { _decorator, AudioClip, AudioSource, Component, game, Node } from 'cc';
const { ccclass, property } = _decorator;
import { GameDataManager } from './GameDataManager';

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static instance: AudioManager | null = null;
     private audioSource: AudioSource | null = null;
    @property(AudioSource)
    bgmSource: AudioSource = null!;

    @property(AudioClip)
    public ClickClip: AudioClip | null = null;

    private bgmVolume: number = 1.0;
    private sfxVolume: number = 1.0;
    private masterVolume: number = 1.0;
    private static _instance: AudioManager;

    onLoad() {
        AudioManager.instance = this;
        this.audioSource = this.getComponent(AudioSource);
        const savedMasterVolume = GameDataManager.getInstance().data.masterVolume
        const savedBGMVolume = GameDataManager.getInstance().data.bgmVolume;
        const savedSFXVolume = GameDataManager.getInstance().data.sfxVolume;
        this.masterVolume = savedMasterVolume;
        this.bgmVolume = savedBGMVolume;
        this.sfxVolume = savedSFXVolume;
        if (AudioManager._instance) {
            this.node.destroy(); // Ensure only one instance
            return;
        }
        AudioManager._instance = this;
        game.addPersistRootNode(this.node);
    }
    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            throw new Error('');
        }
        return AudioManager.instance!;
    }

    playBGM(clip: AudioClip, loop: boolean = true) {
        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.loop = loop;
        this.bgmSource.volume = this.masterVolume * this.bgmVolume;
        this.bgmSource.play();
    }

    stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.clip = null;
        }
    }

    onDisable() {
        this.stopBGM();
    }

    onDestroy() {
        this.stopBGM();
    }

    toggleMasterVolume() {
        this.masterVolume = this.masterVolume === 0 ? 1 : 0;
        this.updateAudioState();
        GameDataManager.getInstance().updateField("masterVolume", this.masterVolume);
    }

    // Toggle BGM volume
    toggleBGM() {
        this.bgmVolume = this.bgmVolume === 0 ? 1 : 0;
        this.updateAudioState();
        GameDataManager.getInstance().updateField("bgmVolume", this.bgmVolume);
    }

    private updateAudioState() {
        this.bgmSource.volume = this.masterVolume * this.bgmVolume;
    }
    playClickClip() {
        if (this.ClickClip) {
            this.audioSource.playOneShot(this.ClickClip, this.sfxVolume * this.masterVolume);
        } else {
        }
    }
}
