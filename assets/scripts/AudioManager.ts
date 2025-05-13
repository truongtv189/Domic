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

    private static _instance: AudioManager;

    onLoad() {
        // Set initial audio state from GameDataManager or default values
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
        // Ensure persistence across scenes
        game.addPersistRootNode(this.node);
    }

    static get instance(): AudioManager {
        return AudioManager._instance;
    }

    // Play background music (BGM)
    playBGM(clip: AudioClip, loop: boolean = true) {
        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.loop = loop;
        this.bgmSource.volume = this.masterVolume * this.bgmVolume;
        this.bgmSource.play();
    }

    // Stop background music (BGM)
    stopBGM() {
        if (this.bgmSource) {
            console.log('Stopping BGM');
            this.bgmSource.stop();
        } else {
            console.error('AudioSource is not assigned!');
        }
    }

    // Toggle Master Audio (mute/unmute all audio)
    toggleMasterVolume() {
        this.masterVolume = this.masterVolume === 0 ? 1 : 0;  // Toggle between 0 (mute) and 1 (unmute)
        this.updateAudioState();
        GameDataManager.getInstance().updateField("masterVolume", this.masterVolume);
    }

    // Toggle BGM volume
    toggleBGM() {
        this.bgmVolume = this.bgmVolume === 0 ? 1 : 0;  // Toggle between 0 (mute) and 1 (unmute)
        this.updateAudioState();
        GameDataManager.getInstance().updateField("bgmVolume", this.bgmVolume);
    }

    // Update audio sources (BGM, SFX) based on volume settings
    private updateAudioState() {
        this.bgmSource.volume = this.masterVolume * this.bgmVolume;
        // Add other sources (e.g., SFX) if needed, and apply the same logic for them.
    }
}
