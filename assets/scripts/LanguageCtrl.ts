import { _decorator, Component, Node, EventTouch, director, Label, Scene, Director, find } from 'cc';
import { I18n } from './I18n';
import { GameDataManager } from './GameDataManager';

const { ccclass, property } = _decorator;

@ccclass('LanguageCtrl')
export class LanguageCtrl extends Component {
    @property(Node) PopupLanguage: Node; // Node popup ngôn ngữ

    // Thêm biến static để lưu trữ tất cả các scene
    private static allScenes: Scene[] = [];
    private static instance: LanguageCtrl = null;

    onLoad() {
        // Set instance
        if (!LanguageCtrl.instance) {
            LanguageCtrl.instance = this;
        }

        const savedLang = GameDataManager.getInstance().data.language || 'english';
        I18n.loadLanguage(savedLang).then(() => {
            I18n.updateAllLabels(director.getScene());
            this.PopupLanguage.children.forEach((langNode) => {
                if (langNode.name !== 'CloseLanguage') {
                    langNode.on(Node.EventType.TOUCH_END, this.onLanguageSelected, this);
                }
            });
            this.updateCheckbox(savedLang);
        });

        // Thêm scene hiện tại vào danh sách
        const currentScene = director.getScene();
        if (currentScene && !LanguageCtrl.allScenes.includes(currentScene)) {
            LanguageCtrl.allScenes.push(currentScene);
        }

        // Listen for scene changes
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLoaded, this);
    }

    onDestroy() {
        // Remove scene change listener
        director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLoaded, this);
    }

    private onSceneLoaded(scene: Scene) {
        if (scene && !LanguageCtrl.allScenes.includes(scene)) {
            LanguageCtrl.allScenes.push(scene);
            // Update labels in the new scene
            I18n.updateAllLabels(scene);
        }
    }

    onHidePopupLanguage() {
        this.PopupLanguage.active = false;
        // Tìm và ẩn nodeOverlay
        const nodeOverlay = find('Canvas/nodeOverlay');
        if (nodeOverlay) {
            nodeOverlay.active = false;
        }
    }
    async onLanguageSelected(event: EventTouch) {
        const selectedNode = event.target as Node;
        const langCode = selectedNode.name;  // Lấy tên node làm mã ngôn ngữ
        // Thay đổi ngôn ngữ và cập nhật checkbox
        await this.setLanguage(langCode);
        this.updateCheckbox(langCode);  // Cập nhật checkbox tương ứng
    }

    async setLanguage(langCode: string) {
        try {
            // Tải lại ngôn ngữ mới
            await I18n.loadLanguage(langCode);
            GameDataManager.getInstance().updateField('language', langCode);
            
            // Cập nhật tất cả các scene
            LanguageCtrl.updateAllScenes();
            
            // Cập nhật lại label trong PopupLanguage nếu có
            if (this.PopupLanguage) {
                I18n.updateAllLabels(this.PopupLanguage);
            }
        } catch (error) {
        }
    }

    // Thêm phương thức static để cập nhật tất cả các scene
    private static updateAllScenes() {
        LanguageCtrl.allScenes.forEach(scene => {
            if (scene && scene.isValid) {
                I18n.updateAllLabels(scene);
            }
        });
    }

    // Cập nhật checkbox cho node ngôn ngữ đã chọn
    updateCheckbox(currentLang: string) {
        this.PopupLanguage.children.forEach((langNode) => {
            const checkbox = langNode.getChildByName('Checkbox');
            if (checkbox) {
                checkbox.active = (langNode.name === currentLang);  // Hiển thị checkbox tương ứng
            }
        });
    }
}
