import { _decorator, Component, Node } from 'cc';
import { GameDataManager } from '../GameDataManager';
import { AudioManager } from '../AudioManager';
const { ccclass, property } = _decorator;

@ccclass('PopupSetting')
export class PopupSetting extends Component {
    @property(Node) onVibrate: Node;
    @property(Node) offVibrate: Node;
    @property(Node) onBackGroundMusic: Node;
    @property(Node) offBackGroundMusic: Node;
    @property(Node) offSoundEffects: Node;
    @property(Node) onSoundEffects: Node;
    @property(Node) NodePopupSetting: Node;
    onLoad() {
        this.offVibrate.active = false;
        this.offBackGroundMusic.active = false;
        this.offSoundEffects.active = false;
    }

    ClickOnVibrate() {
         AudioManager.getInstance().playClickClip()
        this.onVibrate.active = true;
        this.offVibrate.active = false;
        GameDataManager.getInstance().updateField("sfxVolume", 1);
    }
    ClickOffVibrate() {
         AudioManager.getInstance().playClickClip()
        this.onVibrate.active = false;
        this.offVibrate.active = true;
        GameDataManager.getInstance().updateField("sfxVolume", 0);
    }
    ClickonBackGroundMusic() {
        AudioManager.getInstance().playClickClip()
        this.offBackGroundMusic.active = false;
        this.onBackGroundMusic.active = true;
        GameDataManager.getInstance().updateField("bgmVolume", 1);
    }
    ClickoffBackGroundMusic() {
        AudioManager.getInstance().playClickClip()
        this.onBackGroundMusic.active = false;
        this.offBackGroundMusic.active = true;
        GameDataManager.getInstance().updateField("bgmVolume", 0);
    }

    ClickoffSoundEffects() {
        AudioManager.getInstance().playClickClip()
        this.onSoundEffects.active = false;
        this.offSoundEffects.active = true;
        GameDataManager.getInstance().updateField("sfxVolume", 0);
    }
    ClickonSoundEffects() {
        AudioManager.getInstance().playClickClip()
        this.offSoundEffects.active = false;
        this.onSoundEffects.active = true;
        GameDataManager.getInstance().updateField("sfxVolume", 1);
    }
    ClickHideSetting() {
        AudioManager.getInstance().playClickClip()
        this.NodePopupSetting.active = false;
    }
}


